# Development Server Startup Script
# This script starts both backend and frontend servers concurrently

Write-Host "Starting Shadman Housing Development Servers..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = Join-Path $projectRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Yellow; npm start"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host 'Frontend Server' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
