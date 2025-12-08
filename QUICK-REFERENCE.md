# Quick Reference - Testing Commands

## 🚀 Get Started in 3 Steps

```bash
# 1. Make scripts executable (one-time setup)
chmod +x scripts/*.sh

# 2. Start all services
npm run services:start

# 3. Run tests
npm test
```

## 📋 Common Commands

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run services:start` | Start all services (Docker, Backend, Frontend) |
| `npm run services:stop`  | Stop all services                              |
| `npm run services:check` | Check which services are running               |
| `npm test`               | Run all tests                                  |
| `npm run test:headed`    | Run tests with visible browser                 |
| `npm run test:ui`        | Run tests in interactive UI mode               |
| `npm run test:debug`     | Run tests in debug mode                        |
| `npm run test:report`    | View HTML test report                          |

## 🔍 Troubleshooting

### Tests fail with "Connection Refused"

```bash
# Check services
npm run services:check

# If not running, start them
npm run services:start

# Wait 30 seconds, then retry
npm test
```

### Port already in use

```bash
# Stop all services
npm run services:stop

# Find and kill process (example for port 5173)
lsof -ti:5173 | xargs kill -9

# Start services again
npm run services:start
```

### Services won't start

```bash
# Check Docker is running
docker ps

# Check logs
tail -f logs/frontend.log
tail -f logs/server.log

# Verify dependencies installed
cd apps/frontend && npm install
cd apps/server && npm install
```

### Rate limit errors (429 - Too many requests)

```bash
# Restart backend to apply updated rate limits
npm run services:stop
npm run services:start

# Rate limits are now:
# - Production: 100 requests/minute
# - Development/Testing: 1000 requests/minute
```

## 📂 Important Locations

| Location             | Purpose                          |
| -------------------- | -------------------------------- |
| `logs/frontend.log`  | Frontend server logs             |
| `logs/server.log`    | Backend server logs              |
| `test-results/`      | Test results and artifacts       |
| `playwright-report/` | HTML test reports                |
| `.pids/`             | Process IDs for running services |

## 🎯 Quick Fixes

### Reset Everything

```bash
npm run services:stop
rm -rf logs/ .pids/
npm run services:start
npm test
```

### Run Single Test File

```bash
npx playwright test tests/01-app-load.spec.ts
```

### Run Tests for One Browser

```bash
npm run test:chromium
# or
npm run test:firefox
# or
npm run test:webkit
```

### Debug a Failing Test

```bash
# Run in UI mode - best for debugging
npm run test:ui

# Or run with headed mode to see browser
npm run test:headed
```

## 🆘 Still Having Issues?

1. Read [TESTING.md](./TESTING.md) for detailed instructions
2. Read [TEST-FIX-SUMMARY.md](./TEST-FIX-SUMMARY.md) for context
3. Check service logs in `logs/` directory
4. Verify all dependencies installed
5. Ensure Docker is running

## 💡 Pro Tips

- Use `npm run test:ui` for interactive test development
- Check logs when services fail to start
- Always stop services when done: `npm run services:stop`
- Run `npm run services:check` before running tests
- Use `test.only` to focus on specific tests during development
