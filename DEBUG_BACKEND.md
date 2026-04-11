# Backend Debugging Guide

## Quick Checks

### 1. Is Backend Responding?

Run this in your browser console or use curl:

```bash
# Test if backend is alive
curl -v http://localhost:8000/api/v1/health

# Expected: 200 OK with {"status": "ok"}
```

### 2. Check Backend Logs

Look at the **backend terminal** for the actual error. Common 500 errors:

```
ERROR: Database connection failed
ERROR: PostgreSQL is not running
ERROR: Missing env variable: DATABASE_URL
ERROR: JWT validation failed
```

### 3. Test Authentication

If you have a valid token stored, test the /patients endpoint:

```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/patients?page=1&page_size=20

# Should return patient list or error with details
```

### 4. Check Browser Network Tab

1. Open DevTools → Network tab
2. Reload the page and click on the failed request
3. Look at:
   - **Response** tab - Backend error message (usually most detailed)
   - **Headers** tab - Request headers (verify Authorization is present)
   - **Payload** tab - What was sent

## Common Backend Issues

| Issue            | Solution                                                 |
| ---------------- | -------------------------------------------------------- |
| 500 CORS error   | Check backend CORS config allows `http://localhost:3000` |
| 500 Database     | Start PostgreSQL, check DATABASE_URL env var             |
| 500 JWT invalid  | Clear localStorage, login again                          |
| 500 Missing env  | Check `.env` file in backend repo                        |
| 401 Unauthorized | Token expired - refresh or login again                   |

## Backend ENV Variables to Check

Your backend needs these (in its `.env` file):

```
DATABASE_URL=postgresql://user:pass@localhost/dicom_db
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ALLOWED_ORIGINS=http://localhost:3000
```

## Debug: Check Actual Request

Add this to `lib/api-client.ts` temporarily (line 35):

```typescript
client.interceptors.request.use(
  (config) => {
    console.log("📤 API Request:", {
      method: config.method,
      url: config.url,
      fullUrl: config.baseURL + config.url,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => Promise.reject(error),
);
```

Then check the console to see exactly what's being sent.

## Next Steps

1. **Check backend terminal first** - it will show the actual error
2. **Check browser Network tab** - see the response body
3. **Verify tokens are valid** - check localStorage
4. **Restart backend** - sometimes old processes cause issues
5. **Check database connection** - PostgreSQL must be running

## Still Stuck?

Collect this info from backend error:

- Full error message from backend terminal
- Request URL and method
- Response body from Network tab
- Backend environment variables (redact sensitive values)
