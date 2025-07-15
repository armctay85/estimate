/**
 * COMPLETE BACKEND INTEGRATION FOR AUTODESK FORGE
 * Enterprise-grade server implementation for BIM file processing
 * 
 * This backend provides:
 * - Complete Autodesk Platform Services (APS) integration
 * - Professional file upload and translation pipeline
 * - Real-time BIM element extraction and cost calculation
 * - Enterprise-grade authentication and error handling
 * - Production-ready rate limiting and security
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';

// =============================================================================
// ENHANCED FORGE API SERVICE
// =============================================================================

interface ForgeToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
}

interface TranslationJob {
  urn: string;
  status: 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout';
  progress: string;
  messages?: any[];
  region?: string;
}

interface BIMElementData {
  dbId: number;
  name: string;
  category: string;
  properties: any[];
  externalId?: string;
}

interface ModelMetadata {
  type: string;
  name: string;
  guid: string;
  role: string;
  status: string;
  hasThumbnail: boolean;
  children?: ModelMetadata[];
}

export class EnterpriseForgeAPI {
  private clientId: string;
  private clientSecret: string;
  private token: ForgeToken | null = null;
  private baseUrl = 'https://developer.api.autodesk.com';
  
  // Australian construction material rates (2024/2025)
  private materialRates: Record<string, number> = {
    'concrete': 165, // per m²
    'steel': 1230, // per tonne  
    'reinforcement': 2100, // per tonne
    'timber': 1650, // per m³
    'brick': 180, // per m²
    'blockwork': 95, // per m²
    'glass': 400, // per m²
    'aluminum': 85, // per m²
    'plasterboard': 35, // per m²
    'insulation': 25, // per m²
    'roofing': 80, // per m²
    'flooring': 70, // per m²
    'tiles': 70, // per m²
    'paint': 15, // per m²
    'electrical': 75, // per point
    'plumbing': 65, // per fixture
    'hvac': 185, // per m²
    'fire_services': 45 // per m²
  };

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  // Get or refresh access token
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Return existing token if still valid (with 5-minute buffer)
    if (this.token && this.token.expires_at && this.token.expires_at > now + 300000) {
      return this.token.access_token;
    }

    try {
      const tokenData = new FormData();
      tokenData.append('client_id', this.clientId);
      tokenData.append('client_secret', this.clientSecret);
      tokenData.append('grant_type', 'client_credentials');
      tokenData.append('scope', 'data:read data:write data:create bucket:create bucket:read bucket:update bucket:delete');

      const response = await axios.post(
        `${this.baseUrl}/authentication/v2/token`,
        tokenData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...tokenData.getHeaders()
          },
          timeout: 30000
        }
      );

      this.token = {
        ...response.data,
        expires_at: now + (response.data.expires_in * 1000)
      };

      console.log('✅ Forge authentication successful');
      return this.token.access_token;

    } catch (error: any) {
      console.error('❌ Forge authentication failed:', error.response?.data || error.message);
      throw new Error(`Forge authentication failed: ${error.response?.data?.developerMessage || error.message}`);
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
      
      console.log(`✅ Bucket ${bucketKey} exists`);
      
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
          
          console.log(`✅ Created bucket ${bucketKey}`);
          
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

  // Upload file to Forge
  async uploadFile(bucketKey: string, objectName: string, filePath: string): Promise<string> {
    const token = await this.getAccessToken();
    
    try {
      // Get file size for upload
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      console.log(`📤 Uploading ${objectName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

      // For large files (>100MB), use resumable upload
      if (fileSize > 100 * 1024 * 1024) {
        return await this.resumableUpload(bucketKey, objectName, filePath, token);
      }

      // Simple upload for smaller files
      const fileStream = fs.createReadStream(filePath);
      const formData = new FormData();
      formData.append('file', fileStream);

      const response = await axios.put(
        `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectName}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileSize.toString(),
            ...formData.getHeaders()
          },
          timeout: 600000, // 10 minutes for large files
          maxContentLength: 500 * 1024 * 1024, // 500MB max
          maxBodyLength: 500 * 1024 * 1024
        }
      );

      const urn = Buffer.from(response.data.objectId).toString('base64');
      console.log(`✅ Upload successful, URN: ${urn}`);
      
      return urn;

    } catch (error: any) {
      console.error('❌ File upload failed:', error.response?.data || error.message);
      throw new Error(`File upload failed: ${error.response?.data?.reason || error.message}`);
    }
  }

  // Resumable upload for large files
  private async resumableUpload(bucketKey: string, objectName: string, filePath: string, token: string): Promise<string> {
    const fileSize = fs.statSync(filePath).size;
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    let uploadedBytes = 0;

    console.log(`🔄 Starting resumable upload in ${Math.ceil(fileSize / chunkSize)} chunks`);

    // Start resumable upload
    const startResponse = await axios.post(
      `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectName}/resumable`,
      { chunkSize: chunkSize },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const uploadKey = startResponse.data.uploadKey;
    const fileStream = fs.createReadStream(filePath);

    // Upload chunks
    let chunkIndex = 0;
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      fileStream.on('data', async (chunk: Buffer) => {
        chunks.push(chunk);
        
        if (chunks.length * chunkSize >= chunkSize || uploadedBytes + chunk.length >= fileSize) {
          const chunkData = Buffer.concat(chunks);
          chunks.length = 0;
          
          try {
            const range = `bytes ${uploadedBytes}-${uploadedBytes + chunkData.length - 1}/${fileSize}`;
            
            await axios.put(
              `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectName}/resumable`,
              chunkData,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/octet-stream',
                  'Content-Range': range,
                  'Session-Id': uploadKey
                }
              }
            );
            
            uploadedBytes += chunkData.length;
            console.log(`📤 Uploaded chunk ${chunkIndex + 1}: ${((uploadedBytes / fileSize) * 100).toFixed(1)}%`);
            chunkIndex++;
            
          } catch (error: any) {
            reject(new Error(`Chunk upload failed: ${error.response?.data?.reason || error.message}`));
          }
        }
      });

      fileStream.on('end', async () => {
        try {
          // Complete upload
          const response = await axios.post(
            `${this.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectName}/resumable`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Session-Id': uploadKey
              }
            }
          );

          const urn = Buffer.from(response.data.objectId).toString('base64');
          resolve(urn);
          
        } catch (error: any) {
          reject(new Error(`Upload completion failed: ${error.response?.data?.reason || error.message}`));
        }
      });

      fileStream.on('error', (error) => {
        reject(new Error(`File read error: ${error.message}`));
      });
    });
  }

  // Start model translation
  async translateModel(urn: string, outputFormat: string = 'svf2'): Promise<void> {
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
            type: outputFormat,
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
        status: manifest.status,
        progress: manifest.progress || '0%',
        messages: manifest.messages || [],
        region: manifest.region
      };

    } catch (error: any) {
      console.error('❌ Failed to get translation status:', error.response?.data || error.message);
      throw new Error(`Status check failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Get model metadata
  async getModelMetadata(urn: string): Promise<ModelMetadata[]> {
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

  // Extract BIM elements and calculate costs
  async extractBIMElements(urn: string, modelGuid: string): Promise<{ elements: BIMElementData[], totalCost: number }> {
    const token = await this.getAccessToken();
    
    try {
      // Get object tree
      const treeResponse = await axios.get(
        `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/metadata/${modelGuid}/properties`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 30000
        }
      );

      const objectTree = treeResponse.data.data.collection;
      const elements: BIMElementData[] = [];
      let totalCost = 0;

      // Process each object in the tree
      for (const obj of objectTree) {
        if (obj.objectid && obj.name) {
          // Get detailed properties for cost calculation
          const element: BIMElementData = {
            dbId: obj.objectid,
            name: obj.name,
            category: this.extractCategory(obj.properties),
            properties: obj.properties || [],
            externalId: obj.externalId
          };

          // Calculate cost based on properties
          const cost = this.calculateElementCost(obj.properties);
          totalCost += cost;
          
          elements.push(element);
        }
      }

      console.log(`✅ Extracted ${elements.length} elements, Total cost: $${totalCost.toLocaleString()}`);
      
      return { elements, totalCost };

    } catch (error: any) {
      console.error('❌ Failed to extract BIM elements:', error.response?.data || error.message);
      throw new Error(`Element extraction failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  // Extract category from properties
  private extractCategory(properties: any[]): string {
    if (!properties) return 'Unknown';
    
    const categoryProp = properties.find(p => 
      p.displayName === 'Category' || 
      p.displayName === 'Family' ||
      p.displayName === 'Type'
    );
    
    return categoryProp?.displayValue || 'Unknown';
  }

  // Calculate element cost using Australian rates
  private calculateElementCost(properties: any[]): number {
    if (!properties) return 0;

    // Helper to find property by name
    const getProp = (name: string) => properties.find(p => p.displayName === name)?.displayValue;
    
    // Get key measurements
    const volume = parseFloat(getProp('Volume')) || 0;
    const area = parseFloat(getProp('Area')) || 0;
    const length = parseFloat(getProp('Length')) || 0;
    const material = (getProp('Material') || getProp('Type Name') || 'concrete').toLowerCase();
    
    // Determine material category and rate
    let materialKey = 'concrete'; // default
    const materialLower = material.toLowerCase();
    
    if (materialLower.includes('steel') || materialLower.includes('metal')) {
      materialKey = 'steel';
    } else if (materialLower.includes('timber') || materialLower.includes('wood')) {
      materialKey = 'timber';
    } else if (materialLower.includes('brick')) {
      materialKey = 'brick';
    } else if (materialLower.includes('glass')) {
      materialKey = 'glass';
    } else if (materialLower.includes('aluminum') || materialLower.includes('aluminium')) {
      materialKey = 'aluminum';
    } else if (materialLower.includes('plaster')) {
      materialKey = 'plasterboard';
    } else if (materialLower.includes('roof') || materialLower.includes('tile')) {
      materialKey = 'roofing';
    } else if (materialLower.includes('floor') || materialLower.includes('carpet')) {
      materialKey = 'flooring';
    }

    const rate = this.materialRates[materialKey] || 200;
    
    // Calculate cost based on available measurements
    let cost = 0;
    if (volume > 0) {
      cost = volume * rate;
    } else if (area > 0) {
      cost = area * rate;
    } else if (length > 0) {
      cost = length * (rate / 10); // Rough linear rate
    } else {
      cost = rate; // Flat rate for elements without measurements
    }

    return Math.round(cost);
  }
}

// =============================================================================
// EXPRESS ROUTES SETUP
// =============================================================================

export function setupEnterpriseForgeRoutes(app: express.Application) {
  // Rate limiting for file uploads
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 uploads per window
    message: { error: 'Too many upload attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Sanitize filename and add timestamp
      const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      cb(null, `${timestamp}_${sanitized}`);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['.rvt', '.ifc', '.dwg', '.dxf', '.nwd', '.fbx', '.f3d'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file format: ${fileExtension}`));
      }
    }
  });

  // Initialize Forge API
  const forgeAPI = new EnterpriseForgeAPI(
    process.env.FORGE_CLIENT_ID!,
    process.env.FORGE_CLIENT_SECRET!
  );

  // Get Forge access token
  app.post('/api/forge/token', async (req: Request, res: Response) => {
    try {
      const token = await forgeAPI.getAccessToken();
      res.json({ 
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600
      });
    } catch (error: any) {
      console.error('Token generation failed:', error.message);
      res.status(500).json({ 
        error: 'Authentication failed',
        message: error.message 
      });
    }
  });

  // Upload BIM file
  app.post('/api/forge/upload-bim', uploadLimiter, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, filename, path: filePath, size } = req.file;
      
      console.log(`📁 Processing upload: ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);

      // Generate bucket key (sanitized and unique)
      const bucketKey = `estimate-bim-${Date.now()}`.toLowerCase();
      
      // Ensure bucket exists
      await forgeAPI.ensureBucket(bucketKey);
      
      // Upload file to Forge
      const urn = await forgeAPI.uploadFile(bucketKey, filename, filePath);
      
      // Start translation
      await forgeAPI.translateModel(urn, 'svf2');
      
      // Clean up local file
      fs.unlinkSync(filePath);
      
      res.json({
        urn,
        bucketKey,
        objectName: filename,
        originalName: originalname,
        fileSize: size,
        message: 'File uploaded and translation started'
      });

    } catch (error: any) {
      console.error('Upload failed:', error.message);
      
      // Clean up file on error
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      
      res.status(500).json({ 
        error: 'Upload failed',
        message: error.message 
      });
    }
  });

  // Start translation job
  app.post('/api/forge/translate', async (req: Request, res: Response) => {
    try {
      const { urn, outputFormat = 'svf2' } = req.body;
      
      if (!urn) {
        return res.status(400).json({ error: 'URN is required' });
      }

      await forgeAPI.translateModel(urn, outputFormat);
      
      res.json({ 
        message: 'Translation job started',
        urn,
        outputFormat 
      });

    } catch (error: any) {
      console.error('Translation failed:', error.message);
      res.status(500).json({ 
        error: 'Translation failed',
        message: error.message 
      });
    }
  });

  // Get translation status
  app.get('/api/forge/status/:urn', async (req: Request, res: Response) => {
    try {
      const { urn } = req.params;
      const status = await forgeAPI.getTranslationStatus(urn);
      res.json(status);

    } catch (error: any) {
      console.error('Status check failed:', error.message);
      res.status(500).json({ 
        error: 'Status check failed',
        message: error.message 
      });
    }
  });

  // Get model metadata
  app.get('/api/forge/metadata/:urn', async (req: Request, res: Response) => {
    try {
      const { urn } = req.params;
      const metadata = await forgeAPI.getModelMetadata(urn);
      res.json({ data: metadata });

    } catch (error: any) {
      console.error('Metadata retrieval failed:', error.message);
      res.status(500).json({ 
        error: 'Metadata retrieval failed',
        message: error.message 
      });
    }
  });

  // Extract BIM elements and costs
  app.get('/api/forge/extract/:urn', async (req: Request, res: Response) => {
    try {
      const { urn } = req.params;
      const { modelGuid } = req.query;
      
      if (!modelGuid) {
        // Get first available model
        const metadata = await forgeAPI.getModelMetadata(urn);
        const firstModel = metadata.find(m => m.role === '3d') || metadata[0];
        
        if (!firstModel) {
          return res.status(404).json({ error: 'No 3D model found' });
        }
        
        const result = await forgeAPI.extractBIMElements(urn, firstModel.guid);
        return res.json({
          elements: result.elements,
          totalCost: result.totalCost,
          metadata: firstModel
        });
      }

      const result = await forgeAPI.extractBIMElements(urn, modelGuid as string);
      res.json({
        elements: result.elements,
        totalCost: result.totalCost
      });

    } catch (error: any) {
      console.error('Element extraction failed:', error.message);
      res.status(500).json({ 
        error: 'Element extraction failed',
        message: error.message 
      });
    }
  });

  console.log('✅ Enterprise Forge API routes configured');
}

export default EnterpriseForgeAPI;