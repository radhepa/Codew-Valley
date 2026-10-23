import type { CodexBlock } from "../content/types.ts";
import type { PythonRunner } from "../python/runner.ts";
import { esc, md, el } from "./md.ts";
import { icon } from "./icons.ts";

const TRY = `${icon("play")} Try it`;

/** Render Codex blocks. Each example gets a "Try it" button that runs it for real. */
export function renderBlocks(blocks: CodexBlock[], runner: PythonRunner): HTMLElement {
  const root = el(`<div class="codex-page"></div>`);
  for (const b of blocks) {
    if ("h" in b) root.append(el(`<h3>${md(b.h)}</h3>`));
    else if ("p" in b) root.append(el(`<p>${md(b.p)}</p>`));
    else if ("tip" in b) root.append(el(`<div class="tip">${icon("hint")}<span>${md(b.tip)}</span></div>`));
    else {
      const pre = el(`<pre class="code">${esc(b.code)}</pre>`);
      const btn = el<HTMLButtonElement>(`<button class="try" title="Run this example with real Python">${TRY}</button>`);
      pre.append(btn);
      root.append(pre);
      const label = el(`<div class="out-label">${b.err ? "Result" : "Output"}</div>`);
      const out = el(`<pre class="out${b.err ? " err-out" : ""}">${esc(b.err ? `${b.err} (an error)` : (b.out ?? ""))}</pre>`);
      if (b.out !== undefined || b.err) root.append(label, out);
      btn.addEventListener("click", async () => {
        if (runner.isRunning) return;
        btn.textContent = "Running…";
        if (!out.isConnected) root.insertBefore(out, pre.nextSibling), root.insertBefore(label, out);
        try {
          const res = await runner.run(b.code, [], { timeoutMs: 4000 });
          const text = res.error ? `${res.output}${res.error.type}: ${res.error.message}` : res.output || "(nothing printed)";
          out.textContent = text.trimEnd();
          out.classList.toggle("err-out", Boolean(res.error));
          label.textContent = "Real output";
        } finally {
          btn.innerHTML = TRY;
        }
      });
    }
  }
  return root;
}
