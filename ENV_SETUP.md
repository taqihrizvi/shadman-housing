# Environment Configuration Guide

This project uses environment variables to manage different configurations for local development and production environments.

## Environment Files

### `.env` (Production)
- **Purpose**: Default configuration for production builds
- **API URL**: `https://shadman-housing-backend-3.onrender.com/api`
- **Tracked in Git**: ✅ Yes
- **Usage**: Used automatically for production builds

### `.env.local` (Local Development)
- **Purpose**: Your personal local development configuration
- **API URL**: `http://localhost:5000/api` (default)
- **Tracked in Git**: ❌ No (ignored by .gitignore)
- **Usage**: Used when running `npm run dev:local`
- **Important**: Create this file by copying `.env.example`

### `.env.production`
- **Purpose**: Explicit production configuration
- **Tracked in Git**: ✅ Yes
- **Usage**: Used when building with `npm run build`

### `.env.example`
- **Purpose**: Template for creating local environment files
- **Tracked in Git**: ✅ Yes
- **Usage**: Copy this to `.env.local` and modify for your setup

## Setup Instructions

### For Local Development

1. **Create your local environment file:**
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. **Edit `.env.local` to match your local backend:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_ENV=development
   ```

3. **Start the development server:**
   ```powershell
   npm run dev:local
   ```

### For Production Build

1. **Production build uses `.env` by default:**
   ```powershell
   npm run build
   ```

2. **The production API URL is already configured in `.env`**

## NPM Scripts

| Script | Environment | API URL | Description |
|--------|-------------|---------|-------------|
| `npm run dev` | development | `.env` or `.env.development` | Standard dev mode |
| `npm run dev:local` | local | `.env.local` | Local dev with local backend |
| `npm run build` | production | `.env.production` or `.env` | Production build |
| `npm run build:dev` | development | `.env.development` | Development build |
| `npm run build:local` | local | `.env.local` | Local build |
| `npm run preview` | - | Current build | Preview last build |
| `npm run preview:prod` | production | `.env.production` | Preview as production |

## Environment Variables

### VITE_API_URL
- **Description**: Backend API base URL
- **Local Development**: `http://localhost:5000/api`
- **Production**: `https://shadman-housing-backend-3.onrender.com/api`

### VITE_ENV
- **Description**: Environment identifier
- **Values**: `development`, `production`, `local`

## Best Practices

1. ✅ **DO** use `.env.local` for your personal local development
2. ✅ **DO** commit `.env`, `.env.production`, and `.env.example` to git
3. ❌ **DON'T** commit `.env.local` to git (it's ignored)
4. ❌ **DON'T** put secrets or passwords in environment files
5. ✅ **DO** use `npm run dev:local` when working with a local backend
6. ✅ **DO** use `npm run dev` when testing against production API

## Troubleshooting

### Issue: API requests failing in local development
**Solution**: Ensure your `.env.local` points to the correct backend URL and the backend is running.

### Issue: Changes to `.env.local` not taking effect
**Solution**: Restart the Vite dev server. Environment variables are loaded at startup.

### Issue: Production build using local API
**Solution**: Ensure you're using `npm run build` (not `build:local`) for production builds.

## File Priority (Vite loads env files in this order)

1. `.env.[mode].local` (highest priority)
2. `.env.[mode]`
3. `.env.local`
4. `.env` (lowest priority)

Where `[mode]` is the value passed to `--mode` flag (e.g., `development`, `production`, `local`).

## Example Workflow

### Working on a new feature locally:
```powershell
# Make sure you have .env.local configured
npm run dev:local
# Frontend: http://localhost:8080
# Backend: http://localhost:5000
```

### Testing against production API:
```powershell
npm run dev
# Frontend: http://localhost:8080
# Backend: https://shadman-housing-backend-3.onrender.com
```

### Building for deployment:
```powershell
npm run build
# Creates production build with production API URL
```
