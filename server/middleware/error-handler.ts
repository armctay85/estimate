/**
 * Error Handler Middleware
 * Centralized error handling with user-friendly messages
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, true);
    (this as any).retryAfter = retryAfter;
  }
}

// Error response structure
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  requestId?: string;
}

// Global error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId;
  
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode: string | undefined;
  let details: any;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    
    // Map to error codes
    switch (err.constructor.name) {
      case 'ValidationError':
        errorCode = 'VALIDATION_ERROR';
        break;
      case 'AuthenticationError':
        errorCode = 'AUTHENTICATION_ERROR';
        break;
      case 'AuthorizationError':
        errorCode = 'AUTHORIZATION_ERROR';
        break;
      case 'NotFoundError':
        errorCode = 'NOT_FOUND';
        break;
      case 'ConflictError':
        errorCode = 'CONFLICT';
        break;
      case 'RateLimitError':
        errorCode = 'RATE_LIMIT_EXCEEDED';
        details = { retryAfter: (err as any).retryAfter };
        break;
    }
  }

  // Log error
  logger.error(err.message, {
    requestId,
    statusCode,
    errorCode,
    stack: err.stack,
  }, err);

  // Send response
  const response: ErrorResponse = {
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : message,
      ...(errorCode && { code: errorCode }),
      ...(details && { details }),
    },
    ...(requestId && { requestId }),
  };

  res.status(statusCode).json(response);
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      code: 'NOT_FOUND',
    },
  });
}
