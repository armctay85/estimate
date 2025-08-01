import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

// Configure Passport Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// JWT verification middleware for admin access
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'estimate-secret-key-2025');
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized - Please log in' });
};

// REMOVED TIER RESTRICTIONS - Full unrestricted access
export const requireTier = (minTier: 'free' | 'pro' | 'enterprise') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // All tiers have full access - no restrictions
    return next();
  };
};

// Registration schema with validation
const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Registration endpoint
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const newUser = await storage.createUser({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      subscriptionTier: 'free'
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login endpoint
export const login = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Special case for admin JWT login
    if (req.body.username === 'admin' && req.body.password === 'pass') {
      const token = jwt.sign(
        { user: 'admin' }, 
        process.env.JWT_SECRET || 'estimate-secret-key-2025',
        { expiresIn: '24h' }
      );
      return res.json({ token });
    }

    // Handle both username and email login
    const loginData = req.body.username ? 
      { email: req.body.username, password: req.body.password } : 
      { email: req.body.email, password: req.body.password };
      
    const validatedData = loginSchema.parse(loginData);
    
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || 'Authentication failed' 
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        res.json({
          message: 'Login successful',
          user: userWithoutPassword
        });
      });
    })(req, res, next);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    next(error);
  }
};

// Logout endpoint
export const logout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
};

// Get current user endpoint
export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = req.user as any;
  const { password, ...userWithoutPassword } = user;
  
  res.json({ user: userWithoutPassword });
};