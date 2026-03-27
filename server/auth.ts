/**
 * Authentication System
 * 
 * Security-hardened authentication with:
 * - No hardcoded credentials
 * - Proper admin user management in database
 * - Bcrypt password hashing
 * - JWT with secure secret validation
 * - Rate limiting integration
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import securityConfig from './config/security';

// JWT Secret must be set - no fallbacks
const JWT_SECRET = securityConfig.jwt.secret;
const JWT_EXPIRES_IN = securityConfig.jwt.expiresIn;

// Password strength requirements
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Validate password strength
const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^*&*()_+\-=\[\]{};':"\\|,.\/<>?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^*&* etc.)');
  }
  
  return { valid: errors.length === 0, errors };
};

// Admin check - verifies if user has admin privileges
export const isAdmin = async (userId: number): Promise<boolean> => {
  try {
    const user = await storage.getUser(userId);
    return user?.subscriptionTier === 'admin' || false;
  } catch {
    return false;
  }
};

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

// JWT verification middleware
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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

// Middleware to require admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
  
  const adminStatus = await isAdmin(user.id);
  if (!adminStatus) {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  
  next();
};

// Middleware to require QS (Quantity Surveyor) verification
export const requireQS = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
  
  // Check if user is verified QS or admin
  if (!user.isVerifiedQS && user.subscriptionTier !== 'admin') {
    return res.status(403).json({ 
      message: 'Forbidden - Verified Quantity Surveyor access required',
      details: 'Contact support to verify your QS credentials'
    });
  }
  
  next();
};

// REMOVED TIER RESTRICTIONS - Full unrestricted access
export const requireTier = (minTier: 'free' | 'pro' | 'enterprise') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // All tiers have full access - no restrictions
    return next();
  };
};

// Registration schema with enhanced validation
const registerSchema = insertUserSchema.extend({
  password: z.string().min(1, 'Password is required'),
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

// Admin setup schema
const adminSetupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  setupKey: z.string().min(1, 'Setup key is required'),
});

// Registration endpoint
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check password strength
    const passwordCheck = validatePasswordStrength(validatedData.password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'Password too weak',
        errors: passwordCheck.errors
      });
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password with higher cost factor for security
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

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

// JWT Admin Login - Authenticates admin users from database
export const adminJWTLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify admin status
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        isAdmin: true 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({ 
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin Setup - First-time admin creation
export const setupAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = adminSetupSchema.parse(req.body);
    
    // Verify setup key (should be set in environment for first-run)
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY;
    if (!expectedSetupKey) {
      return res.status(503).json({ 
        message: 'Admin setup is disabled. Set ADMIN_SETUP_KEY environment variable to enable.' 
      });
    }
    
    if (validatedData.setupKey !== expectedSetupKey) {
      return res.status(401).json({ message: 'Invalid setup key' });
    }
    
    // Check if admin already exists
    const existingAdmins = await storage.getUsersByTier('admin');
    if (existingAdmins.length > 0) {
      return res.status(400).json({ 
        message: 'Admin user already exists. Use regular login or contact existing admin.' 
      });
    }
    
    // Validate password strength
    const passwordCheck = validatePasswordStrength(validatedData.password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'Password too weak',
        errors: passwordCheck.errors
      });
    }
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Create admin user
    const adminUser = await storage.createUser({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      subscriptionTier: 'admin'
    });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = adminUser;
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    console.error('Admin setup error:', error);
    res.status(500).json({ message: 'Internal server error' });
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

// Change password endpoint
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate new password strength
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'New password too weak',
        errors: passwordCheck.errors
      });
    }
    
    const user = req.user as any;
    const userRecord = await storage.getUser(user.id);
    
    if (!userRecord) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userRecord.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await storage.updateUserPassword(user.id, hashedPassword);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  requireAdmin,
  requireQS,
  requireTier,
  verifyJWT,
  adminJWTLogin,
  setupAdmin,
  changePassword,
  isAdmin,
  validatePasswordStrength,
};

// Alias for isAuthenticated (used by cost-database routes)
export const requireAuth = isAuthenticated;
