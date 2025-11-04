# CI/CD Setup Guide

Continuous Integration and Continuous Deployment configuration for the Kozlekedesi Jegykezelo application using GitHub Actions.

---

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Branch Strategy](#branch-strategy)
4. [Branch Protection Rules](#branch-protection-rules)
5. [Secrets Configuration](#secrets-configuration)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Monitoring CI/CD](#monitoring-cicd)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The project uses GitHub Actions for automated testing, linting, and deployment. All workflows are located in `.github/workflows/`.

### Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `backend-ci.yml` | Backend testing and building | Push/PR to backend/ |
| `frontend-ci.yml` | Frontend testing and building | Push/PR to frontend/ |
| `code-quality.yml` | Code formatting and quality checks | All push/PR |

---

## GitHub Actions Workflows

### 1. Backend CI (`backend-ci.yml`)

**Triggers:**
- Push to `master` or `develop` branches (only if `backend/` changed)
- Pull requests to `master` (only if `backend/` changed)

**Jobs:**

#### Test Job
```yaml
- Checkout code
- Setup Node.js 20.x
- Install dependencies (npm ci)
- Run linter (npm run lint)
- Run tests (npm run test)
- Run tests with coverage
- Upload coverage to Codecov
- Build application
- Verify build output
```

#### Lint Job
```yaml
- Check code formatting with Prettier
- Run ESLint
```

#### Security Job
```yaml
- Run npm audit
- Check for vulnerabilities
```

**Example Run:**
```bash
# Locally test what CI will do:
cd backend
npm ci
npm run lint
npm run test
npm run test:cov
npm run build
```

### 2. Frontend CI (`frontend-ci.yml`)

**Triggers:**
- Push to `master` or `develop` branches (only if `frontend/` changed)
- Pull requests to `master` (only if `frontend/` changed)

**Jobs:**

#### Test Job
```yaml
- Checkout code
- Setup Node.js 20.x
- Install dependencies (npm ci)
- Run linter (ng lint)
- Run tests in headless mode
- Upload coverage to Codecov
- Build for development
- Build for production
- Verify build output
```

#### Lint Job
```yaml
- Check code formatting with Prettier
- Run ESLint
```

#### Security Job
```yaml
- Run npm audit
- Check for vulnerabilities
```

#### Bundle Size Job
```yaml
- Build production bundle
- Analyze bundle sizes
- Report largest files
```

**Example Run:**
```bash
# Locally test what CI will do:
cd frontend
npm ci
npm run lint
ng test --watch=false --browsers=ChromeHeadless
ng build --configuration production
```

### 3. Code Quality (`code-quality.yml`)

**Triggers:**
- All pushes to `master` or `develop`
- All pull requests to `master`

**Jobs:**

#### Prettier Check
```yaml
- Check backend formatting
- Check frontend formatting
- Check all TypeScript/JavaScript/JSON/YAML files
```

#### Commit Lint
```yaml
- Validate commit message format (conventional commits)
```

#### Dependency Review
```yaml
- Check for dependency vulnerabilities in PRs
```

#### File Changes
```yaml
- List changed files
- Check for sensitive files (.env, credentials, etc.)
- Fail if sensitive files detected
```

#### TODO Check
```yaml
- Find all TODO and FIXME comments
- Report for awareness
```

#### Documentation Check
```yaml
- Check for README files
- Check for broken markdown links
```

---

## Branch Strategy

### Branch Model

```
master (production)
  ↑
  └── develop (staging)
       ↑
       ├── feature/user-authentication
       ├── feature/ticket-purchase
       ├── fix/bug-123
       └── chore/update-dependencies
```

### Branch Types

| Branch Type | Naming Convention | Purpose |
|-------------|-------------------|---------|
| `master` | `master` | Production-ready code |
| `develop` | `develop` | Integration branch for features |
| Feature | `feature/<name>` | New features |
| Bug Fix | `fix/<name>` | Bug fixes |
| Hotfix | `hotfix/<name>` | Urgent production fixes |
| Chore | `chore/<name>` | Maintenance tasks |

### Workflow

1. **Create Feature Branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Work on Feature:**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: add user authentication"
   git push origin feature/my-feature
   ```

3. **Create Pull Request:**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Base: `develop` ← Compare: `feature/my-feature`
   - Wait for CI checks to pass
   - Request review
   - Merge after approval

4. **Merge to Develop:**
   ```bash
   # After PR approval, merge via GitHub UI
   # Delete feature branch
   git branch -d feature/my-feature
   ```

5. **Release to Master:**
   ```bash
   git checkout master
   git pull origin master
   git merge develop
   git push origin master
   # Tag release
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

---

## Branch Protection Rules

### Setup Instructions

1. Go to GitHub repository → Settings → Branches
2. Click "Add rule" for `master` branch

### Recommended Rules for `master`

```yaml
Branch name pattern: master

Protection rules:
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require review from Code Owners

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required status checks:
    - test (backend-ci)
    - test (frontend-ci)
    - prettier (code-quality)

☑ Require conversation resolution before merging

☑ Require signed commits (optional, for extra security)

☑ Include administrators (optional)

☐ Allow force pushes (NEVER enable on master)

☐ Allow deletions (NEVER enable on master)
```

### Recommended Rules for `develop`

```yaml
Branch name pattern: develop

Protection rules:
☑ Require a pull request before merging
  ☑ Require approvals: 1

☑ Require status checks to pass before merging
  Required status checks:
    - test (backend-ci)
    - test (frontend-ci)

☑ Require conversation resolution before merging

☐ Include administrators

☐ Allow force pushes (enable with caution)

☐ Allow deletions
```

---

## Secrets Configuration

### GitHub Secrets Setup

1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"

### Required Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `SUPABASE_URL` | Supabase project URL | `database/SUPABASE_SETUP.md` |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard (NEVER commit!) |
| `CODECOV_TOKEN` | Codecov upload token | https://codecov.io (optional) |

### Optional Secrets (for future deployment)

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `NETLIFY_AUTH_TOKEN` | Netlify deploy token | Netlify Dashboard |
| `NETLIFY_SITE_ID` | Netlify site ID | Netlify Dashboard |
| `RAILWAY_TOKEN` | Railway deploy token | Railway Dashboard |
| `SENTRY_DSN` | Sentry error tracking DSN | Sentry.io |

### Using Secrets in Workflows

```yaml
steps:
  - name: Deploy to production
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    run: npm run deploy
```

---

## Deployment Pipeline

### Current State (Sprint 0)

- CI/CD workflows test and build code
- **No automatic deployment yet** (manual deployment for now)

### Future Deployment Workflow

#### Frontend Deployment (Netlify/Vercel)

**File: `.github/workflows/deploy-frontend.yml` (to be created)**

```yaml
name: Deploy Frontend

on:
  push:
    branches: [master]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      - name: Build
        working-directory: ./frontend
        run: npm run build -- --configuration production
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './frontend/dist'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Backend Deployment (Railway/Render)

**File: `.github/workflows/deploy-backend.yml` (to be created)**

```yaml
name: Deploy Backend

on:
  push:
    branches: [master]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

---

## Monitoring CI/CD

### GitHub Actions Dashboard

**Access:** Repository → Actions tab

**What to Monitor:**
- ✅ Green checkmarks: All checks passing
- ❌ Red X: Failed checks (click to see logs)
- ⏳ Yellow circle: Checks in progress

### Viewing Workflow Logs

1. Go to Actions tab
2. Click on a workflow run
3. Click on a job (e.g., "Test Backend")
4. Expand steps to see detailed logs

### Example: Debugging Failed Test

```bash
# CI failed on "Run tests" step
# Log shows:
# ● UserService › should create user
# Expected 200, received 401

# Fix locally:
cd backend
npm run test -- --watch
# Fix the failing test
git add .
git commit -m "fix: user creation test"
git push origin feature/my-feature
# CI will automatically re-run
```

### Status Badges

Add to `README.md`:

```markdown
![Backend CI](https://github.com/username/repo/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/username/repo/actions/workflows/frontend-ci.yml/badge.svg)
![Code Quality](https://github.com/username/repo/actions/workflows/code-quality.yml/badge.svg)
```

---

## Troubleshooting

### CI Failing: "npm ci" error

**Error:** `npm ERR! The package-lock.json was created with an old version of npm`

**Solution:**
```bash
# Update package-lock.json
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

### CI Failing: "linter" error

**Error:** `Expected 0 errors but found 5`

**Solution:**
```bash
# Fix linting errors
npm run lint -- --fix
git add .
git commit -m "style: fix linting errors"
git push
```

### CI Failing: Tests timeout

**Error:** `Exceeded timeout of 5000 ms for a test`

**Solution:**
```typescript
// Increase timeout for slow tests
it('should perform slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### CI Failing: Build error

**Error:** `Cannot find module '@angular/core'`

**Solution:**
```bash
# Ensure dependencies are properly listed
npm install
# Check package.json has @angular/core in dependencies
git add package.json package-lock.json
git commit -m "fix: add missing dependency"
git push
```

### PR Can't Be Merged

**Issue:** "Required status checks have not passed"

**Solution:**
1. Check which checks failed (red X in PR)
2. Fix issues locally
3. Push fixes
4. Wait for CI to re-run automatically

### Secrets Not Working

**Error:** `SUPABASE_URL is not defined`

**Solution:**
1. Go to Settings → Secrets → Actions
2. Verify secret name matches workflow exactly
3. Re-add secret if necessary
4. Re-run workflow manually

---

## Best Practices

### 1. Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```bash
feat(auth): add Google OAuth login
fix(tickets): resolve QR code generation bug
docs(readme): update installation instructions
chore(deps): update Angular to v17
```

### 2. Pull Request Guidelines

- **Title:** Clear and descriptive
- **Description:** Explain what and why
- **Screenshots:** For UI changes
- **Testing:** List how you tested
- **Checklist:** Use PR template

**PR Template** (create `.github/PULL_REQUEST_TEMPLATE.md`):

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

### 3. Code Review Checklist

**For Reviewers:**
- [ ] Code is understandable
- [ ] Tests are sufficient
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Documentation updated
- [ ] Follows project conventions

### 4. CI Optimization

**Speed up workflows:**
```yaml
# Cache dependencies
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json
```

**Run jobs in parallel:**
```yaml
jobs:
  backend-test:
    runs-on: ubuntu-latest
    # ...
  frontend-test:
    runs-on: ubuntu-latest
    # Runs in parallel with backend-test
    # ...
```

---

## Additional Resources

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Conventional Commits:** https://www.conventionalcommits.org/
- **Codecov:** https://about.codecov.io/
- **Environment Setup:** `docs/ENVIRONMENT_SETUP.md`
- **Monitoring:** `docs/MONITORING.md`

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps Infrastructure Engineer
