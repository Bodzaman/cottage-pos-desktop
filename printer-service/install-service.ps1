# install-service.ps1
# Installs Cottage Tandoori Printer Service as Windows service using NSSM

# Requires Administrator privileges
#Requires -RunAsAdministrator

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Cottage Tandoori Printer Service" -ForegroundColor Cyan
Write-Host "Installation Script v1.0" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$serviceName = "CottageTandooriPrinter"
$displayName = "Cottage Tandoori Printer Service"
$description = "Thermal printer communication service for Cottage Tandoori POS"
$installPath = "C:\Program Files\CottageTandoori\PrinterService"
$nodePath = "$installPath\node.exe"
$serverPath = "$installPath\src\server.js"
$nssmPath = "$installPath\nssm.exe"
$logPath = "C:\ProgramData\CottageTandoori\Logs"

# Step 1: Check if service already exists
Write-Host "[1/6] Checking for existing service..." -ForegroundColor Yellow
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "⚠️  Service already exists. Stopping and removing..." -ForegroundColor Yellow
    & $nssmPath stop $serviceName
    & $nssmPath remove $serviceName confirm
    Start-Sleep -Seconds 2
}

# Step 2: Verify installation files
Write-Host "[2/6] Verifying installation files..." -ForegroundColor Yellow
if (-not (Test-Path $nodePath)) {
    Write-Host "❌ ERROR: node.exe not found at $nodePath" -ForegroundColor Red
    Write-Host "Please ensure Node.js portable is extracted to the installation directory." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $serverPath)) {
    Write-Host "❌ ERROR: server.js not found at $serverPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $nssmPath)) {
    Write-Host "❌ ERROR: nssm.exe not found at $nssmPath" -ForegroundColor Red
    Write-Host "Please download NSSM from https://nssm.cc/download" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required files found" -ForegroundColor Green

# Step 3: Create log directory
Write-Host "[3/6] Creating log directory..." -ForegroundColor Yellow
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    Write-Host "✅ Log directory created: $logPath" -ForegroundColor Green
} else {
    Write-Host "✅ Log directory exists: $logPath" -ForegroundColor Green
}

# Step 4: Install service
Write-Host "[4/6] Installing Windows service..." -ForegroundColor Yellow
& $nssmPath install $serviceName $nodePath $serverPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Service installation failed (exit code $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

# Step 5: Configure service
Write-Host "[5/6] Configuring service..." -ForegroundColor Yellow

# Set display name and description
& $nssmPath set $serviceName DisplayName $displayName
& $nssmPath set $serviceName Description $description

# Set working directory
& $nssmPath set $serviceName AppDirectory $installPath

# Set startup type to automatic
& $nssmPath set $serviceName Start SERVICE_AUTO_START

# Set restart policy (restart on failure)
& $nssmPath set $serviceName AppThrottle 5000
& $nssmPath set $serviceName AppExit Default Restart
& $nssmPath set $serviceName AppRestartDelay 2000

# Set stdout/stderr logging
& $nssmPath set $serviceName AppStdout "$logPath\service-stdout.log"
& $nssmPath set $serviceName AppStderr "$logPath\service-stderr.log"

Write-Host "✅ Service configured successfully" -ForegroundColor Green

# Step 6: Start service
Write-Host "[6/6] Starting service..." -ForegroundColor Yellow
& $nssmPath start $serviceName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service started successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Service start failed (exit code $LASTEXITCODE)" -ForegroundColor Yellow
    Write-Host "You can start it manually from Services (services.msc)" -ForegroundColor Yellow
}

# Final status check
Write-Host "" 
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Name: $serviceName" -ForegroundColor White
Write-Host "Display Name: $displayName" -ForegroundColor White
Write-Host "Install Path: $installPath" -ForegroundColor White
Write-Host "Log Path: $logPath" -ForegroundColor White
Write-Host ""
Write-Host "To check service status:" -ForegroundColor Yellow
Write-Host "  Get-Service -Name $serviceName" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  Get-Content '$logPath\printer-service.log'" -ForegroundColor White
Write-Host ""
Write-Host "Health check endpoint:" -ForegroundColor Yellow
Write-Host "  http://127.0.0.1:3000/health" -ForegroundColor White
Write-Host ""
