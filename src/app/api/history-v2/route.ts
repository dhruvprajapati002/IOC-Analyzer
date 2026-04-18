// api/history-v2/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import { IocUserHistory } from '@/lib/models/IocUserHistory';
import { IocCache } from '@/lib/models/IocCache';
import type { IOCAnalysisResult } from '@/lib/threat-intel/types/threat-intel.types';

function buildHistoryMatch(userId: string, params: {
  search?: string;
  type?: string;
  verdict?: string;
  source?: string;
}) {
  const match: Record<string, any> = { userId };

  if (params.search) {
    const regex = new RegExp(params.search, 'i');
    match.$or = [{ value: regex }, { label: regex }];
  }

  if (params.type && params.type !== 'all') {
    match.type = params.type;
  }

  if (params.verdict && params.verdict !== 'all') {
    match.verdict = params.verdict;
  }

  if (params.source && params.source !== 'all') {
    match.source = params.source;
  }

  return match;
}

export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const verdict = searchParams.get('verdict') || '';
    const source = searchParams.get('source') || '';
    const sortBy = searchParams.get('sortBy') || 'searched_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const from = (page - 1) * limit;
    const sortField = sortBy === 'searched_at' ? 'searched_at' : 'searched_at';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    await connectDB();

    const match = buildHistoryMatch(userId, { search, type, verdict, source });
    const basePipeline: any[] = [
      { $match: match },
      { $sort: { searched_at: -1 } },
      {
        $group: {
          _id: { value: '$value', type: '$type' },
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ];

    const [countResult, records] = await Promise.all([
      IocUserHistory.aggregate([...basePipeline, { $count: 'total' }]),
      IocUserHistory.aggregate([
        ...basePipeline,
        { $sort: { [sortField]: sortDirection } },
        { $skip: from },
        { $limit: limit },
      ]),
    ]);

    const totalCount = countResult?.[0]?.total || 0;

    const cacheQueries = records.map((record: any) => ({
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

    const formattedRecords = records.map((record: any) => {
      const cacheDoc = cacheMap.get(`${record.value}::${record.type}`);
      const analysis = cacheDoc?.analysis as IOCAnalysisResult | undefined;
      const stats = analysis?.stats || {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
      };

      const threatTypes = analysis?.threatIntel?.threatTypes || [];
      const severity = analysis?.severity || 'unknown';
      const verdictValue = record.verdict || analysis?.verdict || 'unknown';
      const vtData = (analysis as any)?.vtData || {};

      const metadata = record.metadata
        ? {
            ...record.metadata,
            riskScore: analysis?.riskScore ?? null,
            riskLevel: analysis?.riskLevel ?? null,
          }
        : null;

      return {
        id: record._id?.toString?.() || record._id,
        ioc: record.value,
        type: record.type,
        verdict: verdictValue,
        stats,
        searchedAt: record.searched_at,
        threatTypes,
        severity,
        popularThreatLabel: vtData?.popular_threat_label || vtData?.details?.popular_threat_label || null,
        familyLabels: vtData?.malware_families || [],
        label: record.label || null,
        source: record.source || null,
        metadata,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        records: formattedRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error('[History-v2] Error fetching history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch history data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return new NextResponse(null, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return new NextResponse(null, { status: 401 });
    }

    const userId = payload.userId;
    const searchParams = request.nextUrl.searchParams;
    const lastFetchTime = searchParams.get('since');

    await connectDB();

    const match: Record<string, any> = { userId };
    if (lastFetchTime) {
      match.searched_at = { $gt: new Date(lastFetchTime) };
    }

    const count = await IocUserHistory.countDocuments(match);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': count.toString(),
        'X-Last-Updated': new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[History-v2] Error checking for updates:', error);
    return new NextResponse(null, { status: 500 });
  }
}