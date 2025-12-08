# Netlify Deployment Setup Guide

## Overview

This guide walks you through deploying the Közlekedési Jegykezelő frontend application to Netlify.

**Platform:** Netlify
**Application:** Frontend (Angular 17)
**URL Structure:** `https://your-app.netlify.app`

## Prerequisites

- [ ] Netlify account (sign up at https://www.netlify.com/)
- [ ] GitHub repository access
- [ ] Supabase project configured
- [ ] Frontend application built successfully locally

## Deployment Methods

### Method 1: Git-Based Deployment (Recommended)

This method automatically deploys on every push to your repository.

#### Step 1: Connect Repository

1. Log in to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your repository: `szakdolgozat/kozlekedesi-jegykezelo`

#### Step 2: Configure Build Settings

Netlify should auto-detect settings from `netlify.toml`, but verify:

**Build Settings:**
```
Base directory: frontend
Build command: npm run build:prod
Publish directory: dist/kozlekedesi-jegykezelo-frontend/browser
```

**Branch to deploy:**
```
Production branch: master
```

#### Step 3: Set Environment Variables

In Netlify Dashboard → **Site settings** → **Environment variables**, add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NODE_VERSION` | `20` | Node.js version |
| `NPM_VERSION` | `10` | npm version |
| `NODE_ENV` | `production` | Environment |

**Note:** Supabase credentials are NOT needed here as they're hardcoded in Angular environment files. For production, consider using Angular environment replacement.

#### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (~3-5 minutes)
3. Netlify will assign a random URL like `random-name-12345.netlify.app`

#### Step 5: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `jegykezelo.hu`)
4. Follow DNS configuration instructions
5. SSL certificate will be automatically provisioned

### Method 2: Netlify CLI Deployment

For manual deployments or testing.

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify

```bash
netlify login
```

#### Step 3: Initialize Site

```bash
# From project root
cd frontend
netlify init
```

Follow prompts:
- Create new site or link existing
- Choose team
- Set site name

#### Step 4: Deploy

```bash
# Deploy to preview URL
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### Step 5: Verify Deployment

```bash
netlify open
```

### Method 3: Drag & Drop Deployment

For quick testing only (not recommended for production).

#### Step 1: Build Locally

```bash
cd frontend
npm run build:prod
```

#### Step 2: Deploy via Netlify Drop

1. Go to https://app.netlify.com/drop
2. Drag and drop the `frontend/dist/kozlekedesi-jegykezelo-frontend/browser` folder
3. Site will be deployed instantly

**Note:** This creates a site without Git integration.

## Configuration

### netlify.toml

The project includes a `netlify.toml` file at the root with:

- Build settings
- Redirect rules (SPA fallback)
- Security headers
- Caching policies
- Context-specific configurations

**Location:** `C:/Users/Szabolcs/BUSZ/szakdolgozat/netlify.toml`

### Key Configuration Sections

#### SPA Routing

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures Angular routing works correctly.

#### Security Headers

Headers are configured for:
- XSS protection
- Clickjacking prevention
- Content Security Policy
- CORS

#### Caching

- Static assets: 1 year cache
- HTML files: No cache
- Service workers: No cache

## Environment-Specific Deployments

### Production (master branch)

- Branch: `master`
- URL: `https://your-app.netlify.app`
- Environment: `production`
- Build: `npm run build:prod`

### Staging (develop branch)

1. Go to **Site settings** → **Build & deploy** → **Branch deploys**
2. Enable **Deploy previews** for `develop` branch
3. Each push to `develop` creates: `develop--your-app.netlify.app`

### Pull Request Previews

Netlify automatically creates preview deployments for PRs:
- URL: `deploy-preview-{PR#}--your-app.netlify.app`
- Useful for testing before merging

Enable in: **Site settings** → **Build & deploy** → **Deploy previews**

## Post-Deployment Configuration

### 1. Update OAuth Redirect URLs

Add Netlify URL to Supabase OAuth settings:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://your-app.netlify.app/auth/callback
   https://your-app.netlify.app/**
   ```
4. Update **Site URL**: `https://your-app.netlify.app`

### 2. Update CORS Settings

If backend is on different domain, update CORS:

**Backend `.env`:**
```env
CORS_ORIGIN=https://your-app.netlify.app
```

### 3. Configure Analytics (Optional)

Netlify provides built-in analytics:

1. Go to **Site settings** → **Analytics**
2. Enable **Netlify Analytics** ($9/month)

Or integrate Google Analytics in Angular app.

## Monitoring & Troubleshooting

### Build Logs

View build logs in:
**Netlify Dashboard** → **Deploys** → Click on a deploy → **Deploy log**

### Common Issues

#### Issue 1: Build Fails - "npm command not found"

**Solution:** Verify Node version in environment variables
```toml
[build.environment]
  NODE_VERSION = "20"
```

#### Issue 2: 404 on Page Refresh

**Solution:** Check SPA redirect rule exists in `netlify.toml`
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Issue 3: Environment Variables Not Working

**Solution:** Angular embeds environment at build time. Use Angular environment files instead of Netlify environment variables, or implement runtime configuration.

#### Issue 4: Build Timeout

**Solution:**
- Default timeout is 15 minutes
- Optimize build process
- Contact Netlify support to increase limit

#### Issue 5: Supabase Auth Not Working

**Solution:**
1. Check Supabase redirect URLs include Netlify domain
2. Verify CORS settings
3. Check browser console for errors

### Debugging Commands

```bash
# Test build locally
cd frontend
npm run build:prod

# Preview production build locally
npx http-server dist/kozlekedesi-jegykezelo-frontend/browser -p 8080

# Check Netlify CLI
netlify status

# View site logs
netlify logs
```

## Performance Optimization

### 1. Enable Asset Optimization

In **Site settings** → **Build & deploy** → **Post processing**:

- ✅ Bundle CSS
- ✅ Minify CSS
- ✅ Minify JS
- ✅ Compress images
- ✅ Pretty URLs

### 2. Enable Netlify CDN

Already enabled by default. Assets are automatically served from CDN.

### 3. Prerendering (Optional)

For better SEO, enable prerendering:

1. Install plugin: `npm install --save-dev @netlify/plugin-prerender`
2. Update `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-prerender"
```

### 4. Lighthouse CI

Already configured in `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"
```

Lighthouse runs on every deploy and reports performance metrics.

## Security Best Practices

### 1. Enable HTTPS

HTTPS is enabled by default with auto-renewed Let's Encrypt certificates.

### 2. Security Headers

Already configured in `netlify.toml`:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

### 3. Secrets Management

**Never commit:**
- Supabase service_role key (backend only)
- Private API keys
- Database passwords

**Safe for frontend:**
- Supabase anon key
- Supabase URL

### 4. Enable HSTS (Optional)

Add to `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

## Rollback Procedures

### Method 1: Rollback via Dashboard

1. Go to **Deploys**
2. Find the last working deploy
3. Click **"Publish deploy"** on that version

### Method 2: Rollback via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin master

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin master
```

## Cost Information

### Free Tier Includes:
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- Automatic HTTPS
- Deploy previews

### Paid Plans:
- **Pro**: $19/month - 400 GB bandwidth, 25,000 build minutes
- **Business**: $99/month - 1 TB bandwidth, unlimited build minutes

**Current Plan:** Free Tier (sufficient for development/small production)

## Netlify CLI Commands Reference

```bash
# Login
netlify login

# Link existing site
netlify link

# Deploy preview
netlify deploy

# Deploy production
netlify deploy --prod

# Open site in browser
netlify open

# Open admin dashboard
netlify open:admin

# View site status
netlify status

# View environment variables
netlify env:list

# Set environment variable
netlify env:set VAR_NAME value

# View functions
netlify functions:list

# Run dev server with Netlify
netlify dev
```

## Integration with CI/CD

Netlify automatically integrates with GitHub Actions. The existing workflows will trigger Netlify builds:

**Workflow:** `.github/workflows/frontend-ci.yml`

On successful CI:
1. GitHub Actions runs tests and build
2. If successful, push triggers Netlify deploy
3. Netlify runs its own build and deploys

## Support Resources

- **Netlify Documentation:** https://docs.netlify.com/
- **Netlify Support:** https://www.netlify.com/support/
- **Netlify Community:** https://answers.netlify.com/
- **Status Page:** https://www.netlifystatus.com/

## Checklist for Production Deployment

- [ ] Repository connected to Netlify
- [ ] Build settings configured correctly
- [ ] Environment variables set (if needed)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Supabase OAuth redirect URLs updated
- [ ] CORS configured in backend
- [ ] Security headers verified
- [ ] Asset optimization enabled
- [ ] Lighthouse CI passing
- [ ] Deploy previews enabled for PRs
- [ ] Branch deploys configured
- [ ] Rollback procedure tested
- [ ] Monitoring/analytics set up

---

**Last Updated:** 2025-11-04
**Maintained By:** DevOps Infrastructure Engineer
**Platform Version:** Netlify v6.x
