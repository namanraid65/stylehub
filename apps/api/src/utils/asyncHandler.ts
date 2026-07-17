import { Request, Response, NextFunction, RequestHandler } from 'express';

// ─── Wraps async route handlers to forward errors to Express error middleware ─
// Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
