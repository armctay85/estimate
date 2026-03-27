# Vercel Deployment

## Quick Deploy (One-Time Setup)

Since the GitHub Actions workflow needs Vercel secrets, here's the fastest way:

### Option 1: Vercel Dashboard (2 minutes)

1. Go to https://vercel.com/new
2. Import from GitHub: `armctay85/estimate`
3. Configure:
   - **Framework Preset:** `Other`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm ci`
4. Add Environment Variables:
   ```
   DATABASE_URL=your_neon_postgres_url
   JWT_SECRET=random_64_char_string
   SESSION_SECRET=random_64_char_string
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
5. Click **Deploy**

### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login (opens browser)
vercel login

# Link and deploy
vercel --prod
```

## Current Status

- ✅ Build passing locally
- ✅ All files in `dist/public/`
- ✅ GitHub Actions builds on push (tests only, no auto-deploy)

## Build Verification

```bash
cd /root/.openclaw/workspace/estimate
npm run build
# Output: dist/public/ with assets/
```

## Troubleshooting

If build fails on Vercel:
1. Check Node.js version is 18+ in Vercel settings
2. Verify `dist/public` exists after build
3. Check environment variables are set
4. View build logs in Vercel dashboard
