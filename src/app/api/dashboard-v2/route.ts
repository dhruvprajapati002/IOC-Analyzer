import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import { IocUserHistory } from '@/lib/models/IocUserHistory';
import { IocCache } from '@/lib/models/IocCache';
import { APP_COLORS } from '@/lib/colors';
import type { IOCAnalysisResult } from '@/lib/threat-intel/types/threat-intel.types';

const dashboardCache: Record<string, any> = {};
const cacheTimestamp: Record<string, number> = {};
const CACHE_DURATION = 30000;

const RANGE_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

function buildDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeSeverity(severity?: string) {
  if (!severity) return 'unknown';
  const lower = severity.toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(lower)) {
    return lower;
  }
  return 'unknown';
}

function severityToLabel(severity: string) {
  if (!severity) return 'Low';
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    const timeRange = searchParams.get('range') || 'weekly';
    const daysToFetch = RANGE_DAYS[timeRange] || 7;
    const cacheKey = `dashboard_v2_${userId}_${timeRange}`;

    const now = Date.now();
    if (
      !forceRefresh &&
      dashboardCache[cacheKey] &&
      cacheTimestamp[cacheKey] &&
      now - cacheTimestamp[cacheKey] < CACHE_DURATION
    ) {
      const response = NextResponse.json(dashboardCache[cacheKey]);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, max-age=30');
      response.headers.set('X-Time-Range', timeRange);
      return response;
    }

    const startDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    await connectDB();

    const historyRecords = await IocUserHistory.find({
      userId,
      searched_at: { $gte: startDate },
    }).lean();

    const cacheQueries = historyRecords.map((record) => ({
      value: record.value,
      type: record.type,
    }));

    let cacheMap = new Map<string, any>();
    if (cacheQueries.length > 0) {
      const cacheDocs = await IocCache.find({ $or: cacheQueries }).lean();
      cacheDocs.forEach((doc: any) => {
        cacheMap.set(`${doc.value}::${doc.type}`, doc);
      });
    }

    const verdictCounts = {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
      unknown: 0,
    };

    const severityCounts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };

    const typeCounts: Record<string, number> = {
      ip: 0,
      domain: 0,
      url: 0,
      hash: 0,
    };

    const dailyBuckets: Record<string, { total: number; threats: number; clean: number }> = {};
    const threatTypeCounts: Record<string, number> = {};
    const malwareFamilyCounts: Record<string, { count: number; severity: string }> = {};
    const geoBuckets: Record<string, any> = {};
    const fileTypeCounts: Record<string, number> = {};
    const detectionEngines: Record<string, { total: number; malicious: number }> = {};

    let totalFiles = 0;
    let maliciousFileCount = 0;
    let cleanFileCount = 0;
    let totalFileSize = 0;

    historyRecords.forEach((record: any) => {
      const cacheDoc = cacheMap.get(`${record.value}::${record.type}`);
      const analysis = cacheDoc?.analysis as IOCAnalysisResult | undefined;
      const verdict = (record.verdict || analysis?.verdict || 'unknown').toLowerCase();
      const severity = normalizeSeverity(analysis?.severity || record.verdict || 'unknown');
      const dateKey = buildDayKey(new Date(record.searched_at));

      verdictCounts[verdict as keyof typeof verdictCounts] =
        (verdictCounts[verdict as keyof typeof verdictCounts] || 0) + 1;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;

      typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;

      const bucket = dailyBuckets[dateKey] || { total: 0, threats: 0, clean: 0 };
      bucket.total += 1;
      if (['malicious', 'suspicious'].includes(verdict)) {
        bucket.threats += 1;
      }
      if (['harmless', 'undetected'].includes(verdict)) {
        bucket.clean += 1;
      }
      dailyBuckets[dateKey] = bucket;

      const threatTypes = analysis?.threatIntel?.threatTypes || [];
      threatTypes.forEach((type) => {
        threatTypeCounts[type] = (threatTypeCounts[type] || 0) + 1;
      });

      const vtFamilies = (analysis as any)?.vtData?.malware_families || [];
      vtFamilies.forEach((family: string) => {
        const entry = malwareFamilyCounts[family] || { count: 0, severity: severityToLabel(severity) };
        entry.count += 1;
        malwareFamilyCounts[family] = entry;
      });

      const detections = analysis?.threatIntel?.detections || [];
      detections.forEach((det: any) => {
        if (!det?.engine) return;
        const engineKey = det.engine;
        const entry = detectionEngines[engineKey] || { total: 0, malicious: 0 };
        entry.total += 1;
        if (det.category === 'malicious') {
          entry.malicious += 1;
        }
        detectionEngines[engineKey] = entry;
      });

      if (record.type === 'ip') {
        const geo = analysis?.reputation?.geolocation;
        if (geo?.countryCode || geo?.countryName) {
          const countryKey = geo.countryCode || geo.countryName || 'Unknown';
          const entry = geoBuckets[countryKey] || {
            country: geo.countryCode || countryKey,
            countryName: geo.countryName || countryKey,
            count: 0,
            maliciousCount: 0,
            suspiciousCount: 0,
            harmlessCount: 0,
            undetectedCount: 0,
            threatCount: 0,
          };

          entry.count += 1;
          if (verdict === 'malicious') entry.maliciousCount += 1;
          if (verdict === 'suspicious') entry.suspiciousCount += 1;
          if (verdict === 'harmless') entry.harmlessCount += 1;
          if (verdict === 'undetected') entry.undetectedCount += 1;
          if (['malicious', 'suspicious'].includes(verdict)) entry.threatCount += 1;

          geoBuckets[countryKey] = entry;
        }
      }

      const isFileAnalysis = record.source === 'file_analysis' || record.type === 'hash';
      if (isFileAnalysis && record.metadata?.filename) {
        totalFiles += 1;
        totalFileSize += record.metadata.filesize || 0;
        if (verdict === 'malicious') {
          maliciousFileCount += 1;
        } else if (verdict === 'harmless') {
          cleanFileCount += 1;
        }
        if (record.metadata.filetype) {
          const typeKey = record.metadata.filetype;
          fileTypeCounts[typeKey] = (fileTypeCounts[typeKey] || 0) + 1;
        }
      }
    });

    const totalIOCs = historyRecords.length;
    const maliciousIOCs = verdictCounts.malicious || 0;
    const suspiciousIOCs = verdictCounts.suspicious || 0;
    const cleanIOCs = verdictCounts.harmless || 0;
    const pendingIOCs = (verdictCounts.undetected || 0) + (verdictCounts.unknown || 0);
    const detectionRate = totalIOCs > 0
      ? Math.round(((maliciousIOCs + suspiciousIOCs) / totalIOCs) * 1000) / 10
      : 0;

    const dailyTrends = [] as Array<{ day: string; dateLabel: string; displayDate: string; threats: number; clean: number; total: number }>;
    for (let i = 0; i < daysToFetch; i += 1) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = buildDayKey(date);
      const entry = dailyBuckets[key] || { total: 0, threats: 0, clean: 0 };
      dailyTrends.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel: key,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        threats: entry.threats,
        clean: entry.clean,
        total: entry.total,
      });
    }

    const halfPoint = Math.floor(dailyTrends.length / 2) || 1;
    const firstHalfThreats = dailyTrends.slice(0, halfPoint).reduce((sum, d) => sum + d.threats, 0);
    const secondHalfThreats = dailyTrends.slice(halfPoint).reduce((sum, d) => sum + d.threats, 0);
    const threatsChange = firstHalfThreats > 0
      ? ((secondHalfThreats - firstHalfThreats) / firstHalfThreats) * 100
      : 0;

    const firstHalfTotal = dailyTrends.slice(0, halfPoint).reduce((sum, d) => sum + d.total, 0);
    const secondHalfTotal = dailyTrends.slice(halfPoint).reduce((sum, d) => sum + d.total, 0);
    const totalChange = firstHalfTotal > 0
      ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
      : 0;

    const iocTypeDistribution = [
      { type: 'IP Address', count: typeCounts.ip || 0, color: APP_COLORS.accentBlue, icon: 'globe' },
      { type: 'Domain', count: typeCounts.domain || 0, color: APP_COLORS.accentViolet, icon: 'server' },
      { type: 'URL', count: typeCounts.url || 0, color: APP_COLORS.accentPink, icon: 'link' },
      { type: 'File Hash', count: typeCounts.hash || 0, color: APP_COLORS.warning, icon: 'file' },
    ].filter((item) => item.count > 0);

    const totalForPercentage = totalIOCs || 1;
    const threatTypes = [
      { type: 'Malicious', count: maliciousIOCs, percentage: Math.round((maliciousIOCs / totalForPercentage) * 100), color: APP_COLORS.dangerHover },
      { type: 'Suspicious', count: suspiciousIOCs, percentage: Math.round((suspiciousIOCs / totalForPercentage) * 100), color: APP_COLORS.accentOrange },
      { type: 'Harmless', count: cleanIOCs, percentage: Math.round((cleanIOCs / totalForPercentage) * 100), color: APP_COLORS.successGreen },
      { type: 'Undetected', count: verdictCounts.undetected || 0, percentage: Math.round(((verdictCounts.undetected || 0) / totalForPercentage) * 100), color: APP_COLORS.textTertiary },
      { type: 'Unknown', count: verdictCounts.unknown || 0, percentage: Math.round(((verdictCounts.unknown || 0) / totalForPercentage) * 100), color: APP_COLORS.accentPurple600 },
    ].filter((item) => item.count > 0);

    const threatVectors = Object.entries(threatTypeCounts).map(([name, count]) => ({
      name,
      count,
      severity: 'medium',
      detectionRate: totalIOCs > 0 ? (count / totalIOCs) * 100 : 0,
      riskLevel: count > 10 ? 'high' : 'low',
      color: APP_COLORS.accentPurple,
      description: '',
      percentage: totalIOCs > 0 ? (count / totalIOCs) * 100 : 0,
    }));

    const geoDistribution = Object.values(geoBuckets).map((entry: any) => ({
      ...entry,
      threatPercentage: entry.count > 0 ? (entry.threatCount / entry.count) * 100 : 0,
      verdictBreakdown: {
        malicious: entry.maliciousCount || 0,
        suspicious: entry.suspiciousCount || 0,
        harmless: entry.harmlessCount || 0,
        undetected: entry.undetectedCount || 0,
      },
    }));

    const topFileTypes = Object.entries(fileTypeCounts).map(([type, count]) => ({
      type,
      count,
    }));

    const threatIntelBySeverity = ['critical', 'high', 'medium', 'low'].map((sev) => ({
      severity: sev,
      count: severityCounts[sev] || 0,
    }));

    const malwareFamilies = Object.entries(malwareFamilyCounts)
      .map(([name, entry]) => ({ name, count: entry.count, severity: entry.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const detectionEnginePerformance = Object.entries(detectionEngines)
      .map(([engine, entry]) => ({
        engine,
        totalDetections: entry.total,
        maliciousDetections: entry.malicious,
        detectionRate: entry.total > 0 ? (entry.malicious / entry.total) * 100 : 0,
      }))
      .sort((a, b) => b.totalDetections - a.totalDetections)
      .slice(0, 10);

    const dashboardData = {
      stats: {
        totalIOCs,
        maliciousIOCs,
        cleanIOCs,
        suspiciousIOCs,
        pendingIOCs,
        detectionRate,
        trends: {
          totalIOCs: Math.round(totalChange * 10) / 10,
          threatsDetected: Math.round(threatsChange * 10) / 10,
        },
      },
      dailyTrends,
      threatTypes,
      threatVectors,
      iocTypeDistribution,
      geoDistribution,
      fileAnalysis: {
        totalFiles,
        avgFileSize: totalFiles > 0 ? Math.round(totalFileSize / totalFiles) : 0,
        maliciousFiles: maliciousFileCount,
        cleanFiles: cleanFileCount,
        detectionRate: totalFiles > 0
          ? Math.round((maliciousFileCount / totalFiles) * 1000) / 10
          : 0,
        topFileTypes,
      },
      mitreAttack: { totalTechniques: 0, topTechniques: [] },
      threatIntelligence: {
        bySeverity: threatIntelBySeverity,
        totalCritical: severityCounts.critical || 0,
        totalHigh: severityCounts.high || 0,
        totalMedium: severityCounts.medium || 0,
        totalLow: severityCounts.low || 0,
      },
      malwareFamilies,
      detectionEngines: detectionEnginePerformance,
      timeRange,
      daysIncluded: daysToFetch,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
      dataVersion: '2.1-mongo',
      privacyMode: 'history-only',
    };

    dashboardCache[cacheKey] = dashboardData;
    cacheTimestamp[cacheKey] = now;

    const processingTime = Date.now() - startTime;
    const response = NextResponse.json(dashboardData);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=30');
    response.headers.set('X-Dashboard-IOCs', totalIOCs.toString());
    response.headers.set('X-Data-Version', '2.1-mongo');
    response.headers.set('X-Time-Range', timeRange);
    response.headers.set('X-Processing-Time', `${processingTime}ms`);

    return response;
  } catch (error: any) {
    console.error('Dashboard-v2 API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error.message || 'Unknown error',
        stats: {
          totalIOCs: 0,
          maliciousIOCs: 0,
          cleanIOCs: 0,
          suspiciousIOCs: 0,
          pendingIOCs: 0,
          detectionRate: 0,
          trends: { totalIOCs: 0, threatsDetected: 0 },
        },
        dailyTrends: [],
        threatTypes: [],
        threatVectors: [],
        iocTypeDistribution: [],
        geoDistribution: [],
        fileAnalysis: {
          totalFiles: 0,
          avgFileSize: 0,
          maliciousFiles: 0,
          cleanFiles: 0,
          detectionRate: 0,
          topFileTypes: [],
        },
        mitreAttack: { totalTechniques: 0, topTechniques: [] },
        threatIntelligence: {
          bySeverity: [],
          totalCritical: 0,
          totalHigh: 0,
          totalMedium: 0,
          totalLow: 0,
        },
        malwareFamilies: [],
        detectionEngines: [],
      },
      { status: 500 }
    );
  }
}