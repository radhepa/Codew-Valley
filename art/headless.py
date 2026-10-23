"""Run an art script inside headless Blender, logging to art/logs/<name>.log.

Used by art/blender.ps1 (Blender's own console output isn't visible when it is
started through the Windows app launcher):
    blender -b --factory-startup -P art/headless.py -- art/scripts/mill.py
"""
import os
import runpy
import sys
import traceback

target = os.path.abspath(sys.argv[sys.argv.index("--") + 1])
name = os.path.splitext(os.path.basename(target))[0]
logs = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(logs, exist_ok=True)
log = open(os.path.join(logs, name + ".log"), "w", encoding="utf-8", buffering=1)
sys.stdout = sys.stderr = log
code = 0
try:
    sys.argv = [target]
    runpy.run_path(target, run_name="__main__")
    print("HEADLESS_OK")
except SystemExit as e:
    code = e.code if isinstance(e.code, int) else 0
except BaseException:
    traceback.print_exc()
    print("HEADLESS_FAILED")
    code = 1
log.close()
os._exit(code)
