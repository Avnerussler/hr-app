# Testing Guide for HR App

This document provides comprehensive instructions for running tests in the HR App project.

## Prerequisites

Before running tests, ensure all services are running:

### Required Services:

1. **MongoDB** - Database (port 27017)
2. **Minio** - Object storage (ports 9000, 9001)
3. **Backend Server** - API server (port 3001)
4. **Frontend** - Web application (port 5173)

## Quick Start

### Option 1: Automatic Service Management (Recommended)

```bash
# Check if services are running
npm run services:check

# Start all required services
npm run services:start

# Run tests
npm test

# Stop all services when done
npm run services:stop
```

### Option 2: Manual Service Start

If you prefer to start services manually:

```bash
# Terminal 1: Start Docker services (MongoDB & Minio)
cd apps/server
npm run docker:compose

# Terminal 2: Start Backend
cd apps/server
npm run dev

# Terminal 3: Start Frontend
cd apps/frontend
npm run dev

# Terminal 4: Run tests
npm test
```

## Test Commands

### Run All Tests

```bash
npm test
```

### Run Tests in Headed Mode (see browser)

```bash
npm run test:headed
```

### Run Tests with UI Mode

```bash
npm run test:ui
```

### Run Tests in Debug Mode

```bash
npm run test:debug
```

### Run Tests for Specific Browser

```bash
npm run test:chromium    # Chrome/Chromium
npm run test:firefox     # Firefox
npm run test:webkit      # Safari
```

### View Test Report

```bash
npm run test:report
```

## Test Structure

```
tests/
├── 01-app-load.spec.ts           # Application loading tests
├── 02-navigation.spec.ts          # Navigation tests
├── 03-personnel-crud.spec.ts      # Personnel CRUD operations
├── 03-personnel-crud-with-faker.spec.ts  # CRUD with Faker.js
└── 04-faker-data-generation.spec.ts     # Data generation tests
```

## Troubleshooting

### Connection Refused Error

**Error:** `net::ERR_CONNECTION_REFUSED at http://localhost:5173/`

**Solution:** This means the application services are not running. Follow these steps:

1. Check which services are running:

   ```bash
   npm run services:check
   ```

2. If services are not running, start them:

   ```bash
   npm run services:start
   ```

3. Wait for all services to be ready (usually 10-30 seconds)

4. Run tests again:
   ```bash
   npm test
   ```

### Database Connection Issues

**Error:** MongoDB connection errors

**Solution:**

1. Ensure Docker is running
2. Start Docker services:
   ```bash
   cd apps/server
   npm run docker:compose
   ```
3. Wait for MongoDB to be ready (check with `docker ps`)

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**

1. Find the process using the port:

   ```bash
   # For port 5173 (Frontend)
   lsof -ti:5173

   # For port 3001 (Backend)
   lsof -ti:3001
   ```

2. Kill the process:

   ```bash
   kill -9 <PID>
   ```

3. Or use the stop script:
   ```bash
   npm run services:stop
   ```

### Frontend Not Loading

**Error:** Blank page or loading errors

**Solution:**

1. Check frontend logs:

   ```bash
   tail -f logs/frontend.log
   ```

2. Verify frontend dependencies are installed:

   ```bash
   cd apps/frontend
   npm install
   ```

3. Restart frontend:
   ```bash
   npm run dev
   ```

### Rate Limit Errors

**Error:** `Rate Limit Exceeded` or `Too many requests` (429 status code)

**Solution:**

This happens when tests make too many requests in parallel. The fix is already implemented:

1. **Restart the backend server** to apply the updated rate limits:

   ```bash
   # Stop services
   npm run services:stop

   # Start services again
   npm run services:start
   ```

2. The backend now allows:

   - **Production:** 100 requests/minute
   - **Development/Testing:** 1000 requests/minute

3. Tests are configured to run with 4 parallel workers (instead of unlimited) to avoid overwhelming the API

4. If you still see rate limit errors, reduce parallel workers in `playwright.config.ts`:
   ```typescript
   workers: 2; // or even 1 for very strict rate limits
   ```

## Best Practices

### Before Running Tests

1. ✅ Always ensure all services are running
2. ✅ Run `npm run services:check` to verify
3. ✅ Check logs if tests fail: `logs/frontend.log` and `logs/server.log`
4. ✅ Use `npm run test:ui` for interactive debugging

### After Running Tests

1. ✅ Review test reports: `npm run test:report`
2. ✅ Check for failed tests and investigate
3. ✅ Stop services to free resources: `npm run services:stop`

### CI/CD Integration

For continuous integration environments:

```yaml
# Example GitHub Actions workflow
- name: Start services
  run: npm run services:start

- name: Run tests
  run: npm test

- name: Stop services
  run: npm run services:stop
  if: always()
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL:** http://localhost:5173
- **Browsers:** Chromium, Firefox, WebKit
- **Retries:** 0 locally, 2 in CI
- **Workers:** Parallel execution enabled
- **Artifacts:** Screenshots, videos, traces on failure

## Writing New Tests

When writing new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Add proper wait conditions
4. Use Playwright best practices
5. Test across all browsers

Example:

```typescript
test('should perform user action', async ({ page }) => {
 await page.goto('/');
 await page.waitForSelector('text=Expected Element');
 await page.click('button:has-text("Action")');
 await expect(page.locator('.result')).toBeVisible();
});
```

## Support

For issues or questions:

1. Check this document first
2. Review Playwright documentation: https://playwright.dev
3. Check project README.md
4. Contact the development team

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Automation Patterns](https://playwright.dev/docs/test-patterns)
