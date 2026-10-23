// Messages exchanged between the main thread (PythonRunner) and the Pyodide
// worker. Kept in one place so both sides agree on the shape.

/** One piece of a program's console transcript, in the order it happened. */
export interface Segment {
  kind: "out" | "err" | "prompt" | "input";
  text: string;
}

export interface PyErrorInfo {
  /** Python exception class name, e.g. "NameError". */
  type: string;
  /** str(exception), e.g. "name 'x' is not defined". */
  message: string;
  /** Line in the learner's program (main.py), when known. */
  line: number | null;
  /** Full Python traceback, trimmed to the learner's own frames. */
  traceback: string;
}

export type RunStatus =
  | "ok" // finished normally (including sys.exit())
  | "error" // raised an uncaught exception
  | "interrupted" // stopped by the learner
  | "timeout" // stopped by a check's time limit
  | "crashed"; // the Python runtime itself failed and was restarted

export interface GradeResult {
  passed: boolean;
  /** Why the checks failed (empty when passed or when the program errored). */
  feedback: string;
}

export interface RunResult {
  status: RunStatus;
  error: PyErrorInfo | null;
  /** Set when the run was a challenge check (RunRequest.tests). */
  grade?: GradeResult | null;
  /** Everything printed to stdout, minus input() prompts. */
  output: string;
  /** Prompt strings shown by input(), in order. */
  prompts: string[];
  /** How many queued input lines the program consumed. */
  inputsUsed: number;
  /** True when the program asked for more input than was queued. */
  ranOutOfInput: boolean;
  /** Ordered transcript (capped) for display in check reports. */
  transcript: Segment[];
  truncated: boolean;
  durationMs: number;
}

export interface RunRequest {
  type: "run";
  id: number;
  code: string;
  inputs: string[];
  /** Stream console output live (Run) or only return the result (Check). */
  stream: boolean;
  /** Challenge checks to run after the program (see helper.ts _pg_grade). */
  tests?: string;
}

export type ToWorker = { type: "init"; interruptBuffer: Uint8Array | null; indexURL: string } | RunRequest;

export type FromWorker =
  | { type: "loading"; message: string }
  | { type: "ready"; version: string; pythonVersion: string }
  | { type: "load-error"; message: string }
  | { type: "stream"; id: number; kind: "out" | "err" | "input" | "notice"; text: string }
  | { type: "done"; id: number; result: RunResult }
  | { type: "fatal"; id: number; message: string };
