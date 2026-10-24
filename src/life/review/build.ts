import type { Rng } from "./rng.ts";

// Turns a question template's spec into a challenge-shaped object: starter, solution, the
// checks (Python, run by the same grader as every building challenge) and the wrong answers.
// Plain data only, so the Node content tests can import it.
//
// How the checks work: the learner's program runs on today's values, then again with other
// values swapped into the starter's data lines (or other starting files, or extra code that
// calls the learner's functions). Each run is compared with Wren's own answer run the same
// way, so typed-in answers and hard-coded numbers fail, and a failing run says exactly which
// values it was tried with. Wren's answer lives only in the checks, never on screen.

/** A Python value written into the starter. */
export type Py = number | string | boolean | null | Py[] | PyTuple | PyFloat | { [k: string]: Py };
export class PyTuple {
  readonly items: Py[];
  constructor(items: Py[]) {
    this.items = items;
  }
}
export class PyFloat {
  readonly x: number;
  constructor(x: number) {
    this.x = x;
  }
}
/** A tuple, for data like ("Wren", 3). */
export const tup = (...items: Py[]) => new PyTuple(items);
/** A float that prints with its point even when whole (3.0). */
export const flt = (x: number) => new PyFloat(x);

export function py(v: Py): string {
  if (v === null) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (v instanceof PyFloat) return Number.isInteger(v.x) ? `${v.x}.0` : String(v.x);
  if (v instanceof PyTuple) return v.items.length === 1 ? `(${py(v.items[0])},)` : `(${v.items.map(py).join(", ")})`;
  if (Array.isArray(v)) return `[${v.map(py).join(", ")}]`;
  return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${py(x)}`).join(", ")}}`;
}

/** One more way Wren tries the program. */
export interface Variant {
  /** Other values for some of the starter's data lines. */
  data?: Record<string, Py | undefined>;
  /** Other contents for some starting files. */
  files?: Record<string, string>;
  /** Python run after the program (calls its functions, makes its objects); what it prints is compared. */
  drive?: string;
  /** Added to the message when this try fails: what is special about these values. */
  note?: string;
}

/** What a template's make(rng) returns. */
export interface Spec {
  /** Short title for the question card ("The Heaviest Sack"). */
  title: string;
  /** The Python idea, shown on the card and in the workbench ("while loops"). */
  topic: string;
  /** The task as a short checklist, in story words (CHALLENGES.md): never the exact output or method. */
  task: string[];
  /** Lines given at the very top of the starter (an import the task needs, say). */
  head?: string;
  /** Today's values: one `name = value` line each, at the top of the starter. */
  data?: Record<string, Py>;
  /** Starting files in the program's folder. */
  files?: Record<string, string>;
  /** Plan comments for the starter, after the data ("Find the heaviest sack"). */
  plan?: string[];
  /** The starter's code after the data, instead of plan comments. */
  starter?: string;
  /** Wren's answer, after the data lines. */
  body: string;
  /** Python run after the program on today's values too (to call functions, print a written file). */
  drive?: string;
  /** Other values (at least two; include edge cases: ties, nothing found, the boundary). */
  variants: Variant[];
  /** Plausible mistakes (bodies after the data lines), each failing for its own reason. */
  wrong: string[];
  /** Exactly three: a nudge, the technique on other values, the near-answer with a gap. */
  hints: [string, string, string];
  /** Things the program must use: [regex on the source, message]. */
  needs?: [string, string][];
  /** Said when today's run prints the wrong thing. */
  advice?: string;
  /** Wren's lines on the Story tab (defaults are in the pool). */
  intro?: string[];
  /** Codex pages for the Lesson tab (defaults to the topics' first pages). */
  codex?: string[];
}

/** The challenge-shaped part of a question. */
export interface Made {
  title: string;
  topic: string;
  task: string[];
  starter: string;
  tests: string;
  solution: string;
  hints: [string, string, string];
  wrong: string[];
  files?: Record<string, string>;
  intro?: string[];
  codex?: string[];
  /** The checks call extra code after the program (functions, classes, written files). */
  drives: boolean;
}

export type BuildingId =
  | "tavern"
  | "mill"
  | "dock"
  | "market"
  | "bakery"
  | "forge"
  | "library"
  | "apothecary"
  | "townhall"
  | "clocktower"
  | "guildhall"
  | "observatory";

export interface Template {
  id: string;
  /** The buildings whose Python it uses (it may use nothing taught after the last of them). */
  topics: BuildingId[];
  difficulty: 1 | 2 | 3;
  make(rng: Rng): Spec;
}

const PRE = String.raw`import re as _rv_re
_RV_MARK = "~~ Wren tries ~~"

def _rv_swap(code, swaps):
    for old, new in swaps:
        # a whole line, so "n = 5" never matches inside "seen = 5"
        pat = _rv_re.compile("^" + _rv_re.escape(old) + "[ \t]*$", _rv_re.M)
        check(pat.search(code), "Keep the line  " + old + "  just as it was in the starter. Wren swaps other values in there to try your program.")
        code = pat.sub(lambda m: new, code, count=1)
    return code

def _rv_run(code):
    try:
        ns, ls = rerun(code)
        return ls, None
    except Exception as e:
        return None, type(e).__name__ + ": " + str(e)

def _rv_ref(code):
    # Wren's answer gives the same lines every time, so keep them between checks
    import sys as _rv_sys
    cache = _rv_sys.__dict__.setdefault("_rv_cache", {})
    # the same answer on other starting files gives other lines
    key = code + chr(0) + repr(sorted(files.items()))
    if key not in cache:
        if len(cache) > 400:
            cache.clear()
        cache[key] = _rv_run(code)
    return cache[key]

def _rv_show(ls):
    nl = chr(10) + "  "
    return nl + (nl.join(ls) if ls else "(nothing)")

def _rv_try(swaps, pre, drive, when, note):
    mine = pre + _rv_swap(src, swaps)
    ref = pre + _rv_swap(_RV_SOL, swaps)
    if drive:
        tail = chr(10) + "print(" + repr(_RV_MARK) + ")" + chr(10) + drive + chr(10)
        mine = mine + tail
        ref = ref + tail
    want, err = _rv_ref(ref)
    if err:
        raise RuntimeError("Wren's own answer broke: " + err)
    got, err = _rv_run(mine)
    extra = (chr(10) + note) if note else ""
    if not when.endswith(chr(10)):
        when = when + ", "
    if err:
        check(False, when + "your program stops with " + err + "." + extra)
    if drive:
        want = want[want.index(_RV_MARK) + 1:]
        check(_RV_MARK in got, when + "your program never gets to the end." + extra)
        got = got[got.index(_RV_MARK) + 1:]
    check(got == want, when + "Wren expects:" + _rv_show(want) + chr(10) + "but your program printed:" + _rv_show(got) + extra)

def _rv_today(advice):
    want, err = _rv_ref(_RV_SOL)
    if err:
        raise RuntimeError("Wren's own answer broke: " + err)
    check(len(lines) > 0, "Your program doesn't print anything yet.")
    n = len(want)
    check(len(lines) == n, "Wren is after " + str(n) + (" line" if n == 1 else " lines") + " of output, and your program printed " + str(len(lines)) + ". " + advice)
    check(lines == want, "Not quite. With today's values your program printed:" + _rv_show(lines) + chr(10) + advice)

`;

const show = (s: string) => s.replace(/\n/g, "\n  ");

/** Build the challenge-shaped question from a spec. */
export function build(s: Spec): Made {
  const data = s.data ?? {};
  const dataLines = Object.entries(data).map(([k, v]) => `${k} = ${py(v)}`);
  const top = (s.head ? s.head.trimEnd() + "\n" : "") + (dataLines.length ? dataLines.join("\n") + "\n" : "");
  const after = s.starter ?? (s.plan ?? []).map((p) => `# ${p}`).join("\n");
  const starter = top + (top && after ? "\n" : "") + (after ? after.trimEnd() + "\n" : "");
  const solution = top + s.body.trim() + "\n";
  const wrong = s.wrong.map((w) => top + w.trim() + "\n");

  const t: string[] = [PRE, `_RV_SOL = ${JSON.stringify(solution)}`];
  // what the program must use: before the first run when the checks call a function by
  // name, after today's output otherwise (so a plain wrong answer hears about its output)
  const needs = (s.needs ?? []).map(([re, msg]) => `check(_rv_re.search(${JSON.stringify(re)}, src), ${JSON.stringify(msg)})`);
  const advice = s.advice ?? "Read the task again, one step at a time.";
  if (s.drive) t.push(...needs, `_rv_try([], "", ${JSON.stringify(s.drive)}, ${JSON.stringify(`When Wren runs\n  ${show(s.drive.trim())}\n`)}, ${JSON.stringify(advice)})`);
  else t.push(`_rv_today(${JSON.stringify(advice)})`, ...needs);
  for (const v of s.variants) {
    const swaps: [string, string][] = [];
    const said: string[] = [];
    for (const [k, nv] of Object.entries(v.data ?? {})) {
      if (nv === undefined) continue;
      if (!(k in data)) throw new Error(`variant changes ${k}, which is not a data line`);
      const old = `${k} = ${py(data[k])}`;
      const now = `${k} = ${py(nv)}`;
      if (old !== now) swaps.push([old, now]);
      said.push(`\`${now}\``);
    }
    let pre = "";
    for (const [name, text] of Object.entries(v.files ?? {})) {
      pre += `with open(${JSON.stringify(name)}, "w") as _rv_f:\n    _rv_f.write(${JSON.stringify(text)})\n`;
      said.push(`${name} holding\n  ${show(text.trimEnd())}\n`);
    }
    const drive = v.drive ?? s.drive ?? "";
    // a message that ends in a newline (code or a file shown) goes on "Wren expects:" directly
    let when = said.length ? `With ${said.join(" and ")}` : "With other values";
    if (v.drive) when = (said.length ? when.trimEnd() + ", w" : "W") + `hen Wren runs\n  ${show(v.drive.trim())}\n`;
    t.push(`_rv_try(${JSON.stringify(swaps)}, ${JSON.stringify(pre)}, ${JSON.stringify(drive)}, ${JSON.stringify(when)}, ${JSON.stringify(v.note ?? "")})`);
  }
  return {
    title: s.title,
    topic: s.topic,
    task: s.task,
    starter,
    tests: t.join("\n") + "\n",
    solution,
    hints: s.hints,
    wrong,
    files: s.files,
    intro: s.intro,
    codex: s.codex,
    drives: !!s.drive,
  };
}
