# Resolving Port Conflicts

## Problem

If you encounter this error when starting the backend:

```
Error: listen EADDRINUSE: address already in use :::3000
```

This means another process is already using port 3000.

## Quick Fix (Windows)

### Option 1: Use the Helper Script

Run the provided batch script:

```bash
.\kill-port-3000.bat
```

This will automatically find and kill any process using port 3000.

### Option 2: Manual Process

1. Find the process using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Note the PID (Process ID) in the last column

3. Kill the process:
   ```bash
   taskkill //F //PID <process_id>
   ```

   Example:
   ```bash
   taskkill //F //PID 18744
   ```

### Option 3: Use a Different Port

1. Edit the `.env` file in the backend directory
2. Change the PORT value:
   ```
   PORT=3001
   ```
3. Update the frontend configuration in `frontend/src/environments/environment.ts` to match:
   ```typescript
   apiUrl: 'http://localhost:3001/api'
   ```

## Prevention

The backend now includes improved error handling that will:
- Detect port conflicts and show a clear error message
- Provide instructions on how to resolve the issue
- Exit gracefully instead of hanging

## Common Causes

1. Previous backend instance still running from watch mode
2. Another application using port 3000
3. Crashed backend process that didn't clean up properly

## Verification

After fixing, verify the backend starts successfully:

```bash
npm run start:dev
```

You should see:
```
Alkalmazás fut: http://localhost:3000
Swagger docs: http://localhost:3000/api/docs
```
