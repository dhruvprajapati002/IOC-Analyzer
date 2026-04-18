'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { User, Lock, ArrowRight, Eye, EyeOff, Loader } from 'lucide-react'; // Replace Mail with Userimport { toast } from 'sonner';



export function LoginForm() {
  const [username, setUsername] = useState(''); // Change from email to username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!username) newErrors.username = 'Username is required';

    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(username, password); // Use username
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-t-textLighter mb-2">
          <User className="inline w-4 h-4 mr-2" />
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 bg-t-surface/50 border border-t-border/50 rounded-lg text-t-textPrimary placeholder-t-textMuted focus:outline-none focus:border-t-info/50 transition-colors"
          placeholder="yourusername"
        />
        {errors.username && <p className="text-xs text-t-dangerLight mt-1">{errors.username}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-t-textLighter mb-2">
          <Lock className="inline w-4 h-4 mr-2" />
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-t-surface/50 border border-t-border/50 rounded-lg text-t-textPrimary placeholder-t-textMuted focus:outline-none focus:border-t-info/50 transition-colors pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-t-textMuted hover:text-t-textLighter"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-t-dangerLight mt-1">{errors.password}</p>}
      </div>

      {errors.submit && (
        <div className="p-3 bg-t-danger/10 border border-t-danger/30 rounded-lg">
          <p className="text-sm text-t-dangerLight">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-gradient-to-r from-t-accentBlueDark to-t-accentCyan text-t-textPrimary font-medium rounded-lg hover:from-t-info hover:to-t-accentCyan transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
