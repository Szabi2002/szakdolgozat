<<<<<<< SEARCH
=======
# Environment Setup Guide

Complete guide for setting up environment variables for the Kozlekedesi Jegykezelo application.

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Environment Variables](#backend-environment-variables)
3. [Frontend Environment Variables](#frontend-environment-variables)
4. [Local Development Setup](#local-development-setup)
5. [Production Environment](#production-environment)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The application uses environment variables to configure database connections, API keys, and other sensitive information. **Never commit `.env` files to version control.**

### Environment Files Structure

```
szakdolgozat/
├── backend/
│   ├── .env                 # Backend environment (GITIGNORED)
│   └── .env.example         # Backend template (committed)
├── frontend/
│   ├── .env                 # Frontend environment (GITIGNORED)
│   └── .env.example         # Frontend template (committed)
└── .gitignore               # Ensures .env files are never committed
```

---

## Backend Environment Variables

### File: `backend/.env`

```env
# ============================================================================
# Backend Environment Configuration
# ============================================================================

# Node Environment
NODE_ENV=development
# Options: development, production, test

# Server Configuration
PORT=3000
# The port on which the backend API server will run

# Supabase Configuration
SUPABASE_URL=https://prhlsuwkokuisqavwfoi.supabase.co
# Your Supabase project URL from: database/SUPABASE_SETUP.md

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk
# Supabase anon/public key (safe for client-side use with RLS)

SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
# Supabase service role key (BACKEND ONLY - bypasses RLS)
# Get this from: Supabase Dashboard → Project Settings → API → service_role
# ⚠️ WARNING: NEVER expose this key in frontend or commit to git!

# CORS Configuration
CORS_ORIGIN=http://localhost:4200
# Comma-separated list of allowed origins for CORS
# Production: https://yourdomain.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
# Secret key for signing JWT tokens
# Generate a strong random string: openssl rand -base64 32

JWT_EXPIRATION=15m
# JWT token expiration time (e.g., 15m, 1h, 7d)

# Rate Limiting
THROTTLE_TTL=60
# Time window in seconds for rate limiting

THROTTLE_LIMIT=10
# Maximum number of requests per time window

# Google OAuth (for future implementation)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
# Get these from: Google Cloud Console → APIs & Services → Credentials

# Email Service (for future implementation)
EMAIL_SERVICE=sendgrid
# Options: sendgrid, aws-ses, mailgun

SENDGRID_API_KEY=your-sendgrid-api-key
# Get from: SendGrid Dashboard → Settings → API Keys

EMAIL_FROM=noreply@yourdomain.com
# Email address to send from

# Logging
LOG_LEVEL=info
# Options: error, warn, info, debug, verbose

# Database (if using direct PostgreSQL connection)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.prhlsuwkokuisqavwfoi.supabase.co:5432/postgres
# Direct PostgreSQL connection string (optional, use Supabase client instead)
```

### Required vs Optional Variables

#### Required (Critical for application to run):
- `NODE_ENV`
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `JWT_SECRET`

#### Optional (Can use defaults):
- `JWT_EXPIRATION` (default: 15m)
- `THROTTLE_TTL` (default: 60)
- `THROTTLE_LIMIT` (default: 10)
- `LOG_LEVEL` (default: info)

#### Future Features (Not required for MVP):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SENDGRID_API_KEY`
- `EMAIL_FROM`

---

## Frontend Environment Variables

### File: `frontend/.env`

```env
# ============================================================================
# Frontend Environment Configuration
# ============================================================================

# Supabase Configuration
SUPABASE_URL=https://prhlsuwkokuisqavwfoi.supabase.co
# Your Supabase project URL (same as backend)

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk
# Supabase anon/public key (safe for frontend use)

# Backend API Configuration
API_URL=http://localhost:3000/api
# Backend API base URL
# Production: https://api.yourdomain.com

# Google Maps API (for future implementation)
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
# Get from: Google Cloud Console → APIs & Services → Credentials
# Enable: Maps JavaScript API, Directions API, Places API, Geocoding API

# Analytics (optional)
GA_MEASUREMENT_ID=G-XXXXXXXXXX
# Google Analytics 4 measurement ID
```

### Angular Environment Files

Angular uses TypeScript environment files instead of `.env` directly.

**File: `frontend/src/environments/environment.ts`** (Development)

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://prhlsuwkokuisqavwfoi.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk',
  apiUrl: 'http://localhost:3000/api',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
};
```

**File: `frontend/src/environments/environment.prod.ts`** (Production)

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://prhlsuwkokuisqavwfoi.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk',
  apiUrl: 'https://api.yourdomain.com',
  googleMapsApiKey: 'YOUR_PRODUCTION_GOOGLE_MAPS_API_KEY',
};
```

---

## Local Development Setup

### Step-by-Step Guide

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd szakdolgozat
```

#### 2. Run Setup Script

**Windows:**
```cmd
.\scripts\setup-dev.bat
```

**Unix/Linux/Mac:**
```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

#### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:
1. Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard
2. Generate `JWT_SECRET`: `openssl rand -base64 32`
3. Verify `CORS_ORIGIN` matches your frontend URL

#### 4. Configure Frontend Environment

```bash
cd frontend
```

Edit `frontend/src/environments/environment.ts` with your Supabase URL and keys.

#### 5. Verify Configuration

```bash
# Backend
cd backend
npm run build
npm run start:dev

# Frontend (in new terminal)
cd frontend
ng serve
```

Access:
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Frontend: http://localhost:4200

---

## Production Environment

### Deployment Checklist

#### Backend (Railway/Render/AWS)

1. Set environment variables in hosting platform dashboard
2. Use production values:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://yourdomain.com`
   - Strong `JWT_SECRET`
   - Real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Production email API keys

3. Enable SSL/TLS
4. Set up health check endpoint: `/api/health`

#### Frontend (Netlify/Vercel)

1. Build with production configuration:
   ```bash
   ng build --configuration production
   ```

2. Set build environment variables in platform:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `API_URL` (production backend URL)
   - `GOOGLE_MAPS_API_KEY`

3. Configure redirects for Angular routing

**Netlify `_redirects` file:**
```
/*    /index.html   200
```

**Vercel `vercel.json`:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Verify .env is gitignored
git status

# Should show: nothing to commit, working tree clean
# Should NOT show: backend/.env or frontend/.env
```

### 2. Use Strong Secrets

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate secure password
openssl rand -hex 16
```

### 3. Separate Environments

- **Development**: Use `.env` file locally
- **Staging**: Use platform environment variables
- **Production**: Use platform secrets manager or environment variables

### 4. Rotate Keys Regularly

- JWT secrets: Every 3-6 months
- API keys: When team members leave
- Database passwords: Annually

### 5. Principle of Least Privilege

- **Frontend**: Only gets `SUPABASE_ANON_KEY` (RLS protected)
- **Backend**: Gets `SUPABASE_SERVICE_ROLE_KEY` (full access, keep secure)
- **Users**: RLS policies restrict data access

---

## Troubleshooting

### Backend Won't Start

**Error: `SUPABASE_URL is not defined`**

Solution:
```bash
cd backend
# Check if .env exists
ls -la .env
# If not, copy from example
cp .env.example .env
# Edit with your values
```

**Error: `Cannot connect to Supabase`**

Solution:
1. Verify Supabase project is active: https://app.supabase.com
2. Check `SUPABASE_URL` matches project URL
3. Verify network/firewall allows Supabase connections

### Frontend Build Fails

**Error: `environment.ts not found`**

Solution:
```bash
cd frontend/src/environments
# Ensure both files exist
ls -la environment.ts environment.prod.ts
```

**Error: `NullInjectorError: No provider for HTTP_INTERCEPTORS`**

Solution: Ensure `apiUrl` is set in environment files.

### CORS Errors

**Error: `Access-Control-Allow-Origin header is missing`**

Solution (backend `.env`):
```env
CORS_ORIGIN=http://localhost:4200,https://yourdomain.com
```

### Authentication Issues

**Error: `Invalid JWT`**

Solutions:
1. Check `JWT_SECRET` is the same between restarts
2. Clear browser cookies/local storage
3. Verify Supabase keys are correct

---

## Environment Variables Checklist

### Before Committing Code

- [ ] No `.env` files in git (check with `git status`)
- [ ] `.env.example` files are up to date
- [ ] No hardcoded secrets in code
- [ ] README mentions required environment variables

### Before Deployment

- [ ] All production environment variables set in hosting platform
- [ ] `NODE_ENV=production` in production
- [ ] SSL/TLS enabled
- [ ] CORS configured for production domain
- [ ] Database connection tested
- [ ] Health check endpoint working

### After Deployment

- [ ] Application starts without errors
- [ ] Database queries work
- [ ] Authentication works
- [ ] API calls from frontend successful
- [ ] Monitor logs for errors

---

## Additional Resources

- **Supabase Setup**: `database/SUPABASE_SETUP.md`
- **CI/CD Configuration**: `docs/CI_CD_SETUP.md`
- **Monitoring**: `docs/MONITORING.md`
- **Supabase Documentation**: https://supabase.com/docs
- **Angular Environment Variables**: https://angular.io/guide/build#configuring-application-environments
- **NestJS Configuration**: https://docs.nestjs.com/techniques/configuration

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps Infrastructure Engineer
