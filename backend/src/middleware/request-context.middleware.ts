import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

function normalizeIpAddress(req: Request): string | undefined {
  const forwardedFor = req.header('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || undefined;
  }

  return req.ip || undefined;
}

/**
 * Attaches per-request metadata used by observability and audit trails.
 */
export function attachRequestContext(req: Request, res: Response, next: NextFunction): void {
  const requestIdHeader = req.header('x-request-id');
  const requestId = requestIdHeader && requestIdHeader.trim().length > 0
    ? requestIdHeader.trim()
    : randomUUID();

  req.requestContext = {
    requestId,
    ipAddress: normalizeIpAddress(req),
    userAgent: req.header('user-agent') || undefined,
  };

  res.setHeader('x-request-id', requestId);
  next();
}
