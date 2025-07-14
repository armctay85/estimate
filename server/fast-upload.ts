import { Request, Response } from 'express';
import Busboy from 'busboy';
import { Readable } from 'stream';

export function setupFastUpload(app: any) {
  // Ultra-fast streaming upload endpoint
  app.post('/api/admin/fast-upload', (req: Request, res: Response) => {
    const startTime = Date.now();
    let fileSize = 0;
    let fileName = '';
    
    // Set immediate headers
    res.setHeader('X-Upload-Start', startTime.toString());
    
    const busboy = Busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 1
      }
    });
    
    busboy.on('file', (fieldname: string, file: Readable, info: any) => {
      fileName = info.filename;
      
      // Just consume the stream without storing
      file.on('data', (chunk: Buffer) => {
        fileSize += chunk.length;
      });
      
      file.on('end', () => {
        const duration = Date.now() - startTime;
        const speedMBps = (fileSize / duration * 1000) / (1024 * 1024);
        
        // Send immediate response
        res.json({
          success: true,
          file: {
            name: fileName,
            size: fileSize,
            type: info.mimeType || 'application/octet-stream'
          },
          performance: {
            uploadTime: duration / 1000, // seconds
            speed: speedMBps, // MB/s
            instant: true
          }
        });
      });
      
      file.on('error', (err: Error) => {
        res.status(500).json({ error: err.message });
      });
    });
    
    busboy.on('error', (err: Error) => {
      res.status(500).json({ error: err.message });
    });
    
    // Pipe request to busboy
    req.pipe(busboy);
  });
}