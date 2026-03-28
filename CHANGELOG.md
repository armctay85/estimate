# Changelog

All notable changes to EstiMate will be documented in this file.

## [1.0.0] - 2026-03-28 - MVP Release 🚀

### Added

#### Core Platform
- **User Authentication** - Secure JWT-based auth with bcrypt password hashing
- **Subscription Management** - 4-tier pricing (Free, Pro $79, Pro+ $199, Enterprise $1,499)
- **Role-based Access** - User, admin, and superadmin roles

#### PDF Takeoff Engine
- Upload architectural drawings (up to 50MB)
- Canvas-based measurement tools
- Polygon area calculation
- Line length measurement
- Scale calibration
- Auto-link to elemental rates

#### Elemental Cost Database
- 680+ benchmark rates from real tenders
- 10 Australian regions with multipliers
- NRM1/AIQS aligned structure
- Regional cost factors (Sydney +15%, Darwin +25%, etc.)
- Kmart Gladstone dataset ($2.05M project)

#### Quote Validator
- OCR processing with Tesseract.js
- NLP line-item parsing
- Trust scoring (0-100)
- Benchmark comparison
- Variance highlighting
- Negotiation helper

#### Tender Analyzer
- Upload tender documents
- Automatic line-item extraction
- Trust score generation
- Variance analysis
- Red/yellow/green flags
- Export reports

#### Premium UI
- 639-line design system
- Dark mode support
- 3-font hierarchy (Plus Jakarta Sans/Inter/JetBrains Mono)
- Micro-interactions (150ms)
- Mobile-first responsive

#### Security
- No hardcoded credentials
- No JWT fallback secrets
- Rate limiting (10 login/15min, 100 API/15min)
- Helmet security headers
- Input sanitization
- Security audit passing

#### Testing
- Vitest test suite
- Security tests
- Cost calculator tests
- Quote analysis tests
- CI/CD pipeline (GitHub Actions)

#### Infrastructure
- Rate limiting middleware
- Request logging
- Error handling with custom error classes
- Health check endpoints
- Analytics tracking module

#### Documentation
- README with full setup guide
- API documentation
- Deployment guide
- Marketing copy
- SEO strategy
- Email templates
- Product roadmap

### Data

**Kmart Gladstone Tender Analysis:**
- Low Cost Workstream: $450,000
- Refit Workstream: $2,053,226
- Total: $2,503,226
- 31 Excel sheets extracted
- 68 unique elements
- 680 total rates with regional variations

**Sample Benchmarks:**
- LED downlight: $85/ea
- Carpenter labour: $52/hr
- Electrician labour: $85/hr
- Suspended ceiling: $28.50/m²
- Split system AC: $1,850/ea

### Technical

- React 18 + TypeScript
- Express + Drizzle ORM
- PostgreSQL (Neon)
- Vite build system
- 2MB client bundle (optimized)
- 243KB server bundle

### Security Fixes

- ✅ Removed hardcoded admin credentials
- ✅ Eliminated JWT fallback secrets
- ✅ Re-enabled rate limiting
- ✅ Added Helmet headers
- ✅ Configured CORS properly

### Known Issues

- Build warnings for large chunks (>500KB)
- No real-time collaboration yet
- Mobile PDF takeoff needs optimization

---

## [0.9.0] - 2026-03-27 - Pre-Release

### Added
- Initial security audit
- Code cleanup (26+ backup files removed)
- Viewer consolidation (15+ Forge variants → 1)

---

## [0.8.0] - 2026-03-26 - Beta

### Added
- PDF takeoff MVP
- Elemental database schema
- Quote validator prototype

---

## Roadmap

### [1.1.0] - Coming Soon
- Stripe payment integration
- Email automation
- Onboarding flow

### [1.2.0] - Q2 2026
- Tender marketplace
- Team workspaces
- Advanced reporting

### [2.0.0] - Q3 2026
- Revit/AutoCAD plugin
- Mobile app
- AI cost prediction
