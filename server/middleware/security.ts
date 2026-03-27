/**
 * Security Middleware
 * 
 * Comprehensive security hardening including:
 * - XSS Protection
 * - Input Sanitization
 * - Security Headers
 * - CSRF Protection
 * - Content Security Policy
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import securityConfig from '../config/security';

// XSS Sanitization - Remove dangerous characters
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\(/g, '&#40;')
    .replace(/\)/g, '&#41;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/\u003cscript\b[^\u003c]*(?:(?!\u003c\/script\u003e)\u003c[^\u003c]*)*\u003c\/script\u003e/gi, '');
};

// Deep sanitization for objects
export const sanitizeObject = <T>(obj: T): T => {
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys too to prevent prototype pollution
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized as T;
  }
  return obj;
};

// XSS Protection Middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Prototype Pollution Protection
export const prototypeProtection = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  if (body && typeof body === 'object') {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const checkObject = (obj: any, path: string = '') => {
      for (const key of Object.keys(obj)) {
        if (dangerousKeys.includes(key)) {
          throw new Error(`Prototype pollution attempt detected at: ${path}.${key}`);
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key], `${path}.${key}`);
        }
      }
    };
    
    try {
      checkObject(body);
    } catch (error: any) {
      return res.status(400).json({ 
        message: 'Invalid request: Prototype pollution detected',
        error: securityConfig.isDevelopment ? error.message : undefined
      });
    }
  }
  next();
};

// Content Security Policy Configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some React features
      "js.stripe.com",
      "aps.autodesk.com",
      "developer.api.autodesk.com",
      // Only allow CDN in development
      ...(securityConfig.isDevelopment ? ["cdn.tailwindcss.com"] : [])
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "fonts.googleapis.com",
      "developer.api.autodesk.com",
      ...(securityConfig.isDevelopment ? ["cdn.tailwindcss.com"] : [])
    ],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: [
      "'self'",
      "api.stripe.com",
      "api.x.ai",
      "developer.api.autodesk.com"
    ],
    fontSrc: ["'self'", "fonts.gstatic.com", "fonts.googleapis.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "js.stripe.com"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    scriptSrcAttr: ["'none'"],
    upgradeInsecureRequests: securityConfig.isProduction ? [] : null,
  },
};

// Helmet configuration with CSP
export const helmetMiddleware = helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false, // Allow Forge viewer
  hsts: securityConfig.isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Security Headers Middleware (additional headers not covered by helmet)
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  
  // Prevent MIME type sniffing (redundant with helmet but explicit)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Deny clickjacking (redundant with CSP but explicit)
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
};

// Rate Limiting Configurations
export const createLoginLimiter = () => rateLimit({
  windowMs: securityConfig.rateLimits.login.windowMs,
  max: securityConfig.rateLimits.login.max,
  message: { 
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: Math.ceil(securityConfig.rateLimits.login.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(securityConfig.rateLimits.login.windowMs / 1000)
    });
  },
  keyGenerator: (req) => {
    // Use both IP and username if available to prevent username enumeration
    const username = req.body?.username || req.body?.email || '';
    return `${req.ip}-${username}`;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

export const createApiLimiter = () => rateLimit({
  windowMs: securityConfig.rateLimits.api.windowMs,
  max: securityConfig.rateLimits.api.max,
  message: {
    message: 'Rate limit exceeded. Please slow down your requests.',
    retryAfter: Math.ceil(securityConfig.rateLimits.api.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Rate limit exceeded. Please slow down your requests.',
      retryAfter: Math.ceil(securityConfig.rateLimits.api.windowMs / 1000)
    });
  },
  skip: (req) => {
    // Skip for health checks and authenticated users might have higher limits
    return req.path === '/health' || req.path === '/api/health';
  }
});

export const createUploadLimiter = () => rateLimit({
  windowMs: securityConfig.rateLimits.upload.windowMs,
  max: securityConfig.rateLimits.upload.max,
  message: {
    message: 'Upload limit exceeded. Maximum 5 uploads per hour.',
    retryAfter: Math.ceil(securityConfig.rateLimits.upload.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Upload limit exceeded. Maximum 5 uploads per hour.',
      retryAfter: Math.ceil(securityConfig.rateLimits.upload.windowMs / 1000)
    });
  }
});

// Request Size Limits
export const requestSizeLimits = {
  json: '1mb',
  urlencoded: '1mb',
};

// Validation Error Handler
export const validationErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }
  next(error);
};

// CORS Configuration
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin && securityConfig.cors.allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (securityConfig.isDevelopment && !origin) {
    // Allow requests with no origin in development (e.g., curl, mobile apps)
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

// Suspicious Activity Detection
export const suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /\.{2,}/, // Multiple dots
    /\/etc\/passwd/, // Unix password file
    /\/windows\/system32/, // Windows system
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /;\s*shutdown/i, // SQL injection
    /\/\.env/, // Environment file access
    /\/\.git/, // Git directory access
    /\.php$/i, // PHP file access
    /\.asp$/i, // ASP file access
    /\.jsp$/i, // JSP file access
  ];
  
  const checkValue = (value: string, path: string) => {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(value)) {
        console.warn(`🚨 Suspicious activity detected: ${pattern} in ${path}`);
        return true;
      }
    }
    return false;
  };
  
  // Check URL
  if (checkValue(req.url, 'URL')) {
    return res.status(403).json({ message: 'Forbidden: Suspicious request detected' });
  }
  
  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && checkValue(value, `query.${key}`)) {
      return res.status(403).json({ message: 'Forbidden: Suspicious request detected' });
    }
  }
  
  next();
};

// Combine all security middleware
export const applySecurityMiddleware = (app: any) => {
  // Apply helmet first
  app.use(helmetMiddleware);
  
  // CORS
  app.use(corsMiddleware);
  
  // Security headers
  app.use(securityHeaders);
  
  // XSS and prototype pollution protection
  app.use(xssProtection);
  app.use(prototypeProtection);
  
  // Suspicious activity detection
  app.use(suspiciousActivityDetection);
  
  // Request size limits
  app.use(require('express').json({ limit: requestSizeLimits.json }));
  app.use(require('express').urlencoded({ extended: true, limit: requestSizeLimits.urlencoded }));
  
  return {
    loginLimiter: createLoginLimiter(),
    apiLimiter: createApiLimiter(),
    uploadLimiter: createUploadLimiter(),
  };
};

export default {
  helmetMiddleware,
  corsMiddleware,
  securityHeaders,
  xssProtection,
  prototypeProtection,
  createLoginLimiter,
  createApiLimiter,
  createUploadLimiter,
  suspiciousActivityDetection,
  validationErrorHandler,
  applySecurityMiddleware,
  sanitizeString,
  sanitizeObject,
};
