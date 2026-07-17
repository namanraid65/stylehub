// ─── Custom API Error ─────────────────────────────────────────────────────────
// Extend native Error so instanceof checks work correctly in the error handler.

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: Record<string, string>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: Record<string, string> = {},
    isOperational = true,
    stack = '',
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ── Convenience factory methods ────────────────────────────────────────────

  static badRequest(message: string, errors: Record<string, string> = {}): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, `${resource} not found`);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, {}, false);
  }
}
