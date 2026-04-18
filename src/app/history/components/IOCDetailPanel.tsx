'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { APP_COLORS } from '@/lib/colors';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { EmptyState } from './EmptyState';
import { DetailHeader } from './detail/DetailHeader';
import { DetectionBreakdown } from './detail/DetectionBreakdown';
import { FileInfoSection } from './detail/FileInfoSection';
import { GeoReputationSection } from './detail/GeoReputationSection';
import { MitreAttackSection } from './detail/MitreAttackSection';
import { MultiSourcePanel } from './detail/MultiSourcePanel';
import { SandboxSection } from './detail/SandboxSection';
import { ThreatIntelSection } from './detail/ThreatIntelSection';
import { VerdictBanner } from './detail/VerdictBanner';
import type { IOCDetailData } from './detail/types';
import { toSafeStats } from './detail/types';

interface IOCDetailPanelProps {
  ioc: string;
  iocType?: string | null;
  onClose: () => void;
}

export function IOCDetailPanel({ ioc, iocType, onClose }: IOCDetailPanelProps) {
  const { token } = useAuth();
  const [details, setDetails] = useState<IOCDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDetails = async () => {
    if (!token || !ioc) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/history-v2/${encodeURIComponent(ioc)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch IOC details (${response.status})`);
      }

      const payload = await response.json();
      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.error || 'Failed to load IOC details');
      }

      setDetails(payload.data as IOCDetailData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load IOC details');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetails();
  }, [ioc, token]);

  const copyIOC = () => {
    navigator.clipboard.writeText(ioc);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const safeStats = useMemo(() => toSafeStats(details?.stats), [details?.stats]);
  const totalDetections = safeStats.malicious + safeStats.suspicious + safeStats.harmless + safeStats.undetected;

  if (error && !loading) {
    return <EmptyState variant="error" message={error} onRetry={() => void fetchDetails()} />;
  }

  return (
    <div className="h-full min-h-0">
      {loading && !details ? (
        <div className="flex h-[420px] items-center justify-center rounded-2xl border" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
          <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: APP_COLORS.textSecondary }}>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading IOC details...
          </div>
        </div>
      ) : null}

      {details ? (
        <ScrollArea className="h-full max-h-full" variant="thin">
          <div className="space-y-4 pb-6">
            <DetailHeader
              ioc={details.ioc || ioc}
              iocType={iocType || details.type}
              source={details.metadata?.source}
              searchedAt={details.metadata?.searchedAt}
              copied={copied}
              onCopy={copyIOC}
              onClose={onClose}
            />

            <VerdictBanner
              verdict={details.verdict}
              severity={details.threatIntel?.severity}
              riskScore={details.riskScore}
              riskLevel={details.riskLevel}
              confidence={details.threatIntel?.confidence}
              totalDetections={totalDetections}
            />

            <DetectionBreakdown stats={details.stats} detections={details.detections} />

            <ThreatIntelSection threatIntel={details.threatIntel} />

            <MultiSourcePanel details={details} />

            <FileInfoSection details={details} />

            <GeoReputationSection geolocation={details.geolocation} abuseIPDB={details.abuseIPDB} />

            <MitreAttackSection mitreAttack={details.mitreAttack} />

            <SandboxSection sandboxAnalysis={details.sandboxAnalysis} />
          </div>
        </ScrollArea>
      ) : null}
    </div>
  );
}
