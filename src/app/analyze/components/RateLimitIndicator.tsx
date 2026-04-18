// app/analyze/components/RateLimitIndicator.tsx

'use client';

import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

interface RateLimitIndicatorProps {
  remaining: number;
  limit: number;
  resetAt: string | null;
  isLoading?: boolean;
}

export function RateLimitIndicator({ 
  remaining, 
  limit, 
  resetAt,
  isLoading = false 
}: RateLimitIndicatorProps) {
  const percentage = (remaining / limit) * 100;
  
  // Determine status
  let status: 'healthy' | 'warning' | 'critical' | 'exhausted';
  let statusColor: string;
  let statusIcon: React.ReactNode;
  let statusText: string;
  
  if (remaining === 0) {
    status = 'exhausted';
    statusColor = APP_COLORS.error;
    statusIcon = <XCircle className="w-4 h-4" />;
    statusText = 'Rate limit exceeded';
  } else if (percentage <= 10) {
    status = 'critical';
    statusColor = APP_COLORS.error;
    statusIcon = <AlertTriangle className="w-4 h-4" />;
    statusText = 'Critical';
  } else if (percentage <= 30) {
    status = 'warning';
    statusColor = APP_COLORS.warning;
    statusIcon = <AlertTriangle className="w-4 h-4" />;
    statusText = 'Low';
  } else {
    status = 'healthy';
    statusColor = APP_COLORS.success;
    statusIcon = <CheckCircle className="w-4 h-4" />;
    statusText = 'Healthy';
  }

  // Calculate time until reset
  const getTimeUntilReset = () => {
    if (!resetAt) return 'Unknown';
    const now = new Date().getTime();
    const reset = new Date(resetAt).getTime();
    const diff = reset - now;
    
    if (diff <= 0) return 'Resetting...';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-4"
      style={{
        backgroundColor: APP_COLORS.cardBackground,
        borderColor: APP_COLORS.border,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div style={{ color: statusColor }}>
            {statusIcon}
          </div>
          <h3 className="text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
            API Rate Limit
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: APP_COLORS.textSecondary }}>
            {remaining} / {limit} requests remaining
          </span>
          <span style={{ color: APP_COLORS.textSecondary }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: APP_COLORS.backgroundSoft }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              backgroundColor: statusColor,
              boxShadow: `0 0 10px ${statusColor}40`,
            }}
          />
        </div>
      </div>

      {/* Reset Timer */}
      {resetAt && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1" style={{ color: APP_COLORS.textSecondary }}>
            <Clock className="w-3 h-3" />
            <span>Resets in</span>
          </div>
          <span 
            className="font-mono font-medium"
            style={{ color: APP_COLORS.textPrimary }}
          >
            {getTimeUntilReset()}
          </span>
        </div>
      )}

      {/* Warning Messages */}
      {status === 'exhausted' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-2 rounded text-xs"
          style={{
            backgroundColor: `${APP_COLORS.error}10`,
            color: APP_COLORS.error,
            borderLeft: `3px solid ${APP_COLORS.error}`,
          }}
        >
          <strong>Rate limit exceeded.</strong> Please wait until reset or upgrade your plan.
        </motion.div>
      )}

      {status === 'critical' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-2 rounded text-xs"
          style={{
            backgroundColor: `${APP_COLORS.warning}10`,
            color: APP_COLORS.warning,
            borderLeft: `3px solid ${APP_COLORS.warning}`,
          }}
        >
          <strong>Low quota.</strong> Only {remaining} requests left!
        </motion.div>
      )}

      {isLoading && (
        <div className="mt-3 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" 
               style={{ borderColor: statusColor, borderTopColor: 'transparent' }} />
        </div>
      )}
    </motion.div>
  );
}
