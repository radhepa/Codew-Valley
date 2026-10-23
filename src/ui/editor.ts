import { EditorView, keymap, lineNumbers, highlightActiveLine, Decoration, type DecorationSet } from "@codemirror/view";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting, indentUnit, bracketMatching } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// A calm night-ink editor theme with warm syntax colours.
const theme = EditorView.theme(
  {
    "&": { backgroundColor: "#1b1e25", color: "#e9e3d5" },
    ".cm-content": { fontFamily: "var(--mono)", padding: "12px 0", caretColor: "#d6b16a" },
    ".cm-gutters": { backgroundColor: "#1b1e25", color: "#5a5f6b", border: "none", paddingLeft: "6px" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#c8bfac" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "#d6b16a", borderLeftWidth: "2px" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(214, 177, 106, 0.22) !important" },
    ".cm-matchingBracket": { backgroundColor: "rgba(95, 199, 173, 0.22)", outline: "none" },
    ".cm-scroller": { lineHeight: "1.6" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: "#e0a26a", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "#a9c98a" },
  { tag: t.number, color: "#e3c27d" },
  { tag: [t.bool, t.null], color: "#e3c27d", fontWeight: "600" },
  { tag: t.comment, color: "#737a88", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#8cc6d6" },
  { tag: t.standard(t.variableName), color: "#8cc6d6" },
  { tag: t.propertyName, color: "#d9c3a5" },
  { tag: t.operator, color: "#c8bfac" },
  { tag: t.variableName, color: "#e9e3d5" },
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
