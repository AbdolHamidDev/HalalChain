# Demo Admin Feature Guide

## Overview
The Demo Admin feature allows users to experience the full HalalChain admin panel without creating a real account or modifying production data. All changes are stored locally in the browser's localStorage.

## Quick Access

### 1-Click Login Options:
- **Landing Page Hero**: Amber "Try Demo Admin" button → auto-redirects to dashboard
- **Landing Page Header**: "Demo Admin" button in top navigation
- **Login Page**: "Try Demo Admin" button below login form
- **Direct URL**: `/demo-admin` (pre-filled credentials)

### Demo Credentials:
```
Email: demo-admin@halalchain.local
Password: demo-admin-2024
```

## Features

### ✅ What Works in Demo Mode:

1. **User Management**
   - View all users (3 demo users pre-loaded)
   - Create new users
   - Edit user names
   - Change user roles (ADMIN/MANAGER/STAFF)
   - Suspend/activate users
   - Verify/unverify users
   - Delete users

2. **Dashboard**
   - View dashboard statistics
   - See charts and analytics (mock data)
   - Access all dashboard widgets

3. **Notifications**
   - View notifications
   - Mark as read/unread
   - Mark all as read

4. **Settings**
   - View settings
   - Update preferences

5. **Navigation**
   - Full sidebar navigation
   - All menu items accessible
   - Role-based menu items (ADMIN view)

### ❌ What Doesn't Work (By Design):

- Real database operations (no data is saved to backend)
- Email notifications
- File uploads (avatars, certificates)
- Real-time WebSocket updates
- API calls to external services

## Visual Indicators

### In Demo Mode You'll See:
1. **Header Badge**: Amber "Demo" badge next to page title
2. **Sidebar Badge**: "Demo" badge next to your role
3. **Floating Indicator**: Bottom-right corner notification
   - Shows "Demo Mode Active"
   - Explains data is local only
   - "Reset Demo Data" button

## Data Storage

### Where Data is Stored:
- **localStorage Key**: `halalchain_demo_data`
- **Scope**: Browser-only (cleared when you clear browser data)
- **Persistence**: Survives page refreshes, lost on cache clear

### What's Stored:
```javascript
{
  users: [...],           // User list
  settings: [...],        // App settings
  notifications: [...],   // Notifications
  lastUpdated: "..."      // Timestamp
}
```

## Managing Demo Data

### Reset Demo Data:
1. Click "Reset Demo Data" in the floating indicator
2. Confirm the action
3. Page reloads with fresh demo data

### Clear Demo Session:
- Click "Logout" in the user menu
- This clears the demo token and localStorage flags
- Demo data remains until you reset it

## Technical Details

### Architecture:
```
User clicks "Try Demo Admin"
    ↓
loginDemo() called
    ↓
POST /api/demo-admin/login
    ↓
Backend creates JWT with isDemo=true flag
    ↓
Frontend stores demo flag in localStorage
    ↓
User accesses dashboard
    ↓
/api/auth/me returns user from JWT (no DB lookup)
    ↓
Components check isDemo flag
    ↓
If demo mode: use demoApi (localStorage)
If normal: use real api (backend)
```

### Files Created:
- `backend/src/routes/demo-admin.ts` - Demo login endpoint
- `backend/src/middleware/auth.ts` - Demo token bypass
- `backend/src/routes/auth.ts` - Demo-aware /me endpoint
- `frontend/src/lib/demo-data-service.ts` - localStorage manager
- `frontend/src/lib/demo-api.ts` - Mock API functions
- `frontend/src/hooks/use-demo-mode.ts` - Demo mode hook
- `frontend/src/components/shared/demo-mode-indicator.tsx` - UI indicator

### Files Modified:
- `frontend/src/components/providers/auth-provider.tsx` - Added loginDemo
- `frontend/src/components/landing/hero.tsx` - Added demo button
- `frontend/src/components/landing/header.tsx` - Added demo button
- `frontend/src/components/landing/cta.tsx` - Added demo button
- `frontend/src/app/(auth)/login/page.tsx` - Added demo button
- `frontend/src/app/dashboard/layout.tsx` - Added indicator
- `frontend/src/components/layout/dashboard-header.tsx` - Demo badge
- `frontend/src/components/layout/sidebar.tsx` - Demo badge

## Testing Demo Mode

### Test User CRUD:
1. Login as demo admin
2. Go to Users page
3. Create a new user
4. Edit the user's name
5. Change the user's role
6. Suspend the user
7. Refresh the page - changes persist!
8. Reset demo data to start fresh

### Test Notifications:
1. Login as demo admin
2. View notifications in header
3. Mark as read
4. Refresh - state persists

## Benefits

1. **No Account Required**: Try admin features instantly
2. **No Database Impact**: Zero risk to production data
3. **Full Feature Access**: Test all admin capabilities
4. **Persistent Sessions**: Changes survive page refreshes
5. **Easy Reset**: Clear data anytime to start fresh
6. **Safe Testing**: Perfect for demos and training

## Troubleshooting

### "Try Demo Admin" button doesn't work:
- Ensure backend is running on port 4001
- Ensure frontend is running on port 3000
- Check browser console for errors
- Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4001`

### Demo data not persisting:
- Check if browser allows localStorage
- Check if incognito/private mode (may block storage)
- Check browser developer tools > Application > Local Storage

### Redirected to login after clicking demo:
- Backend not restarted after changes
- Check backend console for errors
- Verify `/api/auth/me` returns user data

## Future Enhancements

Possible additions:
- More demo data (products, suppliers, certificates)
- Demo mode for other user roles (MANAGER, STAFF)
- Export/import demo data
- Share demo data via URL
- Time-limited demo sessions