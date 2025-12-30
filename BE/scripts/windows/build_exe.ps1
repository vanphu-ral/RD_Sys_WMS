# PowerShell script to build executable for Windows
# Warehouse Management System Backend

Write-Host "Building Warehouse Management System Backend executable..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Define variables
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$DIST_DIR = Join-Path $PROJECT_ROOT "dist"
$BUILD_DIR = Join-Path $PROJECT_ROOT "build"
$SPEC_FILE = Join-Path $PROJECT_ROOT "warehouse-be.spec"

# Create dist and build directories if they don't exist
if (!(Test-Path $DIST_DIR)) {
    New-Item -ItemType Directory -Path $DIST_DIR | Out-Null
}

if (!(Test-Path $BUILD_DIR)) {
    New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null
}

# Check if PyInstaller is installed
try {
    $pyinstallerVersion = & pyinstaller --version 2>$null
    Write-Host "PyInstaller version: $pyinstallerVersion" -ForegroundColor Yellow
} catch {
    Write-Host "PyInstaller not found. Installing..." -ForegroundColor Yellow
    & pip install pyinstaller
}

# Build the executable
Write-Host "Building executable..." -ForegroundColor Green

# Change to project root directory
Set-Location $PROJECT_ROOT

# Run PyInstaller
# & pyinstaller --onefile --windowed --name warehouse-be run.py
py -m PyInstaller --onefile --windowed --name warehouse-be run.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Executable created at: $DIST_DIR\warehouse-be.exe" -ForegroundColor Green

    # Get file size
    $fileSize = (Get-Item "$DIST_DIR\warehouse-be.exe").Length / 1MB
    Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build process completed." -ForegroundColor Green