import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import connectDB from '@/lib/db';

const loginSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid request', details: parsed.error.flatten() },
        },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid username or password' } },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid username or password' } },
        { status: 401 }
      );
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = generateToken(user._id.toString(), user.username, user.role);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email ?? null,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    const code = (error as NodeJS.ErrnoException)?.code;
    const name = (error as Error)?.name || '';
    const isConfigError = code === 'MONGO_URI_MISSING';
    const isMongoError = name.toLowerCase().includes('mongo');
    const message = isConfigError
      ? 'Database is not configured'
      : isMongoError
        ? 'Database connection failed'
        : 'Login failed';
    const status = isConfigError || isMongoError ? 503 : 500;
    return NextResponse.json(
      { success: false, error: { message } },
      { status }
    );
  }
}
