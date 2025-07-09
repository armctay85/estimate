# BuildCost Sketch - Replit Project Guide

## Overview

BuildCost Sketch is a web-based mini take-off tool for property and construction projects in Australia. The application allows users to sketch simple floor plans, assign floor materials to rooms, and get quick cost estimates for renovation projects. It features a freemium model with basic functionality for free users and advanced features for paid subscribers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Canvas**: Fabric.js for drawing and manipulating floor plan sketches
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using sessions
- **Session Management**: Express sessions with PostgreSQL store
- **Password Security**: bcryptjs for password hashing
- **API Design**: RESTful endpoints with JSON responses

### Database Layer
- **Database**: PostgreSQL (fully configured and operational)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations (schema pushed successfully)
- **Connection**: Neon Database serverless driver for PostgreSQL
- **Storage**: DatabaseStorage implementation active (replaces MemStorage)

## Key Components

### Authentication System
- Local username/email and password authentication
- Session-based authentication with secure cookies
- User registration and login flows
- Password hashing with bcryptjs
- User roles and subscription tiers (free, pro, premium)

### Canvas Drawing System
- Fabric.js integration for interactive floor plan sketching
- Room creation with rectangular shapes only (for simplicity)
- Material assignment per room with visual indicators
- Real-time cost calculations based on area and material costs
- Room selection and editing capabilities

### Subscription Management
- Stripe integration for payment processing
- Three-tier system: Free (3 projects/month), Pro ($9.99/month), Premium ($19.99/month)
- Feature gating based on subscription tier
- Customer and subscription management through Stripe

### Material Cost Database
- Hardcoded Australian material costs (2024/2025 data):
  - Timber: $100/sqm
  - Carpet: $40/sqm
  - Tiles: $60/sqm
  - Laminate: $30/sqm
  - Vinyl: $25/sqm
- Color-coded material representation
- Cost calculation engine

## Data Flow

### Project Creation Flow
1. User authenticates and accesses the main canvas
2. User draws rectangular rooms using Fabric.js canvas
3. Each room is assigned a material type and labeled
4. Cost calculations happen in real-time based on room area × material cost
5. Project data is saved to PostgreSQL with room details as JSON

### Authentication Flow
1. User submits login/registration form
2. Passport.js validates credentials against PostgreSQL
3. Session is created and stored in database
4. Frontend receives user object and subscription details
5. UI adapts based on user's subscription tier

### Payment Flow
1. User selects subscription tier on `/subscribe` page
2. Stripe Payment Element handles payment collection
3. Webhook processes successful payments
4. User subscription tier is updated in database
5. Feature access is immediately available

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure
- Supports subscription management, customer creation, and webhook processing
- Configured for Australian market

### Database Hosting
- **Neon Database**: Serverless PostgreSQL hosting
- Provides connection pooling and automatic scaling
- Environment variable: `DATABASE_URL`

### UI Components
- **shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling framework

### Development Tools
- **Replit**: Hosting and development environment
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack

## Deployment Strategy

### Environment Configuration
- Development: Local development with Vite dev server
- Production: Built with `npm run build` and served by Express
- Environment variables for database connection and Stripe keys
- Session secrets and security configuration

### Build Process
1. Frontend builds to `dist/public` using Vite
2. Backend builds to `dist` using esbuild
3. Static files served by Express in production
4. Database migrations run via `npm run db:push`

### Security Considerations
- HTTPS enforcement in production
- Secure session configuration with proper cookie settings
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS configuration for API endpoints

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── dist/           # Production build output
```

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, making it maintainable and scalable for the Australian construction market.