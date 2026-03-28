import { Request, Response, NextFunction } from 'express';

// Log levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL === 'debug' 
  ? LogLevel.DEBUG 
  : process.env.NODE_ENV === 'production' 
    ? LogLevel.WARN 
    : LogLevel.INFO;

interface LogContext {
  userId?: number;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? JSON.stringify(context) : '';
    const err = error ? `\n${error.stack}` : '';
    
    return `[${timestamp}] ${level}: ${message} ${ctx}${err}`;
  }

  debug(message: string, context?: LogContext): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context, error));
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, context, error));
    }
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context });
    }
  }
}

export const logger = new Logger();

// Express middleware for request logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Attach request ID for tracking
  (req as any).requestId = requestId;
  
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    userId: (req.user as any)?.id,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level](`Request ${res.statusCode >= 400 ? 'failed' : 'completed'}`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req.user as any)?.id,
    });
  });

  next();
}

// Error logging middleware
export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    requestId: (req as any).requestId,
    method: req.method,
    path: req.path,
    userId: (req.user as any)?.id,
    body: req.body,
    query: req.query,
  }, err);

  next(err);
}
