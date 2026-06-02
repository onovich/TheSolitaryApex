param(
    [string] $Url = "http://blog.onovich.com/TheSolitaryApex/",
    [switch] $DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Url)) {
    Write-Host "Online test URL is empty." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host "Online test URL: $Url"

if ($DryRun) {
    Write-Host "Dry run only. Browser was not opened."
    exit 0
}

Start-Process $Url
