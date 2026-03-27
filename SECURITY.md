# Security Configuration

This document outlines the security measures implemented in the EstiMate application.

## 🔐 Environment Variables

The following environment variables are **REQUIRED** for the application to start:

### Critical Security Variables

| Variable | Required | Min Length | Description |
|----------|----------|------------|-------------|
| `JWT_SECRET` | Yes | 32 chars | Secret for JWT token signing |
| `SESSION_SECRET` | Yes | 32 chars | Secret for session encryption |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `ALLOWED_ORIGINS` | `localhost:3000,5173` | CORS allowed origins |
| `ADMIN_SETUP_KEY` | - | Key for first-time admin setup |
| `RATE_LIMIT_LOGIN_MAX` | 10 | Max login attempts per window |
| `RATE_LIMIT_API_MAX` | 100 | Max API requests per window |
| `RATE_LIMIT_UPLOAD_MAX` | 5 | Max uploads per hour |

## 🛡️ Security Features

### 1. Authentication & Authorization

- **No hardcoded credentials** - All credentials stored in database with bcrypt hashing
- **Password requirements**: Minimum 12 characters, uppercase, lowercase, number, special character
- **JWT tokens** with configurable expiration (default: 24h)
- **Session security** with httpOnly, secure, and sameSite cookies
- **Admin tier** - Special `admin` subscription tier for administrative access

### 2. Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Login | 10 attempts | 15 minutes |
| API | 100 requests | 15 minutes |
| Upload | 5 files | 1 hour |

### 3. Input Sanitization

- **XSS Protection** - All user input sanitized to prevent cross-site scripting
- **Prototype Pollution Protection** - Blocks `__proto__`, `constructor`, `prototype` in request bodies
- **SQL Injection Prevention** - Using parameterized queries via Drizzle ORM

### 4. Security Headers

The application sets the following security headers:

- `Content-Security-Policy` - Restricts resource loading
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `Strict-Transport-Security` - HTTPS enforcement in production
- `Referrer-Policy: strict-origin-when-cross-origin` - Limits referrer information

### 5. CORS Configuration

CORS is configured to only allow specific origins:
- Development: `http://localhost:3000`, `http://localhost:5173`
- Production: Configured via `ALLOWED_ORIGINS` environment variable

### 6. Suspicious Activity Detection

The application automatically detects and blocks:
- Path traversal attempts (`../`, `..`)
- Access to sensitive files (`.env`, `.git`, etc.)
- Script injection attempts (`<script>`, `javascript:`)
- SQL injection patterns (`union select`, `drop table`)

## 👤 Admin User Setup

### First-Time Setup

1. Set the `ADMIN_SETUP_KEY` environment variable:
   ```bash
   export ADMIN_SETUP_KEY=$(openssl rand -base64 32)
   ```

2. Run the setup script:
   ```bash
   npm run setup:admin
   # or
   npx tsx scripts/setup-admin.ts
   ```

3. Follow the prompts to create the admin user.

4. **Important**: Remove or rotate `ADMIN_SETUP_KEY` after setup.

### Admin Login

Admins can log in via the `/api/auth/admin-login` endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword123!"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin"
  }
}
```

## 📝 Security Best Practices

### For Developers

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas for validation
3. **Use parameterized queries** - Never concatenate SQL
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Enable security headers** - Helmet is configured by default

### For System Administrators

1. **Use strong secrets** - Generate with `openssl rand -base64 32`
2. **Enable HTTPS** - Required for secure cookies
3. **Restrict CORS origins** - Set `ALLOWED_ORIGINS` in production
4. **Monitor logs** - Watch for suspicious activity
5. **Regular updates** - Keep Node.js and dependencies updated

## 🔍 Security Testing

Run the security test suite:

```bash
npm run test:security
```

This will verify:
- Environment variable validation
- Rate limiting functionality
- Input sanitization
- Authentication flows
- Authorization checks

## 🚨 Security Incident Response

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email security concerns to: [security@estimate.app](mailto:security@estimate.app)
3. Include detailed reproduction steps
4. Allow time for remediation before disclosure

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
