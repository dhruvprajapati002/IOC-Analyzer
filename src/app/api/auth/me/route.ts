import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = await verifyAuth(req);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid or expired token' } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
      },
    },
  });
}
