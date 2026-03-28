# Quick Start Guide for Developers

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended)
- Git

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/armctay85/estimate.git
cd estimate
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.production.template .env.development
```

Edit `.env.development`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/estimate
JWT_SECRET=your-jwt-secret-min-64-chars
SESSION_SECRET=your-session-secret-min-64-chars
NODE_ENV=development
```

### 4. Database Setup
```bash
# Run migrations
npm run db:push

# Seed with benchmark data
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Server runs at http://localhost:5000

---

## Project Structure

```
estimate/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Express backend
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── seed/            # Database seeding
│   └── index.ts
├── shared/              # Shared code
│   └── schema.ts        # Database schema
├── tests/               # Test suite
└── seed_data/           # Benchmark data
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run check            # TypeScript check

# Building
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:seed          # Seed database

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Deployment
npm run deploy:staging   # Deploy to staging
npm run deploy:prod      # Deploy to production
```

---

## Key Features Implementation

### Adding a New API Endpoint

1. Create route in `server/routes/my-feature.ts`
2. Add to `server/index.ts`:
```typescript
import myFeatureRoutes from './routes/my-feature';
app.use('/api/my-feature', myFeatureRoutes);
```

### Adding a New Component

1. Create in `client/src/components/MyComponent.tsx`
2. Export from `client/src/components/index.ts`
3. Import in page

### Adding a Database Table

1. Add table definition in `shared/schema.ts`
2. Run `npm run db:push`
3. Export types from `shared/schema.ts`

---

## Testing

```bash
# Run all tests
npm test

# Run specific test
npx vitest run tests/auth.security.test.ts

# Coverage
npm run test:coverage
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Manual

```bash
# Build
npm run build

# Start
npm run start
```

---

## Troubleshooting

### Build fails
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Database connection error
- Check `DATABASE_URL` format
- Verify database exists
- Check network access

### TypeScript errors
```bash
npm run check
```

### Port already in use
```bash
lsof -ti:5000 | xargs kill -9
```

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push: `git push origin feature/my-feature`
5. Create Pull Request

---

## Resources

- API Docs: `/API.md`
- Architecture: `/README.md`
- Roadmap: `/ROADMAP.md`
- Changelog: `/CHANGELOG.md`
