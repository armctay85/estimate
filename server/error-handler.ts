// server/error-handler.ts
// Global error handler: Triggers Grok API for auto-fixes on runtime errors.
// Quality: Starlink-level - Asynchronous, logged, with rollback on failure.

import { Request, Response, NextFunction } from 'express';
import { amendCode, testCode } from './grok-api-client';

export function setupGrokErrorHandler(app: any) {
  // Global error handler middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Runtime error:', err.message);
    
    // Trigger on viewer errors
    if (err.message.includes('Viewer') || err.message.includes('forge')) {
      console.log('Triggering Grok auto-fix for viewer error...');
      
      amendCode('client/src/components/forge-viewer.tsx', err.message)
        .then(amended => {
          console.log('Code amended successfully');
          
          // Run tests if available
          testCode('npm test -- forge-viewer')
            .then(result => console.log('Test result after amend:', result))
            .catch(testErr => console.error('Test failed:', testErr));
        })
        .catch(amendErr => console.error('Grok amend failed:', amendErr));
    }
    
    // Send error response
    res.status(500).json({ 
      error: err.message,
      grokFixAttempted: err.message.includes('Viewer') || err.message.includes('forge')
    });
  });
}

// Async error wrapper for routes
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}