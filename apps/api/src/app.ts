import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import { env, isDev } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { morganStream } from './utils/logger';
import apiRouter from './routes/index';

// ─── Create Express app ───────────────────────────────────────────────────────
const app: Application = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Sets secure HTTP headers (X-Frame-Options, X-XSS-Protection, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
  }),
);

// CORS — allow web and admin origins
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [env.WEB_URL, env.ADMIN_URL];
      // Allow server-to-server (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true, // Allow cookies (refresh token)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Global rate limiter — 100 requests per 15 minutes per IP (relaxed to 10000 in dev)
const isProd = process.env.NODE_ENV === 'production';
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 100 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again in 15 minutes.',
    },
  }),
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Data Sanitisation ────────────────────────────────────────────────────────
// Strips MongoDB operators ($where, $gt, etc.) from user input
app.use(mongoSanitize());

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
app.use(
  morgan(isDev ? 'dev' : 'combined', {
    stream: morganStream,
    skip: (_req, res) => res.statusCode < 400 && !isDev, // prod: only log errors
  }),
);

// ─── Trust proxy (Nginx / Railway / Vercel) ───────────────────────────────────
app.set('trust proxy', 1);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Root welcome ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'StyleHub API',
    version: '1.0.0',
    status: '🟢 Running',
    docs: '/api/health',
  });
});

// ─── 404 & Error Handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
