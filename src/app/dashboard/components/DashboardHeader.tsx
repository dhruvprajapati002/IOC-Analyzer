'use client';

import { Database, AlertTriangle } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { useState, useEffect } from 'react';
import { TimeFilterDropdown, TimeRange } from './TimeFilterDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from "@/lib/apiFetch";

interface DashboardHeaderProps {
  error?: string | null;
}

export function DashboardHeader({ error }: DashboardHeaderProps) {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [stats, setStats] = useState<{
    totalIOCs: number;
    maliciousIOCs: number;
    cleanIOCs: number;
    pendingIOCs: number;
    detectionRate: number;
    trends: {
      totalIOCs: number;
      threatsDetected: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch header stats when timeRange changes
  useEffect(() => {
    const fetchHeaderStats = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await apiFetch(`/api/dashboard-v2?range=${timeRange}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching header stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeaderStats();
  }, [token, timeRange]);

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    // Stats will automatically update via useEffect
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
      {/* Left: subtitle */}
      <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`} style={{ color: APP_COLORS.textSecondary }}>
        {error ? "Cyber Threat Intelligence Platform (API issue)" : "Cyber Threat Intelligence Platform"}
      </p>

      {/* Right: actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Time Range Filter */}
        <TimeFilterDropdown
          value={timeRange}
          onChange={handleTimeRangeChange}
        />

        {/* Stats */}
        {stats && (
          <>
            <div className="h-6 w-px hidden sm:block" style={{ backgroundColor: APP_COLORS.borderSoft }} />

            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
              <div className="flex items-baseline gap-1">
                <span className={`${TYPOGRAPHY.label.lg} hidden sm:inline`} style={{ color: APP_COLORS.textSecondary }}>IOCs:</span>
                <span className={`${TYPOGRAPHY.data.xs} ${loading ? 'opacity-50' : ''}`} style={{ color: APP_COLORS.primary }}>
                  {stats.totalIOCs.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="h-6 w-px" style={{ backgroundColor: APP_COLORS.borderSoft }} />

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: APP_COLORS.danger }} />
              <div className="flex items-baseline gap-1">
                <span className={`${TYPOGRAPHY.label.lg} hidden sm:inline`} style={{ color: APP_COLORS.textSecondary }}>Threats:</span>
                <span className={`${TYPOGRAPHY.data.xs} ${loading ? 'opacity-50' : ''}`} style={{ color: APP_COLORS.danger }}>
                  {stats.maliciousIOCs.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="h-6 w-px hidden md:block" style={{ backgroundColor: APP_COLORS.borderSoft }} />
          </>
        )}
      </div>
    </div>
  );
}
