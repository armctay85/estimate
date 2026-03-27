# EstiMate - Construction Cost Platform

> $100M ARR vision. Automated QS workflows. Real tender benchmarks. CostX killer.

## Overview

EstiMate transforms construction cost estimation from a manual, error-prone process into an automated, data-driven platform. Built for quantity surveyors, builders, and developers who need accurate estimates fast.

## Key Features

### 🔒 Security First
- No hardcoded credentials
- JWT authentication with secure secrets
- Rate limiting (10 login/15min, 100 API/15min)
- Input sanitization
- Helmet security headers

### 📊 Elemental Cost Database
- **680+ benchmark rates** from real tenders (Kmart Gladstone $2.05M)
- **10 Australian regions** with multipliers
- **NRM1/AIQS aligned** element structure
- Crowdsourced data with QS verification
- Regional cost factors (Sydney +15%, Darwin +25%)

### 📄 PDF Takeoff Engine
- Upload architectural drawings (50MB limit)
- Canvas-based measurement tools
- Polygon area calculation
- Line length measurement
- Scale calibration from known dimensions
- Auto-link to elemental rates

### 🤖 Quote Validator
- OCR processing with Tesseract.js
- NLP line-item parsing
- Trust scoring (0-100)
- Benchmark comparison
- Variance highlighting
- Negotiation helper

### 📈 Tender Analyzer
- Upload tender documents
- Automatic line-item extraction
- Trust score generation
- Variance analysis
- Red/yellow/green flags
- Export reports

### 💰 Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 estimates/month |
| Pro | $79/mo | Unlimited, API access |
| Pro+ | $199/mo | Team features, priority support |
| Enterprise | $1,499+/mo | Custom integrations, SLA |

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Express, TypeScript, Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **Build:** Vite, Rollup code splitting
- **Auth:** Passport.js, JWT, bcrypt
- **Payments:** Stripe
- **Storage:** AWS S3 compatible

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.production.template .env.development
# Edit .env.development with your values

# Run database migrations
npm run db:push

# Seed database with benchmark rates
npm run db:seed

# Start development server
npm run dev
```

## Database Schema

### Core Tables
- `users` - User accounts with subscription tiers
- `projects` - Construction projects
- `rooms` - Room-level cost breakdowns
- `pdfTakeoffs` - PDF takeoff measurements

### Cost Database Tables
- `elements` - NRM1-aligned construction elements
- `costRates` - Regional pricing with percentiles
- `costSubmissions` - Crowdsourced QS data
- `regionalFactors` - Location multipliers
- `costIndexHistory` - Inflation tracking

## API Endpoints

See [API.md](./API.md) for complete documentation.

Key endpoints:
- `GET /api/health` - System health
- `GET /api/elements` - Search elements
- `POST /api/costs/estimate` - Calculate estimates
- `POST /api/quotes/validate` - Validate quotes
- `POST /api/tenders/analyze` - Analyze tenders

## Deployment

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy:prod
```

### Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `STORAGE_BUCKET` - File storage

See `.env.production.template` for full list.

## Data Moat

Our competitive advantage: **real tender data**

- Kmart Gladstone Refit: $2,053,226 (31 sheets)
- Samways Australia builder rates
- McLeod+Aitken QS breakdowns
- 500+ line-item rates extracted
- Labour: Carpenter $52/hr, Electrician $85/hr
- Materials: LED downlight $85/ea, Suspended ceiling $28.50/m²

## Business Model

**Revenue Mix Target:**
- 70% SaaS subscriptions
- 22% Transaction fees (tender marketplace)
- 6% Data/API licensing
- 2% Professional services

**Unit Economics:**
- Year 1: LTV:CAC 22.8:1, Payback 9.2mo
- Year 5: LTV:CAC 95.2:1, Payback 3.8mo

## Roadmap

### Complete ✅
- Security hardening
- Code cleanup
- PDF takeoff engine
- Elemental cost database
- Quote validator
- Premium UI transformation
- Tender analyzer
- Takeoff-cost integration

### Next
- RVT model integration
- Automated quantity extraction
- Tender marketplace
- Mobile app
- AI cost prediction

## License

Private - All rights reserved

## Contact

For support: support@estimate-app.com  
For sales: sales@estimate-app.com
