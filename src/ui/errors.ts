import type { PyErrorInfo } from "../python/protocol.ts";

export interface Friendly {
  title: string;
  explain: string;
  /** Codex page that teaches the fix. */
  codex?: string;
}

// Pip's plain-words version of a Python error. Matches the most specific
// message first; falls back to a general explanation of the error type.
export function friendlyError(e: PyErrorInfo, source: string): Friendly {
  const m = e.message;
  const at = e.line ? ` on line ${e.line}` : "";
  const lineText = e.line ? (source.split("\n")[e.line - 1] ?? "").trim() : "";

  switch (e.type) {
    case "NameError": {
      const name = /name '(\w+)' is not defined/.exec(m)?.[1];
      const suggestion = /Did you mean: '(\w+)'/.exec(m)?.[1];
      if (name === "Print" || name === "PRINT") return { title: "print is lowercase", explain: `Python is picky about capitals. Write \`print\`, all lowercase${at}.`, codex: "print" };
      if (name && /^(true|false)$/.test(name)) return { title: "True and False need capitals", explain: `Write \`${name[0].toUpperCase() + name.slice(1)}\` with a capital letter${at}.`, codex: "booleans" };
      let explain = `Python doesn't know anything called \`${name ?? "that"}\`${at}.`;
      if (suggestion) explain += ` Did you mean \`${suggestion}\`?`;
      explain += " Maybe it's a typo, maybe you meant text and forgot the quotes, or maybe the variable hasn't been created yet (Python reads from top to bottom).";
      return { title: "Unknown name", explain, codex: "variables" };
    }
    case "SyntaxError":
    case "IndentationError":
    case "TabError": {
      if (/unterminated string|EOL while scanning|unterminated triple/.test(m))
        return { title: "A string never ends", explain: `A quote was opened${at} but never closed. Every string needs a matching closing quote. If the text has an apostrophe, wrap it in double quotes.`, codex: "strings" };
      if (/was never closed/.test(m))
        return { title: "A bracket is still open", explain: `${m.replace(/^'(.)' was never closed$/, "An opening `$1`")} was never closed${at}. Count your brackets: each \`(\` needs a \`)\`.`, codex: "print" };
      if (/unmatched|does not match/.test(m))
        return { title: "Brackets don't match", explain: `There's a closing bracket${at} without a matching opening one, or the wrong kind of bracket.`, codex: "print" };
      if (/unexpected indent/.test(m))
        return { title: "Unexpected spaces at the start", explain: `Line ${e.line ?? "?"} starts with spaces. For now, every line should start right at the left edge.`, codex: "errors" };
      if (/Missing parentheses in call to 'print'/.test(m))
        return { title: "print needs parentheses", explain: `Put what you want to print inside parentheses: \`print("like this")\`${at}.`, codex: "print" };
      if (/cannot assign to literal|cannot assign to expression|cannot assign to function call/.test(m))
        return { title: "Backwards assignment", explain: `With \`=\` the variable name goes on the **left** and the value on the right, like \`wood = 10\`${at}. To compare two things, use \`==\`.`, codex: "variables" };
      if (/Maybe you meant '==' or ':=' instead of '='/.test(m))
        return { title: "= versus ==", explain: `\`=\` stores a value; \`==\` compares two values${at}.`, codex: "booleans" };
      if (/invalid decimal literal/.test(m))
        return { title: "A name can't start with a number", explain: `Something${at} starts with a digit and then has letters. Variable names must start with a letter, like \`wood2\` not \`2wood\`.`, codex: "variables" };
      if (/Perhaps you forgot a comma/.test(m))
        return { title: "Missing comma or quote?", explain: `Python found two things side by side${at} with nothing joining them. In \`print\`, separate items with commas; text needs quotes around it.${lineText ? ` The line is: \`${lineText}\`` : ""}`, codex: "print" };
      if (/f-string/.test(m))
        return { title: "f-string trouble", explain: `Something inside an f-string's curly braces${at} isn't valid Python. Check the \`{}\` pairs and the names inside them.`, codex: "fstrings" };
      return { title: "Python can't read this line", explain: `Something${at} breaks Python's grammar (${m}). Look for a missing quote, bracket or comma, here or on the line just above.`, codex: "errors" };
    }
    case "TypeError": {
      if (/can only concatenate str \(not "(\w+)"\) to str/.test(m) || /unsupported operand type\(s\) for \+: '(int|float)' and 'str'/.test(m))
        return { title: "Mixing text and numbers", explain: `You used \`+\` between a string and a number${at}. Python won't guess what you mean. Turn the number into text with \`str()\`, or the text into a number with \`int()\`, or use an f-string.`, codex: "types" };
      if (/unsupported operand type/.test(m))
        return { title: "That maths doesn't work on these types", explain: `${m}${at}. One of the values probably isn't the type you expect. Check for text where you wanted a number.`, codex: "types" };
      if (/'str' object is not callable|'int' object is not callable/.test(m))
        return { title: "Something isn't a function", explain: `You put \`()\` after a value that isn't a function${at}. Did you name a variable \`print\`, \`str\` or \`int\` earlier?`, codex: "variables" };
      if (/takes \d+ positional argument|missing \d+ required/.test(m))
        return { title: "Wrong number of inputs", explain: `${m}${at}.`, codex: "string-methods" };
      return { title: "Wrong type", explain: `A value was used the wrong way for its type${at}: ${m}.`, codex: "types" };
    }
    case "ValueError":
      if (/invalid literal for int\(\)/.test(m))
        return { title: "That text isn't a whole number", explain: `\`int()\` can only convert text that looks like a whole number, such as \`"12"\`${at}. ${m.replace("invalid literal for int() with base 10:", "It got")}.`, codex: "types" };
      return { title: "Bad value", explain: `The type was right but the value wasn't${at}: ${m}.`, codex: "types" };
    case "IndexError":
      return { title: "Past the end", explain: `You asked for a position that doesn't exist${at}. Remember counting starts at 0, so the last position is one less than the length.`, codex: "indexing" };
    case "AttributeError": {
      const meth = /has no attribute '(\w+)'/.exec(m)?.[1];
      return { title: "No such method", explain: `${meth ? `\`.${meth}\` isn't` : "That isn't"} something this value has${at}. Check the spelling (methods are lowercase) and the type of the value.`, codex: "string-methods" };
    }
    case "ZeroDivisionError":
      return { title: "Dividing by zero", explain: `Nothing can be divided by zero${at}. Check the value you're dividing by.`, codex: "math" };
    case "EOFError":
      return { title: "No input to read", explain: "The program called `input()`, but these challenges don't type anything in. Use the variables you were given instead.", codex: "variables" };
    case "RecursionError":
      return { title: "Too deep", explain: `A function kept calling itself${at}.`, codex: "errors" };
    default:
      return { title: e.type, explain: `${m}${at}.`, codex: "errors" };
  }
}
