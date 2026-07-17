import winston from 'winston';
import { isDev } from '../config/env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// ─── Dev format: colored, human-readable ─────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  }),
);

// ─── Prod format: structured JSON for log aggregators ────────────────────────
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    // Add file transports in production via environment config if needed
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
  // Don't throw on uncaught errors
  exitOnError: false,
});

// ─── Stream for Morgan HTTP logger ───────────────────────────────────────────
export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
