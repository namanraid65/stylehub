// ─── Express Request Augmentation ─────────────────────────────────────────────
// Adds `req.user` typed field used by auth middleware across all routes.

import { IPublicUser } from '@stylehub/types';

declare global {
  namespace Express {
    interface Request {
      user?: IPublicUser;
    }
  }
}

export {};
