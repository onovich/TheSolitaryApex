param(
    [int[]] $Ports = @(5173, 5174, 5175, 5180, 3000, 3001, 4173, 4174, 8000, 8080, 8090),
    [string] $HostName = "127.0.0.1",
    [string] $BasePath = "/TheSolitaryApex/",
    [switch] $DryRun
)

$ErrorActionPreference = "Stop"

function Test-PortFree {
    param([string] $Address, [int] $Port)

    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse($Address), $Port)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener -ne $null) {
            $listener.Stop()
        }
    }
}

function Get-CandidatePorts {
    param([int[]] $PreferredPorts)

    $fallbackPorts = @(5173..5190) + @(3000..3010) + @(4173..4180) + @(8000..8010) + @(8080..8090)
    $seen = @{}

    foreach ($port in ($PreferredPorts + $fallbackPorts)) {
        if (-not $seen.ContainsKey($port)) {
            $seen[$port] = $true
            $port
        }
    }
}

function Wait-ForPort {
    param([string] $Address, [int] $Port, [int] $TimeoutSeconds = 25)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $client = $null
        try {
            $client = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $client.ConnectAsync($Address, $Port)
            if ($connectTask.Wait(500) -and $client.Connected) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 500
        } finally {
            if ($client -ne $null) {
                $client.Close()
            }
        }
    }

    return $false
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($npmCommand -eq $null) {
    $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
}

if ($npmCommand -eq $null) {
    Write-Host "npm was not found. Install Node.js, then run this command again." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
    Write-Host "node_modules was not found. Running npm install first..." -ForegroundColor Yellow
    & $npmCommand.Path install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed. Fix the dependency install, then run this command again." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit $LASTEXITCODE
    }
}

$selectedPort = $null
foreach ($port in Get-CandidatePorts -PreferredPorts $Ports) {
    if (Test-PortFree -Address $HostName -Port $port) {
        $selectedPort = $port
        break
    }

    Write-Host "Port $port is busy, trying another port..." -ForegroundColor DarkYellow
}

if ($selectedPort -eq $null) {
    Write-Host "No available local test port was found." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$normalizedBasePath = if ($BasePath.StartsWith("/")) { $BasePath } else { "/$BasePath" }
if (-not $normalizedBasePath.EndsWith("/")) {
    $normalizedBasePath = "$normalizedBasePath/"
}

$url = "http://${HostName}:${selectedPort}${normalizedBasePath}"
$devCommand = "Set-Location '$repoRoot'; & '$($npmCommand.Path)' run dev -- --host $HostName --port $selectedPort --strictPort"

Write-Host "Project: $repoRoot"
Write-Host "Selected port: $selectedPort"
Write-Host "Local test URL: $url"

if ($DryRun) {
    Write-Host "Dry run only. Dev command:"
    Write-Host $devCommand
    exit 0
}

$serverProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $devCommand
) -PassThru

if (-not (Wait-ForPort -Address $HostName -Port $selectedPort)) {
    Write-Host "The dev server did not answer on port $selectedPort within the timeout." -ForegroundColor Red
    Write-Host "Check the server window for details. If needed, close it and run this command again."
    Read-Host "Press Enter to close"
    exit 1
}

Start-Process $url
Write-Host "Opened browser window. Keep the server window open while testing." -ForegroundColor Green
Write-Host "Close the server window to stop the local dev server."
Start-Sleep -Seconds 2
