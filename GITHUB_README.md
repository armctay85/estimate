# EstiMate - Construction Cost Intelligence Platform

> The CostX killer. Built on real Australian tender data.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/armctay85/estimate/actions)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)

## 🎯 Mission

Transform construction cost estimation from manual spreadsheets into automated, data-driven intelligence. Replace CostX ($2,500/year) with EstiMate ($948/year) - same power, 62% savings, real data.

## ✨ Features

### 📄 PDF Takeoff Engine
- Upload architectural drawings (50MB max)
- Canvas-based measurement tools
- Polygon area calculation
- Auto-scale calibration
- Real-time cost linking

### 📊 Elemental Cost Database
- **680+ benchmark rates** from real tenders
- **10 Australian regions** with multipliers
- NRM1/AIQS aligned
- Kmart Gladstone dataset ($2.05M project)
- Sample rates: LED downlight $85, Carpenter $52/hr

### 🤖 Quote Validator
- OCR + NLP processing
- Trust scoring (0-100)
- Benchmark comparison
- Variance highlighting
- Negotiation helper

### 📈 Tender Analyzer
- Multi-bid comparison
- Trust score generation
- Red/yellow/green flags
- Exportable reports

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/armctay85/estimate.git
cd estimate

# Install
npm install

# Setup env
cp .env.production.template .env.development
# Edit .env.development with your values

# Database
npm run db:push
npm run db:seed

# Run
npm run dev
```

## 💰 Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 estimates/mo |
| **Pro** | $79/mo | Unlimited estimates |
| **Pro+** | $199/mo | Team features |
| **Enterprise** | $1,499/mo | Custom integrations |

**Save $1,548/year vs CostX**

## 🏗️ Architecture

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Express + Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **Build:** Vite + esbuild
- **Testing:** Vitest
- **Auth:** JWT + bcrypt

## 📁 Repository Structure

```
estimate/
├── client/          # React frontend
├── server/          # Express API
├── shared/          # Shared types/schema
├── tests/           # Test suite
├── seed_data/       # Benchmark rates
└── docs/            # Documentation
```

## 📖 Documentation

- [API Reference](API.md)
- [Deployment Guide](DEPLOY.md)
- [Developer Guide](CONTRIBUTING.md)
- [Business Model](BUSINESS_MODEL.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)

## 🧪 Testing

```bash
npm test              # Run tests
npm run test:coverage # Coverage report
```

## 🔒 Security

- ✅ No hardcoded credentials
- ✅ JWT with secure secrets
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ Helmet headers

## 📊 Data Sources

- **Kmart Gladstone Refit** - $2.05M tender (31 sheets)
- **Samways Australia** - Builder rates
- **McLeod+Aitken** - QS breakdowns
- **500+ line-item rates** extracted

## 🌐 Deployment

### Vercel (Recommended)
```bash
# One-click deploy
https://vercel.com/new?repository-url=https://github.com/armctay85/estimate
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_...
```

## 🤝 Contributing

1. Fork repository
2. Create branch: `git checkout -b feature/amazing`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing`
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📈 Metrics

- 121 React components
- 30 API routes
- 2MB client bundle
- 243KB server bundle
- 680 benchmark rates
- 50+ documentation files

## 🏆 Achievements

- ✅ MVP complete
- ✅ Security hardened
- ✅ Tests passing
- ✅ Build optimized
- ✅ Documentation complete

## 🗺️ Roadmap

### Phase 1 (Now)
- [x] Core platform
- [x] PDF takeoff
- [x] Cost database
- [ ] Stripe integration

### Phase 2 (Q2 2026)
- [ ] Tender marketplace
- [ ] Team workspaces
- [ ] Mobile app

### Phase 3 (Q3 2026)
- [ ] Revit plugin
- [ ] AI prediction
- [ ] API access

## 📞 Support

- Email: support@estimate-app.com
- Discord: [Join Community](https://discord.gg/estimate)
- Issues: [GitHub Issues](https://github.com/armctay85/estimate/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

Built in Sydney 🇦🇺 | Loved by QSs Nationwide
