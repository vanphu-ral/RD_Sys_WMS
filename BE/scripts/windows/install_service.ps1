# PowerShell script to install Warehouse Management System as Windows service
# Requires NSSM (Non-Sucking Service Manager) to be installed

Write-Host "Installing Warehouse Management System Backend as Windows service..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Define variables
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$SERVICE_NAME = "WarehouseManagementSystem"
$DISPLAY_NAME = "Warehouse Management System Backend"
$DESCRIPTION = "FastAPI backend service for Warehouse Management System"
$EXECUTABLE_PATH = Join-Path $PROJECT_ROOT "dist\warehouse-be.exe"
$LOG_DIR = Join-Path $PROJECT_ROOT "logs"

# Check if NSSM is available
try {
    $nssmVersion = & nssm version 2>$null
    Write-Host "NSSM version: $nssmVersion" -ForegroundColor Yellow
} catch {
    Write-Host "NSSM not found in PATH. Please install NSSM and add it to PATH." -ForegroundColor Red
    Write-Host "Download from: https://nssm.cc/download" -ForegroundColor Yellow
    exit 1
}

# Check if executable exists
if (!(Test-Path $EXECUTABLE_PATH)) {
    Write-Host "Executable not found at: $EXECUTABLE_PATH" -ForegroundColor Red
    Write-Host "Please run build_exe.ps1 first to create the executable." -ForegroundColor Yellow
    exit 1
}

# Create logs directory if it doesn't exist
if (!(Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR | Out-Null
    Write-Host "Created logs directory: $LOG_DIR" -ForegroundColor Yellow
}

# Check if service already exists
$existingService = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Service '$SERVICE_NAME' already exists. Removing..." -ForegroundColor Yellow
    & nssm stop $SERVICE_NAME
    & nssm remove $SERVICE_NAME confirm
}

# Install the service
Write-Host "Installing service '$SERVICE_NAME'..." -ForegroundColor Green

& nssm install $SERVICE_NAME $EXECUTABLE_PATH

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install service!" -ForegroundColor Red
    exit 1
}

# Configure service settings
& nssm set $SERVICE_NAME DisplayName $DISPLAY_NAME
& nssm set $SERVICE_NAME Description $DESCRIPTION
& nssm set $SERVICE_NAME AppDirectory $PROJECT_ROOT
& nssm set $SERVICE_NAME AppStdout (Join-Path $LOG_DIR "service.out.log")
& nssm set $SERVICE_NAME AppStderr (Join-Path $LOG_DIR "service.err.log")
& nssm set $SERVICE_NAME AppRotateFiles 1
& nssm set $SERVICE_NAME AppRotateOnline 1
& nssm set $SERVICE_NAME AppRotateSeconds 86400

# Set service to start automatically
& nssm set $SERVICE_NAME Start SERVICE_AUTO_START

# Set recovery options
& nssm set $SERVICE_NAME AppExit Default Exit
& nssm set $SERVICE_NAME AppRestartDelay 5000

Write-Host "Service installed successfully!" -ForegroundColor Green
Write-Host "Service Name: $SERVICE_NAME" -ForegroundColor Green
Write-Host "Display Name: $DISPLAY_NAME" -ForegroundColor Green
Write-Host "Executable: $EXECUTABLE_PATH" -ForegroundColor Green
Write-Host "Logs: $LOG_DIR" -ForegroundColor Green

# Ask user if they want to start the service now
$startService = Read-Host "Do you want to start the service now? (y/n)"
if ($startService -eq "y" -or $startService -eq "Y") {
    Write-Host "Starting service..." -ForegroundColor Green
    & nssm start $SERVICE_NAME

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Service started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to start service!" -ForegroundColor Red
    }
} else {
    Write-Host "Service installed but not started. You can start it later with: nssm start $SERVICE_NAME" -ForegroundColor Yellow
}

Write-Host "Installation completed." -ForegroundColor Green