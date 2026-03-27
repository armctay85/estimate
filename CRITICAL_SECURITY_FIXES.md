# CRITICAL SECURITY FIXES FOR ESTIMATE
## Must fix BEFORE production or integration

---

## 🔴 FIX 1: Hardcoded Admin Credentials

**File:** `server/auth.ts` (around line 165)

### Current (DANGEROUS):
```typescript
if (req.body.username === 'admin' && req.body.password === 'pass') {
  const token = jwt.sign({ userId: 'admin', isAdmin: true }, JWT_SECRET);
  return res.json({ token, user: { id: 'admin', isAdmin: true } });
}
```

### Fixed:
```typescript
// Remove the hardcoded check entirely
// Use proper database authentication only
const user = await storage.getUserByUsername(req.body.username);
if (!user || !user.isAdmin) {
  return res.status(401).json({ message: 'Invalid credentials' });
}
const validPassword = await bcrypt.compare(req.body.password, user.password);
if (!validPassword) {
  return res.status(401).json({ message: 'Invalid credentials' });
}
```

---

## 🔴 FIX 2: JWT Secret Fallback

**File:** `server/auth.ts`

### Current (DANGEROUS):
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'estimate-secret-key-2025';
```

### Fixed:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be set and at least 32 characters');
}
```

---

## 🔴 FIX 3: Rate Limiting Disabled

**File:** `server/auth.ts`

### Current (DANGEROUS):
```typescript
const authLimiter = (req, res, next) => next();
```

### Fixed:
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 🟡 FIX 4: CORS Restriction

**File:** `server/index.ts`

### Current (DANGEROUS):
```typescript
app.use(cors({ origin: '*' }));
```

### Fixed:
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://yourdomain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## 🟡 FIX 5: Input Sanitization

**Create new file:** `server/middleware/sanitization.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potential XSS patterns
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};
```

**In `server/index.ts`:**
```typescript
import { sanitizeInput } from './middleware/sanitization';
app.use(sanitizeInput);
```

---

## Required Environment Variables

```bash
# Critical - must be set
JWT_SECRET=your-32-char-minimum-secret-here
SESSION_SECRET=different-32-char-secret-here

# Database
DATABASE_URL=postgresql://...

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Admin setup (create proper admin user)
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD_HASH=bcrypt-hash-of-password
```

---

## Verification Checklist

- [ ] Deleted hardcoded admin credentials
- [ ] JWT_SECRET enforces minimum 32 chars, no fallback
- [ ] Rate limiting active (10 attempts per 15 min)
- [ ] CORS restricted to known origins
- [ ] Input sanitization middleware active
- [ ] No stack traces in production errors
- [ ] Strong passwords enforced
- [ ] HTTPS only in production

---

## Testing Security

```bash
# 1. Test admin login fails with default credentials
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass"}'
# Should return 401

# 2. Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done
# Should block after 10 attempts

# 3. Test XSS protection
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>"}'
# Script tags should be stripped
```

---

**DO NOT DEPLOY TO PRODUCTION WITHOUT THESE FIXES**
