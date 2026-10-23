import { EditorView, keymap, lineNumbers, highlightActiveLine, Decoration, type DecorationSet } from "@codemirror/view";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting, indentUnit, bracketMatching } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// A warm, readable code editor theme to match the parchment UI.
const theme = EditorView.theme(
  {
    "&": { backgroundColor: "#2b2420", color: "#f4ead7" },
    ".cm-content": { fontFamily: "var(--mono)", padding: "12px 0", caretColor: "#ffd27a" },
    ".cm-gutters": { backgroundColor: "#241e1b", color: "#7d6d5e", border: "none" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.06)", color: "#c9b79f" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "#ffd27a", borderLeftWidth: "2px" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(255, 210, 122, 0.25) !important" },
    ".cm-matchingBracket": { backgroundColor: "rgba(127, 224, 200, 0.25)", outline: "none" },
    ".cm-scroller": { lineHeight: "1.6" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: "#f0a35e", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "#a8d878" },
  { tag: t.number, color: "#f7c96b" },
  { tag: [t.bool, t.null], color: "#f7c96b", fontWeight: "600" },
  { tag: t.comment, color: "#8f8273", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#7fd0e0" },
  { tag: t.standard(t.variableName), color: "#7fd0e0" },
  { tag: t.propertyName, color: "#e6c9a8" },
  { tag: t.operator, color: "#f4ead7" },
  { tag: t.variableName, color: "#f4ead7" },
]);

const setError = StateEffect.define<number | null>();
const errorField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setError)) {
        if (e.value == null || e.value < 1 || e.value > tr.state.doc.lines) deco = Decoration.none;
        else deco = Decoration.set([Decoration.line({ class: "cm-error-line" }).range(tr.state.doc.line(e.value).from)]);
      }
    }
    if (tr.docChanged) deco = Decoration.none;
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export interface CodeEditor {
  view: EditorView;
  get(): string;
  set(code: string): void;
  markError(line: number | null): void;
  focus(): void;
}

export function createEditor(parent: HTMLElement, doc: string, onChange: (code: string) => void, onRun: () => void): CodeEditor {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        python(),
        theme,
        syntaxHighlighting(highlight),
        errorField,
        keymap.of([{ key: "Mod-Enter", run: () => (onRun(), true) }, indentWithTab, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((u) => u.docChanged && onChange(u.state.doc.toString())),
        EditorView.contentAttributes.of({ "aria-label": "Python code editor", spellcheck: "false", autocorrect: "off", autocapitalize: "off" }),
      ],
    }),
  });
  return {
    view,
    get: () => view.state.doc.toString(),
    set: (code) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } }),
    markError: (line) => view.dispatch({ effects: setError.of(line) }),
    focus: () => view.focus(),
  };
}
