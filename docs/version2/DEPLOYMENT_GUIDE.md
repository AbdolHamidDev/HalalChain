# HalalChain v2.0 — Deployment Guide

## Overview

This guide covers deploying HalalChain v2.0 to:
- **Backend**: Render (or any Node.js hosting)
- **Frontend**: Vercel (or any Next.js hosting)
- **Database**: Neon PostgreSQL (already configured)
- **Cache/Queue**: Upstash Redis (already configured)

---

## Prerequisites

1. **GitHub repository** with your code
2. **Render account** (for backend) — https://render.com
3. **Vercel account** (for frontend) — https://vercel.com
4. **Neon PostgreSQL** database (already configured in `.env`)
5. **Upstash Redis** instance (already configured in `.env`)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend

The backend is already configured for deployment:

**Files ready:**
- ✅ `backend/Dockerfile` — Multi-stage build for production
- ✅ `docker-compose.yml` — Local development (not used for Render)
- ✅ `backend/package.json` — Build scripts configured
- ✅ `backend/.env.example` — Environment variables documented

### Step 2: Deploy to Render

#### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Choose the backend folder (or root if monorepo)

3. **Configure Service**
   ```
   Name: halalchain-api
   Region: Singapore (closest to Vietnam)
   Branch: main
   Root Directory: backend
   Runtime: Docker
   ```

4. **Set Environment Variables**
   
   Go to "Environment" tab and add:
   ```env
   NODE_ENV=production
   PORT=4000
   
   # Database (from Neon)
   DATABASE_URL=postgresql://neondb_owner:****@ep-****.aws.neon.tech/neondb?sslmode=require
   
   # Redis (from Upstash)
   REDIS_URL=rediss://default:****@square-aphid-****.upstash.io:6379
   
   # JWT (generate a new secure secret for production)
   JWT_SECRET=your-secure-jwt-secret-here
   JWT_EXPIRES_IN=15m
   
   # Frontend URL (your Vercel domain)
   FRONTEND_URL=https://your-app.vercel.app
   
   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=drgwmsjhl
   CLOUDINARY_API_KEY=843561561259693
   CLOUDINARY_API_SECRET=PENMG41juKJK34LImJdTCEpMsQk
   
   # Email (Resend)
   RESEND_API_KEY=re_****
   EMAIL_FROM=abdolhamid.dev@gmail.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - First deployment takes 3-5 minutes

#### Option B: Using render.yaml (Infrastructure as Code)

Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: halalchain-api
    runtime: docker
    region: singapore
    plan: starter
    branch: main
    rootDir: backend
    dockerfilePath: backend/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: DATABASE_URL
        fromDatabase:
          name: halalchain-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: halalchain-redis
          type: redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 15m
      - key: FRONTEND_URL
        sync: false  # Set manually in dashboard
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_FROM
        sync: false

databases:
  - name: halalchain-db
    plan: free
    databaseName: halalchain
    user: halalchain

redis:
  - name: halalchain-redis
    plan: free
```

Then deploy:
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

### Step 3: Automatic Migration & Seeding

**Good news!** The Docker container now automatically runs migrations and seeds v2.0 data on startup. No manual shell access needed!

**What happens automatically:**
1. ✅ Waits for database to be ready (max 30 seconds)
2. ✅ Runs `prisma migrate deploy` (applies pending migrations)
3. ✅ Seeds v2.0 data (configs, feature flags, automation rules)
4. ✅ Starts the server

**You'll see this in Render logs:**
```
🚀 Starting HalalChain v2.0...
⏳ Waiting for database...
✅ Database is ready
🔄 Running database migrations...
🌱 Seeding v2.0 data...
✅ Initialization complete
🚀 Starting server...
```

**Note:** The seeding is idempotent — safe to run multiple times. It won't duplicate data.

### Step 4: Verify Backend

Test your deployed backend:
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Should return:
# {"status":"ok","service":"HalalChain API","timestamp":"..."}
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

Update `frontend/.env.production` (or Vercel environment variables):

```env
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Select your GitHub repository
   - Choose the frontend folder

3. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   ```

4. **Set Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-app.onrender.com
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - First deployment takes 2-3 minutes

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from frontend directory)
cd frontend
vercel --prod
```

### Step 3: Update Backend CORS

After deploying frontend, update backend environment:

1. Go to Render → Your Service → Environment
2. Update `FRONTEND_URL` to your Vercel domain:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Save changes (Render will auto-redeploy)

---

## Part 3: Post-Deployment Checklist

### Backend (Render)

- [ ] Service is running (green status)
- [ ] Health check passes: `https://your-app.onrender.com/api/health`
- [ ] Database migration completed
- [ ] v2.0 data seeded (configs, flags, rules)
- [ ] Environment variables set correctly
- [ ] CORS allows your Vercel domain
- [ ] Logs show no errors

### Frontend (Vercel)

- [ ] Site loads successfully
- [ ] Can login with admin credentials
- [ ] API calls work (check browser DevTools → Network)
- [ ] No CORS errors in console
- [ ] Images load correctly (Cloudinary)

### Database

- [ ] Neon database is active
- [ ] Connection string works
- [ ] All tables created (check with `npx prisma studio`)
- [ ] Seed data populated

### Redis (Upstash)

- [ ] Upstash instance is active
- [ ] Connection string works
- [ ] Caching/rate limiting functional

---

## Part 4: Environment Variables Reference

### Backend (.env)

```env
# Required
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=15m
FRONTEND_URL=https://your-app.vercel.app

# Optional (but recommended)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM=...

# v2.0 New (optional, have defaults)
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=7
LOG_LEVEL=info
```

### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Part 5: Custom Domain (Optional)

### Backend Custom Domain

1. **In Render:**
   - Go to Settings → Custom Domains
   - Add your domain: `api.yourdomain.com`
   - Update DNS CNAME record to point to Render

2. **Update Frontend:**
   - Change `NEXT_PUBLIC_API_URL` to `https://api.yourdomain.com`

### Frontend Custom Domain

1. **In Vercel:**
   - Go to Settings → Domains
   - Add your domain: `yourdomain.com`
   - Update DNS A/AAAA records as instructed

---

## Part 6: Monitoring & Maintenance

### Render Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: CPU, memory, response time
- **Alerts**: Set up email alerts for downtime
- **Auto-deploy**: Enabled by default on git push

### Vercel Monitoring

- **Analytics**: Built-in in Vercel dashboard
- **Speed Insights**: Enable in project settings
- **Logs**: Function logs available

### Database Monitoring

- **Neon Dashboard**: Query performance, connection count
- **Prisma Studio**: `npx prisma studio` (local only)

### Redis Monitoring

- **Upstash Dashboard**: Commands, memory usage, evictions

---

## Part 7: Backup Strategy

### Automated Backups (v2.0 Feature)

The system now has automated backups:

- **Schedule**: Daily at 02:00 AM
- **Retention**: 7 days (configurable)
- **Location**: `./backups` folder (local) or cloud storage

### Manual Backup

Trigger via API:
```bash
curl -X POST https://your-app.onrender.com/api/admin/system/backup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Database Backup (Neon)

Neon provides automatic backups:
- **Free tier**: 7-day retention
- **Pro tier**: 30-day retention
- Manual backup: Use Neon dashboard → "Backups" → "Create Backup"

---

## Troubleshooting

### Backend Issues

**Problem**: "Cannot connect to database"
- **Solution**: Check DATABASE_URL in Render environment variables
- Verify Neon database is active
- Check SSL mode is `require`

**Problem**: "Redis connection failed"
- **Solution**: Verify REDIS_URL format: `rediss://...` (note the `rediss` not `redis`)
- Check Upstash instance is active

**Problem**: "Build failed"
- **Solution**: Check Render logs for specific error
- Ensure all dependencies in package.json
- Try building locally first: `npm run build`

### Frontend Issues

**Problem**: "CORS error"
- **Solution**: Verify FRONTEND_URL in backend matches Vercel domain
- Check CORS configuration in `backend/src/app.ts`

**Problem**: "API calls fail"
- **Solution**: Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running and accessible
- Check browser console for specific errors

---

## Cost Estimate

### Render (Backend)
- **Free Tier**: $0/month
  - 512 MB RAM
  - 0.5 CPU
  - 100 GB bandwidth
  - Sleeps after 15 min inactivity
  
- **Starter**: $7/month
  - 512 MB RAM
  - 0.5 CPU
  - Always on

### Vercel (Frontend)
- **Hobby**: $0/month
  - 100 GB bandwidth
  - Automatic HTTPS
  - Preview deployments

### Neon (Database)
- **Free Tier**: $0/month
  - 0.5 GB storage
  - 100 hours compute/month
  
- **Launch**: $19/month
  - 10 GB storage
  - No compute limits

### Upstash (Redis)
- **Free Tier**: $0/month
  - 10,000 commands/day
  - 256 MB storage

**Total Monthly Cost**: $0-26/month depending on tier

---

## Rollback Procedure

If deployment fails:

### Backend Rollback
```bash
# In Render dashboard:
# 1. Go to your service
# 2. Click "Deploys" tab
# 3. Find previous successful deploy
# 4. Click "Redeploy"
```

### Frontend Rollback
```bash
# In Vercel dashboard:
# 1. Go to your project
# 2. Click "Deployments" tab
# 3. Find previous successful deployment
# 4. Click "..." → "Promote to Production"
```

---

## Security Checklist

- [ ] JWT_SECRET is strong and unique (not in code)
- [ ] Database credentials are secure
- [ ] Redis credentials are secure
- [ ] CORS only allows your domains
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] Environment variables not committed to git
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled

---

## Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Upstash Docs**: https://docs.upstash.com

---

**Last Updated**: 2026-06-23  
**Version**: 2.0.0