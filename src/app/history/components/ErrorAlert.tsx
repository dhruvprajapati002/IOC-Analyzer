'use client';

import { AlertTriangle } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div
      className="p-4 rounded-xl border-2"
      style={{
        backgroundColor: `${APP_COLORS.danger}10`,
        borderColor: `${APP_COLORS.danger}40`,
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          style={{ color: APP_COLORS.danger }}
        />
        <div
          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
          style={{ color: APP_COLORS.danger }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
