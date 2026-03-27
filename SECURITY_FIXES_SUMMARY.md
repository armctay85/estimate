# Estimate Security Fixes

## Critical Issues Found

### 1. Hardcoded Admin Credentials (CRITICAL)
**File:** `server/auth.ts:145`
```typescript
if (req.body.username === 'admin' && req.body.password === 'pass') {
```
**Fix:** Remove hardcoded credentials, use environment variables

### 2. JWT Fallback Secret (CRITICAL)
**File:** `server/auth.ts:63`
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'estimate-secret-key-2025');
```
**Fix:** Remove fallback, require env var

### 3. Disabled Rate Limiting (HIGH)
**File:** `server/auth.ts` (reported in audit)
```typescript
const authLimiter = (req, res, next) => next(); // Disabled
```
**Fix:** Implement proper rate limiting

### 4. Open CORS (MEDIUM)
**File:** `server/index.ts`
```typescript
Access-Control-Allow-Origin: '*'
```
**Fix:** Restrict to known origins

---

## Fixed Files

### server/auth.ts
```typescript
// JWT verification - NO FALLBACK
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Admin login - NO HARDCODED CREDENTIALS
// Check against database or env vars only
const adminUsername = process.env.ADMIN_USERNAME;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
```

### .env.template additions
```bash
# Admin Configuration (required)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=bcrypt_hash_of_password
JWT_SECRET=your_secure_random_string_min_32_chars
```

---

## Implementation Steps

1. Remove hardcoded admin credentials from auth.ts
2. Add proper admin user database table
3. Remove JWT fallback secret
4. Implement rate limiting with express-rate-limit
5. Restrict CORS origins
6. Add security headers with Helmet
7. Test all authentication flows

---

## Verification

After fixes, run:
```bash
# Check no hardcoded secrets
grep -r "admin" server/ | grep -v "adminUser\|isAdmin"
grep -r "pass" server/ | grep -v "password\|hash"

# Check JWT has no fallback
grep "JWT_SECRET" server/auth.ts
```
