import type { FromWorker, RunResult, RunStatus, ToWorker } from "./protocol";

export type PythonState = "loading" | "ready" | "restarting" | "error";

export interface PythonStatus {
  state: PythonState;
  message: string;
  pythonVersion?: string;
}

export type StreamKind = "out" | "err" | "input" | "notice";

export interface RunOptions {
  /** Stream console output while the program runs. */
  onStream?: (kind: StreamKind, text: string) => void;
  /** Stop the program automatically after this many milliseconds. */
  timeoutMs?: number;
  /** Grade the program against these challenge checks. */
  tests?: string;
  /** Files in the program's folder before it starts (Challenge.files). */
  files?: Record<string, string>;
}

interface ActiveRun {
  id: number;
  resolve(result: RunResult): void;
  onStream?: RunOptions["onStream"];
  stopReason: "user" | "timeout" | null;
  started: number;
  timers: number[];
}

/** How long Stop waits for a KeyboardInterrupt before killing the worker. */
const KILL_GRACE_MS = 1200;

/**
 * Owns the Pyodide worker. One program runs at a time. Stop first raises a
 * real KeyboardInterrupt (needs cross-origin isolation); if the program does
 * not yield, or interrupts are unavailable, the worker is terminated and a
 * fresh Python is started in its place.
 */
export class PythonRunner {
  status: PythonStatus = { state: "loading", message: "Loading Python…" };
  /** True when Stop can raise KeyboardInterrupt instead of restarting. */
  readonly canInterrupt: boolean;

  private worker!: Worker;
  private readonly interrupt: Uint8Array | null;
  private active: ActiveRun | null = null;
  private busy = false;
  private stopBeforeStart = false;
  private nextId = 1;
  private listeners = new Set<(s: PythonStatus) => void>();
  private waiters: Array<{ resolve(): void; reject(e: Error): void }> = [];

  constructor() {
    this.canInterrupt = typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
    this.interrupt = this.canInterrupt ? new Uint8Array(new SharedArrayBuffer(1)) : null;
    this.spawn();
  }

  get isRunning() {
    return this.busy;
  }

  onStatus(fn: (s: PythonStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  /** Retry after a failed load. */
  retry() {
    if (this.status.state !== "error") return;
    this.worker.terminate();
    this.spawn();
  }

  /** A new interpreter for each controlled check, including modules and files. */
  async freshEnvironment() {
    if (this.busy) throw new Error("A program is already running.");
    this.worker.terminate();
    this.setStatus({ state: "loading", message: "Preparing a clean Python environment…" });
    this.spawn();
    await this.whenReady();
  }

  async run(code: string, inputs: string[], opts: RunOptions = {}): Promise<RunResult> {
    if (this.busy) throw new Error("A program is already running.");
    this.busy = true;
    this.stopBeforeStart = false;
    try {
      await this.whenReady();
    } catch (e) {
      this.busy = false;
      throw e;
    }
    if (this.stopBeforeStart) {
      // Stop was pressed while Python was still starting: never run it.
      this.stopBeforeStart = false;
      this.busy = false;
      return { status: "interrupted", error: null, output: "", prompts: [], inputsUsed: 0, ranOutOfInput: false, transcript: [], truncated: false, durationMs: 0 };
    }
    return new Promise<RunResult>((resolve) => {
      const run: ActiveRun = {
        id: this.nextId++,
        resolve,
        onStream: opts.onStream,
        stopReason: null,
        started: performance.now(),
        timers: [],
      };
      this.active = run;
      if (opts.timeoutMs) run.timers.push(window.setTimeout(() => this.stop("timeout"), opts.timeoutMs));
      this.send({ type: "run", id: run.id, code, inputs, stream: Boolean(opts.onStream), tests: opts.tests, files: opts.files });
    });
  }

  stop(reason: "user" | "timeout" = "user") {
    const run = this.active;
    if (!run) {
      if (this.busy) this.stopBeforeStart = true;
      return;
    }
    if (run.stopReason) return;
    run.stopReason = reason;
    if (this.interrupt) {
      this.interrupt[0] = 2; // SIGINT -> KeyboardInterrupt inside Python
      run.timers.push(
        window.setTimeout(() => {
          if (this.active === run) this.restart(run, "Program didn't respond to Stop, so Python was restarted.");
        }, KILL_GRACE_MS),
      );
    } else {
      this.restart(run);
    }
  }

  // ---- internals -----------------------------------------------------------

  private spawn() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<FromWorker>) => this.onMessage(e.data);
    this.worker.onerror = (e) => {
      e.preventDefault();
      this.setStatus({ state: "error", message: `Python could not start (${e.message || "worker error"}).` });
      const run = this.active;
      if (run) this.finish(run, {
        status: "crashed", error: { type: "RuntimeError", message: e.message || "The Python worker failed.", line: null, traceback: "" },
        output: "", prompts: [], inputsUsed: 0, ranOutOfInput: false, transcript: [], truncated: false, durationMs: performance.now() - run.started,
      });
    };
    const indexURL = new URL(`${import.meta.env.BASE_URL}pyodide/`, location.href).href;
    this.send({ type: "init", interruptBuffer: this.interrupt, indexURL });
  }

  private send(msg: ToWorker) {
    this.worker.postMessage(msg);
  }

  private whenReady(): Promise<void> {
    if (this.status.state === "ready") return Promise.resolve();
    if (this.status.state === "error") return Promise.reject(new Error(this.status.message));
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }

  private setStatus(status: PythonStatus) {
    this.status = status;
    for (const fn of this.listeners) fn(status);
    if (status.state === "ready" || status.state === "error") {
      const waiters = this.waiters.splice(0);
      for (const w of waiters) {
        if (status.state === "ready") w.resolve();
        else w.reject(new Error(status.message));
      }
    }
  }

  private onMessage(msg: FromWorker) {
    switch (msg.type) {
      case "loading":
        if (this.status.state !== "restarting") this.setStatus({ state: "loading", message: msg.message });
        break;
      case "ready":
        this.setStatus({ state: "ready", message: `Python ${msg.pythonVersion} ready`, pythonVersion: msg.pythonVersion });
        break;
      case "load-error":
        this.setStatus({ state: "error", message: `Python failed to load: ${msg.message}` });
        break;
      case "stream":
        if (this.active?.id === msg.id) this.active.onStream?.(msg.kind, msg.text);
        break;
      case "done": {
        const run = this.active;
        if (!run || run.id !== msg.id) return;
        const result = msg.result;
        if (result.status === "interrupted" && run.stopReason === "timeout") result.status = "timeout";
        this.finish(run, result);
        break;
      }
      case "fatal": {
        const run = this.active;
        this.restart(run && run.id === msg.id ? run : null, `The Python runtime hit an internal error and was restarted (${msg.message}).`);
        break;
      }
    }
  }

  /** Kill the worker, settle any active run, and boot a fresh Python. */
  private restart(run: ActiveRun | null, note?: string) {
    this.worker.terminate();
    this.setStatus({ state: "restarting", message: "Restarting Python…" });
    if (run) {
      const status: RunStatus =
        run.stopReason === "timeout" ? "timeout" : run.stopReason === "user" ? "interrupted" : "crashed";
      if (note && status !== "timeout") run.onStream?.("notice", note);
      this.finish(run, {
        status,
        error: status === "crashed" ? { type: "RuntimeError", message: note ?? "Python crashed.", line: null, traceback: "" } : null,
        output: "",
        prompts: [],
        inputsUsed: 0,
        ranOutOfInput: false,
        transcript: [],
        truncated: false,
        durationMs: performance.now() - run.started,
      });
    }
    this.spawn();
  }

  private finish(run: ActiveRun, result: RunResult) {
    for (const t of run.timers) clearTimeout(t);
    if (this.interrupt) this.interrupt[0] = 0;
    this.active = null;
    this.busy = false;
    run.resolve(result);
  }
}
