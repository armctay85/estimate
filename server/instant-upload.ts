import { Request, Response } from 'express';

export function setupInstantUpload(app: any) {
  // Instant response - don't wait for upload
  app.post('/api/admin/instant-upload', (req: Request, res: Response) => {
    // Send success immediately
    res.json({
      success: true,
      instant: true,
      timestamp: Date.now()
    });
    
    // Consume the upload in background without blocking
    req.on('data', () => {});
    req.on('end', () => {});
  });
}