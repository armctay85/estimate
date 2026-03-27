# Vercel Deployment Setup

## Option 1: GitHub Integration (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select "Import Git Repository"
4. Choose `armctay85/estimate`
5. Configure:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm ci`
6. Add Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
7. Click Deploy

## Option 2: Vercel CLI (Manual)

```bash
# Install Vercel CLI
npm i -g vercel

# Login (opens browser)
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

## Option 3: GitHub Actions (Auto-deploy)

1. Get Vercel token:
   ```bash
   vercel tokens create
   ```

2. Add secrets to GitHub repository:
   - Go to https://github.com/armctay85/estimate/settings/secrets/actions
   - Add `VERCEL_TOKEN`
   - Add `VERCEL_ORG_ID` (from `vercel teams list`)
   - Add `VERCEL_PROJECT_ID` (from `.vercel/project.json`)

3. Push to main branch — auto-deploys

## Current Build Status

- ✅ Frontend: 2MB bundle (optimized)
- ✅ Server: 243KB
- ✅ Build passing
- ✅ Ready for deployment

## Environment Variables Required

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
