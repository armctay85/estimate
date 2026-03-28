# 🚀 EstiMate Deployment Ready

## Environment Variables for Vercel

Copy each of these into Vercel Dashboard → Project Settings → Environment Variables

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

### Stripe (Add YOUR live keys)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Price IDs (Already set)
```
STRIPE_PRICE_PRO=price_1TG4USGWpl9FVP42NKcwuW62
STRIPE_PRICE_PRO_PLUS=price_1TG4V1GWpl9FVP42o8l5eEZ6
STRIPE_PRICE_ENTERPRISE=price_1TG4VdGWpl9FVP42A5EXwfHq
```

### Feature Flags
```
ENABLE_COST_DATABASE=true
ENABLE_PDF_TAKEOFF=true
ENABLE_TENDER_ANALYZER=true
ENABLE_QUOTE_VALIDATOR=true
```

---

## Deploy Steps

1. **Go to** https://vercel.com/new
2. **Import** `armctay85/estimate`
3. **Add all env vars above** (one by one)
4. **Deploy**

---

## After Deploy

1. **Get your Vercel URL** (e.g., `https://estimate-xxx.vercel.app`)
2. **In Stripe Dashboard:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-vercel-url/api/webhook`
   - Events: `checkout.session.completed`, `invoice.paid`
   - Copy the webhook secret → add to `STRIPE_WEBHOOK_SECRET`
3. **Redeploy** with the webhook secret

---

## You're Missing (Add These)

| Variable | Where to Get |
|----------|--------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Create webhook endpoint first, then copy secret |

---

Ready to deploy! 🚀
