/**
 * GROK'S SOLUTION: Fixed BIM Upload with Proper Multer Configuration
 * Resolves multer middleware conflicts that were preventing file uploads
 */

import type { Express, Request, Response } from "express";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { 
  authenticateForge, 
  ensureBucket, 
  uploadBIMFile, 
  translateBIMFile, 
  getTranslationStatus,
  getViewerToken 
} from './forge-real-integration';

// Fixed multer configuration with proper file handling
const bimUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.rvt', '.ifc', '.dwg', '.dxf'];
    const fileName = file.originalname.toLowerCase();
    const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .rvt, .ifc, .dwg, .dxf files are allowed.'));
    }
  }
});

export function setupBIMUploadFix(app: Express) {
  console.log('Setting up fixed BIM upload routes...');

  /**
   * FIXED: BIM file upload endpoint
   * Key fixes from Grok's analysis:
   * 1. Dedicated multer instance without conflicts
   * 2. Proper field name matching frontend ('bimFile')
   * 3. File cleanup after processing
   * 4. No global express.json() interference
   */
  app.post('/api/forge/upload-bim', bimUpload.single('bimFile'), async (req: Request, res: Response) => {
    try {
      console.log('BIM upload endpoint hit');
      console.log('Request file:', req.file ? 'File received' : 'No file');
      console.log('Request body:', req.body);
      
      if (!req.file) {
        console.error('No file uploaded - multer failed to parse');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, path: filePath } = req.file;
      console.log(`Processing BIM file: ${originalname} at ${filePath}`);
      
      try {
        // Upload to Forge
        const objectId = await uploadBIMFile(filePath, originalname);
        console.log('Uploaded to Forge, objectId:', objectId);
        
        // Start translation
        const urn = await translateBIMFile(objectId);
        console.log('Translation started, URN:', urn);
        
        // Clean up local file
        fs.unlinkSync(filePath);
        
        res.json({
          success: true,
          objectId,
          urn,
          fileName: originalname,
          message: 'File uploaded successfully. Translation in progress.'
        });
        
      } catch (forgeError: any) {
        console.error('Forge processing error:', forgeError);
        // Clean up file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: `Forge processing failed: ${forgeError.message}` });
      }
      
    } catch (error: any) {
      console.error('BIM upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get viewer token for 3D display
   */
  app.get('/api/forge/viewer-token', async (req: Request, res: Response) => {
    try {
      const token = await getViewerToken();
      res.json({ access_token: token });
    } catch (error: any) {
      console.error('Viewer token error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Check translation status
   */
  app.get('/api/forge/translation-status', async (req: Request, res: Response) => {
    const { urn } = req.query;
    
    if (!urn || typeof urn !== 'string') {
      return res.status(400).json({ error: 'URN parameter required' });
    }
    
    try {
      const status = await getTranslationStatus(urn);
      res.json(status);
    } catch (error: any) {
      console.error('Translation status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Test endpoint to verify Forge authentication
   */
  app.get('/api/forge/test-auth', async (req: Request, res: Response) => {
    try {
      const token = await authenticateForge();
      res.json({ 
        success: true, 
        message: 'Forge authentication working',
        tokenReceived: !!token 
      });
    } catch (error: any) {
      console.error('Forge auth test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  console.log('Fixed BIM upload routes configured successfully');
}