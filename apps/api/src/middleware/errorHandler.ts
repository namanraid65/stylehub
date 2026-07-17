import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { ApiResponseBuilder } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import { isDev } from '../config/env';

// ─── Global Error Handler Middleware ─────────────────────────────────────────
// Must have 4 parameters for Express to treat it as error middleware.

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  logger.error(`[${req.method}] ${req.path} →`, {
    message: err.message,
    ...(isDev && { stack: err.stack }),
  });

  // ── Zod Validation Error ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      errors[field] = e.message;
    });
    res.status(400).json(ApiResponseBuilder.error('Validation failed', errors));
    return;
  }

  // ── Our Custom ApiError ───────────────────────────────────────────────────
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(ApiResponseBuilder.error(err.message, err.errors));
    return;
  }

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    Object.entries(err.errors).forEach(([key, val]) => {
      errors[key] = val.message;
    });
    res.status(400).json(ApiResponseBuilder.error('Validation failed', errors));
    return;
  }

  // ── Mongoose Duplicate Key Error ──────────────────────────────────────────
  if ((err as NodeJS.ErrnoException).code === '11000') {
    const mongoErr = err as { keyValue?: Record<string, unknown> };
    const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? 'field';
    res
      .status(409)
      .json(
        ApiResponseBuilder.error(`Duplicate value: ${field} already exists`, { [field]: `${field} must be unique` }),
      );
    return;
  }

  // ── Mongoose Cast Error (invalid ObjectId) ────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json(ApiResponseBuilder.error(`Invalid ${err.path}: ${err.value}`));
    return;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(ApiResponseBuilder.error('Invalid token. Please log in again.'));
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(ApiResponseBuilder.error('Token expired. Please log in again.'));
    return;
  }

  // ── Unhandled / Unknown Error ─────────────────────────────────────────────
  const message = isDev ? err.message : 'Something went wrong. Please try again.';
  res.status(500).json(ApiResponseBuilder.error(message));
};

// ─── 404 Not Found Handler ────────────────────────────────────────────────────
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl}`));
};
