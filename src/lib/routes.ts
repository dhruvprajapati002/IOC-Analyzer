export const PUBLIC_ROUTES = ['/login', '/register', '/about'];

export function normalizeRoute(path: string): string {
  const base = (path || '/').split('?')[0].split('#')[0] || '/';
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base;
}

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(normalizeRoute(path));
}
