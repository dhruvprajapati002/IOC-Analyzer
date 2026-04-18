// middleware.ts (PROJECT ROOT - NOT in src/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from './src/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      // Redirect to login with return URL
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', '/admin');
      return NextResponse.redirect(url);
    }

    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      // Redirect to home with error
      const url = new URL('/', request.url);
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // Protect all /admin routes
};
