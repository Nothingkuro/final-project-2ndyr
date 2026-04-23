/**
 * Request-scoped metadata propagated into audit records.
 */
export interface RequestContext {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  actorUserId?: string;
}
