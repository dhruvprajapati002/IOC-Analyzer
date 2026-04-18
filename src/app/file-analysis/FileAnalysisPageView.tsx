'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedPage } from '@/components/ProtectedPage';
import { Shield, FileText, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { FileUploadZone } from './components/FileUploadZone';
import { FileAnalysisOverview } from './components/FileAnalysisOverview';
import { toast } from 'sonner';
import type { FileAnalysisResult } from './components/types';

export default function FileAnalysisPage() {
  return (
    <ProtectedPage>
      <FileAnalysisContent />
    </ProtectedPage>
  );
}

// ✅ Rate limit state interface
interface RateLimitState {
  remaining: number;
  limit: number;
  resetAt: string | null;
}

function FileAnalysisContent() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<FileAnalysisResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ✅ Rate limit state
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    remaining: 10,
    limit: 10,
    resetAt: null,
  });

  // ✅ Update rate limit from response headers
  const updateRateLimitFromHeaders = (headers: Headers) => {
    const remaining = headers.get('X-RateLimit-Remaining');
    const limit = headers.get('X-RateLimit-Limit');
    const resetAt = headers.get('X-RateLimit-Reset');

    if (remaining && limit) {
      const newRateLimit = {
        remaining: parseInt(remaining),
        limit: parseInt(limit),
        resetAt: resetAt,
      };

      setRateLimit(newRateLimit);

      // ✅ Show alerts only when critically low
      const percentage = (parseInt(remaining) / parseInt(limit)) * 100;
      
      if (parseInt(remaining) === 0) {
        toast.error('🚫 File analysis rate limit exceeded! Please wait for reset.', {
          duration: 8000,
          position: 'top-center',
        });
      } else if (percentage <= 20) {
        toast.warning(`⚠️ Low quota: ${remaining}/${limit} file analyses remaining`, {
          duration: 5000,
        });
      }
    }
  };

  // Auto-scroll to results when analysis completes
  useEffect(() => {
    if (currentAnalysis && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [currentAnalysis]);

  

  
  // const statItems = [
   
  //   {
  //     title: 'Analyses Left',
  //     value: `${rateLimit.remaining}/${rateLimit.limit}`,
  //     icon: Zap,
  //     color: rateLimit.remaining <= 2 ? APP_COLORS.danger : 
  //            rateLimit.remaining <= 5 ? APP_COLORS.warning : 
  //            APP_COLORS.accentPurple,
  //   },
  // ];

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
      style={{ backgroundColor: APP_COLORS.background }}
    >
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Stats Bar */}
        {/* <div className="flex items-center justify-end gap-6">
          <div className="hidden lg:flex items-center gap-6">
            {statItems.map((stat, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
                {index < statItems.length - 1 && (
                  <div className="h-10 w-px" style={{ backgroundColor: APP_COLORS.borderSoft }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div> */}

        {/* File Upload Zone */}
        <FileUploadZone 
          token={token!} 
          onAnalysisComplete={(result) => setCurrentAnalysis(result)}
          onRateLimitUpdate={updateRateLimitFromHeaders}
          rateLimitRemaining={rateLimit.remaining}
        />

        {/* Analysis Results */}
        {currentAnalysis && (
          <div ref={resultsRef} className="scroll-mt-6">
            <FileAnalysisOverview result={currentAnalysis} />
          </div>
        )}
      </div>
    </div>
  );
}
