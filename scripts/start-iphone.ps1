$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
& npm ci
if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }
& npx expo start ./apps/mobile --go --clear --lan
