// api/history-v2/[ioc]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getIOCFromCache, getLatestHistoryRecord } from '@/lib/ioc-cache';
import type { IOCAnalysisResult } from '@/lib/threat-intel/types/threat-intel.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ioc: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = payload.userId;
    const username = payload.username;
    const { ioc } = await params;
    const iocValue = decodeURIComponent(ioc);

    const historyRecord = await getLatestHistoryRecord(userId, iocValue);
    if (!historyRecord) {
      return NextResponse.json(
        { success: false, error: 'IOC not found in your history' },
        { status: 404 }
      );
    }

    const cacheResult = await getIOCFromCache(iocValue, historyRecord.type);
    const analysis = cacheResult.success ? (cacheResult.data as IOCAnalysisResult) : undefined;
    const stats = analysis?.stats || {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
    };

    const threatIntel = analysis?.threatIntel || {
      threatTypes: [],
      detections: [],
      severity: 'unknown',
      confidence: 0,
    };

    const vtData = (analysis as any)?.vtData || {};
    const reputation = vtData?.reputation || vtData?.details?.reputation || 0;
    const familyLabels = vtData?.malware_families || [];
    const popularThreatLabel = vtData?.popular_threat_label || vtData?.details?.popular_threat_label || null;
    const suggestedThreatLabel = vtData?.details?.suggested_threat_label || null;

    const cacheTtl = cacheResult.success && cacheResult.cache
      ? Math.max(
          0,
          Math.round(
            (new Date(cacheResult.cache.expiresAt).getTime() -
              new Date(cacheResult.cache.created_at).getTime()) /
              1000
          )
        )
      : 0;

    const details = {
      id: historyRecord._id?.toString?.() || historyRecord._id,
      ioc: iocValue,
      type: historyRecord.type,
      verdict: historyRecord.verdict || analysis?.verdict || 'unknown',
      label: historyRecord.label || null,
      stats,
      reputation,
      riskScore: analysis?.riskScore ?? null,
      riskLevel: analysis?.riskLevel ?? null,
      threatIntel: {
        threatTypes: threatIntel.threatTypes || [],
        severity: analysis?.severity || threatIntel.severity || 'unknown',
        confidence: threatIntel.confidence ?? 0,
        firstSeen: null,
        lastSeen: null,
        popularThreatLabel,
        familyLabels,
        threatCategories: vtData?.threat_types || [],
        suggestedThreatLabel,
      },
      detections: (threatIntel.detections || []).map((d: any) => ({
        engine: d.engine,
        category: d.category,
        result: d.result,
        method: d.method || null,
      })),
      fileInfo: analysis?.fileInfo || null,
      sandboxAnalysis: analysis?.sandboxAnalysis || null,
      codeInsights: null,
      mitreAttack: analysis?.mitreAttack || null,
      abuseIPDB: analysis?.reputation?.abuseipdb || null,
      geolocation: analysis?.reputation?.geolocation || null,
      whois: null,
      shodan: null,
      metadata: {
        searchedAt: historyRecord.searched_at,
        createdAt: historyRecord.searched_at,
        updatedAt: historyRecord.searched_at,
        lastAnalysisDate: analysis?.fetchedAt || null,
        username: username || '',
        cacheTtl,
        userNotes: null,
        userVerdict: null,
        source: historyRecord.source || null,
        filename: historyRecord.metadata?.filename || null,
        filesize: historyRecord.metadata?.filesize || null,
        filetype: historyRecord.metadata?.filetype || null,
        entropy: null,
        isPacked: null,
      },
      reputationData: analysis?.reputation || null,
      threatIntelData: threatIntel,
    };

    return NextResponse.json({ success: true, data: details });
  } catch (error: any) {
    console.error('[History-v2] Error fetching IOC details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch IOC details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}