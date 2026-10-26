// Python code loaded once into every interpreter (the browser worker and the
// Node content tests share it, so a challenge passes in tests exactly when it
// passes in the game).
//
// Each run executes in a brand-new globals dict and an empty working folder.
// Afterwards anything the program changed in builtins or sys streams is put
// back and every module it imported is unloaded, so every Run and every check
// starts from the same clean interpreter state.
export const HELPER = `
import sys, builtins, linecache, traceback, os, shutil

_pg_list = list
_pg_saved_builtins = dict(builtins.__dict__)
_pg_saved_streams = (sys.stdin, sys.stdout, sys.stderr)
_pg_recursion = sys.getrecursionlimit()
_pg_home = os.getcwd()
_pg_workdir = "/tmp/village-run"
_pg_saved_modules = set(sys.modules)
_pg_files = {}

def _pg_restore():
    d = builtins.__dict__
    for k in _pg_list(d.keys()):
        if k not in _pg_saved_builtins:
            del d[k]
    for k, v in _pg_saved_builtins.items():
        if d.get(k, None) is not v:
            d[k] = v
    sys.stdin, sys.stdout, sys.stderr = _pg_saved_streams
    sys.setrecursionlimit(_pg_recursion)
    for name in _pg_list(sys.modules.keys()):
        if name not in _pg_saved_modules:
            del sys.modules[name]
    try:
        os.chdir(_pg_home)
    except OSError:
        pass

def _pg_fresh_folder():
    # An empty folder, plus the challenge's starting files (Challenge.files).
    shutil.rmtree(_pg_workdir, ignore_errors=True)
    os.makedirs(_pg_workdir, exist_ok=True)
    os.chdir(_pg_workdir)
    for name, text in _pg_files.items():
        with open(name, "w", encoding="utf-8") as f:
            f.write(text)

def _pg_user_tb(tb):
    while tb is not None and tb.tb_frame.f_code.co_filename != "main.py":
        tb = tb.tb_next
    return tb

def _pg_new_ns(source):
    linecache.cache["main.py"] = (len(source), None, source.splitlines(True), "main.py")
    return {"__name__": "__main__", "__builtins__": builtins, "__file__": "main.py"}

def _pg_exec(source, ns):
    result = {"status": "ok", "type": None, "message": None, "line": None, "traceback": ""}
    try:
        _pg_fresh_folder()
        code = compile(source, "main.py", "exec")
        exec(code, ns)
    except SystemExit as e:
        if e.code is not None and not isinstance(e.code, int):
            sys.stderr.write(str(e.code) + chr(10))
    except KeyboardInterrupt:
        result["status"] = "interrupted"
    except BaseException as e:
        result["status"] = "error"
        result["type"] = type(e).__name__
        if isinstance(e, SyntaxError) and e.msg:
            result["message"] = e.msg
        else:
            result["message"] = str(e)
        tb = _pg_user_tb(e.__traceback__)
        if isinstance(e, SyntaxError):
            result["line"] = e.lineno if e.filename == "main.py" else None
        else:
            walk = tb
            while walk is not None:
                if walk.tb_frame.f_code.co_filename == "main.py":
                    result["line"] = walk.tb_lineno
                walk = walk.tb_next
        text = "".join(traceback.format_exception(type(e), e, tb))
        result["traceback"] = text
        try:
            sys.stdout.flush()
        except BaseException:
            pass
        sys.stderr.write(text)
    finally:
        try:
            sys.stdout.flush()
            sys.stderr.flush()
        except BaseException:
            pass
    return result

def _pg_set_files(files):
    global _pg_files
    _pg_files = dict(files) if files else {}

def _pg_run(source, files=None):
    _pg_set_files(files)
    ns = _pg_new_ns(source)
    try:
        return _pg_exec(source, ns)
    finally:
        _pg_restore()

class _PgFail(Exception):
    pass

class _PgTee:
    def __init__(self, target):
        self.target = target
        self.parts = []
    def write(self, s):
        self.parts.append(s)
        return self.target.write(s)
    def flush(self):
        try:
            self.target.flush()
        except BaseException:
            pass
    def getvalue(self):
        return "".join(self.parts)

def _pg_check(cond, msg):
    if not cond:
        raise _PgFail(msg)

def _pg_casefold(x):
    if isinstance(x, tuple):
        return tuple(_pg_casefold(i) for i in x)
    return x.casefold() if isinstance(x, str) else x

class _PgText(str):
    # Printed text as the checks see it: comparing, searching and counting
    # ignore capitals, so "hello" passes for "Hello". Challenges about capitals
    # start their checks with "# case: strict" (content/types.ts checksFor) and
    # get plain strings. Hashing stays exact, so sets and dict keys match as before.
    __hash__ = str.__hash__
    def __eq__(self, o):
        return str.casefold(self) == o.casefold() if isinstance(o, str) else NotImplemented
    def __ne__(self, o):
        r = self.__eq__(o)
        return r if r is NotImplemented else not r
    def __contains__(self, o):
        return _pg_casefold(o) in str.casefold(self)
    def startswith(self, p, *a):
        return str.casefold(self).startswith(_pg_casefold(p), *a)
    def endswith(self, p, *a):
        return str.casefold(self).endswith(_pg_casefold(p), *a)
    def find(self, s, *a):
        return str.casefold(self).find(_pg_casefold(s), *a)
    def rfind(self, s, *a):
        return str.casefold(self).rfind(_pg_casefold(s), *a)
    def index(self, s, *a):
        return str.casefold(self).index(_pg_casefold(s), *a)
    def rindex(self, s, *a):
        return str.casefold(self).rindex(_pg_casefold(s), *a)
    def count(self, s, *a):
        return str.casefold(self).count(_pg_casefold(s), *a)

def _pg_text(x):
    if type(x) is str:
        return _PgText(x)
    if isinstance(x, (list, tuple)):
        return type(x)(_pg_text(i) for i in x)
    return x

# Pieces cut from printed text stay printed text.
for _pg_name in ("strip", "lstrip", "rstrip", "split", "rsplit", "splitlines", "partition", "rpartition", "replace", "removeprefix", "removesuffix", "__getitem__", "__add__", "__mod__", "join", "expandtabs", "center", "ljust", "rjust", "zfill"):
    setattr(_PgText, _pg_name, (lambda m: lambda self, *a, **k: _pg_text(m(self, *a, **k)))(getattr(str, _pg_name)))

_pg_fold = [True]

# While checks run, re's functions ignore capitals when handed printed text, and
# give text back as printed text, so checks that pick lines apart with regular
# expressions stay capital-blind too. Anything else (the learner's own strings)
# goes through untouched.
import re as _pg_re
# For each function: where the string sits, and where flags sit, among the arguments after the pattern.
_PG_RE = {"search": (0, 1), "match": (0, 1), "fullmatch": (0, 1), "findall": (0, 1), "finditer": (0, 1), "split": (0, 2), "sub": (1, 3), "subn": (1, 3)}
_pg_re_real = {n: getattr(_pg_re, n) for n in _PG_RE}

def _pg_re_blind(name):
    real = _pg_re_real[name]
    si, fi = _PG_RE[name]
    def blind(pattern, *a, **k):
        a = list(a)
        s = a[si] if len(a) > si else k.get("string")
        if not isinstance(s, _PgText):
            return real(pattern, *a, **k)
        flags = k.pop("flags", 0)
        if len(a) > fi:
            flags = a[fi]
            del a[fi:]
        if isinstance(pattern, _pg_re.Pattern):
            flags |= pattern.flags
            pattern = pattern.pattern
        pattern = _pg_re.compile(pattern, flags | _pg_re.IGNORECASE)
        if len(a) > si:
            a[si] = str(s)
        else:
            k["string"] = str(s)
        r = real(pattern, *a, **k)
        if name == "subn":
            return _pg_text(r[0]), r[1]
        return _pg_text(r) if name in ("findall", "split", "sub") else r
    return blind

def _pg_re_on(on):
    for n in _PG_RE:
        setattr(_pg_re, n, _pg_re_blind(n) if on else _pg_re_real[n])

def _pg_expect_lines(lines, expected):
    nl = chr(10) + "  "
    for i, want in enumerate(expected):
        if i >= len(lines):
            raise _PgFail("Line " + str(i + 1) + " is missing. It should be:" + nl + want)
        if lines[i] != want:
            raise _PgFail("Line " + str(i + 1) + " should be:" + nl + want + chr(10) + "but you printed:" + nl + lines[i])
    if len(lines) > len(expected):
        raise _PgFail("You printed " + str(len(lines)) + " lines, but the rune only wants " + str(len(expected)) + ". This line is extra:" + nl + lines[len(expected)])

def _pg_rerun(source):
    # Runs a variant of the program (checks swap in other starting values so
    # typed-in answers do not pass) and returns its variables and lines. The
    # folder is reset to the challenge's starting files first, so read what
    # the main run wrote before calling rerun.
    import io
    _pg_fresh_folder()
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    ns2 = {"__name__": "__main__", "__builtins__": builtins}
    try:
        exec(compile(source, "main.py", "exec"), ns2)
    finally:
        sys.stdout = old
    lines2 = [l.rstrip() for l in buf.getvalue().splitlines()]
    return ns2, _pg_text(lines2) if _pg_fold[0] else lines2

def _pg_grade(source, tests, files=None):
    # Runs the learner's program, then the challenge's checks. Checks see:
    # ns (the program's variables), out (everything printed), lines (out
    # split into lines, right-stripped), src (the source), check(cond, msg),
    # expect_lines(list), rerun(variant_source) -> (ns, lines), as_output(text
    # or lines a check captured itself, so they compare like out) and files (the
    # starting files). The program's folder is the current directory. Unless
    # the checks start with "# case: strict", out and lines (and rerun's
    # lines) ignore capitals when compared: see _PgText.
    _pg_fold[0] = not tests.startswith("# case: strict")
    _pg_set_files(files)
    ns = _pg_new_ns(source)
    tee = _PgTee(sys.stdout)
    sys.stdout = tee
    try:
        result = _pg_exec(source, ns)
        sys.stdout = tee.target
        result["passed"] = False
        result["feedback"] = ""
        if result["status"] != "ok":
            return result
        out = tee.getvalue()
        lines = [l.rstrip() for l in out.splitlines()]
        if _pg_fold[0]:
            out, lines = _pg_text(out), _pg_text(lines)
        env = {
            "ns": ns,
            "out": out,
            "lines": lines,
            "expect_lines": lambda expected: _pg_expect_lines(lines, expected),
            "rerun": _pg_rerun,
            "src": source,
            "files": dict(_pg_files),
            "check": _pg_check,
            "as_output": lambda x: _pg_text(x) if _pg_fold[0] else x,
            "__builtins__": builtins,
        }
        try:
            _pg_re_on(_pg_fold[0])
            exec(compile(tests, "<checks>", "exec"), env)
            result["passed"] = True
        except _PgFail as f:
            result["feedback"] = str(f)
        except KeyboardInterrupt:
            result["status"] = "interrupted"
        except BaseException as e:
            result["feedback"] = "The rune-checker tripped over your program (" + type(e).__name__ + ": " + str(e) + "). Re-read the task and try again."
        return result
    finally:
        _pg_re_on(False)
        _pg_restore()
`;
