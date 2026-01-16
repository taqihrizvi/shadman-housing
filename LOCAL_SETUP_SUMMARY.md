# Local vs Production Environment Setup - Summary

## ✅ What Has Been Configured

### 1. Environment Files Created

| File | Purpose | Git Tracked | API URL |
|------|---------|-------------|---------|
| `.env` | Default/Production config | ✅ Yes | Production API |
| `.env.local` | Your local development | ❌ No | `http://localhost:5000/api` |
| `.env.production` | Explicit production | ✅ Yes | Production API |
| `.env.example` | Template for developers | ✅ Yes | Local API (example) |

### 2. NPM Scripts Updated

```json
{
  "dev": "vite --mode development",           // Uses .env.development or .env
  "dev:local": "vite --mode local",           // Uses .env.local
  "build": "vite build --mode production",    // Uses .env.production
  "build:local": "vite build --mode local",   // Uses .env.local
  "preview": "vite preview",                  // Preview last build
  "preview:prod": "vite preview --mode production"
}
```

### 3. Enhanced API Configuration

- Added environment logging in development mode
- Shows which API URL is being used
- Shows current environment mode

### 4. Setup Scripts

- `setup-local.ps1` - Interactive PowerShell script for quick local setup

## 🚀 Quick Start Guide

### For First-Time Setup:

```powershell
# Option 1: Use the setup script (Recommended)
.\setup-local.ps1

# Option 2: Manual setup
Copy-Item .env.example .env.local
# Edit .env.local if needed
npm install
npm run dev:local
```

### Daily Development Workflow:

```powershell
# Working with local backend
npm run dev:local

# Testing against production API
npm run dev
```

### Building for Production:

```powershell
# Production build (uses .env.production)
npm run build

# The build will use: https://shadman-housing-backend-3.onrender.com/api
```

## 🔍 How It Works

1. **Vite Environment Loading Priority:**
   - `.env.[mode].local` (highest)
   - `.env.[mode]`
   - `.env.local`
   - `.env` (lowest)

2. **When you run `npm run dev:local`:**
   - Vite loads with `--mode local`
   - Looks for `.env.local` first
   - Uses `VITE_API_URL=http://localhost:5000/api`

3. **When you run `npm run build`:**
   - Vite loads with `--mode production`
   - Looks for `.env.production` first
   - Uses production API URL

## 🎯 Key Benefits

✅ **No Conflicts:** Local and production settings are completely separate
✅ **Safety:** `.env.local` is gitignored, won't accidentally commit local settings
✅ **Flexibility:** Easy to switch between local and production backends
✅ **Team-Friendly:** `.env.example` helps new developers get started
✅ **Clear:** Console logs show which environment and API you're using

## 📝 Important Notes

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Always use the correct script:**
   - Local dev: `npm run dev:local`
   - Production build: `npm run build`
3. **Backend must be running** when using `dev:local`
4. **Environment variables are loaded at startup** - restart dev server after changes

## 🔧 Configuration Details

### Local Development (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

### Production (.env.production)
```env
VITE_API_URL=https://shadman-housing-backend-3.onrender.com/api
VITE_ENV=production
```

## 🐛 Troubleshooting

**Problem:** API calls failing in local mode
- **Solution:** Check if backend is running on `http://localhost:5000`
- **Solution:** Verify `.env.local` has correct API URL

**Problem:** Changes to .env.local not working
- **Solution:** Restart the dev server (Ctrl+C, then `npm run dev:local`)

**Problem:** Production build using local API
- **Solution:** Use `npm run build` (not `npm run build:local`)

**Problem:** Don't see environment logs
- **Solution:** Open browser DevTools Console, they only show in development

## 📚 Additional Resources

- Full documentation: [ENV_SETUP.md](ENV_SETUP.md)
- Main README: [README.md](README.md)
- Docker setup: [DOCKER_README.md](DOCKER_README.md)

## ✨ Next Steps

1. Run `.\setup-local.ps1` to configure your local environment
2. Start your backend server on `http://localhost:5000`
3. Run `npm run dev:local` to start frontend
4. Open `http://localhost:8080` in your browser
5. Check browser console - you should see:
   ```
   🌍 Environment: local
   🔗 API URL: http://localhost:5000/api
   ```

That's it! You're ready to develop locally without affecting production! 🎉
