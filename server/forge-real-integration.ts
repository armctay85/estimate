/**
 * REAL AUTODESK FORGE INTEGRATION - COMPLETE BACKEND
 * Production-ready Forge API implementation with proper error handling
 * Addresses the issue of basic geometric shapes instead of real BIM models
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

interface ForgeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TranslationJob {
  urn: string;
  status: 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout';
  progress: string;
  messages?: any[];
}

interface BIMElement {
  id: string;
  name: string;
  category: string;
  properties: Record<string, any>;
  cost: number;
  material: string;
  quantity: number;
  unit: string;
}

export class RealForgeAPI {
  private clientId: string;
  private clientSecret: string;
  private token: ForgeTokenResponse | null = null;
  private tokenExpiry: Date | null = null;
  private baseUrl = 'https://developer.api.autodesk.com';

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  // Get or refresh access token
  async getAccessToken(): Promise<string> {
    const now = new Date();
    
    // Return existing token if still valid (with 5-minute buffer)
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date(now.getTime() + 300000)) {
      return this.token.access_token;
    }

    try {
      const formData = new FormData();
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      formData.append('grant_type', 'client_credentials');
      formData.append('scope', 'data:read data:write data:create bucket:create bucket:read bucket:update bucket:delete');

      const response = await axios.post(
        `${this.baseUrl}/authentication/v2/token`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...formData.getHeaders()
          },
          timeout: 30000
        }
      );

      this.token = response.data;
      this.tokenExpiry = new Date(now.getTime() + (response.data.expires_in * 1000));

      console.log('✅ Real Forge authentication successful');
      return this.token.access_token;

    } catch (error: any) {
      console.error('❌ Real Forge authentication failed:', error.response?.data || error.message);
      throw new Error(`Forge authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  // Create or ensure bucket exists
  async ensureBucket(bucketKey: string): Promise<void> {
    const token = await this.getAccessToken();
    
    try {
      // Try to get bucket details first
      await axios.get(`${this.baseUrl}/oss/v2/buckets/${bucketKey}/details`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });
      
      console.log(`✅ Bucket ${bucketKey} already exists`);
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Bucket doesn't exist, create it
        try {
          await axios.post(`${this.baseUrl}/oss/v2/buckets`, {
            bucketKey: bucketKey,
            policyKey: 'temporary', // Files auto-deleted after 24 hours
            access: 'full'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });
          
          console.log(`✅ Created new bucket ${bucketKey}`);
          
        } catch (createError: any) {
          console.error('❌ Failed to create bucket:', createError.response?.data || createError.message);
          throw new Error(`Failed to create bucket: ${createError.response?.data?.reason || createError.message}`);
        }
      } else {
        console.error('❌ Failed to check bucket:', error.response?.data || error.message);
        throw new Error(`Failed to access bucket: ${error.response?.data?.reason || error.message}`);
      }
    }
  }

  // Upload file to Forge OSS
  async uploadFile(bucketKey: string, objectName: string, fileBuffer: Buffer): Promise<string> {
    const token = await this.getAccessToken();
    
    try {
      console.log(`📤 Uploading ${objectName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

      const response = await axios.put(
        `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectName)}`,
        fileBuffer,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileBuffer.length.toString()
          },
          timeout: 300000, // 5 minutes for uploads
          maxContentLength: 500 * 1024 * 1024, // 500MB max
          maxBodyLength: 500 * 1024 * 1024
        }
      );

      // Create base64 URN from objectId
      const urn = Buffer.from(response.data.objectId).toString('base64');
      console.log(`✅ Upload successful, URN: ${urn}`);
      
      return urn;

    } catch (error: any) {
      console.error('❌ File upload failed:', error.response?.data || error.message);
      throw new Error(`File upload failed: ${error.response?.data?.reason || error.message}`);
    }
  }

  // Start model translation to SVF2
  async translateModel(urn: string): Promise<void> {
    const token = await this.getAccessToken();
    
    try {
      const translationData = {
        input: {
          urn: urn,
          compressedUrn: true,
          rootFilename: ''
        },
        output: {
          formats: [{
            type: 'svf2',
            views: ['2d', '3d']
          }]
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/modelderivative/v2/designdata/job`,
        translationData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-ads-force': 'true' // Force re-translation if needed
          },
          timeout: 30000
        }
      );

      console.log(`✅ Translation job started for URN: ${urn}`);
      
    } catch (error: any) {
      console.error('❌ Translation job failed:', error.response?.data || error.message);
      throw new Error(`Translation failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Get translation status
  async getTranslationStatus(urn: string): Promise<TranslationJob> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000
        }
      );

      const manifest = response.data;
      
      return {
        urn,
        status: manifest.status === 'success' ? 'success' : 
                manifest.status === 'failed' ? 'failed' : 
                manifest.progress === 'complete' ? 'success' : 'inprogress',
        progress: manifest.progress || '0% complete',
        messages: manifest.messages || []
      };

    } catch (error: any) {
      console.error('❌ Failed to get translation status:', error.response?.data || error.message);
      throw new Error(`Status check failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Get model metadata
  async getModelMetadata(urn: string): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/metadata`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000
        }
      );

      return response.data.data.metadata;

    } catch (error: any) {
      console.error('❌ Failed to get metadata:', error.response?.data || error.message);
      throw new Error(`Metadata retrieval failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Extract BIM elements with real cost calculation
  async extractBIMElements(urn: string): Promise<{ elements: BIMElement[], totalCost: number }> {
    const token = await this.getAccessToken();
    
    try {
      // Get metadata first to find 3D viewable
      const metadata = await this.getModelMetadata(urn);
      const view3d = metadata.find((m: any) => m.role === '3d');
      
      if (!view3d) {
        throw new Error('No 3D viewable found in the model');
      }

      // Get bulk properties
      const propsResponse = await axios.get(
        `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/metadata/${view3d.guid}/properties`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 30000
        }
      );

      const properties = propsResponse.data.data.collection;
      const elements: BIMElement[] = [];
      let totalCost = 0;

      // Australian construction rates
      const materialRates: Record<string, number> = {
        'concrete': 165, // per m²
        'steel': 1230, // per tonne
        'timber': 1650, // per m³
        'brick': 180, // per m²
        'glass': 400, // per m²
        'aluminum': 85, // per m²
        'plasterboard': 35, // per m²
        'roofing': 80, // per m²
        'flooring': 70 // per m²
      };

      // Process each object
      for (const obj of properties) {
        if (obj.objectid && obj.name && obj.properties) {
          // Extract key properties
          const category = this.getPropertyValue(obj.properties, 'Category') || 'Unknown';
          const material = this.getPropertyValue(obj.properties, 'Material') || 
                          this.getPropertyValue(obj.properties, 'Type Name') || 'concrete';
          const volume = parseFloat(this.getPropertyValue(obj.properties, 'Volume')) || 0;
          const area = parseFloat(this.getPropertyValue(obj.properties, 'Area')) || 0;
          const length = parseFloat(this.getPropertyValue(obj.properties, 'Length')) || 0;

          // Calculate cost based on material and measurements
          const materialKey = material.toLowerCase();
          let rate = materialRates.concrete; // default
          
          if (materialKey.includes('steel')) rate = materialRates.steel;
          else if (materialKey.includes('timber') || materialKey.includes('wood')) rate = materialRates.timber;
          else if (materialKey.includes('brick')) rate = materialRates.brick;
          else if (materialKey.includes('glass')) rate = materialRates.glass;
          else if (materialKey.includes('aluminum')) rate = materialRates.aluminum;
          else if (materialKey.includes('plaster')) rate = materialRates.plasterboard;
          else if (materialKey.includes('roof')) rate = materialRates.roofing;
          else if (materialKey.includes('floor')) rate = materialRates.flooring;
          else rate = materialRates[materialKey] || materialRates.concrete;

          let cost = 0;
          let quantity = 0;
          let unit = 'ea';

          if (volume > 0) {
            cost = volume * rate;
            quantity = volume;
            unit = 'm³';
          } else if (area > 0) {
            cost = area * rate;
            quantity = area;
            unit = 'm²';
          } else if (length > 0) {
            cost = length * (rate / 10);
            quantity = length;
            unit = 'm';
          } else {
            cost = rate;
            quantity = 1;
            unit = 'ea';
          }

          const element: BIMElement = {
            id: obj.objectid.toString(),
            name: obj.name,
            category,
            properties: obj.properties,
            cost: Math.round(cost),
            material,
            quantity: Math.round(quantity * 100) / 100,
            unit
          };

          elements.push(element);
          totalCost += cost;
        }
      }

      console.log(`✅ Extracted ${elements.length} real BIM elements, Total cost: $${Math.round(totalCost).toLocaleString()}`);
      
      return { 
        elements, 
        totalCost: Math.round(totalCost) 
      };

    } catch (error: any) {
      console.error('❌ Failed to extract BIM elements:', error.response?.data || error.message);
      throw new Error(`Element extraction failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Helper to get property value by display name
  private getPropertyValue(properties: any, displayName: string): string {
    for (const category of Object.values(properties)) {
      if (typeof category === 'object' && category !== null) {
        for (const [key, value] of Object.entries(category as any)) {
          if (key === displayName && value && typeof value === 'object' && 'displayValue' in value) {
            return (value as any).displayValue;
          }
        }
      }
    }
    return '';
  }
}

// Express routes for real Forge integration
export function setupRealForgeRoutes(app: express.Application) {
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per window
    message: { error: 'Too many upload attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['.rvt', '.ifc', '.dwg', '.dxf', '.nwd', '.fbx'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file format: ${fileExtension}. Supported: ${allowedExtensions.join(', ')}`));
      }
    }
  });

  // Initialize Real Forge API
  const realForgeAPI = new RealForgeAPI(
    process.env.FORGE_CLIENT_ID!,
    process.env.FORGE_CLIENT_SECRET!
  );

  // Get Forge access token
  app.post('/api/forge-real/token', async (req: Request, res: Response) => {
    try {
      const token = await realForgeAPI.getAccessToken();
      res.json({ 
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600
      });
    } catch (error: any) {
      console.error('Real token generation failed:', error.message);
      res.status(500).json({ 
        error: 'Real Forge authentication failed',
        message: error.message,
        details: 'Check FORGE_CLIENT_ID and FORGE_CLIENT_SECRET environment variables'
      });
    }
  });

  // Upload real BIM file
  app.post('/api/forge-real/upload-bim', uploadLimiter, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No BIM file uploaded' });
      }

      const { originalname, buffer, size } = req.file;
      
      console.log(`📁 Processing real BIM upload: ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);

      // Generate unique bucket key
      const bucketKey = `estimate-real-${Date.now()}`.toLowerCase();
      
      // Ensure bucket exists
      await realForgeAPI.ensureBucket(bucketKey);
      
      // Upload file to Forge
      const urn = await realForgeAPI.uploadFile(bucketKey, originalname, buffer);
      
      // Start translation immediately
      await realForgeAPI.translateModel(urn);
      
      res.json({
        urn,
        bucketKey,
        objectName: originalname,
        originalName: originalname,
        fileSize: size,
        message: 'Real BIM file uploaded and translation started',
        uploadType: 'REAL_FORGE_INTEGRATION'
      });

    } catch (error: any) {
      console.error('Real upload failed:', error.message);
      res.status(500).json({ 
        error: 'Real BIM upload failed',
        message: error.message,
        uploadType: 'REAL_FORGE_INTEGRATION'
      });
    }
  });

  // Get real translation status
  app.get('/api/forge-real/status/:urn', async (req: Request, res: Response) => {
    try {
      const { urn } = req.params;
      const status = await realForgeAPI.getTranslationStatus(urn);
      res.json(status);

    } catch (error: any) {
      console.error('Real status check failed:', error.message);
      res.status(500).json({ 
        error: 'Real status check failed',
        message: error.message 
      });
    }
  });

  // Get real model metadata
  app.get('/api/forge-real/metadata/:urn', async (req: Request, res: Response) => {
    try {
      const { urn } = req.params;
      const metadata = await realForgeAPI.getModelMetadata(urn);
      res.json({ data: metadata });

    } catch (error: any) {
      console.error('Real metadata retrieval failed:', error.message);
      res.status(500).json({ 
        error: 'Real metadata retrieval failed',
        message: error.message 
      });
    }
  });

  // Extract real BIM elements and costs
  app.get('/api/forge-real/extract/:urn', async (req: Request, res: Response) => {
    try {
      const { urn } = req.params;
      const result = await realForgeAPI.extractBIMElements(urn);
      
      res.json({
        elements: result.elements,
        totalCost: result.totalCost,
        extractionType: 'REAL_BIM_DATA',
        elementCount: result.elements.length
      });

    } catch (error: any) {
      console.error('Real element extraction failed:', error.message);
      res.status(500).json({ 
        error: 'Real element extraction failed',
        message: error.message 
      });
    }
  });

  console.log('✅ Real Forge API routes configured successfully');
}

export default RealForgeAPI;