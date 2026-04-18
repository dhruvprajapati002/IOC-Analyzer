import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import connectDB from '@/lib/db';

const usernamePattern = /^[a-zA-Z0-9_.-]+$/;

const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(30),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .superRefine((data, ctx) => {
    if (!usernamePattern.test(data.username)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['username'],
        message: 'Username can only contain letters, numbers, dots, dashes, and underscores',
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid request', details: parsed.error.flatten() },
        },
        { status: 400 }
      );
    }

    const username = parsed.data.username.trim();
    const usernameTaken = await User.exists({ username });
    if (usernameTaken) {
      return NextResponse.json(
        { success: false, error: { message: 'Username is already taken' } },
        { status: 409 }
      );
    }

    const user = await User.create({
      username,
      password: parsed.data.password,
      role: 'user',
    });

    const token = generateToken(user._id.toString(), user.username, user.role);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user._id.toString(),
            email: user.email ?? null,
            username: user.username,
            role: user.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const code = (error as NodeJS.ErrnoException)?.code;
    const name = (error as Error)?.name || '';
    const isConfigError = code === 'MONGO_URI_MISSING';
    const isMongoError = name.toLowerCase().includes('mongo');
    const message = isConfigError
      ? 'Database is not configured'
      : isMongoError
        ? 'Database connection failed'
        : 'Registration failed';
    const status = isConfigError || isMongoError ? 503 : 500;
    return NextResponse.json(
      { success: false, error: { message } },
      { status }
    );
  }
}
