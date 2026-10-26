// Verifies every piece of Python content against real Python (Pyodide in Node):
// Codex examples print what they claim, quiz answers match real output, every
// challenge's reference solution passes and every listed mistake fails.
//
//   npm test                  everything
//   npm test -- dock market   only these buildings' challenges and Codex pages
//   npm test -- dock -v       also print why each listed mistake fails
//   npm test -- life          only the village runes (src/life)
//   npm test -- scenes        only the personal runes in heart events (src/content/scenes)
//   npm test -- review        only Wren's practice questions (src/life/review), 20 seeds each
//   npm test -- review:mk-    only the question templates whose id starts with mk-
import { loadPyodide } from "pyodide";
import { HELPER } from "../src/python/helper.ts";
import { CODEX, codexById, PAGES_BY_BUILDING } from "../src/content/codex.ts";
import { BUILDINGS } from "../src/content/index.ts";
import { checksFor } from "../src/content/types.ts";
import { PEOPLE, personById } from "../src/content/people/index.ts";
import { LIFE_RUNES } from "../src/life/runes.ts";
import { SCENE_RUNES } from "../src/content/scenes/runes.ts";
import { SCENES } from "../src/content/scenes/index.ts";
import { TEMPLATES, makeQuestion } from "../src/life/review/question.ts";

const py = await loadPyodide();
let out = "";
const dec = new TextDecoder();
py.setStdout({ write: (b) => ((out += dec.decode(b)), b.length) });
py.setStderr({ write: (b) => b.length });
py.runPython(HELPER);
// The game stops runaway programs with a timer; here an endless loop in a
// listed mistake would hang the tests, so learner code gets a line budget.
py.runPython(`
class LoopLimit(Exception):
    pass
_pg_lines = [0]
def _pg_tracer(frame, event, arg):
    if frame.f_code.co_filename != "main.py":
        return None
    def local(frame, event, arg):
        if event == "line":
            _pg_lines[0] += 1
            if _pg_lines[0] > 3000000:
                raise LoopLimit("ran more than 3 million lines: an endless loop?")
        return local
    return local
sys.settrace(_pg_tracer)
`);
const run = py.globals.get("_pg_run");
const grade = py.globals.get("_pg_grade");
// Python drops the tracer when it raises, so put it back before every run.
const resetLines = () => py.runPython("_pg_lines[0] = 0\nsys.settrace(_pg_tracer)");
const toPy = (files) => (files ? py.toPy(files) : null);
// The text a learner types into print(...) lines, with its capitals swapped
// ("Kinds of seed:" -> "kINDS OF SEED:"); escapes and f-string {fields} are
// left alone, and so is data printed from variables. Output checks ignore
// capitals unless a challenge is about them, so the solution must still pass.
const swapCase = (s) => [...s].map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join("");
function swapTyped(body, f) {
  let outText = "", depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "\\") {
      outText += ch + (body[i + 1] ?? "");
      i++;
    } else if (f && ch === "{" && body[i + 1] === "{" && !depth) {
      outText += "{{";
      i++;
    } else if (f && ch === "{") {
      depth++;
      outText += ch;
    } else if (f && ch === "}" && depth) {
      depth--;
      outText += ch;
    } else outText += depth ? ch : swapCase(ch);
  }
  return outText;
}
/** Swaps only strings handed straight to print (not keys or arguments nested deeper, which are data). */
function swapPrintLine(line) {
  const at = line.search(/(?<![\w.])print\(/);
  if (at < 0) return line;
  let i = at + 6, depth = 1, outText = line.slice(0, i);
  while (i < line.length && depth > 0) {
    const m = /^([rRfF]{0,2})(["'])/.exec(line.slice(i));
    if (m && !/\w/.test(line[i - 1] ?? "")) {
      const q = m[2];
      let j = i + m[0].length;
      while (j < line.length && line[j] !== q) j += line[j] === "\\" ? 2 : 1;
      const body = line.slice(i + m[0].length, j);
      const raw = /r/i.test(m[1]);
      outText += m[0] + (depth === 1 ? (raw ? swapCase(body) : swapTyped(body, /f/i.test(m[1]))) : body) + q;
      i = j + 1;
      continue;
    }
    const ch = line[i];
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    outText += ch;
    i++;
  }
  return outText + line.slice(i);
}
/** Print lines already in the starter are given text, not typed, so they stay. */
const swapPrinted = (code, starter) => {
  const given = new Set(starter.split("\n").map((l) => l.trim()));
  return code.split("\n").map((l) => (given.has(l.trim()) ? l : swapPrintLine(l))).join("\n");
};

function exec(code, files) {
  out = "";
  resetLines();
  const res = run(code, toPy(files)).toJs({ dict_converter: Object.fromEntries });
  return { ...res, output: out };
}
function check(code, tests, files) {
  out = "";
  resetLines();
  return grade(code, tests, toPy(files)).toJs({ dict_converter: Object.fromEntries });
}

// Building filter from the command line (anything that isn't a flag).
const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
for (const id of only) if (id !== "life" && id !== "scenes" && !id.startsWith("review") && !BUILDINGS.some((b) => b.id === id)) throw new Error(`No building "${id}". Try one of: ${BUILDINGS.map((b) => b.id).join(", ")}, life`);
const wanted = (id) => !only.length || only.includes(id);
/** Parts in each building's model (art/specs): one challenge per part. */
const STAGES = { tavern: 12, mill: 14, dock: 12, market: 14, bakery: 14, forge: 15, library: 14, apothecary: 14, townhall: 14, clocktower: 14, guildhall: 16, observatory: 16 };
/** Which building each Codex page belongs to, by story position (0 = tavern and mill). */
const pageHome = new Map();
Object.entries(PAGES_BY_BUILDING).forEach(([home, pages]) => pages.forEach((p) => pageHome.set(p.id, home === "base" ? 1 : BUILDINGS.findIndex((b) => b.id === home))));

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
let count = 0;

const pageIds = new Set();
for (const page of CODEX) {
  if (pageIds.has(page.id)) fail(`codex/${page.id}`, "duplicate page id");
  pageIds.add(page.id);
}
const checkedPages = Object.entries(PAGES_BY_BUILDING).filter(([home]) => (home === "base" ? !only.length : wanted(home))).flatMap(([, pages]) => pages);
for (const page of checkedPages) {
  page.blocks.forEach((b, i) => {
    if (!("code" in b)) return;
    count++;
    const where = `codex/${page.id}#${i}`;
    const res = exec(b.code);
    if (b.err) {
      if (res.status !== "error" || res.type !== b.err) fail(where, `expected ${b.err}, got ${res.status} ${res.type ?? ""}`);
    } else if (res.status !== "ok") fail(where, `raised ${res.type}: ${res.message}`);
    else if (b.out !== undefined && res.output.trimEnd() !== b.out.trimEnd())
      fail(where, `printed ${JSON.stringify(res.output)} but page says ${JSON.stringify(b.out)}`);
  });
}

function checkChallenge(where, c, at) {
  if (!c.topic?.trim()) fail(where, "needs a topic");
  for (const p of c.codex) {
    if (!codexById.has(p)) fail(where, `unknown codex page ${p}`);
    else if (pageHome.get(p) > Math.max(at, 1)) fail(where, `codex page ${p} is taught in a later building`);
  }

  // Quiz: the marked answer must be what really happens.
  count++;
  const q = exec(c.quiz.code);
  const want = c.quiz.options[c.quiz.answer];
  const got = q.status === "error" ? q.type : q.output.trimEnd() === "" ? "(nothing)" : q.output.trimEnd();
  if (got !== want) fail(`${where} quiz`, `answer says ${JSON.stringify(want)} but Python gives ${JSON.stringify(got)}`);
  const others = c.quiz.options.filter((_, i) => i !== c.quiz.answer);
  if (others.includes(got)) fail(`${where} quiz`, "two options are the same as the real output");

  count++;
  const sol = check(c.solution, checksFor(c), c.files);
  if (!sol.passed) fail(`${where} solution`, `fails: ${sol.status} ${sol.type ?? ""} ${sol.message ?? ""} ${sol.feedback}`);

  const swapped = swapPrinted(c.solution, c.starter);
  if (sol.passed && swapped !== c.solution && !checksFor(c).startsWith("# case: strict")) {
    count++;
    const loud = check(swapped, checksFor(c), c.files);
    if (!loud.passed) fail(`${where} capitals`, `the solution fails once the text in its print lines has its capitals swapped, so a check still minds capitals: ${loud.feedback || loud.message}`);
  }

  count++;
  const st = check(c.starter, checksFor(c), c.files);
  if (st.passed) fail(`${where} starter`, "passes without any work");
  if (st.feedback.startsWith("The rune-checker tripped")) fail(`${where} starter`, `checker crashed: ${st.feedback}`);

  c.wrong.forEach((w, i) => {
    count++;
    const res = check(w, checksFor(c), c.files);
    if (res.passed) fail(`${where} wrong#${i}`, "passes but should fail");
    else if (res.feedback.startsWith("The rune-checker tripped")) fail(`${where} wrong#${i}`, `checker crashed: ${res.feedback}`);
    else if (process.argv.includes("-v")) console.log(`  ${where} wrong#${i}: ${res.status === "error" ? res.type + ": " + res.message : res.feedback}`);
  });
}

const ids = new Set();
for (const building of BUILDINGS) {
  for (const c of building.challenges) if (ids.has(c.id)) fail(`${building.id}/${c.id}`, "duplicate id");
  building.challenges.forEach((c) => ids.add(c.id));
  if (!wanted(building.id)) continue;
  const at = BUILDINGS.indexOf(building);
  const want = STAGES[building.id];
  if (building.challenges.length && building.challenges.length !== want)
    fail(`buildings/${building.id}`, `has ${building.challenges.length} challenges but its model has ${want} parts (one challenge per part)`);
  if (building.challenges.length === want && building.id !== "tavern" && building.id !== "mill") {
    if (!building.chronicle) fail(`buildings/${building.id}`, "needs its Chronicle page (STORY.md)");
    if (!building.opening.length || !building.finale.length) fail(`buildings/${building.id}`, "needs opening and finale lines");
  }
  for (const c of building.challenges) checkChallenge(`${building.id}/${c.id}`, c, at);
}

// Village runes (src/life): same checks; they may use what's taught up to the building they need.
const runeIds = new Set();
for (const r of LIFE_RUNES) {
  if (ids.has(r.id) || runeIds.has(r.id)) fail(`life/${r.id}`, "duplicate id");
  runeIds.add(r.id);
  const at = BUILDINGS.findIndex((b) => b.id === r.requires);
  if (at < 0) fail(`life/${r.id}`, `requires "${r.requires}", which is not a building`);
  else if (!only.length || only.includes("life")) checkChallenge(`life/${r.id}`, r, at);
}

// Personal runes in heart events (src/content/scenes): the same checks, `npm test -- scenes`.
for (const r of SCENE_RUNES) {
  if (ids.has(r.id) || runeIds.has(r.id)) fail(`scenes/${r.id}`, "duplicate id");
  runeIds.add(r.id);
  const at = BUILDINGS.findIndex((b) => b.id === r.requires);
  if (at < 0) fail(`scenes/${r.id}`, `requires "${r.requires}", which is not a building`);
  else if (!only.length || only.includes("scenes")) checkChallenge(`scenes/${r.id}`, r, at);
}

// Wren's daily practice (src/life/review): every question template, built with 20 seeds.
// The solution passes, the starter, every listed mistake and a typed-in copy of the output
// fail (without tripping the checker), a seed always builds the same question, the task and
// hints never give away the output, and nothing uses Python its buildings haven't taught.
const reviewArgs = only.filter((a) => a.startsWith("review"));
if (!only.length || reviewArgs.length) {
  const prefixes = reviewArgs.map((a) => a.slice("review:".length)).filter(Boolean);
  const order = BUILDINGS.map((b) => b.id);
  // [pattern, first building that teaches it]; strings and comments are blanked first
  const TAUGHT = [
    [/\bif\b/, "mill"], [/\bwhile\b|\bbreak\b|\bcontinue\b|\bimport random\b/, "dock"],
    [/\.(append|sort|pop|insert|remove|index)\(|\bsorted\(|\bsum\(/, "market"],
    [/\bfor\b|\brange\(|\benumerate\(|\bzip\(/, "bakery"], [/\bdef\b|\breturn\b/, "forge"],
    [/\{|\.(items|keys|values|get)\(|\bdel\b/, "library"],
    [/\.(split|join)\(|\btry\b|\bexcept\b|\braise\b|\bset\(/, "apothecary"],
    [/\bopen\(|\bwith\b|\bimport csv\b/, "townhall"],
    [/\bmath\b|\bdatetime\b|\bdivmod\(|\[[^\n]*\bfor\b|=[^\n]*\bif\b[^\n]*\belse\b|random\.(choice|shuffle|sample)/, "clocktower"],
    [/\bclass\b|\bisinstance\(|\bsuper\(/, "guildhall"], [/\byield\b|\blambda\b|\bnext\(/, "observatory"],
  ];
  const bare = (code) => code.replace(/"""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""').replace(/#.*$/gm, "");
  const tids = new Set();
  for (const t of TEMPLATES) {
    const where = `review/${t.id}`;
    if (tids.has(t.id)) fail(where, "duplicate template id");
    tids.add(t.id);
    if (prefixes.length && !prefixes.some((p) => t.id.startsWith(p))) continue;
    count++;
    if (!t.topics.length || t.topics.some((id) => !order.includes(id))) fail(where, `topics ${JSON.stringify(t.topics)} must be building ids`);
    if (![1, 2, 3].includes(t.difficulty)) fail(where, "difficulty must be 1, 2 or 3");
    const at = Math.max(...t.topics.map((id) => order.indexOf(id)));
    for (let seed = 1; seed <= 20; seed++) {
      const w = `${where}@${seed}`;
      let q;
      try {
        q = makeQuestion(t, seed);
      } catch (e) {
        fail(w, `make() threw ${e.message}`);
        continue;
      }
      if (JSON.stringify(makeQuestion(t, seed)) !== JSON.stringify(q)) fail(w, "the same seed built a different question");
      const m = q.made;
      if (!m.title || !m.topic || !m.task.length) fail(w, "needs a title, a topic and a task");
      if (m.hints.length !== 3 || m.hints.some((h) => !h.trim())) fail(w, "needs exactly three hints");
      if (m.wrong.length < 2) fail(w, "needs at least two wrong answers");
      for (const p of m.codex ?? []) if (!codexById.has(p)) fail(w, `unknown codex page ${p}`);
      for (const [code, what] of [[m.solution, "solution"], [m.starter, "starter"], ...m.wrong.map((x, i) => [x, `wrong#${i}`])])
        for (const [re, home] of TAUGHT) if (order.indexOf(home) > at && re.test(bare(code))) fail(w, `${what} uses ${re.exec(bare(code))[0].trim()}, taught at the ${home}`);
      count++;
      const sol = check(m.solution, checksFor(m), m.files);
      if (!sol.passed) {
        fail(`${w} solution`, `fails: ${sol.status} ${sol.type ?? ""} ${sol.message ?? ""} ${sol.feedback}`);
        continue;
      }
      // the task and hints describe the output; they never print it
      const said = [...m.task, ...m.hints].join("\n");
      const printed = exec(m.solution, m.files).output.trim();
      for (const line of [printed, ...printed.split("\n")].map((l) => l.trim()))
        if (line.length >= 3 && !/^(True|False|None)$/.test(line) && said.includes(line)) fail(w, `the task or a hint gives away the output ${JSON.stringify(line)}`);
      const fakes = m.drives || !printed ? [] : [m.starter + printed.split("\n").map((l) => `print(${JSON.stringify(l)})`).join("\n") + "\n"];
      for (const [code, what] of [[m.starter, "starter"], ...m.wrong.map((x, i) => [x, `wrong#${i}`]), ...fakes.map((x) => [x, "typed-in output"])]) {
        count++;
        const res = check(code, checksFor(m), m.files);
        if (res.passed) fail(`${w} ${what}`, "passes but should fail");
        else if (res.feedback.startsWith("The rune-checker tripped")) fail(`${w} ${what}`, `checker crashed: ${res.feedback}`);
        else if (process.argv.includes("-v") && seed === 1) console.log(`  ${w} ${what}: ${res.status === "error" ? res.type + ": " + res.message : res.feedback}`);
      }
    }
  }
}

// Flags the heart events can set (flag -> its values), so sayings can only ask for real ones.
const sceneFlags = new Map();
const addFlag = (k, v) => sceneFlags.set(k, (sceneFlags.get(k) ?? new Set()).add(v));
const walkSteps = (steps) => {
  for (const st of steps) {
    if ("choice" in st) for (const o of st.choice.options) addFlag(st.choice.flag, o.value), walkSteps(o.then);
    if ("flag" in st) addFlag(st.flag, st.value ?? "yes");
    if ("if" in st) walkSteps([...st.then, ...(st.else ?? [])]);
    if ("rune" in st) walkSteps([...st.solved, ...st.skipped]);
  }
};
for (const sc of SCENES) walkSteps(sc.steps);

// Villagers: every profile is complete, and every building's villager has one.
const questionIds = new Set();
for (const p of PEOPLE) {
  const where = `people/${p.id}`;
  count++;
  if (p.talk.length !== 4 || p.talk.some((t) => t.length < 3)) fail(where, "needs 4 talk tiers with at least 3 lines each");
  if (p.milestones.length !== 5) fail(where, "needs 5 milestones (2, 4, 6, 8, 10 hearts)");
  if (!p.rain.length || !p.evening.length) fail(where, "needs rain and evening lines");
  if (p.home && !BUILDINGS.some((b) => b.id === p.home)) fail(where, `home "${p.home}" is not a building`);
  const said = (p.sayings ?? []).flatMap((s) => (typeof s.say === "string" ? [s.say] : s.say));
  const lines = [...p.talk.flat(), ...p.rain, ...p.evening, ...p.milestones, ...said, ...p.questions.flatMap((q) => [q.ask, ...q.choices.map((c) => c.reply)])];
  const firsts = new Set();
  for (const s of p.sayings ?? []) {
    const first = typeof s.say === "string" ? s.say : s.say[0];
    if (!first) fail(where, "has an empty saying");
    else if (firsts.has(first.slice(0, 48))) fail(where, `two sayings start the same way: "${first.slice(0, 48)}"`);
    firsts.add(first?.slice(0, 48));
    if ((s.min ?? 0) > (s.max ?? 10)) fail(where, `saying "${first}" has min hearts above max`);
    for (const id of [s.after, s.before]) if (id && !BUILDINGS.some((b) => b.id === id)) fail(where, `saying "${first}" names "${id}", which is not a building`);
    if (s.flag) {
      const [k, v] = s.flag.replace(/^!/, "").split("=");
      if (!sceneFlags.has(k)) fail(where, `saying "${first}" needs flag "${k}", which no heart event sets`);
      else if (v !== undefined && !sceneFlags.get(k).has(v)) fail(where, `saying "${first}" needs ${k}=${v}, but it is only ever ${[...sceneFlags.get(k)].join(" or ")}`);
    }
  }
  if (lines.some((l) => !l.trim())) fail(where, "has an empty line");
  if (lines.some((l) => l.startsWith(p.name + ":"))) fail(where, "lines are in their own voice; drop the 'Name:' prefix");
  for (const q of p.questions) {
    if (questionIds.has(q.id)) fail(where, `duplicate question id ${q.id}`);
    questionIds.add(q.id);
    if (q.choices.length < 2 || q.choices.length > 3) fail(where, `${q.id} needs 2 or 3 choices`);
    if (q.choices.some((c) => c.points < 0 || c.points > 60)) fail(where, `${q.id} points should be 0 to 60`);
  }
}
for (const b of BUILDINGS) if (b.villager && !personById.has(b.villager.model)) fail(`buildings/${b.id}`, `no profile in src/content/people for ${b.villager.model}`);

if (failures.length) {
  console.error(`✗ ${failures.length} of ${count} content checks failed:\n` + failures.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
const scope = only.length ? ` for ${only.join(", ")}` : "";
console.log(`✓ all ${count} content checks passed${scope} (${CODEX.length} codex pages, ${ids.size} challenges, ${PEOPLE.length} villagers)`);
