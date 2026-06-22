# HalalChain v2.0 — Testing Guide

## Prerequisites

1. **Start the backend server:**
   ```powershell
   cd D:\Projects\HalalChain\backend
   npm run dev
   ```
   
   Keep this terminal running. You should see:
   ```
   HalalChain API running on http://localhost:4000
   WebSocket server running on ws://localhost:4000/ws
   ```

2. **Start the frontend (optional, for UI testing):**
   ```powershell
   cd D:\Projects\HalalChain\frontend
   npm run dev
   ```

## Testing the API Endpoints

### Option 1: Using PowerShell (Recommended for Windows)

Open a **new** PowerShell window and run:

```powershell
# Test health endpoint (no auth required)
Invoke-RestMethod -Uri http://localhost:4000/api/health -Method Get

# Test v2.0 health endpoint (requires ADMIN auth - see below)
Invoke-RestMethod -Uri http://localhost:4000/api/admin/system/health -Method Get
```

### Option 2: Using the Frontend

1. Open browser to `http://localhost:3000`
2. Login as admin: `admin@halalchain.com` / `demo-admin-2024`
3. Navigate to settings pages (once frontend is built)

### Option 3: Using Postman or Thunder Client

Import these endpoints into your API client:

**Public Endpoints (No Auth):**
- `GET http://localhost:4000/api/health`

**Admin Endpoints (Require ADMIN Role):**
- `GET http://localhost:4000/api/admin/system/health`
- `GET http://localhost:4000/api/admin/system/configs`
- `GET http://localhost:4000/api/admin/feature-flags`
- `GET http://localhost:4000/api/admin/automation/rules`
- `GET http://localhost:4000/api/admin/queues`
- `GET http://localhost:4000/api/admin/maintenance/status`

## Authentication

All `/api/admin/*` endpoints require authentication. To test them:

### Method 1: Use Browser Cookies (Easiest)
1. Login via the frontend at `http://localhost:3000`
2. The frontend automatically sends the auth cookie
3. Use browser DevTools → Network tab to see API calls

### Method 2: Get Token via API
```powershell
# Login
$response = Invoke-RestMethod -Uri http://localhost:4000/api/auth/login `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@halalchain.com","password":"demo-admin-2024"}'

# Use the token
$token = $response.token
Invoke-RestMethod -Uri http://localhost:4000/api/admin/system/health `
  -Method Get `
  -Headers @{"Authorization"="Bearer $token"}
```

## Quick Test Checklist

- [ ] Server starts without errors: `npm run dev`
- [ ] Health check works: `http://localhost:4000/api/health`
- [ ] Database connected (check console logs)
- [ ] Redis connected (check console logs)
- [ ] Scheduler started (check console for cron jobs)

## Common Issues

### "Cannot GET /api/admin/system/health"
**Cause:** Server not running or endpoint doesn't exist  
**Solution:** 
1. Make sure `npm run dev` is running in backend directory
2. Check that you're using the correct URL

### "Authentication required"
**Cause:** No auth token/cookie  
**Solution:** Login via frontend or include auth token in headers

### "Cannot find module"
**Cause:** Dependencies not installed  
**Solution:** Run `npm install` in backend directory

## Next Steps After Testing

1. **Run database migration:**
   ```powershell
   cd backend
   npx prisma migrate dev --name add_v2_system_tables
   ```

2. **Seed v2.0 data:**
   ```powershell
   npm run db:seed:v2
   ```

3. **Test new endpoints** (after seeding):
   - System configs will be populated
   - Feature flags will be created
   - Automation rules will be initialized

## Monitoring

Watch the console output for:
- `[Scheduler] All jobs scheduled` — Cron jobs are running
- `[AutomationScheduler] Starting daily rule evaluation` — Rules executing
- `[BackupScheduler] Starting daily backup` — Backups running
- Structured JSON logs from Pino

## Build Verification

```powershell
# Build should succeed with no errors
npm run build

# Check dist folder exists
dir dist
```

---

**Note:** The v2.0 features are backend-only. Frontend UI pages need to be built separately to interact with these endpoints via a user interface.