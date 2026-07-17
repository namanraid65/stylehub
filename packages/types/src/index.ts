// ─── Barrel export — import everything from '@stylehub/types' ─────────────────
export * from './enums';
export * from './user.types';
export * from './product.types';
export * from './order.types';

// ─── Generic API response shape ───────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
