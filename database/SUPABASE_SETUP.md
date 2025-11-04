# Supabase Project Setup Guide

## Project Information

**Project Name:** kozlekedesi-jegykezelo
**Project ID:** prhlsuwkokuisqavwfoi
**Region:** eu-central-1 (Europe - Frankfurt)
**Status:** ACTIVE_HEALTHY
**Created:** 2025-11-02

## Connection Details

### Project URL
```
https://prhlsuwkokuisqavwfoi.supabase.co
```

### API Keys

**Anon/Public Key** (Safe for client-side use):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk
```

**Service Role Key** (BACKEND ONLY - NEVER expose to client):
> ⚠️ **SECURITY WARNING**: The service role key is stored securely in the Supabase dashboard.
> Access it via: Dashboard → Project Settings → API → service_role key
>
> **NEVER commit this key to git or expose it in frontend code!**

### Database Connection

**Connection String Template:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.prhlsuwkokuisqavwfoi.supabase.co:5432/postgres
```

> Note: Database password was set during project creation. Store it securely in your password manager.

## How to Access Supabase Dashboard

1. Go to: https://app.supabase.com
2. Sign in with your account
3. Select organization: **Szabi2002**
4. Select project: **kozlekedesi-jegykezelo**

## Dashboard Features

### Authentication
- **Path:** Dashboard → Authentication
- **Google OAuth Setup:** Authentication → Providers → Google
- **Users Management:** Authentication → Users

### Database
- **Path:** Dashboard → Database
- **Table Editor:** Create and edit tables visually
- **SQL Editor:** Run custom SQL queries and migrations
- **Migrations:** View migration history

### Storage
- **Path:** Dashboard → Storage
- **Buckets:** Manage file storage buckets
- **Policies:** Configure Row Level Security for files

### API
- **Path:** Dashboard → Project Settings → API
- **API Keys:** View and regenerate keys
- **Connection Strings:** Database connection details

## Environment Variables Setup

### Backend (.env)
```env
SUPABASE_URL=https://prhlsuwkokuisqavwfoi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk
SUPABASE_SERVICE_ROLE_KEY=[GET_FROM_DASHBOARD_DO_NOT_COMMIT]
```

### Frontend (.env)
```env
SUPABASE_URL=https://prhlsuwkokuisqavwfoi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk
```

## Security Best Practices

### 1. API Key Management
- ✅ **Anon key:** Safe for frontend - has limited permissions via RLS
- ❌ **Service role key:** Backend ONLY - bypasses all RLS policies
- ✅ Use environment variables, never hardcode
- ✅ Add `.env` to `.gitignore`

### 2. Row Level Security (RLS)
- Always enable RLS on all public tables
- Create specific policies for SELECT, INSERT, UPDATE, DELETE
- Use `auth.uid()` to restrict access to user's own data
- Test policies thoroughly before production

### 3. Database Access
- Use connection pooling for production (via Supabase pooler)
- Never expose direct database credentials to frontend
- Use Supabase client libraries for secure access

## Migration Management

All database migrations are stored in: `C:\Users\Szabolcs\BUSZ\szakdolgozat\database\migrations\`

### How to Apply Migrations

**Option 1: SQL Editor (Manual)**
1. Open Supabase Dashboard → SQL Editor
2. Open migration file content
3. Copy and paste into editor
4. Click "Run"

**Option 2: Supabase CLI (Recommended for production)**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref prhlsuwkokuisqavwfoi

# Apply migrations
supabase db push
```

**Option 3: MCP Tool (Development)**
- Use `mcp__supabase__apply_migration` tool
- Provide migration name and SQL query

## Applied Migrations

Track all applied migrations here:

- [ ] `001_create_users_table.sql` - Users table with RLS
- [ ] `002_create_core_tables.sql` - Routes, Stops, RouteStops, Tickets
- [ ] `003_seed_demo_data.sql` - Demo data (3 routes, 10 stops)
- [ ] `004_create_storage_buckets.sql` - Storage buckets for files

## Troubleshooting

### Connection Issues
- Verify project is ACTIVE_HEALTHY in dashboard
- Check firewall/network allows Supabase connections
- Verify API keys are correct and not expired

### Authentication Issues
- Ensure Google OAuth is configured in dashboard
- Check redirect URLs match your application URLs
- Verify JWT secret is not exposed

### RLS Policy Issues
- Use SQL Editor to test policies with different user contexts
- Check `auth.uid()` returns expected user ID
- Review Supabase logs for policy violations

## Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** https://github.com/supabase/supabase/issues

## Cost Information

**Current Plan:** Free Tier
**Cost:** $0 monthly

**Free Tier Limits:**
- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB
- Edge Functions: 500K executions/month

> Monitor usage in Dashboard → Project Settings → Usage

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps Infrastructure Engineer
