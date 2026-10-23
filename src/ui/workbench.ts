import type { Challenge } from "../content/types.ts";
import { codexById } from "../content/codex.ts";
import type { PythonRunner } from "../python/runner.ts";
import type { RunResult } from "../python/protocol.ts";
import { store } from "../state.ts";
import { sfx } from "../game/audio.ts";
import { renderBlocks } from "./blocks.ts";
import { createEditor } from "./editor.ts";
import { friendlyError } from "./errors.ts";
import { esc, md, el } from "./md.ts";
import { portrait } from "./portrait.ts";
import { modelOf, toLine } from "./speakers.ts";

export interface BenchOptions {
  challenge: Challenge;
  stage: number;
  total: number;
  runner: PythonRunner;
  close(): void;
  openCodex(page: string): void;
  /** Called when the checks pass and the player chooses to build. */
  build(): void;
}

type Tab = "story" | "learn" | "quiz" | "task";

/** The coding workbench for one challenge. */
export function workbench(o: BenchOptions): HTMLElement {
  const c = o.challenge;
  const data = store.data;
  const root = el(`<div class="panel modal bench" role="dialog" aria-label="${esc(c.title)}">
    <div class="modal-head">
      <span style="font-size:1.5rem">🪨</span>
      <h2>${esc(c.title)} <small style="font-family:var(--font);font-weight:600;color:var(--ink-soft);font-size:.9rem">· Part ${o.stage} of ${o.total}: ${esc(c.part)}</small></h2>
      <button class="close" aria-label="Close">✕</button>
    </div>
    <div class="bench-body">
      <div class="bench-left">
        <div class="tabs" role="tablist"></div>
        <div class="tab-body"></div>
      </div>
      <div class="bench-right">
        <div class="bench-tools">
          <button class="btn wood run" title="Run your program (Ctrl+Enter)">▶ Run</button>
          <button class="btn check" title="Check your program against the rune stone">✓ Check &amp; build</button>
          <span class="spacer"></span>
          <span class="py-status"></span>
          <button class="btn ghost reset" title="Put the starter code back">↺ Reset</button>
        </div>
        <div class="editor-wrap"></div>
        <div class="feedback" aria-live="polite"></div>
        <div class="console" aria-label="Output" aria-live="polite"><span class="dim">Your program's output appears here. Press ▶ Run to try it.</span></div>
      </div>
    </div>
  </div>`);

  const tabs = root.querySelector<HTMLElement>(".tabs")!;
  const body = root.querySelector<HTMLElement>(".tab-body")!;
  const consoleEl = root.querySelector<HTMLElement>(".console")!;
  const feedback = root.querySelector<HTMLElement>(".feedback")!;
  const runBtn = root.querySelector<HTMLButtonElement>(".run")!;
  const checkBtn = root.querySelector<HTMLButtonElement>(".check")!;
  const status = root.querySelector<HTMLElement>(".py-status")!;
  root.querySelector(".close")!.addEventListener("click", o.close);

  let pipImg = "";
  void portrait("pip").then((u) => {
    pipImg = u;
    root.querySelectorAll<HTMLImageElement>("img.pip").forEach((i) => (i.src = u));
  });
  const pipTag = () => `<img class="pip" alt="Pip" src="${pipImg}">`;

  // ---- left side tabs -------------------------------------------------------

  const labels: Record<Tab, string> = { story: "📜 Story", learn: "📖 Learn", quiz: "❓ Quick check", task: "🛠 Task & hints" };
  let tab: Tab = data.drafts[c.id] !== undefined ? "task" : "story";
  function drawTabs() {
    tabs.innerHTML = "";
    for (const t of Object.keys(labels) as Tab[]) {
      const done = t === "quiz" && data.quiz[c.id];
      const b = el<HTMLButtonElement>(`<button class="tab ${t === tab ? "on" : ""}" role="tab" aria-selected="${t === tab}">${labels[t]}${done ? '<span class="dot" title="Answered"></span>' : ""}</button>`);
      b.addEventListener("click", () => show(t));
      tabs.append(b);
    }
  }
  function show(t: Tab) {
    tab = t;
    drawTabs();
    body.innerHTML = "";
    if (t === "story") story();
    else if (t === "learn") learn();
    else if (t === "quiz") quiz();
    else task();
    root.querySelector(".bench-left")!.scrollTop = 0;
  }
  function nextBtn(label: string, to: Tab) {
    const b = el<HTMLButtonElement>(`<button class="btn" style="margin-top:12px">${label} →</button>`);
    b.addEventListener("click", () => show(to));
    return b;
  }
  function story() {
    const s = el(`<div class="story"></div>`);
    for (const raw of c.intro) {
      const line = toLine(raw);
      if (line.who === "Pip") s.append(el(`<div class="pip-line">${pipTag()}<p>${md(line.text)}</p></div>`));
      else {
        const row = el(`<div class="pip-line"><img class="pip" alt="${esc(line.who)}"><p><b>${esc(line.who)}:</b> ${md(line.text)}</p></div>`);
        void portrait(modelOf(line.who)).then((u) => (row.querySelector("img")!.src = u));
        s.append(row);
      }
    }
    body.append(s, nextBtn("Learn what you need", "learn"));
  }
  function learn() {
    const page = codexById.get(c.codex[0])!;
    body.append(el(`<h3 class="section-title" style="font-size:1.2rem">${esc(page.title)}</h3>`));
    body.append(renderBlocks(page.blocks, o.runner));
    if (c.codex.length > 1) {
      const more = el(`<p style="margin-top:14px">Also useful: </p>`);
      c.codex.slice(1).forEach((id, i) => {
        const a = el(`<a class="link">${esc(codexById.get(id)!.title)}</a>`);
        a.addEventListener("click", () => o.openCodex(id));
        more.append(i ? ", " : "", a);
      });
      body.append(more);
    }
    body.append(nextBtn("Quick check", "quiz"));
  }
  function quiz() {
    const q = c.quiz;
    const wrap = el(`<div class="quiz"><p style="font-weight:700;margin:0 0 6px">${md(q.question)}</p><pre class="code">${esc(q.code)}</pre><div class="opts"></div><div class="why-slot"></div></div>`);
    const opts = wrap.querySelector<HTMLElement>(".opts")!;
    const slot = wrap.querySelector<HTMLElement>(".why-slot")!;
    // stable shuffle per challenge so the answer isn't always first
    const order = q.options.map((_, i) => i).sort((a, b) => ((a * 7 + c.id.length) % 5) - ((b * 7 + c.id.length) % 5));
    for (const i of order) {
      const b = el<HTMLButtonElement>(`<button class="opt">${esc(q.options[i])}</button>`);
      b.addEventListener("click", () => {
        if (i === q.answer) {
          b.classList.add("right");
          sfx.success();
          data.quiz[c.id] = true;
          store.changed();
          slot.innerHTML = "";
          slot.append(el(`<div class="why">✅ <b>Right!</b> ${md(q.why)}</div>`), nextBtn("On to the task", "task"));
          drawTabs();
        } else {
          b.classList.remove("wrong");
          void b.offsetWidth;
          b.classList.add("wrong");
          sfx.error();
          slot.innerHTML = "";
          slot.append(el(`<div class="why">Not quite. Read it line by line, like Python does, and try another answer. You can press <b>▶ Try it</b> on the Learn tab to test examples.</div>`));
        }
      });
      opts.append(b);
    }
    body.append(wrap);
  }
  function task() {
    const t = el(`<div class="task"><h4>Your task</h4><ul></ul></div>`);
    const ul = t.querySelector("ul")!;
    for (const line of c.task) ul.append(el(`<li>${md(line)}</li>`));
    body.append(el(`<div class="pip-line">${pipTag()}<p>Write your program on the right. Press <b>▶ Run</b> to see what it does, then <b>✓ Check &amp; build</b> when you think it's right.</p></div>`), t);
    const h = el(`<div class="hints"><h4 class="section-title">Stuck?</h4><div class="list"></div></div>`);
    const list = h.querySelector<HTMLElement>(".list")!;
    const drawHints = () => {
      list.innerHTML = "";
      const shown = data.hints[c.id] ?? 0;
      for (let i = 0; i < shown; i++) list.append(el(`<div class="hint"><b>Hint ${i + 1}:</b> ${md(c.hints[i])}</div>`));
      if (shown < c.hints.length) {
        const b = el<HTMLButtonElement>(`<button class="btn ghost" style="margin-top:6px">💡 Show hint ${shown + 1} of ${c.hints.length}</button>`);
        b.addEventListener("click", () => {
          data.hints[c.id] = shown + 1;
          store.changed();
          drawHints();
        });
        list.append(b);
      }
      const pages = el(`<p style="font-size:.92rem;margin-top:12px">Codex pages for this part: </p>`);
      c.codex.forEach((id, i) => {
        const a = el(`<a class="link">${esc(codexById.get(id)!.title)}</a>`);
        a.addEventListener("click", () => o.openCodex(id));
        pages.append(i ? " · " : "", a);
      });
      list.append(pages);
    };
    drawHints();
    body.append(h);
  }

  // ---- editor and running ---------------------------------------------------

  let saveTimer = 0;
  const editor = createEditor(
    root.querySelector<HTMLElement>(".editor-wrap")!,
    data.drafts[c.id] ?? c.starter,
    (code) => {
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        data.drafts[c.id] = code;
        store.changed();
      }, 400);
    },
    () => void run(),
  );
  root.querySelector(".reset")!.addEventListener("click", () => {
    if (editor.get() !== c.starter && !confirm("Put the starter code back? Your current code will be replaced.")) return;
    editor.set(c.starter);
    hideFeedback();
  });

  const unsub = o.runner.onStatus((s) => {
    status.textContent = s.state === "ready" ? `🐍 ${s.message}` : s.message;
  });
  root.addEventListener("bench:destroy", () => {
    unsub();
    clearTimeout(saveTimer);
    data.drafts[c.id] = editor.get();
    store.changed();
  });

  function hideFeedback() {
    feedback.className = "feedback";
    feedback.innerHTML = "";
  }
  function showFeedback(kind: "good" | "bad", title: string, text: string, extra?: HTMLElement) {
    feedback.className = `feedback show ${kind}`;
    feedback.innerHTML = "";
    const box = el(`<div><b>${esc(title)}</b><div class="fb-text">${md(text)}</div></div>`);
    if (extra) box.append(extra);
    feedback.append(el(pipTag()), box);
  }
  function explainResult(res: RunResult, code: string): boolean {
    editor.markError(null);
    if (res.status === "timeout") {
      showFeedback("bad", "That took too long", "Your program didn't finish in time. Is something repeating forever? Press Run to see what it prints.");
      return true;
    }
    if (res.status === "crashed") {
      showFeedback("bad", "Python had a hiccup", "The Python engine restarted. Press Run or Check again.");
      return true;
    }
    if (res.error) {
      const f = friendlyError(res.error, code);
      editor.markError(res.error.line);
      const extra = el(`<div style="margin-top:6px;font-size:.88rem"></div>`);
      if (f.codex && codexById.has(f.codex)) {
        const a = el(`<a class="link">Read “${esc(codexById.get(f.codex)!.title)}” in the Codex</a>`);
        a.addEventListener("click", () => o.openCodex(f.codex!));
        extra.append(a);
      }
      showFeedback("bad", `${f.title} (${res.error.type})`, f.explain, extra);
      return true;
    }
    return false;
  }
  function writeConsole(res: RunResult | null, live: string) {
    consoleEl.innerHTML = "";
    const text = res ? res.transcript.map((s) => s.text).join("") : live;
    if (res && !res.transcript.length && !res.error) consoleEl.append(el(`<span class="dim">(Your program ran but printed nothing.)</span>`));
    if (res) {
      for (const s of res.transcript) consoleEl.append(el(`<span class="${s.kind === "err" ? "err" : ""}">${esc(s.text)}</span>`));
    } else consoleEl.textContent = text;
  }

  async function run() {
    if (o.runner.isRunning) return;
    hideFeedback();
    const code = editor.get();
    runBtn.disabled = checkBtn.disabled = true;
    consoleEl.innerHTML = "";
    let live = "";
    try {
      const res = await o.runner.run(code, [], {
        timeoutMs: 5000,
        onStream: (kind, text) => {
          live += text;
          if (kind === "notice") consoleEl.append(el(`<span class="notice">${esc(text)}\n</span>`));
          else consoleEl.append(el(`<span class="${kind === "err" ? "err" : ""}">${esc(text)}</span>`));
          consoleEl.scrollTop = consoleEl.scrollHeight;
        },
      });
      writeConsole(res, live);
      sfx.click();
      explainResult(res, code);
    } catch (err) {
      consoleEl.textContent = String(err instanceof Error ? err.message : err);
    } finally {
      runBtn.disabled = checkBtn.disabled = false;
    }
  }

  async function check() {
    if (o.runner.isRunning) return;
    hideFeedback();
    const code = editor.get();
    data.drafts[c.id] = code;
    store.changed();
    runBtn.disabled = checkBtn.disabled = true;
    checkBtn.textContent = "Checking…";
    try {
      const res = await o.runner.run(code, [], { timeoutMs: 6000, tests: c.tests });
      writeConsole(res, "");
      if (explainResult(res, code)) {
        sfx.error();
        return;
      }
      if (res.grade?.passed) {
        sfx.success();
        const already = store.isDone(c.id);
        const b = el<HTMLButtonElement>(`<button class="btn amber" style="margin-top:10px">${already ? "Close" : `🔨 Build the ${esc(c.part.toLowerCase())}!`}</button>`);
        b.addEventListener("click", () => (already ? o.close() : o.build()));
        showFeedback("good", "The rune stone glows!", already ? "Still correct. Nicely done." : "Your program works. The valley is ready to build.", b);
        b.focus();
      } else {
        sfx.error();
        showFeedback("bad", "Not quite yet", res.grade?.feedback || "Something doesn't match the task yet. Read the task again.");
      }
    } finally {
      runBtn.disabled = checkBtn.disabled = false;
      checkBtn.innerHTML = "✓ Check &amp; build";
    }
  }
  runBtn.addEventListener("click", () => void run());
  checkBtn.addEventListener("click", () => void check());

  show(tab);
  if (tab === "task") setTimeout(() => editor.focus(), 50);
  return root;
}
