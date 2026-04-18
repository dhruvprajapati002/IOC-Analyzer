import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

export interface DetectionItem {
  engine: string;
  category: string;
  result: string;
}

export interface AnalysisView {
  query: string;
  timestamp: string;
  totalAnalyzed: number;
  type: string;
  verdict: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  maliciousIocs: number;
  suspiciousIocs: number;
  cleanIocs: number;
  undetectedDetections: number;
  maliciousDetections: number;
  suspiciousDetections: number;
  cleanDetections: number;
  detections: DetectionItem[];
  threatCategories: string[];
  familyLabels: string[];
  popularThreatLabel: string | null;
  suggestedThreatLabel: string | null;
  fileInfo: any;
  sandboxAnalysis: any;
  multiSourceData: any;
  vtData: any;
  sourcesAvailable: string[];
  sourcesFailed: string[];
  ipReputation: Array<{
    ip: string;
    reputation: any;
    geolocation: any;
    abuseipdb?: any;
    threats?: any;
  }>;
  rawResults: any[];
}

interface UseAnalysisOptions {
  onHeaders?: (headers: Headers) => void;
  onRateLimit?: (payload: { type: 'minute' | 'day'; retryAfter: number }) => void;
}

const PHASE_MESSAGES = [
  'Querying VirusTotal...',
  'Enriching with GreyNoise...',
  'Compiling results...',
];

function gatherDetections(results: any[]): DetectionItem[] {
  const output: DetectionItem[] = [];

  for (const result of results) {
    const direct = result?.threatIntel?.detections;
    if (Array.isArray(direct) && direct.length > 0) {
      direct.forEach((item: any) => {
        if (!item?.category) return;
        output.push({
          engine: item.engine || 'Unknown Engine',
          category: item.category,
          result: item.result || 'Detected',
        });
      });
      continue;
    }

    const vtResults =
      result?.vtData?.raw?.raw?.data?.attributes?.last_analysis_results ||
      result?.vtData?.raw?.summary?.last_analysis_results;

    if (vtResults && typeof vtResults === 'object') {
      Object.entries(vtResults).forEach(([engine, data]) => {
        const entry = data as any;
        if (!entry?.category || !['malicious', 'suspicious'].includes(entry.category)) {
          return;
        }
        output.push({
          engine: entry.engine_name || engine,
          category: entry.category,
          result: entry.result || 'Detected',
        });
      });
    }
  }

  return output;
}

function normalizeAnalysis(query: string, results: any[]): AnalysisView {
  const first = results[0] || {};
  const detections = gatherDetections(results);

  let maliciousDetections = 0;
  let suspiciousDetections = 0;
  let cleanDetections = 0;
  let undetectedDetections = 0;

  results.forEach((record) => {
    const stats = record?.stats || {};
    maliciousDetections += Number(stats.malicious || 0);
    suspiciousDetections += Number(stats.suspicious || 0);
    cleanDetections += Number(stats.harmless || 0);
    undetectedDetections += Number(stats.undetected || 0);
  });

  const totalAnalyzed = results.length;
  const maliciousIocs = results.filter((item) => item?.verdict === 'malicious').length;
  const suspiciousIocs = results.filter((item) => item?.verdict === 'suspicious').length;
  const cleanIocs = results.filter((item) => ['harmless', 'clean'].includes(item?.verdict)).length;

  const vtData = first?.vtData || null;
  const threatCategories =
    vtData?.threat_categories || first?.threatIntel?.threatTypes || first?.threatIntel?.threat_categories || [];
  const familyLabels = vtData?.family_labels || first?.threatIntel?.familyLabels || [];

  const ipReputation =
    first?.type === 'ip' && first?.reputation
      ? [
          {
            ip: first?.ioc || query,
            reputation: {
              riskScore: first?.riskScore || first?.reputation?.riskScore || 0,
              verdict: first?.verdict || first?.reputation?.verdict || 'unknown',
              riskLevel: first?.riskLevel || first?.reputation?.riskLevel || 'low',
              confidence: first?.threatIntel?.confidence || 0,
            },
            geolocation: first?.reputation?.geolocation,
            abuseipdb: first?.reputation?.abuseipdb,
            threats: first?.reputation?.intelligence,
          },
        ]
      : [];

  return {
    query,
    timestamp: new Date().toISOString(),
    totalAnalyzed,
    type: first?.type || 'unknown',
    verdict: first?.verdict || 'unknown',
    riskScore: first?.riskScore || first?.reputation?.riskScore || 0,
    riskLevel: (first?.riskLevel || first?.reputation?.riskLevel || 'unknown') as
      | 'critical'
      | 'high'
      | 'medium'
      | 'low'
      | 'unknown',
    maliciousIocs,
    suspiciousIocs,
    cleanIocs,
    undetectedDetections,
    maliciousDetections,
    suspiciousDetections,
    cleanDetections,
    detections,
    threatCategories,
    familyLabels,
    popularThreatLabel:
      vtData?.popular_threat_label ||
      vtData?.popular_threat_classification?.suggested_threat_label ||
      null,
    suggestedThreatLabel:
      vtData?.suggested_threat_label ||
      vtData?.popular_threat_classification?.suggested_threat_label ||
      null,
    fileInfo: first?.fileInfo || null,
    sandboxAnalysis: first?.sandboxAnalysis || null,
    multiSourceData: first?.multiSourceData || null,
    vtData,
    sourcesAvailable: first?.sources_available || [],
    sourcesFailed: first?.sources_failed || [],
    ipReputation,
    rawResults: results,
  };
}

export function useAnalysis({ onHeaders, onRateLimit }: UseAnalysisOptions) {
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [activeQuery, setActiveQuery] = useState('');

  useEffect(() => {
    if (!loading) return undefined;
    const timer = window.setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASE_MESSAGES.length);
    }, 800);
    return () => window.clearInterval(timer);
  }, [loading]);

  const runAnalysis = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);
      setActiveQuery(trimmed);

      try {
        const iocs = trimmed
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        const response = await apiFetch('/api/ioc-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            iocs,
            label: 'Threat Hunt Analysis',
          }),
        });

        onHeaders?.(response.headers);

        if (response.status === 429) {
          const payload = await response.json();
          const type = payload?.type === 'day' ? 'day' : 'minute';
          const retryAfter = Number(payload?.retryAfter || 0);
          onRateLimit?.({ type, retryAfter });
          setError(payload?.message || 'Rate limit reached. Please retry later.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Analysis failed (${response.status})`);
        }

        const payload = await response.json();
        const responseResults =
          (Array.isArray(payload?.results) && payload.results) ||
          (Array.isArray(payload?.data) && payload.data) ||
          [];

        if (responseResults.length === 0) {
          setError('No analysis results were returned.');
          setAnalysis(null);
          setLoading(false);
          return;
        }

        const normalized = normalizeAnalysis(trimmed, responseResults);
        setAnalysis(normalized);
      } catch (requestError: any) {
        setError(requestError?.message || 'Unable to run analysis');
      } finally {
        setLoading(false);
      }
    },
    [onHeaders, onRateLimit]
  );

  const clearResults = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setActiveQuery('');
  }, []);

  const phaseMessage = useMemo(() => PHASE_MESSAGES[phaseIndex], [phaseIndex]);

  return {
    analysis,
    loading,
    error,
    phaseMessage,
    activeQuery,
    activeType: analysis?.type || '',
    runAnalysis,
    clearResults,
    setError,
  };
}
