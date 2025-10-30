# uninstall-service.ps1
# Uninstalls Cottage Tandoori Printer Service

# Requires Administrator privileges
#Requires -RunAsAdministrator

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Cottage Tandoori Printer Service" -ForegroundColor Cyan
Write-Host "Uninstallation Script v1.0" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$serviceName = "CottageTandooriPrinter"
$installPath = "C:\Program Files\CottageTandoori\PrinterService"
$nssmPath = "$installPath\nssm.exe"

# Check if service exists
Write-Host "[1/2] Checking for service..." -ForegroundColor Yellow
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "⚠️  Service not found. Nothing to uninstall." -ForegroundColor Yellow
    exit 0
}

# Stop and remove service
Write-Host "[2/2] Stopping and removing service..." -ForegroundColor Yellow

if ($service.Status -eq 'Running') {
    Write-Host "Stopping service..." -ForegroundColor Yellow
    & $nssmPath stop $serviceName
    Start-Sleep -Seconds 2
}

Write-Host "Removing service..." -ForegroundColor Yellow
& $nssmPath remove $serviceName confirm

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service removed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Service removal failed (exit code $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host "" 
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Uninstallation Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Installation files remain at $installPath" -ForegroundColor Yellow
Write-Host "Delete manually if no longer needed." -ForegroundColor Yellow
Write-Host ""
