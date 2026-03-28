/**
 * EstiMate Server Entry Point
 * 
 * Security-hardened Express server with comprehensive
 * protection against common web vulnerabilities.
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Import security configuration FIRST - validates environment variables
// This will exit if required security variables are not set
import securityConfig from "./config/security";

import paymentRoutes from "./routes/payments";
import { setupWebSockets } from "./websocket";

const app = express();

// Trust proxy for Replit environment
app.set('trust proxy', true);

// HTTPS enforcement middleware (production only)
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && securityConfig.isProduction) {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

// Optimize for high-speed uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true, parameterLimit: 50000 }));

// Increase server timeouts for large files
app.use((req, res, next) => {
  // Set 5 minute timeout for uploads
  if (req.path.includes('/upload')) {
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    // Skip logging for admin upload routes to improve performance
    if (path.startsWith("/api") && !path.includes("/admin/upload")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && duration < 5000) { // Only log response for fast requests
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    } else if (path.includes("/admin/upload")) {
      // Minimal logging for uploads
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  // Register routes - security middleware is applied inside registerRoutes
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Don't leak internal error details in production
    const message = securityConfig.isProduction 
      ? "Internal Server Error" 
      : (err.message || "Internal Server Error");

    // Log the error for debugging
    console.error('Error:', err);

    res.status(status).json({ message });
  });

  // Setup Vite in development, serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🔐 Security-hardened server serving on port ${port}`);
    log(`📊 Environment: ${securityConfig.env.NODE_ENV}`);
    log(`🔑 JWT configured: ${securityConfig.jwt.secret ? 'Yes' : 'No'}`);
  });
})();
