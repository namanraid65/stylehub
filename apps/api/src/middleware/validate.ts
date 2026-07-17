import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ApiResponseBuilder } from '../utils/ApiResponse';

type RequestPart = 'body' | 'params' | 'query';

// ─── Zod Validation Middleware ────────────────────────────────────────────────
// Usage: router.post('/endpoint', validate(mySchema), controller)
// Usage: router.get('/endpoint', validate(mySchema, 'query'), controller)

export const validate =
  (schema: ZodTypeAny, part: RequestPart = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors: Record<string, string> = {};
      (result.error as ZodError).errors.forEach((e) => {
        const field = e.path.join('.');
        errors[field] = e.message;
      });
      res.status(400).json(ApiResponseBuilder.error('Validation failed', errors));
      return;
    }

    // Attach parsed & coerced data back to request
    req[part] = result.data;
    next();
  };
