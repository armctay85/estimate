import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import multer from "multer";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertRoomSchema, MATERIALS } from "@shared/schema";

// Initialize Stripe only if the secret is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      subscriptionTier: string;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      projectsThisMonth: number;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve standalone HTML application
  app.get('/standalone.html', (req, res) => {
    res.sendFile('standalone.html', { root: '.' });
  });
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPG, PNG, SVG, and PDF files are allowed.'));
      }
    }
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      res.json({ message: 'User created successfully', userId: user.id });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'Login successful' });
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Project routes
  app.get('/api/projects', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      await storage.resetUserProjectsIfNeeded(req.user!.id);
      const projects = await storage.getUserProjects(req.user!.id);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/projects', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      await storage.resetUserProjectsIfNeeded(req.user!.id);
      const user = await storage.getUser(req.user!.id);
      
      if (user!.subscriptionTier === 'free' && user!.projectsThisMonth >= 3) {
        return res.status(403).json({ message: 'Free tier project limit reached. Please upgrade to continue.' });
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      const project = await storage.createProject(projectData);
      await storage.incrementUserProjects(req.user!.id);
      
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const rooms = await storage.getProjectRooms(project.id);
      res.json({ ...project, rooms });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const updateData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(project.id, updateData);
      
      res.json(updatedProject);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Project not found' });
      }

      await storage.deleteProject(project.id);
      res.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Room routes
  app.post('/api/projects/:projectId/rooms', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const roomData = insertRoomSchema.parse({
        ...req.body,
        projectId
      });

      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/rooms/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getProjectRooms(0).then(rooms => rooms.find(r => r.id === roomId));
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const project = await storage.getProject(room.projectId);
      if (!project || project.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updateData = insertRoomSchema.partial().parse(req.body);
      const updatedRoom = await storage.updateRoom(roomId, updateData);
      
      res.json(updatedRoom);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/rooms/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const roomId = parseInt(req.params.id);
      await storage.deleteRoom(roomId);
      res.json({ message: 'Room deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Materials route
  app.get('/api/materials', (req, res) => {
    res.json(MATERIALS);
  });

  // File upload route for background images
  app.post('/api/upload-background', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      console.log('File uploaded:', file.originalname, file.mimetype, file.size);

      // Convert file to base64 for client
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      // For PDF files, we'd normally convert to image here
      // For now, return the file info and let client handle it
      res.json({
        success: true,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        dataUrl: file.mimetype === 'application/pdf' ? null : dataUrl,
        isPdf: file.mimetype === 'application/pdf',
        isCAD: file.originalname.toLowerCase().endsWith('.dwg') || file.originalname.toLowerCase().endsWith('.dxf'),
        fileType: file.mimetype === 'application/pdf' ? 'PDF' : 
                 file.originalname.toLowerCase().endsWith('.dwg') ? 'DWG' : 
                 file.originalname.toLowerCase().endsWith('.dxf') ? 'DXF' : 'Image',
        message: file.mimetype === 'application/pdf' 
          ? 'PDF uploaded successfully - ready as base layer!'
          : file.originalname.toLowerCase().endsWith('.dwg') ? 'DWG CAD file uploaded successfully - ready as base layer!'
          : file.originalname.toLowerCase().endsWith('.dxf') ? 'DXF CAD file uploaded successfully - ready as base layer!'
          : 'Image uploaded successfully'
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Upload failed', 
        error: error.message 
      });
    }
  });

  // Subscription routes
  app.post('/api/create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!stripe) {
      return res.status(503).json({ message: 'Payment processing is not configured. Please contact support.' });
    }

    const { tier } = req.body;
    const user = req.user!;

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const invoice = subscription.latest_invoice;
        const clientSecret = typeof invoice === 'object' && invoice?.payment_intent 
          ? (typeof invoice.payment_intent === 'object' ? invoice.payment_intent.client_secret : null)
          : null;
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret,
        });
        return;
      } catch (error) {
        // Continue to create new subscription if retrieval fails
      }
    }

    try {
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
      }

      const priceId = tier === 'pro' 
        ? process.env.STRIPE_PRO_PRICE_ID 
        : process.env.STRIPE_PREMIUM_PRICE_ID;

      if (!priceId) {
        return res.status(400).json({ message: 'Price ID not configured for this tier' });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserSubscription(
        user.id, 
        tier, 
        customer.id, 
        subscription.id
      );

      const invoice = subscription.latest_invoice;
      const clientSecret = typeof invoice === 'object' && invoice?.payment_intent 
        ? (typeof invoice.payment_intent === 'object' ? invoice.payment_intent.client_secret : null)
        : null;

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
