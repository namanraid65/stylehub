import { ApiResponse } from '@stylehub/types';

// ─── Standard success response wrapper ───────────────────────────────────────
export class ApiResponseBuilder {
  static success<T>(message: string, data?: T, statusCode = 200): ApiResponse<T> {
    return {
      success: true,
      message,
      ...(data !== undefined && { data }),
    };
  }

  static paginated<T>(
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number,
  ) {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static error(message: string, errors: Record<string, string> = {}): ApiResponse {
    return {
      success: false,
      message,
      ...(Object.keys(errors).length > 0 && { errors }),
    };
  }
}
