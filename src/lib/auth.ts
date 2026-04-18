// lib/auth.ts
import jwt, { type SignOptions } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_EXPIRY = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']; // Token expiry duration

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 */
export function generateToken(
  userId: string,
  username: string,
  role: 'user' | 'admin' = 'user'
): string {
  return jwt.sign(
    { userId, username, role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request headers
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Middleware to verify authentication
 */
export async function verifyAuth(req: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = verifyToken(token);
  return payload;
}

/**
 * Check if user is admin
 */
export function isAdmin(payload: JwtPayload | null): boolean {
  return payload?.role === 'admin';
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: { message: 'Unauthorized' } },
    { status: 401 }
  );
}

/**
 * Create forbidden response (for non-admins)
 */
export function forbiddenResponse(message?: string) {
  return NextResponse.json(
    { success: false, error: { message: message || 'Forbidden - Admin access required' } },
    { status: 403 }
  );
}
