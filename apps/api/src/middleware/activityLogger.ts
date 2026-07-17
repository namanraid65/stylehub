import { Request, Response, NextFunction, RequestHandler } from 'express';
import ActivityLog from '../models/ActivityLog';
import type { ActivityAction, ActivityEntity } from '../models/ActivityLog';
import mongoose from 'mongoose';

/**
 * logActivity — middleware factory that logs an action after the route handler responds.
 *
 * Usage:
 *   router.post('/orders', protect, logActivity('order.create', 'Order'), createOrderHandler);
 *
 * The middleware reads x-user-id / x-user-name / x-user-role from request headers
 * (set by your auth middleware) and captures the response body's entity ID.
 */
export function logActivity(
  action: ActivityAction,
  entity: ActivityEntity,
  getSummary?: (req: Request, resBody: Record<string,unknown>) => string,
): RequestHandler {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const originalJson = _res.json.bind(_res);
    let capturedBody: Record<string,unknown> = {};

    // Intercept json() to capture response body
    _res.json = function (body: Record<string,unknown>) {
      capturedBody = body ?? {};
      return originalJson(body);
    };

    _res.on('finish', () => {
      // Only log successful mutations
      if (_res.statusCode >= 400) return;

      const user = (_req as any).user;
      const actorId   = user?._id || (_req.headers['x-user-id']   as string | undefined);
      const actorName = user?.name || (_req.headers['x-user-name']  as string | undefined);
      const actorRole = user?.role || (_req.headers['x-user-role'] as string | undefined) || 'customer';

      if (!actorId || !mongoose.isValidObjectId(actorId)) return;

      const entityId =
        (capturedBody?.orderId as string) ||
        (capturedBody?.reviewId as string) ||
        (capturedBody?.enquiryId as string) ||
        (capturedBody?.productId as string) ||
        (capturedBody?._id as string) ||
        (_req.params?.id as string) ||
        undefined;

      const summary = getSummary
        ? getSummary(_req, capturedBody)
        : `${actorName ?? 'User'} performed ${action} on ${entity}${entityId ? ` (${entityId})` : ''}`;

      ActivityLog.create({
        actor:     new mongoose.Types.ObjectId(actorId),
        actorRole: actorRole as 'customer' | 'vendor' | 'admin' | 'system',
        actorName: actorName ?? 'Unknown',
        action,
        entity,
        entityId:  String(entityId ?? ''),
        summary,
        metadata:  { body: _req.body, query: _req.query },
        ip:        _req.ip ?? _req.socket.remoteAddress,
        userAgent: _req.headers['user-agent'],
      }).catch((err) => {
        console.error('[ActivityLogger] Failed to log activity:', err);
      });
    });

    next();
  };
}
