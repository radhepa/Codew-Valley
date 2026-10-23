// Pyodide runs here, off the main thread, so a runaway learner program can
// never freeze the village. Real CPython (compiled to WebAssembly) executes the
// code; nothing about the output is simulated.
import { loadPyodide, type PyodideInterface } from "pyodide";
import type { FromWorker, RunRequest, RunResult, Segment, ToWorker } from "./protocol";
import { HELPER } from "./helper";

const ctx = self as unknown as {
  postMessage(msg: FromWorker): void;
  onmessage: ((e: MessageEvent<ToWorker>) => void) | null;
};
const post = (msg: FromWorker) => ctx.postMessage(msg);

/** Max characters kept in a run's transcript/output for checks and reports. */
const CAPTURE_CAP = 40_000;
/** Max characters streamed live to the console for a single run. */
const STREAM_CAP = 120_000;


interface RunState {
  req: RunRequest;
  inputsUsed: number;
  ranOutOfInput: boolean;
  /** stdout text since the last newline; becomes a prompt if input() follows. */
  lineBuf: string;
  output: string;
  prompts: string[];
  transcript: Segment[];
  captured: number;
  truncated: boolean;
  streamed: number;
  streamCapped: boolean;
  outDecoder: TextDecoder;
  errDecoder: TextDecoder;
}

let pyodide: PyodideInterface | null = null;
let runFn: ((code: string) => { toJs(opts: object): unknown; destroy(): void }) | null = null;
let gradeFn: ((code: string, tests: string) => { toJs(opts: object): unknown; destroy(): void }) | null = null;
let restoreFn: (() => void) | null = null;
let interruptBuffer: Uint8Array | null = null;
let current: RunState | null = null;
const queue: RunRequest[] = [];

// ---- capture --------------------------------------------------------------

function pushSegment(kind: Segment["kind"], text: string) {
  const s = current!;
  if (!text) return;
  if (s.captured >= CAPTURE_CAP) {
    s.truncated = true;
    return;
  }
  if (s.captured + text.length > CAPTURE_CAP) {
    text = text.slice(0, CAPTURE_CAP - s.captured);
    s.truncated = true;
  }
  s.captured += text.length;
  const last = s.transcript[s.transcript.length - 1];
  if (last && last.kind === kind && (kind === "out" || kind === "err")) last.text += text;
  else s.transcript.push({ kind, text });
}

function addOutput(text: string) {
  const s = current!;
  if (s.output.length < CAPTURE_CAP) s.output += text.slice(0, CAPTURE_CAP - s.output.length);
  pushSegment("out", text);
}

function capture(kind: "out" | "err", text: string) {
  const s = current!;
  if (kind === "err") {
    pushSegment("err", text);
    return;
  }
  s.lineBuf += text;
  let nl: number;
  while ((nl = s.lineBuf.indexOf("\n")) >= 0) {
    addOutput(s.lineBuf.slice(0, nl + 1));
    s.lineBuf = s.lineBuf.slice(nl + 1);
  }
  // A single enormous line with no newline: keep memory bounded.
  if (s.lineBuf.length > CAPTURE_CAP) {
    addOutput(s.lineBuf);
    s.lineBuf = "";
  }
}

// ---- live streaming (throttled so print loops can't flood the page) --------

let pending: { kind: "out" | "err" | "input"; text: string } | null = null;
let windowStart = 0;
let windowCount = 0;

function flushStream() {
  if (!pending || !current) return;
  post({ type: "stream", id: current.req.id, kind: pending.kind, text: pending.text });
  pending = null;
}

function streamEmit(kind: "out" | "err" | "input", text: string) {
  const s = current!;
  if (!s.req.stream || s.streamCapped) return;
  if (s.streamed + text.length > STREAM_CAP) {
    text = text.slice(0, STREAM_CAP - s.streamed);
    s.streamCapped = true;
  }
  s.streamed += text.length;
  if (pending && pending.kind !== kind) flushStream();
  pending = pending ? { kind, text: pending.text + text } : { kind, text };
  const now = performance.now();
  if (now - windowStart > 100) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount < 25 || pending.text.length > 16_384 || kind === "input") {
    flushStream();
    windowCount++;
  }
  if (s.streamCapped) {
    flushStream();
    post({
      type: "stream",
      id: s.req.id,
      kind: "notice",
      text: "Output limit reached, so the rest is hidden. The program may still be running: press Stop.",
    });
  }
}

// ---- Pyodide stream handlers ---------------------------------------------

function onWrite(kind: "out" | "err", buffer: Uint8Array): number {
  const s = current;
  if (!s) return buffer.length; // startup noise
  const text = (kind === "out" ? s.outDecoder : s.errDecoder).decode(buffer, { stream: true });
  capture(kind, text);
  streamEmit(kind, text);
  return buffer.length;
}

function onStdin(): string | undefined {
  const s = current;
  if (!s) return undefined;
  // Whatever is on the current, unfinished stdout line is the input() prompt.
  const prompt = s.lineBuf;
  s.lineBuf = "";
  if (prompt) {
    s.prompts.push(prompt);
    pushSegment("prompt", prompt);
  }
  if (s.inputsUsed >= s.req.inputs.length) {
    s.ranOutOfInput = true;
    return undefined; // EOF: input() raises EOFError, just like real Python
  }
  const value = s.req.inputs[s.inputsUsed++];
  pushSegment("input", value);
  streamEmit("input", value + "\n");
  return value; // Pyodide appends the newline
}

// ---- lifecycle -------------------------------------------------------------

async function init(msg: Extract<ToWorker, { type: "init" }>) {
  interruptBuffer = msg.interruptBuffer;
  post({ type: "loading", message: "Downloading Python…" });
  try {
    const py = await loadPyodide({ indexURL: msg.indexURL });
    post({ type: "loading", message: "Warming up Python…" });
    py.setStdout({ write: (b: Uint8Array) => onWrite("out", b) });
    py.setStderr({ write: (b: Uint8Array) => onWrite("err", b) });
    // autoEOF: each input() call consumes exactly one queued line.
    py.setStdin({ stdin: onStdin, autoEOF: true });
    if (interruptBuffer) py.setInterruptBuffer(interruptBuffer);
    py.runPython(HELPER, { filename: "<village>" });
    runFn = py.globals.get("_pg_run");
    gradeFn = py.globals.get("_pg_grade");
    restoreFn = py.globals.get("_pg_restore");
    const pythonVersion = String(py.runPython("import sys; sys.version.split()[0]"));
    pyodide = py;
    post({ type: "ready", version: py.version, pythonVersion });
    pump();
  } catch (err) {
    post({ type: "load-error", message: err instanceof Error ? err.message : String(err) });
  }
}

function pump() {
  while (pyodide && queue.length) execute(queue.shift()!);
}

function execute(req: RunRequest) {
  current = {
    req,
    inputsUsed: 0,
    ranOutOfInput: false,
    lineBuf: "",
    output: "",
    prompts: [],
    transcript: [],
    captured: 0,
    truncated: false,
    streamed: 0,
    streamCapped: false,
    outDecoder: new TextDecoder(),
    errDecoder: new TextDecoder(),
  };
  pending = null;
  windowCount = 0;
  if (interruptBuffer) interruptBuffer[0] = 0;
  const started = performance.now();

  let info: Record<string, unknown>;
  try {
    const proxy = req.tests != null ? gradeFn!(req.code, req.tests) : runFn!(req.code);
    info = proxy.toJs({ dict_converter: Object.fromEntries }) as Record<string, unknown>;
    proxy.destroy();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/KeyboardInterrupt/.test(message)) {
      // A second Stop landed while the helper was tidying up.
      info = { status: "interrupted" };
      try {
        restoreFn?.();
      } catch {
        /* runtime will be restarted on the next fatal error */
      }
    } else {
      flushStream();
      post({ type: "fatal", id: req.id, message });
      current = null;
      return;
    }
  }

  const s = current;
  const tailOut = s.outDecoder.decode();
  const tailErr = s.errDecoder.decode();
  if (tailOut) capture("out", tailOut);
  if (tailErr) capture("err", tailErr);
  if (s.lineBuf) {
    addOutput(s.lineBuf); // final line printed without a newline
    s.lineBuf = "";
  }
  flushStream();

  const status = info.status as RunResult["status"];
  const result: RunResult = {
    status,
    error:
      status === "error"
        ? {
            type: String(info.type ?? "Error"),
            message: String(info.message ?? ""),
            line: typeof info.line === "number" ? info.line : null,
            traceback: String(info.traceback ?? ""),
          }
        : null,
    grade: req.tests != null && status !== "interrupted" ? { passed: info.passed === true, feedback: String(info.feedback ?? "") } : null,
    output: s.output,
    prompts: s.prompts,
    inputsUsed: s.inputsUsed,
    ranOutOfInput: s.ranOutOfInput,
    transcript: s.transcript,
    truncated: s.truncated,
    durationMs: performance.now() - started,
  };
  current = null;
  post({ type: "done", id: req.id, result });
}

ctx.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === "init") void init(msg);
  else {
    queue.push(msg);
    pump();
  }
};
