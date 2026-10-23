// Verifies every piece of Python content against real Python (Pyodide in Node):
// Codex examples print what they claim, quiz answers match real output, every
// challenge's reference solution passes and every listed mistake fails.
import { loadPyodide } from "pyodide";
import { HELPER } from "../src/python/helper.ts";
import { CODEX, codexById } from "../src/content/codex.ts";
import { BUILDINGS } from "../src/content/index.ts";

const py = await loadPyodide();
let out = "";
const dec = new TextDecoder();
py.setStdout({ write: (b) => ((out += dec.decode(b)), b.length) });
py.setStderr({ write: (b) => b.length });
py.runPython(HELPER);
const run = py.globals.get("_pg_run");
const grade = py.globals.get("_pg_grade");

function exec(code) {
  out = "";
  const res = run(code).toJs({ dict_converter: Object.fromEntries });
  return { ...res, output: out };
}
function check(code, tests) {
  out = "";
  return grade(code, tests).toJs({ dict_converter: Object.fromEntries });
}

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
let count = 0;

for (const page of CODEX) {
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

const ids = new Set();
for (const building of BUILDINGS) {
  for (const c of building.challenges) {
    const where = `${building.id}/${c.id}`;
    if (ids.has(c.id)) fail(where, "duplicate id");
    ids.add(c.id);
    for (const p of c.codex) if (!codexById.has(p)) fail(where, `unknown codex page ${p}`);

    // Quiz: the marked answer must be what really happens.
    count++;
    const q = exec(c.quiz.code);
    const want = c.quiz.options[c.quiz.answer];
    const got = q.status === "error" ? q.type : q.output.trimEnd() === "" ? "(nothing)" : q.output.trimEnd();
    if (got !== want) fail(`${where} quiz`, `answer says ${JSON.stringify(want)} but Python gives ${JSON.stringify(got)}`);
    const others = c.quiz.options.filter((_, i) => i !== c.quiz.answer);
    if (others.includes(got)) fail(`${where} quiz`, "two options are the same as the real output");

    count++;
    const sol = check(c.solution, c.tests);
    if (!sol.passed) fail(`${where} solution`, `fails: ${sol.status} ${sol.type ?? ""} ${sol.message ?? ""} ${sol.feedback}`);

    count++;
    const st = check(c.starter, c.tests);
    if (st.passed) fail(`${where} starter`, "passes without any work");
    if (st.feedback.startsWith("The rune-checker tripped")) fail(`${where} starter`, `checker crashed: ${st.feedback}`);

    c.wrong.forEach((w, i) => {
      count++;
      const res = check(w, c.tests);
      if (res.passed) fail(`${where} wrong#${i}`, "passes but should fail");
      else if (res.feedback.startsWith("The rune-checker tripped")) fail(`${where} wrong#${i}`, `checker crashed: ${res.feedback}`);
      else if (process.argv.includes("-v")) console.log(`  ${where} wrong#${i}: ${res.status === "error" ? res.type + ": " + res.message : res.feedback}`);
    });
  }
}

if (failures.length) {
  console.error(`✗ ${failures.length} of ${count} content checks failed:\n` + failures.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
console.log(`✓ all ${count} content checks passed (${CODEX.length} codex pages, ${ids.size} challenges)`);
