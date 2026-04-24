'use client';

import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { APP_COLORS } from '@/lib/colors';
import VigilanceLogo from '@/components/brand/VigilanceLogo';

export default function RegisterPageView() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(to bottom right, ${APP_COLORS.loginBgFrom}, ${APP_COLORS.loginBgTo})` }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-t-info/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-t-accentCyan/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <VigilanceLogo variant="full" size="lg" theme="light" showTagline={true} />
          </div>
          <p className="text-t-textMuted">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-t-bg/50 border border-t-border/50 rounded-xl p-8 backdrop-blur-sm">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-t-textMuted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-t-info hover:text-t-accentCyan">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
