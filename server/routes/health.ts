import { Router } from 'express';
import { db } from '../db';
import os from 'os';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    cpu: {
      load: os.loadavg(),
      cores: os.cpus().length,
    },
  };

  // Check database connection
  try {
    await db.execute('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.status = 'unhealthy';
    health.database = 'disconnected';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness check - for Kubernetes/liveness probes
router.get('/ready', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Database unavailable' });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({ alive: true, uptime: process.uptime() });
});

// System metrics for monitoring
router.get('/metrics', (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    connections: (req.app as any).connections || 'N/A',
  };
  res.json(metrics);
});

export default router;
