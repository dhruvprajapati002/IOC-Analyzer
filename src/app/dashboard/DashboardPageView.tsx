"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { APP_COLORS } from "@/lib/colors";
import { TYPOGRAPHY } from "@/lib/typography";
import { ProtectedPage } from "@/components/ProtectedPage";
import { TimeRange } from "./components/TimeFilterDropdown";

// Import dashboard components
import { DashboardHeader } from "@/app/dashboard/components/DashboardHeader";
import { ThreatTrendChart } from "@/app/dashboard/components/ThreatTrendChart";
import { TopThreatsGraph } from "@/app/dashboard/components/TopThreatsGraph";
import { IOCTypeDistributionChart } from "@/app/dashboard/components/IOCTypeDistributionChartNew";
import { GeographicDistributionChart } from "@/app/dashboard/components/GeographicDistributionChartNew";
import { FileAnalysisGraph } from "@/app/dashboard/components/FileAnalysisGraphCompact";
import { MalwareFamiliesChart } from "@/app/dashboard/components/MalwareFamiliesChartNew";
import { ThreatSeverityChart } from "@/app/dashboard/components/ThreatSeverityChart";
// import { DetectionEnginePerformanceChart } from '@/app/dashboard/components/DetectionEnginePerformanceChartNew';
import { ThreatTypePieChart } from "@/app/dashboard/components/ThreatTypePieChartModern";
import { apiFetch } from "@/lib/apiFetch";

// Type definitions for header stats only
interface HeaderStats {
  totalIOCs: number;
  maliciousIOCs: number;
  cleanIOCs: number;
  suspiciousIOCs: number;
  pendingIOCs: number;
  detectionRate: number;
  trends: {
    totalIOCs: number;
    threatsDetected: number;
  };
}

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <DashboardContent />
    </ProtectedPage>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const [headerStats, setHeaderStats] = useState<HeaderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeRange: TimeRange = "weekly";
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================================================
  // HEADER STATS FETCHING ONLY - Cards fetch their own data
  // ========================================================================
  useEffect(() => {
    let isMounted = true;

    const fetchHeaderStats = async () => {
      if (!isMounted || !token) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await apiFetch(`/api/dashboard-v2?range=${timeRange}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setHeaderStats(data.stats);
          setError(null);
        }
      } catch (err) {
        console.error("❌ Header stats fetch error:", err);
        if (isMounted && err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      }
    };

    const setupDashboard = async () => {
      setLoading(true);
      setError(null);

      await fetchHeaderStats();
      setLoading(false);

      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Refresh header stats every 30 seconds
      intervalRef.current = setInterval(fetchHeaderStats, 30000);
    };

    if (token) {
      setupDashboard();
    }

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, timeRange]);

  // ========================================================================
  // LOADING STATE
  // ========================================================================
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: APP_COLORS.background }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{
              borderColor: `${APP_COLORS.primary} transparent transparent transparent`,
            }}
          />
          <p
            className={TYPOGRAPHY.body.md}
            style={{ color: APP_COLORS.textSecondary }}
          >
            Loading SentinelIQ dashboard...
          </p>
          <p
            className={`${TYPOGRAPHY.caption.sm} mt-2`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================
  if (error || !headerStats) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: APP_COLORS.background }}
      >
        <div
          className="text-center max-w-md mx-auto p-8 rounded-2xl border-2"
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: APP_COLORS.border,
          }}
        >
          <div
            className="inline-flex p-4 rounded-full mb-6"
            style={{
              backgroundColor: `${APP_COLORS.danger}20`,
              border: `2px solid ${APP_COLORS.danger}40`,
            }}
          >
            <AlertTriangle
              className="h-12 w-12"
              style={{ color: APP_COLORS.danger }}
            />
          </div>

          <h2
            className={TYPOGRAPHY.heading.h2}
            style={{ color: APP_COLORS.textPrimary }}
          >
            Dashboard Data Unavailable
          </h2>

          <p
            className={`${TYPOGRAPHY.body.md} mb-6`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            {error || "Failed to fetch dashboard statistics"}
          </p>

          <button
            onClick={() => undefined}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:shadow-lg ${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`}
            style={{
              backgroundColor: APP_COLORS.primary,
              color: APP_COLORS.textPrimary,
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // MAIN DASHBOARD CONTENT
  // ========================================================================
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: APP_COLORS.background }}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 max-w-[1900px]">
        {/* Header with integrated stats and global time filter */}
        <DashboardHeader error={error} />

        {/* Row 1: Trend Chart, Severity, IOC Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-3">
          {/* ✅ No props - fetches its own data */}
          <ThreatTrendChart />

          {/* ✅ No props - fetches its own data */}
          <ThreatSeverityChart />

          {/* ✅ No props - fetches its own data */}
          <IOCTypeDistributionChart />
        </div>

        {/* Row 2: File Analysis, Top Threats, Geographic */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-3">
          {/* ✅ No props - fetches its own data */}
          <FileAnalysisGraph />

          {/* ✅ No props - fetches its own data */}
          <ThreatTypePieChart />

          {/* ✅ No props - fetches its own data */}
          <GeographicDistributionChart />
        </div>

        {/* Row 3: Malware Families & Detection Engine Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
          {/* ✅ No props - fetches its own data */}
          <MalwareFamiliesChart />
          <TopThreatsGraph />

          {/* ✅ No props - fetches its own data */}
          {/* <DetectionEnginePerformanceChart /> */}
        </div>
      </div>
    </div>
  );
}
