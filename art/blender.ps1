# Run one art script in its own headless Blender and print its log.
#   powershell -File art/blender.ps1 art/scripts/mill.py
# Each call is a separate Blender process, so several sessions can build
# models at the same time without touching the user's open Blender.
param([Parameter(Mandatory = $true)][string]$Script)

$root = Split-Path -Parent $PSScriptRoot
$target = Resolve-Path $Script
$name = [IO.Path]::GetFileNameWithoutExtension($target)
$launcher = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\blender-launcher.exe"
$argv = @("-b", "--factory-startup", "-P", (Join-Path $PSScriptRoot "headless.py"), "--", "$target")
$p = Start-Process $launcher -ArgumentList $argv -WorkingDirectory $root -PassThru -Wait -WindowStyle Hidden
$log = Join-Path $PSScriptRoot "logs\$name.log"
if (Test-Path $log) { Get-Content $log -Tail 40 } else { "no log written" }
"exit code: $($p.ExitCode)"
