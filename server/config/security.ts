/**
 * Security Configuration & Environment Validation
 * 
 * Fort Knox Level Security - No hardcoded secrets, no fallbacks
 */

import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // JWT Configuration - REQUIRED, no fallbacks
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .refine((val) => !val.includes('default') && !val.includes('secret') && !val.includes('test'), {
      message: 'JWT_SECRET must not contain default, secret, or test keywords'
    }),
  
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Session Configuration - REQUIRED
  SESSION_SECRET: z.string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .refine((val) => !val.includes('default') && !val.includes('secret') && !val.includes('test'), {
      message: 'SESSION_SECRET must not contain default, secret, or test keywords'
    }),
  
  // Database - REQUIRED
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // CORS Configuration
  ALLOWED_ORIGINS: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Rate Limiting Configuration
  RATE_LIMIT_LOGIN_MAX: z.string().transform(Number).default('10'),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_API_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_API_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_UPLOAD_MAX: z.string().transform(Number).default('5'),
  RATE_LIMIT_UPLOAD_WINDOW_MS: z.string().transform(Number).default('3600000'), // 1 hour
  
  // Optional API Keys (validated if present)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  GROK_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  FORGE_CLIENT_ID: z.string().optional(),
  FORGE_CLIENT_SECRET: z.string().optional(),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

// In Vercel serverless, don't exit on validation failure - throw instead
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error('\n❌ CRITICAL SECURITY ERROR: Environment validation failed\n');
    console.error(issues);
    console.error('\n🚨 The application cannot start without proper security configuration.\n');
    console.error('Required environment variables:\n');
    console.error('  JWT_SECRET         - Min 32 chars, strong random string');
    console.error('  SESSION_SECRET     - Min 32 chars, strong random string');
    console.error('  DATABASE_URL       - PostgreSQL connection string');
    console.error('\nExample .env file:\n');
    console.error('JWT_SECRET=your-super-secret-32-char-minimum-random-string-here');
    console.error('SESSION_SECRET=another-super-secret-32-char-minimum-random-string');
    console.error('DATABASE_URL=postgresql://user:pass@localhost:5432/dbname');
    console.error('');
  }
  
  // In Vercel serverless, throw instead of exit so error is returned
  if (isVercel) {
    throw error;
  }
  process.exit(1);
}

// CORS allowed origins
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

const allowedOrigins = env.ALLOWED_ORIGINS 
  ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : defaultOrigins;

// Production origin restriction
if (env.NODE_ENV === 'production' && allowedOrigins.some(o => o.includes('localhost'))) {
  console.warn('⚠️  WARNING: localhost origins allowed in production. Set ALLOWED_ORIGINS to restrict.');
}

export const securityConfig = {
  env,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  session: {
    secret: env.SESSION_SECRET,
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  cors: {
    allowedOrigins,
    credentials: true,
  },
  rateLimits: {
    login: {
      max: env.RATE_LIMIT_LOGIN_MAX,
      windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MS,
    },
    api: {
      max: env.RATE_LIMIT_API_MAX,
      windowMs: env.RATE_LIMIT_API_WINDOW_MS,
    },
    upload: {
      max: env.RATE_LIMIT_UPLOAD_MAX,
      windowMs: env.RATE_LIMIT_UPLOAD_WINDOW_MS,
    },
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
};

export default securityConfig;
