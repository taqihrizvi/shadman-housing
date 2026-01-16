# Environment Verification Script
# This script checks if your environment is correctly configured

Write-Host ""
Write-Host "🔍 Shadman Housing Frontend - Environment Verification" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Check for required files
$requiredFiles = @(
    ".env",
    ".env.example",
    ".env.production",
    "package.json",
    "vite.config.ts",
    "src/lib/api.ts"
)

Write-Host "📁 Checking required files..." -ForegroundColor Yellow
$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - MISSING!" -ForegroundColor Red
        $allFilesExist = $false
    }
}
Write-Host ""

# Check for .env.local
Write-Host "🔧 Checking local development setup..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "  ✅ .env.local exists" -ForegroundColor Green
    $envLocalContent = Get-Content ".env.local" -Raw
    if ($envLocalContent -match "VITE_API_URL=(.+)") {
        $localApiUrl = $matches[1].Trim()
        Write-Host "  📍 Local API URL: $localApiUrl" -ForegroundColor White
    }
} else {
    Write-Host "  ⚠️  .env.local not found" -ForegroundColor Yellow
    Write-Host "  💡 Run '.\setup-local.ps1' to create it" -ForegroundColor Gray
}
Write-Host ""

# Check production config
Write-Host "🌐 Checking production configuration..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    $envProdContent = Get-Content ".env.production" -Raw
    if ($envProdContent -match "VITE_API_URL=(.+)") {
        $prodApiUrl = $matches[1].Trim()
        Write-Host "  ✅ Production API URL: $prodApiUrl" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ .env.production not found!" -ForegroundColor Red
}
Write-Host ""

# Check gitignore
Write-Host "🔒 Checking .gitignore configuration..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match ".env.local") {
        Write-Host "  ✅ .env.local is in .gitignore (won't be committed)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  .env.local is NOT in .gitignore!" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check node_modules
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Dependencies not installed" -ForegroundColor Yellow
    Write-Host "  💡 Run 'npm install' to install" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host ""

if ($allFilesExist -and (Test-Path ".env.local") -and (Test-Path "node_modules")) {
    Write-Host "  ✅ Everything looks good! You're ready to develop." -ForegroundColor Green
    Write-Host ""
    Write-Host "  🚀 To start development:" -ForegroundColor White
    Write-Host "     npm run dev:local    # Local backend" -ForegroundColor Gray
    Write-Host "     npm run dev          # Production backend" -ForegroundColor Gray
} elseif (-not (Test-Path ".env.local")) {
    Write-Host "  ⚠️  Setup required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🔧 Run this to get started:" -ForegroundColor White
    Write-Host "     .\setup-local.ps1" -ForegroundColor Gray
} elseif (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠️  Dependencies needed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  📦 Run this to install:" -ForegroundColor White
    Write-Host "     npm install" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  Some issues detected. Review the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📖 For more help, see:" -ForegroundColor Gray
Write-Host "   - LOCAL_SETUP_SUMMARY.md (quick reference)" -ForegroundColor Gray
Write-Host "   - ENV_SETUP.md (detailed guide)" -ForegroundColor Gray
Write-Host ""
