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
    shutil.rmtree(_pg_workdir, ignore_errors=True)
    os.makedirs(_pg_workdir, exist_ok=True)
    os.chdir(_pg_workdir)

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

def _pg_run(source):
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
    # typed-in answers do not pass) and returns its variables and lines.
    import io
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    ns2 = {"__name__": "__main__", "__builtins__": builtins}
    try:
        exec(compile(source, "main.py", "exec"), ns2)
    finally:
        sys.stdout = old
    return ns2, [l.rstrip() for l in buf.getvalue().splitlines()]

def _pg_grade(source, tests):
    # Runs the learner's program, then the challenge's checks. Checks see:
    # ns (the program's variables), out (everything printed), lines (out
    # split into lines, right-stripped), src (the source), check(cond, msg),
    # expect_lines(list) and rerun(variant_source) -> (ns, lines).
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
        env = {
            "ns": ns,
            "out": out,
            "lines": lines,
            "expect_lines": lambda expected: _pg_expect_lines(lines, expected),
            "rerun": _pg_rerun,
            "src": source,
            "check": _pg_check,
            "__builtins__": builtins,
        }
        try:
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
        _pg_restore()
`;
