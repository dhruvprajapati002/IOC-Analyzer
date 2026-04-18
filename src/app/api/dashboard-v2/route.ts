import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { IocUserHistory } from '@/lib/models/IocUserHistory';
import { IocCache } from '@/lib/models/IocCache';
import { SYSTEM_USER_ID } from '@/lib/system-user';

type TimeRange = 'daily' | 'weekly' | 'monthly';

type DashboardCacheEntry = {
  timestamp: number;
  data: Record<string, unknown>;
};

const CACHE_TTL_MS = 30 * 1000;
const dashboardCache = new Map<string, DashboardCacheEntry>();

const RANGE_DAYS: Record<TimeRange, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

const THREAT_VECTOR_COLORS = {
  high: '#dc2626',
  low: '#3b82f6',
};

const THREAT_VECTOR_DESCRIPTIONS: Record<string, string> = {
  ransomware: 'File encryption and extortion activity patterns.',
  trojan: 'Malware delivery and credential theft activity.',
  botnet: 'Distributed command-and-control infrastructure behavior.',
  phishing: 'Credential harvesting and social engineering campaigns.',
  c2: 'Command-and-control callback infrastructure.',
  scanner: 'Reconnaissance and scanning source patterns.',
  miner: 'Unauthorized cryptomining related indicators.',
};

const IOC_TYPE_LABELS: Record<string, string> = {
  ip: 'IP Address',
  domain: 'Domain',
  url: 'URL',
  hash: 'File Hash',
};

const VERDICT_LABEL_MAP: Record<string, string> = {
  malicious: 'Malicious',
  suspicious: 'Suspicious',
  harmless: 'Harmless',
  clean: 'Harmless',
  undetected: 'Undetected',
  unknown: 'Unknown',
  pending: 'Unknown',
  '': 'Unknown',
};

const VERDICT_COLOR_MAP: Record<string, string> = {
  Malicious: '#dc2626',
  Suspicious: '#d97706',
  Harmless: '#16a34a',
  Undetected: '#6b6653',
  Unknown: '#9c87f5',
};

function toRange(value: string | null): TimeRange {
  if (value === 'daily' || value === 'weekly' || value === 'monthly') {
    return value;
  }
  return 'weekly';
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(1));
}

function percentDelta(firstHalfValue: number, secondHalfValue: number): number {
  if (firstHalfValue === 0) {
    return secondHalfValue === 0 ? 0 : 100;
  }
  return clampPercent(((secondHalfValue - firstHalfValue) / firstHalfValue) * 100);
}

function normalizeVerdict(value?: string): 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' {
  const v = (value ?? '').toLowerCase().trim();
  if (v === 'malicious') return 'malicious';
  if (v === 'suspicious') return 'suspicious';
  if (v === 'harmless' || v === 'clean') return 'harmless';
  if (v === 'undetected') return 'undetected';
  return 'unknown';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await verifyAuth(request);

    const userId = SYSTEM_USER_ID;
    const searchParams = new URL(request.url).searchParams;
    const range = toRange(searchParams.get('range'));
    const days = RANGE_DAYS[range];
    const startDate = new Date(Date.now() - days * 86400 * 1000);
    startDate.setHours(0, 0, 0, 0);
    const nowDate = new Date();

    const cacheKey = `dashboard_v2_system_${range}`;
    const cached = dashboardCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Time-Range': range,
          'Cache-Control': 'private, max-age=30',
        },
      });
    }

    await connectDB();

    let historyDocs = await IocUserHistory.find({
      userId,
      searched_at: { $gte: startDate },
    })
      .sort({ searched_at: 1 })
      .lean();

    let dataScope: 'system' | 'legacy-fallback' = 'system';
    if (historyDocs.length === 0) {
      historyDocs = await IocUserHistory.find({
        searched_at: { $gte: startDate },
      })
        .sort({ searched_at: 1 })
        .lean();
      dataScope = 'legacy-fallback';
    }

    const pairMap = new Map<string, { value: string; type: string }>();
    for (const doc of historyDocs) {
      const key = `${doc.value}::${doc.type}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, { value: doc.value, type: doc.type });
      }
    }

    const iocPairs = Array.from(pairMap.values());
    const cacheDocs = iocPairs.length
      ? await IocCache.find({ $or: iocPairs }).lean()
      : [];

    const cacheMap = new Map<string, any>();
    for (const cacheDoc of cacheDocs) {
      cacheMap.set(`${cacheDoc.value}::${cacheDoc.type}`, cacheDoc);
    }

    const typeCountMap: Record<string, number> = { ip: 0, domain: 0, url: 0, hash: 0 };
    for (const doc of historyDocs) {
      const t = String(doc.type ?? '').toLowerCase().trim();
      if (t in typeCountMap) {
        typeCountMap[t]++;
      } else if (t === 'file_hash' || t === 'filehash') {
        typeCountMap.hash++;
      } else if (t === 'ip_address' || t === 'ipaddress') {
        typeCountMap.ip++;
      }
    }
    const totalTypeCount = Object.values(typeCountMap).reduce((a, b) => a + b, 0);

    const iocTypeDistribution = Object.entries(typeCountMap).map(([key, count]) => ({
      type: IOC_TYPE_LABELS[key] ?? key,
      rawType: key,
      count,
      percentage: totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0,
      color:
        key === 'ip'
          ? '#3b82f6'
          : key === 'domain'
            ? '#c96442'
            : key === 'url'
              ? '#f59e0b'
              : key === 'hash'
                ? '#9c87f5'
                : '#6b7280',
      icon:
        key === 'ip'
          ? 'Globe'
          : key === 'domain'
            ? 'Link'
            : key === 'url'
              ? 'ExternalLink'
              : key === 'hash'
                ? 'FileDigit'
                : 'Circle',
    }));

    const verdictCount: Record<string, number> = {
      Malicious: 0,
      Suspicious: 0,
      Harmless: 0,
      Undetected: 0,
      Unknown: 0,
    };

    for (const doc of historyDocs) {
      const raw = String(doc.verdict ?? doc.label ?? '').toLowerCase().trim();
      const normalized = VERDICT_LABEL_MAP[raw] ?? 'Unknown';
      verdictCount[normalized]++;
    }
    const totalVerdicts = historyDocs.length || 1;
    const threatTypes = Object.entries(verdictCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalVerdicts) * 100),
        color: VERDICT_COLOR_MAP[type] ?? '#6b7280',
      }))
      .sort((a, b) => b.count - a.count);

    const buckets: Map<string, { threats: number; suspicious: number; clean: number; total: number }> = new Map();
    for (let d = new Date(startDate); d <= nowDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { threats: 0, suspicious: 0, clean: 0, total: 0 });
    }

    for (const doc of historyDocs) {
      const key = new Date(doc.searched_at).toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.total++;
      const v = String(doc.verdict ?? doc.label ?? '').toLowerCase().trim();
      if (v === 'malicious' || v === 'suspicious') {
        bucket.threats++;
        if (v === 'suspicious') bucket.suspicious++;
      } else {
        bucket.clean++;
      }
    }

    const dailyTrends = Array.from(buckets.entries()).map(([dateLabel, b]) => {
      const d = new Date(dateLabel);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        threats: b.threats,
        suspicious: b.suspicious,
        clean: b.clean,
        total: b.total,
      };
    });

    const geoMap = new Map<
      string,
      {
        country: string;
        countryName: string;
        count: number;
        maliciousCount: number;
        suspiciousCount: number;
        harmlessCount: number;
        undetectedCount: number;
      }
    >();

      const severityCount = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };

      for (const [key] of cacheMap) {
        const cacheDoc = cacheMap.get(key);
        if (!cacheDoc) continue;

        const sev = String(
          cacheDoc.severity ??
            cacheDoc.analysis?.severity ??
            cacheDoc.analysis?.riskLevel ??
            cacheDoc.analysis?.threatIntel?.severity ??
            ''
        )
          .toLowerCase()
          .trim();

        if (sev === 'critical') severityCount.critical++;
        else if (sev === 'high') severityCount.high++;
        else if (sev === 'medium' || sev === 'moderate') severityCount.medium++;
        else if (sev === 'low' || sev === 'info') severityCount.low++;
        else severityCount.unknown++;
      }

      for (const doc of historyDocs) {
        const key = `${doc.value}::${doc.type}`;
        const cacheDoc = cacheMap.get(key);
        if (cacheDoc) continue;
        const verdict = String(doc.verdict ?? '').toLowerCase().trim();
        if (verdict === 'malicious') severityCount.high++;
        else if (verdict === 'suspicious') severityCount.medium++;
        else severityCount.low++;
      }

      const threatIntelligence = {
        bySeverity: [
          { severity: 'critical', count: severityCount.critical },
          { severity: 'high', count: severityCount.high },
          { severity: 'medium', count: severityCount.medium },
          { severity: 'low', count: severityCount.low },
        ],
        totalCritical: severityCount.critical,
        totalHigh: severityCount.high,
        totalMedium: severityCount.medium,
        totalLow: severityCount.low,
      };

      const engineMap: Map<string, { total: number; malicious: number }> = new Map();
      for (const cacheDoc of cacheMap.values()) {
        const detections: any[] =
          cacheDoc.analysis?.threatIntel?.detections ??
          cacheDoc.analysis?.detections ??
          cacheDoc.threatIntel?.detections ??
          [];

        for (const det of detections) {
          const engine = String(det?.engine ?? det?.source ?? det?.name ?? '').trim();
          if (!engine) continue;
          const current = engineMap.get(engine) ?? { total: 0, malicious: 0 };
          current.total++;
          const isMalicious =
            det?.detected === true ||
            String(det?.verdict ?? '').toLowerCase() === 'malicious' ||
            Number(det?.confidence ?? 0) > 0.7;
          if (isMalicious) current.malicious++;
          engineMap.set(engine, current);
        }

        if (detections.length === 0) {
          const src = String(cacheDoc.source ?? cacheDoc.analysis?.source ?? '').trim();
          if (src) {
            const current = engineMap.get(src) ?? { total: 0, malicious: 0 };
            current.total++;
            if (String(cacheDoc.verdict ?? '').toLowerCase() === 'malicious') current.malicious++;
            engineMap.set(src, current);
          }
        }
      }

      if (engineMap.size === 0) {
        for (const doc of historyDocs) {
          const src = String(doc.source ?? '').trim();
          if (!src) continue;
          const current = engineMap.get(src) ?? { total: 0, malicious: 0 };
          current.total++;
          if (String(doc.verdict ?? '').toLowerCase() === 'malicious') current.malicious++;
          engineMap.set(src, current);
        }
      }

      const detectionEngines = Array.from(engineMap.entries())
        .map(([engine, v]) => ({
          engine,
          totalDetections: v.total,
          maliciousDetections: v.malicious,
          detectionRate: v.total > 0 ? Math.round((v.malicious / v.total) * 100) : 0,
        }))
        .sort((a, b) => b.totalDetections - a.totalDetections)
        .slice(0, 10);

      const familyMap: Map<string, { count: number; severity: string }> = new Map();
      for (const cacheDoc of cacheMap.values()) {
        const families: any[] =
          (cacheDoc.analysis as any)?.vtData?.malware_families ??
          (cacheDoc.analysis as any)?.malwareFamilies ??
          (cacheDoc.analysis as any)?.familyLabels?.map((n: string) => ({ name: n, count: 1 })) ??
          [];

        for (const fam of families) {
          const name = fam?.name ?? fam?.family ?? fam;
          if (typeof name !== 'string' || !name) continue;
          const existing = familyMap.get(name) ?? { count: 0, severity: 'high' };
          existing.count += Number(fam?.count ?? 1);
          existing.severity = String(cacheDoc.severity ?? cacheDoc.analysis?.severity ?? 'high').toLowerCase();
          familyMap.set(name, existing);
        }

        const threatTypes: string[] =
          cacheDoc.analysis?.threatIntel?.threatTypes ?? cacheDoc.threatIntel?.threatTypes ?? [];
        if (families.length === 0) {
          for (const t of threatTypes) {
            if (!t) continue;
            const existing = familyMap.get(t) ?? { count: 0, severity: 'medium' };
            existing.count++;
            familyMap.set(t, existing);
          }
        }
      }

      const malwareFamilies = Array.from(familyMap.entries())
        .map(([name, v]) => ({ name, count: v.count, severity: v.severity }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      const threatVectorCounts = new Map<string, number>();
      for (const cacheDoc of cacheMap.values()) {
        const threatTypes: string[] =
          cacheDoc.analysis?.threatIntel?.threatTypes ?? cacheDoc.threatIntel?.threatTypes ?? [];
        for (const threatType of threatTypes) {
          const normalized = String(threatType).toLowerCase().trim();
          if (!normalized) continue;
          threatVectorCounts.set(normalized, (threatVectorCounts.get(normalized) ?? 0) + 1);
        }
      }

      if (threatVectorCounts.size === 0) {
        for (const doc of historyDocs) {
          const fallbackType = String(doc.source ?? doc.type ?? '').toLowerCase().trim();
          if (!fallbackType) continue;
          threatVectorCounts.set(fallbackType, (threatVectorCounts.get(fallbackType) ?? 0) + 1);
        }
      }

      const totalThreatVectorMentions =
        Array.from(threatVectorCounts.values()).reduce((sum, count) => sum + count, 0) || 1;
      const threatVectors = Array.from(threatVectorCounts.entries())
        .map(([name, count]) => {
          const severity = count > 10 ? 'high' : 'low';
          return {
            name,
            count,
            severity,
            detectionRate: historyDocs.length ? clampPercent((count / historyDocs.length) * 100) : 0,
            riskLevel: severity,
            color: THREAT_VECTOR_COLORS[severity as 'high' | 'low'],
            description:
              THREAT_VECTOR_DESCRIPTIONS[name] ??
              `${name} related telemetry observed in analyzed indicators.`,
            percentage: clampPercent((count / totalThreatVectorMentions) * 100),
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      for (const doc of historyDocs) {
        const key = `${doc.value}::${doc.type}`;
        const cacheDoc = cacheMap.get(key);
        const analysis = cacheDoc?.analysis ?? {};
        const geo = analysis?.reputation?.geolocation ?? analysis?.geolocation;
        if (String(doc.type ?? '').toLowerCase() !== 'ip' || !geo) continue;

        const countryCode = String(geo.country ?? geo.countryCode ?? 'UN');
        const countryName = String(geo.countryName ?? geo.country ?? countryCode);
        const row = geoMap.get(countryCode) ?? {
          country: countryCode,
          countryName,
          count: 0,
          maliciousCount: 0,
          suspiciousCount: 0,
          harmlessCount: 0,
          undetectedCount: 0,
        };

        row.count++;
        const verdict = normalizeVerdict(String(doc.verdict ?? doc.label ?? ''));
        if (verdict === 'malicious') row.maliciousCount++;
        else if (verdict === 'suspicious') row.suspiciousCount++;
        else if (verdict === 'harmless') row.harmlessCount++;
        else if (verdict === 'undetected') row.undetectedCount++;
        geoMap.set(countryCode, row);
      }

      const geoDistribution = Array.from(geoMap.values())
        .map((row) => {
          const threatCount = row.maliciousCount + row.suspiciousCount;
          const threatPercentage = row.count > 0 ? Math.round((threatCount / row.count) * 100) : 0;
          return {
            ...row,
            threatCount,
            threatPercentage,
            verdictBreakdown: {
              malicious: row.maliciousCount,
              suspicious: row.suspiciousCount,
              harmless: row.harmlessCount,
              undetected: row.undetectedCount,
            },
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const fileDocs = historyDocs.filter((doc) => {
        const t = String(doc.type ?? '').toLowerCase().trim();
        return (
          doc.source === 'file_analysis' ||
          t === 'hash' ||
          t === 'file_hash' ||
          Boolean(doc.metadata?.filename)
        );
      });

      const totalFiles = fileDocs.length;
      const maliciousFiles = fileDocs.filter((d) =>
        ['malicious', 'suspicious'].includes(String(d.verdict ?? '').toLowerCase().trim())
      ).length;
      const cleanFiles = totalFiles - maliciousFiles;
      const fileSizes = fileDocs
        .map((d) => d.metadata?.filesize)
        .filter((s): s is number => typeof s === 'number' && s > 0);
      const avgFileSize =
        fileSizes.length > 0
          ? Math.round(fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length)
          : 0;

      const fileTypeMap: Map<string, number> = new Map();
      for (const doc of fileDocs) {
        const ft = String(doc.metadata?.filetype ?? 'Unknown');
        fileTypeMap.set(ft, (fileTypeMap.get(ft) ?? 0) + 1);
      }
      const topFileTypes = Array.from(fileTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const fileAnalysis = {
        totalFiles,
        avgFileSize,
        maliciousFiles,
        cleanFiles,
        detectionRate: totalFiles > 0 ? Math.round((maliciousFiles / totalFiles) * 100) : 0,
        topFileTypes,
      };

      const totalIOCs = historyDocs.length;
      const maliciousIOCs = verdictCount.Malicious;
      const suspiciousIOCs = verdictCount.Suspicious;
      const cleanIOCs = verdictCount.Harmless;
      const pendingIOCs = verdictCount.Unknown;
      const detectionRate =
        totalIOCs > 0 ? Math.round(((maliciousIOCs + suspiciousIOCs) / totalIOCs) * 100) : 0;

      const half = Math.max(1, Math.floor(historyDocs.length / 2));
      const firstHalf = historyDocs.slice(0, half);
      const secondHalf = historyDocs.slice(half);

      const countThreats = (docs: any[]) =>
        docs.filter((d) => {
          const v = String(d.verdict ?? d.label ?? '').toLowerCase().trim();
          return v === 'malicious' || v === 'suspicious';
        }).length;

      const firstHalfThreats = countThreats(firstHalf);
      const secondHalfThreats = countThreats(secondHalf);

      const threatFeed = [...historyDocs]
        .sort((a, b) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime())
        .slice(0, 20)
        .map((doc) => ({
          ioc: doc.value,
          type: doc.type,
          verdict: normalizeVerdict(String(doc.verdict ?? doc.label ?? '')),
          source: doc.source || 'ioc-search',
          timestamp: new Date(doc.searched_at).toISOString(),
        }));

      const payload = {
        stats: {
          totalIOCs,
          maliciousIOCs,
          cleanIOCs,
          suspiciousIOCs,
          pendingIOCs,
          detectionRate,
          trends: {
            totalIOCs: percentDelta(firstHalf.length, secondHalf.length),
            threatsDetected: percentDelta(firstHalfThreats, secondHalfThreats),
          },
        },
        dailyTrends,
        threatTypes,
        iocTypeDistribution,
        threatIntelligence,
        geoDistribution,
        threatVectors,
        fileAnalysis,
        malwareFamilies,
        detectionEngines,
        threatFeed,
        timeRange: range,
        daysIncluded: days,
        startDate: startDate.toISOString(),
        endDate: nowDate.toISOString(),
        cachedAt: new Date(now).toISOString(),
        dataVersion: '2.1-mongo',
        privacyMode: dataScope === 'system' ? 'history-only' : 'history-all-users-fallback',
      };

    dashboardCache.set(cacheKey, {
      timestamp: now,
      data: payload,
    });

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'X-Time-Range': range,
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('dashboard-v2 GET error', error);
    return NextResponse.json(
      {
        error: 'Failed to build dashboard payload',
        message: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}