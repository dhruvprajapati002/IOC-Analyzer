export const ADMIN_ROUTE_PREFIX = '/admin';

export function normalizeRoute(path: string): string {
  const base = (path || '/').split('?')[0].split('#')[0] || '/';
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base;
}

export function isPublicRoute(path: string): boolean {
  const normalized = normalizeRoute(path);
  return !normalized.startsWith(ADMIN_ROUTE_PREFIX);
}

export function isAdminRoute(path: string): boolean {
  return normalizeRoute(path).startsWith(ADMIN_ROUTE_PREFIX);
}
