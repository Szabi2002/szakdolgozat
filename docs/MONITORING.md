# Monitoring and Observability Guide

Guide for monitoring the Kozlekedesi Jegykezelo application in development and production environments.

---

## Table of Contents

1. [Overview](#overview)
2. [Supabase Dashboard Monitoring](#supabase-dashboard-monitoring)
3. [Application Logging](#application-logging)
4. [GitHub Actions Monitoring](#github-actions-monitoring)
5. [Error Tracking (Future: Sentry)](#error-tracking-future-sentry)
6. [Performance Monitoring](#performance-monitoring)
7. [Uptime Monitoring](#uptime-monitoring)
8. [Alerting Strategy](#alerting-strategy)
9. [Incident Response](#incident-response)
10. [Metrics to Track](#metrics-to-track)

---

## Overview

The application uses multiple monitoring tools to ensure reliability, performance, and security:

| Tool | Purpose | Status |
|------|---------|--------|
| Supabase Dashboard | Database, Auth, Storage monitoring | ✅ Active (Sprint 0) |
| GitHub Actions | CI/CD pipeline monitoring | ✅ Active (Sprint 0) |
| Application Logs | Backend debugging and tracking | ✅ Active (Sprint 0) |
| Sentry | Error tracking and reporting | 🔜 Future (Sprint 2+) |
| Uptime Robot | Uptime and availability monitoring | 🔜 Future (Production) |
| Google Analytics | User behavior analytics | 🔜 Future (Production) |

---

## Supabase Dashboard Monitoring

### Access Dashboard

1. Go to: https://app.supabase.com
2. Sign in with your account
3. Select organization: **Szabi2002**
4. Select project: **kozlekedesi-jegykezelo** (ID: prhlsuwkokuisqavwfoi)

### Key Monitoring Areas

#### 1. Database

**Path:** Dashboard → Database

**What to Monitor:**
- Table sizes and row counts
- Query performance
- Active connections
- Database disk usage

**Access SQL Editor:**
```sql
-- View table sizes
SELECT
  schemaname as schema,
  tablename as table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View row counts
SELECT
  'users' as table, COUNT(*) as rows FROM public.users
UNION ALL
SELECT 'routes', COUNT(*) FROM public.routes
UNION ALL
SELECT 'stops', COUNT(*) FROM public.stops
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets;

-- View recent tickets
SELECT
  t.id,
  u.email as user_email,
  r.route_number,
  t.ticket_type,
  t.status,
  t.purchase_date
FROM public.tickets t
JOIN public.users u ON t.user_id = u.id
LEFT JOIN public.routes r ON t.route_id = r.id
ORDER BY t.purchase_date DESC
LIMIT 10;
```

**Alerts:**
- Disk usage > 80% (Free tier: 500 MB limit)
- Table row count approaching limits
- Slow queries (> 1 second)

#### 2. Authentication

**Path:** Dashboard → Authentication

**What to Monitor:**
- Total users
- New signups (daily/weekly)
- Failed login attempts
- Active sessions

**User Management:**
- View all users
- Ban/unban users
- Send password reset emails
- View user metadata

**Logs:**
```
Dashboard → Authentication → Logs
```

- Login attempts
- Registration events
- Password resets
- OAuth provider connections

**Alerts:**
- Unusual spike in failed logins (potential attack)
- New user registration surge
- OAuth provider errors

#### 3. Storage

**Path:** Dashboard → Storage

**What to Monitor:**
- Bucket sizes
- File counts
- Storage usage percentage
- Failed uploads

**Storage Buckets:**
- `profile-pictures`: User profile images (public)
- `ticket-pdfs`: Purchased ticket PDFs (private)
- `route-images`: Route/vehicle photos (public)

**Storage Queries:**
```sql
-- View storage usage by bucket
SELECT
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
GROUP BY bucket_id;

-- View largest files
SELECT
  bucket_id,
  name,
  pg_size_pretty((metadata->>'size')::bigint) as size,
  created_at
FROM storage.objects
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 10;
```

**Alerts:**
- Storage usage > 80% (Free tier: 1 GB limit)
- Unusual file upload patterns
- Failed upload rate > 5%

#### 4. Logs

**Path:** Dashboard → Logs → Query Logs**

**Query Logs:**
- All database queries
- Query execution time
- Error logs

**Example: Find slow queries**
```
Filter: execution_time > 1000ms
```

**API Logs:**
- HTTP requests to Supabase API
- Authentication events
- Storage events

**Real-time Logs:**
```
Dashboard → Logs → Realtime (if using real-time features)
```

**Alerts:**
- Error rate > 1% of total requests
- Query time > 2 seconds for 95th percentile
- API response time > 500ms consistently

#### 5. API Usage

**Path:** Dashboard → Project Settings → Usage

**Metrics:**
- Database queries per day
- Storage bandwidth
- Auth requests
- Edge function invocations

**Free Tier Limits:**
- Database: 500 MB, 2 GB bandwidth
- Storage: 1 GB, 2 GB bandwidth
- Auth: 50,000 monthly active users
- Edge Functions: 500K executions/month

**Alerts:**
- Any metric > 80% of limit
- Bandwidth spike (potential DDoS or bug)

---

## Application Logging

### Backend Logging (NestJS)

**Winston Logger Configuration:**

Backend logs are managed by Winston (configured in Sprint 0 plan).

**Log Levels:**
- `error`: Application errors
- `warn`: Warnings
- `info`: General information
- `debug`: Debugging information (dev only)
- `verbose`: Detailed logs (dev only)

**Example Logs:**

```typescript
// In your NestJS service
import { Logger } from '@nestjs/common';

export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  async purchaseTicket(userId: string, routeId: string) {
    this.logger.log(`User ${userId} purchasing ticket for route ${routeId}`);

    try {
      // ... purchase logic
      this.logger.log(`Ticket purchased successfully: ${ticket.id}`);
    } catch (error) {
      this.logger.error(`Failed to purchase ticket: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

**Viewing Logs:**

**Development:**
```bash
cd backend
npm run start:dev
# Logs appear in console
```

**Production (Railway/Render):**
```bash
# Railway CLI
railway logs --service backend

# Render Dashboard
# Go to: Dashboard → Service → Logs tab
```

**Log Format:**
```
[2025-11-02 14:30:45.123] [INFO] [TicketService] User abc123 purchasing ticket for route def456
[2025-11-02 14:30:45.456] [ERROR] [TicketService] Failed to purchase ticket: Insufficient balance
```

### Frontend Logging (Angular)

**Console Logs:**

Angular logs errors to browser console automatically.

**Viewing Logs:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter by level: Error, Warning, Info, Debug

**Custom Logging Service:**

```typescript
// src/app/core/services/logger.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(message: string, ...args: any[]) {
    if (!environment.production) {
      console.log(message, ...args);
    }
  }

  error(message: string, error?: any) {
    console.error(message, error);
    // Future: Send to Sentry
  }

  warn(message: string, ...args: any[]) {
    console.warn(message, ...args);
  }
}
```

**Usage:**
```typescript
constructor(private logger: LoggerService) {}

ngOnInit() {
  this.logger.log('Component initialized');

  this.ticketService.purchase(ticketData).subscribe({
    next: (ticket) => this.logger.log('Ticket purchased', ticket),
    error: (err) => this.logger.error('Purchase failed', err)
  });
}
```

---

## GitHub Actions Monitoring

### CI/CD Pipeline Status

**Access:** Repository → Actions tab

**Workflow Status:**
- ✅ Green: All checks passed
- ❌ Red: One or more checks failed
- ⏳ Yellow: Checks in progress
- ⚪ Gray: Checks skipped or not run

**Email Notifications:**

GitHub sends emails for:
- Failed workflow runs (on your code)
- Successful workflow runs (optional)

**Configure notifications:**
1. GitHub → Settings → Notifications
2. Actions → Workflow runs on repositories you push to
3. Choose: Email, Web, or Mobile

**Slack Integration (Future):**

```yaml
# .github/workflows/notify-slack.yml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "❌ CI Failed on ${{ github.repository }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Workflow *${{ github.workflow }}* failed"
            }
          }
        ]
      }
```

---

## Error Tracking (Future: Sentry)

**Status:** 🔜 Planned for Sprint 2+

### Sentry Setup (When Ready)

#### 1. Create Sentry Account

- Go to: https://sentry.io
- Sign up for free tier
- Create new project: "kozlekedesi-jegykezelo"

#### 2. Backend Integration

```bash
cd backend
npm install @sentry/node
```

```typescript
// main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capture all unhandled exceptions
app.use(Sentry.Handlers.errorHandler());
```

#### 3. Frontend Integration

```bash
cd frontend
npm install @sentry/angular
```

```typescript
// app.config.ts
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  tracesSampleRate: 1.0,
});
```

#### 4. Monitor Errors

**Sentry Dashboard:**
- Real-time error tracking
- Stack traces
- User context (which user experienced error)
- Breadcrumbs (user actions before error)
- Release tracking

**Alerts:**
- Email when new error occurs
- Slack notifications for critical errors
- Daily/weekly error summaries

---

## Performance Monitoring

### Backend Performance

**Metrics to Track:**
- API response time (p50, p95, p99)
- Requests per second (RPS)
- Error rate
- Database query time

**Tools:**

**1. NestJS Built-in (Development):**
```typescript
// Log request duration
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: Function) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
  }
}
```

**2. Supabase Analytics (Production):**
- Dashboard → Logs → API Logs
- Filter slow requests: `execution_time > 500ms`

### Frontend Performance

**Metrics to Track:**
- Page load time
- Time to Interactive (TTI)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

**Tools:**

**1. Chrome DevTools:**
- Network tab: Resource loading times
- Performance tab: Recording and analysis
- Lighthouse tab: Performance audit

**2. Angular Performance Profiler:**
```bash
ng serve --source-map
# Open Chrome DevTools → Performance tab
# Record user interaction
# Analyze flame graph
```

**3. Google Analytics (Future):**

Track custom events:
```typescript
// Track ticket purchase time
gtag('event', 'timing_complete', {
  name: 'ticket_purchase',
  value: duration,
  event_category: 'UX'
});
```

---

## Uptime Monitoring

**Status:** 🔜 Planned for Production

### UptimeRobot Setup

**When deployed to production:**

1. Sign up: https://uptimerobot.com (free tier)
2. Create monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://api.yourdomain.com/api/health`
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email, Slack

3. Create monitors for:
   - Backend API health endpoint
   - Frontend homepage
   - Supabase API (if needed)

4. Configure alerts:
   - Email when site goes down
   - Email when site comes back up
   - SMS for critical services (premium)

**Alternative: Better Uptime**
- https://betteruptime.com
- More features on free tier
- Status page included

---

## Alerting Strategy

### Critical Alerts (Immediate Action)

**Conditions:**
- Application down (uptime < 99%)
- Database connection lost
- Authentication service down
- High error rate (> 5% of requests)

**Channels:**
- Email (immediate)
- SMS (if critical)
- Slack notification

### Warning Alerts (Monitor Closely)

**Conditions:**
- Slow response time (> 2 seconds for p95)
- Storage usage > 80%
- Database usage > 80%
- Failed login attempts spike

**Channels:**
- Email (daily digest)
- Slack notification

### Info Alerts (Awareness)

**Conditions:**
- New user registration
- High traffic spike (good news!)
- Successful deployment

**Channels:**
- Email (weekly digest)
- Dashboard notification

---

## Incident Response

### Response Workflow

**1. Detect**
- Alert received
- User reports issue
- Monitoring shows anomaly

**2. Assess**
- Check Supabase Dashboard → Logs
- Check GitHub Actions → Recent deployments
- Check application logs

**3. Diagnose**
- Identify root cause
- Check recent code changes
- Review error stack traces

**4. Mitigate**
- Rollback deployment if recent change caused issue
- Apply hotfix
- Scale resources if needed

**5. Resolve**
- Verify fix in production
- Monitor for 30 minutes
- Update status page

**6. Postmortem**
- Document what happened
- Document why it happened
- Document what was done
- Document how to prevent it

**Postmortem Template:**

```markdown
# Incident Report: [Brief Description]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** Critical / High / Medium / Low

## Summary
Brief description of the incident.

## Timeline
- HH:MM - Incident detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
What caused the incident.

## Impact
- Users affected: X
- Services affected: Y
- Data loss: None / Description

## Resolution
How the incident was resolved.

## Action Items
- [ ] Task 1 to prevent recurrence
- [ ] Task 2 to improve monitoring
- [ ] Task 3 to update documentation
```

---

## Metrics to Track

### Development Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Build time | < 5 minutes | GitHub Actions logs |
| Test coverage | > 70% | Codecov report |
| Linting errors | 0 | GitHub Actions checks |
| Failed PR checks | < 10% | GitHub PR history |

### Production Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Uptime | > 99.9% | UptimeRobot |
| API response time (p95) | < 500ms | Supabase logs |
| Error rate | < 1% | Sentry dashboard |
| Page load time | < 2 seconds | Google Analytics |
| Database query time | < 100ms | Supabase logs |

### Business Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| New user signups | Growing | Supabase Auth dashboard |
| Ticket purchases | Growing | Database query |
| Active users (DAU) | Growing | Custom analytics |
| Route searches | Growing | Application logs |

---

## Dashboard Examples

### Custom Monitoring Dashboard (Future)

**Using Grafana or Datadog:**

**Panels:**
1. **Uptime** (last 7 days)
2. **API Response Time** (p50, p95, p99)
3. **Error Rate** (percentage)
4. **Active Users** (real-time)
5. **Database Performance** (query time)
6. **Storage Usage** (percentage)

**Example Query:**
```sql
-- Daily active users
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users
FROM public.tickets
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

---

## Additional Resources

- **Supabase Documentation:** https://supabase.com/docs/guides/platform/logs
- **Sentry Documentation:** https://docs.sentry.io/
- **UptimeRobot:** https://uptimerobot.com/
- **Google Analytics:** https://analytics.google.com/
- **Environment Setup:** `docs/ENVIRONMENT_SETUP.md`
- **CI/CD Setup:** `docs/CI_CD_SETUP.md`

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps Infrastructure Engineer
