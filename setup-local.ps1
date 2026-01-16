# Quick Setup Script for Local Development
# This script sets up your local environment configuration

Write-Host "🚀 Shadman Housing Frontend - Local Development Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit
    }
}

# Copy .env.example to .env.local
Write-Host "📝 Creating .env.local from .env.example..." -ForegroundColor Green
Copy-Item ".env.example" ".env.local" -Force

Write-Host "✅ .env.local created successfully!" -ForegroundColor Green
Write-Host ""

# Ask user for backend URL
Write-Host "🔧 Configuration:" -ForegroundColor Cyan
$defaultBackend = "http://localhost:5000/api"
$backend = Read-Host "Enter your backend API URL (press Enter for default: $defaultBackend)"

if ([string]::IsNullOrWhiteSpace($backend)) {
    $backend = $defaultBackend
}

# Update .env.local with user's backend URL
$envContent = Get-Content ".env.local"
$envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=$backend"
$envContent | Set-Content ".env.local"

Write-Host "✅ Configuration updated!" -ForegroundColor Green
Write-Host ""

# Display current configuration
Write-Host "📋 Current Configuration:" -ForegroundColor Cyan
Write-Host "  Backend API: $backend" -ForegroundColor White
Write-Host "  Environment: development (local)" -ForegroundColor White
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure your backend is running on: $backend" -ForegroundColor White
Write-Host "  2. Run 'npm run dev:local' to start the development server" -ForegroundColor White
Write-Host "  3. Open http://localhost:8080 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more information, see ENV_SETUP.md" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to start the dev server
$startServer = Read-Host "Do you want to start the development server now? (y/N)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    npm run dev:local
}
