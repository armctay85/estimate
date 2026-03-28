# 🚀 EstiMate Deployment Guide

## Step 1: Create Vercel Project
- Go to https://vercel.com/new
- Import `armctay85/estimate`

## Step 2: Add Environment Variables

Copy-paste these into Vercel Dashboard:

### Database
```
DATABASE_URL=postgresql://postgres:upNCchvzTbMy0Ghw@db.duzofvlrhoewqopollca.supabase.co:5432/postgres
```

### Secrets
```
JWT_SECRET=R0HjP8XBoWLVQn4AbPqFsQi8pmvMeO8TEW8g/jpXoZfUwU856p/CmYIhDpLBaYdK
```
```
SESSION_SECRET=8eznKkUuihFhxsypBiye4CD0rMwAEfJy5UtOqeemflznJs3BoCbE9i1BkGZPDYwn
```

### Stripe (Get from dashboard.stripe.com)
- `STRIPE_SECRET_KEY` - sk_live_... (Secret key)
- `STRIPE_PUBLISHABLE_KEY` - pk_live_... (Publishable key)  
- `STRIPE_WEBHOOK_SECRET` - Add after deploy

### Stripe Price IDs
```
STRIPE_PRICE_PRO=price_1TG4USGWpl9FVP42NKcwuW62
STRIPE_PRICE_PRO_PLUS=price_1TG4V1GWpl9FVP42o8l5eEZ6
STRIPE_PRICE_ENTERPRISE=price_1TG4VdGWpl9FVP42A5EXwfHq
```

### Features
```
ENABLE_COST_DATABASE=true
ENABLE_PDF_TAKEOFF=true
ENABLE_TENDER_ANALYZER=true
ENABLE_QUOTE_VALIDATOR=true
```

## Step 3: Deploy
Click Deploy. After it builds:

1. Copy your Vercel URL (e.g., `https://estimate-xxx.vercel.app`)
2. In Stripe Dashboard → Developers → Webhooks → Add endpoint
3. URL: `https://your-url/api/webhook`
4. Select events: `checkout.session.completed`, `invoice.paid`
5. Copy webhook signing secret
6. Add to Vercel as `STRIPE_WEBHOOK_SECRET`
7. Redeploy

Done! 🎉
