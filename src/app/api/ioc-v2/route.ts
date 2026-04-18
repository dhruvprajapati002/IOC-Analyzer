// app/api/ioc-v2/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { SubmitIOCRequestSchema, detectIOCType } from '@/lib/validators';
import { getIOCFromCache, saveIOCAnalysis, getUserHistory } from '@/lib/ioc-cache';
import { IocCache } from '@/lib/models/IocCache';
import { getCacheTTL } from '@/lib/cache/cache-ttl';
import { SYSTEM_USER, SYSTEM_USER_ID } from '@/lib/system-user';
import {
  MultiSourceOrchestrator,
  formatIOCResponse,
  createErrorResult,
} from '@/lib/threat-intel/orchestrator/multi-source.orchestrator';
import { calculateIPRiskScore, getRiskLevelDetails } from '@/lib/threat-intel/services/risk-scoring.service';
import { getGeolocationData, checkAbuseIPDB } from '@/lib/threat-intel/services/ip-reputation.service';
import { checkRateLimit, RATE_LIMIT_CONFIG, type RateLimitResult } from './services/rate-limit';
import type { IOCAnalysisResult } from '@/lib/threat-intel/types/threat-intel.types';

const orchestrator = new MultiSourceOrchestrator();

const MAX_PAYLOAD_BYTES = 50 * 1024;
const MAX_BATCH_SIZE = 50;

function normalizeRequestBody(body: any) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if (Array.isArray(body.iocs)) {
    return body;
  }

  const single = body.ioc || body.iocValue || body.value;
  if (typeof single === 'string' && single.trim()) {
    return { ...body, iocs: [single] };
  }

  return body;
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown-ip';
  }

  return cfIp || realIp || 'unknown-ip';
}

function buildRateLimitHeaders(rateLimit: RateLimitResult) {
  const activeResetAt =
    rateLimit.limitType === 'day' ? rateLimit.day.resetAt : rateLimit.minute.resetAt;

  return {
    'X-RateLimit-Limit-Minute': rateLimit.minute.limit.toString(),
    'X-RateLimit-Remaining-Minute': rateLimit.minute.remaining.toString(),
    'X-RateLimit-Reset-Minute': Math.floor(rateLimit.minute.resetAt / 1000).toString(),
    'X-RateLimit-Limit-Day': rateLimit.day.limit.toString(),
    'X-RateLimit-Remaining-Day': rateLimit.day.remaining.toString(),
    'X-RateLimit-Reset-Day': Math.floor(rateLimit.day.resetAt / 1000).toString(),
    // Backward-compatible headers used by legacy clients.
    'X-RateLimit-Limit': rateLimit.day.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.day.remaining.toString(),
    'X-RateLimit-Reset': new Date(activeResetAt).toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Payload too large' },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parsed = SubmitIOCRequestSchema.safeParse(normalizeRequestBody(body));
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const userId = SYSTEM_USER_ID;
    const username = SYSTEM_USER.username;

    const rateLimit = checkRateLimit(getClientIdentifier(request));
    if (!rateLimit.allowed) {
      const resetAt =
        rateLimit.limitType === 'day' ? rateLimit.day.resetAt : rateLimit.minute.resetAt;

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          type: rateLimit.limitType,
          retryAfter: rateLimit.retryAfter,
          resetAt: new Date(resetAt).toISOString(),
          minuteRemaining: rateLimit.minute.remaining,
          dayRemaining: rateLimit.day.remaining,
        },
        { status: 429, headers: buildRateLimitHeaders(rateLimit) }
      );
    }

    const { iocs, label } = parsed.data;
    if (iocs.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `Batch size exceeds ${MAX_BATCH_SIZE}` },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      iocs.map(async (ioc) => {
        const iocValue = ioc.trim();
        const iocType = detectIOCType(iocValue);

        try {
          let analysisResult: IOCAnalysisResult | undefined;
          let cached = false;

          try {
            const cachedData = await getIOCFromCache(iocValue, iocType);
            if (cachedData.success && cachedData.data) {
              analysisResult = cachedData.data;
              cached = true;
            }
          } catch (cacheError: any) {
            console.log(`[IOC-API-V2] Cache check failed: ${cacheError.message}`);
          }

          if (!analysisResult) {
            analysisResult = await orchestrator.analyzeIOC(iocValue, iocType as any);

            const sourcesAvailable = analysisResult?.sources_available || [];
            if (sourcesAvailable.length === 0) {
              if (iocType === 'ip') {
                const [geoData, abuseData] = await Promise.all([
                  getGeolocationData(iocValue).catch(() => null),
                  checkAbuseIPDB(iocValue).catch(() => null),
                ]);

                return formatIOCResponse(
                  {
                    ioc: iocValue,
                    type: iocType as any,
                    verdict: 'error',
                    severity: 'unknown',
                    stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
                    threatIntel: {
                      threatTypes: [],
                      detections: [],
                      confidence: 0,
                      severity: 'unknown',
                    },
                    reputation:
                      geoData || abuseData
                        ? {
                            geolocation: geoData as any,
                            abuseipdb: abuseData as any,
                            riskScore: 0,
                            riskLevel: 'unknown' as any,
                          }
                        : undefined,
                    riskScore: 0,
                    riskLevel: 'unknown' as any,
                    sources_available: [],
                    sources_failed:
                      analysisResult?.sources_failed || [
                        'VirusTotal',
                        'GreyNoise',
                        'IPQS',
                        'ThreatFox',
                        'MalwareBazaar',
                        'URLhaus',
                      ],
                    cached: false,
                    fetchedAt: new Date().toISOString(),
                  } as any,
                  false
                );
              }

              return formatIOCResponse(
                {
                  ioc: iocValue,
                  type: iocType as any,
                  verdict: 'error',
                  severity: 'unknown',
                  stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
                  threatIntel: {
                    threatTypes: [],
                    detections: [],
                    confidence: 0,
                    severity: 'unknown',
                  },
                  sources_available: [],
                  sources_failed:
                    analysisResult?.sources_failed || [
                      'VirusTotal',
                      'GreyNoise',
                      'IPQS',
                      'ThreatFox',
                      'MalwareBazaar',
                      'URLhaus',
                    ],
                  cached: false,
                  fetchedAt: new Date().toISOString(),
                } as any,
                false
              );
            }
          }

          if (!analysisResult.threatIntel) {
            analysisResult.threatIntel = {
              threatTypes: [],
              detections: [],
              severity: 'unknown',
              confidence: 0,
            };
          }

          if (iocType === 'ip') {
            const [geoData, abuseData] = await Promise.all([
              getGeolocationData(iocValue),
              checkAbuseIPDB(iocValue),
            ]);

            const multiSourceData: Record<string, any> = {};
            if ((analysisResult as any).vtData) {
              multiSourceData.VirusTotal = (analysisResult as any).vtData;
            }
            if ((analysisResult as any).ipqsData) {
              multiSourceData.IPQualityScore = (analysisResult as any).ipqsData;
            }
            if ((analysisResult as any).greynoiseData) {
              multiSourceData.GreyNoise = (analysisResult as any).greynoiseData;
            }
            if ((analysisResult as any).threatfoxData) {
              multiSourceData.ThreatFox = (analysisResult as any).threatfoxData;
            }

            const riskResult = calculateIPRiskScore(multiSourceData, abuseData);
            const riskDetails = getRiskLevelDetails(riskResult.level, riskResult.score);

            analysisResult.riskScore = riskResult.score;
            analysisResult.riskLevel = riskResult.level;
            analysisResult.riskDetails = riskDetails;
            analysisResult.verdict = riskResult.verdict;
            analysisResult.severity = riskResult.severity as any;
            analysisResult.threatIntel.riskScore = riskResult.score;
            analysisResult.threatIntel.riskLevel = riskResult.level;
            analysisResult.threatIntel.confidence = riskResult.confidence;

            if (geoData || abuseData) {
              analysisResult.reputation = {
                geolocation: geoData as any,
                abuseipdb: abuseData as any,
                riskScore: riskResult.score,
                riskLevel: riskResult.level,
              };
            }
          }

          try {
            const ttl = getCacheTTL(iocType as any, 'api_search');
            await saveIOCAnalysis({
              ioc: iocValue,
              type: iocType,
              userId,
              username,
              label,
              source: 'api_search',
              analysisResult,
              fetchedAt: new Date(),
              cacheTtlSec: ttl,
            });
          } catch (saveError) {
            console.error(`[IOC-API-V2] Failed to save ${iocValue} to Mongo cache:`, saveError);
          }

          return formatIOCResponse(analysisResult, cached);
        } catch (error: any) {
          console.error(`[IOC-API-V2] Error analyzing ${ioc}:`, error);
          return createErrorResult(ioc, iocType, error);
        }
      })
    );

    const successCount = results.filter((r) => r.verdict !== 'error').length;
    const analysisTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        results,
        analyzed: iocs.length,
        successful: successCount,
        failed: iocs.length - successCount,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        analysisTimeMs: analysisTime,
      },
      {
        headers: {
          ...buildRateLimitHeaders(rateLimit),
          'X-Analysis-Time': `${analysisTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[IOC-API-V2] Request failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = SYSTEM_USER_ID;

    const rateLimit = checkRateLimit(getClientIdentifier(request));
    if (!rateLimit.allowed) {
      const resetAt =
        rateLimit.limitType === 'day' ? rateLimit.day.resetAt : rateLimit.minute.resetAt;

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          type: rateLimit.limitType,
          retryAfter: rateLimit.retryAfter,
          resetAt: new Date(resetAt).toISOString(),
          minuteRemaining: rateLimit.minute.remaining,
          dayRemaining: rateLimit.day.remaining,
        },
        { status: 429, headers: buildRateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);
    const page = Math.floor(skip / limit) + 1;
    const type = searchParams.get('type') || undefined;
    const verdict = searchParams.get('verdict') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const search = searchParams.get('search') || undefined;

    let history = await getUserHistory({
      userId,
      page,
      limit,
      type,
      verdict,
      search,
    });

    let dataScope: 'system' | 'legacy-fallback' = 'system';
    if ((history.pagination?.totalCount ?? 0) === 0) {
      history = await getUserHistory({
        userId,
        includeAllUsers: true,
        page,
        limit,
        type,
        verdict,
        search,
      });
      dataScope = 'legacy-fallback';
    }

    const historyRecords = history.records || [];
    const cacheQueries = historyRecords.map((record: any) => ({
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

    let records = historyRecords.map((record: any) => {
      const cacheDoc = cacheMap.get(`${record.value}::${record.type}`);
      const analysis = cacheDoc?.analysis as IOCAnalysisResult | undefined;
      const stats = analysis?.stats || {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
      };

      const threatTypes = analysis?.threatIntel?.threatTypes || [];
      const severityValue = analysis?.severity || 'unknown';
      const verdictValue = record.verdict || analysis?.verdict || 'unknown';
      const vtData = (analysis as any)?.vtData || {};
      const familyLabels = vtData?.malware_families || [];
      const popularThreatLabel = vtData?.popular_threat_label || vtData?.details?.popular_threat_label || null;
      const sourcesAvailable = analysis?.sources_available || [];

      const hasData = {
        virustotal: sourcesAvailable.includes('virustotal'),
        greynoise: sourcesAvailable.includes('greynoise'),
        ipqs: sourcesAvailable.includes('ipqs'),
        threatfox: sourcesAvailable.includes('threatfox'),
        malwarebazaar: sourcesAvailable.includes('malwarebazaar'),
        urlhaus: sourcesAvailable.includes('urlhaus'),
      };

      const recordItem: any = {
        id: record._id?.toString?.() || record._id,
        ioc: record.value,
        type: record.type,
        label: record.label || null,
        source: record.source || null,
        metadata: record.metadata || null,
        searched_at: record.searched_at,
        user_notes: null,
        user_verdict: null,
        verdict: verdictValue,
        severity: severityValue,
        stats,
        threatTypes,
        confidence: analysis?.threatIntel?.confidence || 0,
        popularThreatLabel,
        familyLabels,
        hasData,
        scores: {
          virustotal: (analysis as any)?.vtData?.score || 0,
          ipqs: (analysis as any)?.ipqsData?.score || 0,
          greynoise: (analysis as any)?.greynoiseData?.score || 0,
        },
        sources_available: sourcesAvailable,
      };

      if (record.type === 'ip') {
        recordItem.ipReputation = {
          riskScore: analysis?.riskScore || 0,
          riskLevel: analysis?.riskLevel || 'low',
          geolocation: analysis?.reputation?.geolocation || null,
        };
      }

      return recordItem;
    });

    if (severity) {
      records = records.filter((record: any) => record.severity === severity);
    }

    const total = severity ? records.length : history.pagination.totalCount;
    const totalPages = severity ? Math.ceil(total / limit) : history.pagination.totalPages;

    return NextResponse.json(
      {
        success: true,
        data: {
          records,
          total,
          limit,
          skip,
          hasMore: skip + records.length < total,
          page,
          totalPages,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
          dataScope,
          filters: {
            type,
            verdict,
            severity,
            search,
          },
        },
      },
      { headers: buildRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('[IOC-API-V2] User IOCs fetch error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    service: 'IOC Analysis API v2',
    version: '2.0.0',
    endpoints: {
      analyze: {
        method: 'POST',
        path: '/api/ioc-v2',
        description: 'Analyze IOCs using multi-source threat intelligence',
        auth: 'Bearer token required',
      },
      search: {
        method: 'GET',
        path: '/api/ioc-v2',
        description: 'Search analyzed IOCs',
        auth: 'Bearer token required',
        params: {
          limit: 'Number of results (max 100, default 20)',
          skip: 'Offset for pagination (default 0)',
          type: 'Filter by IOC type (ip, domain, url, hash)',
          verdict: 'Filter by verdict (malicious, suspicious, clean, unknown)',
          severity: 'Filter by severity (critical, high, medium, low, clean)',
          search: 'Search in IOC values',
        },
      },
    },
    rateLimit: {
      minuteLimit: RATE_LIMIT_CONFIG.MINUTE_LIMIT,
      dayLimit: RATE_LIMIT_CONFIG.DAY_LIMIT,
      minuteWindowSeconds: RATE_LIMIT_CONFIG.MINUTE_WINDOW_MS / 1000,
      dayWindowHours: RATE_LIMIT_CONFIG.DAY_WINDOW_MS / 3600000,
      perIp: true,
    },
    features: [
      'Multi-source threat intelligence aggregation',
      'VirusTotal integration',
      'GreyNoise integration',
      'IPQualityScore integration',
      'ThreatFox integration',
      'MalwareBazaar integration',
      'URLhaus integration',
      'AbuseIPDB for IP reputation',
      'IP geolocation',
      'Severity-based verdict aggregation',
      'Mongo cache with TTL',
      'Rate limiting per IP (minute/day)',
      'Batch analysis support',
    ],
    threatIntelligenceSources: {
      virustotal: 'File, URL, domain, IP analysis',
      greynoise: 'IP reputation and classification',
      ipqs: 'IP, domain, URL fraud detection',
      threatfox: 'IOC threat intelligence',
      malwarebazaar: 'Malware file hash lookup',
      urlhaus: 'Malicious URL database',
      abuseipdb: 'IP abuse reports',
    },
    supportedTypes: ['ip', 'domain', 'url', 'hash'],
    maxBatchSize: MAX_BATCH_SIZE,
    responseFormat: {
      ioc: 'string',
      type: 'ip | domain | url | file_hash',
      verdict: 'malicious | suspicious | clean | unknown',
      severity: 'critical | high | medium | low | clean | unknown',
      stats: {
        malicious: 'number',
        suspicious: 'number',
        harmless: 'number',
        undetected: 'number',
      },
      threatIntel: {
        threatTypes: 'string[]',
        detections: 'Detection[]',
        severity: 'string',
        confidence: 'number',
      },
      multiSourceData: {
        virustotal: 'VTData | null',
        greynoise: 'GreyNoiseData | null',
        ipqs: 'IPQSData | null',
        threatfox: 'ThreatFoxData | null',
        malwarebazaar: 'MalwareBazaarData | null',
        urlhaus: 'URLhausData | null',
      },
      sources_available: 'string[]',
      sources_failed: 'string[]',
    },
  });
}