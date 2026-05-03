import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { IocUserHistory } from '@/lib/models/IocUserHistory';
import { IocCache } from '@/lib/models/IocCache';
import { SYSTEM_USER_ID } from '@/lib/system-user';

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'all';
const RANGE_DAYS: Record<TimeRange, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  all: 3650,
};

function toRange(value: string | null): TimeRange {
  if (value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'all') return value;
  return 'all';
}

/**
 * GET /api/dashboard/graph-detail
 * Query params:
 *   - type: 'malicious_ips' | 'malicious_domains' | 'malicious_urls' | 'malicious_hashes' | 'suspicious' | 'harmless' | 'undetected'
 *   - range: 'daily' | 'weekly' | 'monthly' | 'all'
 *   - limit: number (default 50)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await verifyAuth(request);

    const userId = SYSTEM_USER_ID;
    const searchParams = new URL(request.url).searchParams;
    const graphType = (searchParams.get('type') ?? '').toLowerCase().trim();
    const range = toRange(searchParams.get('range'));
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    if (!graphType) {
      return NextResponse.json({ success: false, error: 'Missing required query param: type' }, { status: 400 });
    }

    const days = RANGE_DAYS[range];
    const startDate = new Date(Date.now() - days * 86400 * 1000);
    startDate.setHours(0, 0, 0, 0);

    await connectDB();

    // Map graph type to filter criteria
    let iocTypeFilter: string | null = null;
    let verdictFilter: string[] | null = null;

    switch (graphType) {
      case 'malicious_ips':
        iocTypeFilter = 'ip';
        verdictFilter = ['malicious'];
        break;
      case 'malicious_domains':
        iocTypeFilter = 'domain';
        verdictFilter = ['malicious'];
        break;
      case 'malicious_urls':
        iocTypeFilter = 'url';
        verdictFilter = ['malicious'];
        break;
      case 'malicious_hashes':
        iocTypeFilter = 'hash';
        verdictFilter = ['malicious'];
        break;
      case 'suspicious':
        verdictFilter = ['suspicious'];
        break;
      case 'malicious':
        verdictFilter = ['malicious'];
        break;
      case 'harmless':
      case 'clean':
        verdictFilter = ['harmless', 'clean'];
        break;
      case 'undetected':
        verdictFilter = ['undetected'];
        break;
      default:
        // Try to treat as IOC type filter
        if (['ip', 'domain', 'url', 'hash'].includes(graphType)) {
          iocTypeFilter = graphType;
        } else {
          return NextResponse.json(
            { success: false, error: `Unknown graph type: ${graphType}` },
            { status: 400 }
          );
        }
    }

    // Build match query
    const matchQuery: Record<string, any> = {
      searched_at: { $gte: startDate },
    };

    if (iocTypeFilter) {
      matchQuery.type = iocTypeFilter;
    }
    if (verdictFilter) {
      matchQuery.verdict = { $in: verdictFilter };
    }

    // Fetch from user history (system + fallback)
    let historyDocs = await IocUserHistory.find({ userId, ...matchQuery })
      .sort({ searched_at: -1 })
      .lean();

    if (historyDocs.length === 0) {
      historyDocs = await IocUserHistory.find(matchQuery)
        .sort({ searched_at: -1 })
        .lean();
    }

    // Deduplicate by value+type keeping latest
    const seen = new Map<string, any>();
    for (const doc of historyDocs) {
      const key = `${doc.value}::${doc.type}`;
      if (!seen.has(key)) {
        seen.set(key, doc);
      }
    }
    const uniqueDocs = Array.from(seen.values()).slice(0, limit);

    // Enrich with cache data
    const cacheQueries = uniqueDocs.map((d) => ({ value: d.value, type: d.type }));
    const cacheMap = new Map<string, any>();

    if (cacheQueries.length > 0) {
      const cacheDocs = await IocCache.find({ $or: cacheQueries }).lean();
      for (const c of cacheDocs) {
        cacheMap.set(`${c.value}::${c.type}`, c);
      }
    }

    const iocs = uniqueDocs.map((doc) => {
      const cacheDoc = cacheMap.get(`${doc.value}::${doc.type}`);
      const analysis = cacheDoc?.analysis ?? {};
      const vtData = analysis?.vtData ?? {};

      const riskScore: number =
        analysis?.riskScore ??
        vtData?.normalized?.riskScore ??
        vtData?.riskScore ??
        (doc.verdict === 'malicious' ? 75 : doc.verdict === 'suspicious' ? 40 : 10);

      const threatLabel: string =
        vtData?.popular_threat_label ??
        vtData?.details?.popular_threat_label ??
        (analysis?.threatIntel?.threatTypes?.[0] ?? null) ??
        doc.verdict ??
        'Unknown';

      return {
        id: String(doc._id),
        ioc_value: doc.value,
        ioc_type: doc.type,
        verdict: doc.verdict || 'unknown',
        threat_label: threatLabel,
        last_seen: new Date(doc.searched_at).toISOString(),
        risk_score: Math.round(Number(riskScore) || 0),
        severity: cacheDoc?.severity ?? analysis?.severity ?? 'unknown',
        source: doc.source ?? null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        graph_type: graphType,
        time_range: range,
        total: iocs.length,
        iocs,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error: any) {
    console.error('[graph-detail] GET error', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Failed to fetch graph detail' },
      { status: 500 }
    );
  }
}
