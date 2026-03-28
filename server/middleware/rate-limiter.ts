import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Rate limit storage (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

// Default rate limits by tier
export const RATE_LIMITS = {
  // Authentication endpoints
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 per 15 min
  
  // API endpoints
  api: {
    free: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    pro: { windowMs: 15 * 60 * 1000, maxRequests: 1000 },
    enterprise: { windowMs: 15 * 60 * 1000, maxRequests: 10000 },
  },
  
  // File uploads
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
  
  // Cost database queries
  costDb: {
    free: { windowMs: 60 * 1000, maxRequests: 30 },
    pro: { windowMs: 60 * 1000, maxRequests: 300 },
    enterprise: { windowMs: 60 * 1000, maxRequests: 3000 },
  },
};

export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${config.keyPrefix || 'default'}:${req.ip}`;
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    // Reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }
    
    // Check limit
    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }
    
    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    
    next();
  };
}

// Tier-based rate limiter
export function tieredRateLimiter(
  freeConfig: RateLimitConfig,
  proConfig: RateLimitConfig,
  enterpriseConfig: RateLimitConfig
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const tier = user?.subscriptionTier || 'free';
    
    let config: RateLimitConfig;
    switch (tier) {
      case 'pro':
      case 'pro_plus':
        config = proConfig;
        break;
      case 'enterprise':
        config = enterpriseConfig;
        break;
      default:
        config = freeConfig;
    }
    
    return createRateLimiter({ ...config, keyPrefix: tier })(req, res, next);
  };
}

// Specific limiters
export const authRateLimiter = createRateLimiter({
  ...RATE_LIMITS.auth,
  keyPrefix: 'auth',
});

export const uploadRateLimiter = createRateLimiter({
  ...RATE_LIMITS.upload,
  keyPrefix: 'upload',
});

export const apiRateLimiter = tieredRateLimiter(
  { ...RATE_LIMITS.api.free, keyPrefix: 'api' },
  { ...RATE_LIMITS.api.pro, keyPrefix: 'api' },
  { ...RATE_LIMITS.api.enterprise, keyPrefix: 'api' }
);

export const costDbRateLimiter = tieredRateLimiter(
  { ...RATE_LIMITS.costDb.free, keyPrefix: 'costdb' },
  { ...RATE_LIMITS.costDb.pro, keyPrefix: 'costdb' },
  { ...RATE_LIMITS.costDb.enterprise, keyPrefix: 'costdb' }
);

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);
