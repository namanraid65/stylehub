import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiResponseBuilder } from '../utils/ApiResponse';

const router = Router();

/**
 * GET /api/health
 * Public health-check — used by load balancers, Docker, and uptime monitors.
 */
router.get('/', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const health = {
    status: dbState === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus[dbState] ?? 'unknown',
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'n/a',
      },
    },
    version: process.env.npm_package_version ?? '0.0.1',
    environment: process.env.NODE_ENV ?? 'development',
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(ApiResponseBuilder.success('StyleHub API is running', health));
});

export default router;
