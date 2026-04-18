import connectDB from '@/lib/db';
import { IocCache, IocType } from '@/lib/models/IocCache';
import { IocUserHistory } from '@/lib/models/IocUserHistory';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import type { IocHistoryMetadata } from '@/lib/models/IocUserHistory';
import type { IOCAnalysisResult } from '@/lib/threat-intel/types/threat-intel.types';

const DEFAULT_TTL_SEC = 3600;

export interface SaveIOCAnalysisInput {
  ioc: string;
  type: string;
  userId?: string;
  username?: string;
  label?: string;
  source?: string;
  fileMetadata?: {
    originalFilename: string;
    uploadedSize: number;
    uploadedType: string;
    uploadedAt: string;
  };
  analysisResult: IOCAnalysisResult;
  fetchedAt: Date;
  cacheTtlSec?: number;
}

interface UserHistoryFilters {
  userId: string;
  includeAllUsers?: boolean;
  page?: number;
  limit?: number;
  type?: string;
  verdict?: string;
  source?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

interface IocHistoryRecord {
  _id?: unknown;
  userId: string;
  value: string;
  type: IocType;
  searched_at: Date;
  verdict?: string | null;
  label?: string | null;
  source?: string | null;
  metadata?: IocHistoryMetadata | null;
}

interface IocCacheRecord {
  _id?: unknown;
  value: string;
  type: IocType;
  verdict: string;
  severity: string;
  riskScore: number;
  threatIntel: { threatTypes: string[]; confidence: number };
  analysis?: IOCAnalysisResult | null;
  created_at: Date;
  expiresAt: Date;
}

function buildThreatIntelBasic(result: IOCAnalysisResult) {
  return {
    threatTypes: result.threatIntel?.threatTypes || [],
    confidence: result.threatIntel?.confidence || 0,
  };
}

function buildMinimalAnalysis(cacheDoc: any): IOCAnalysisResult {
  return {
    ioc: cacheDoc.value,
    type: cacheDoc.type,
    verdict: cacheDoc.verdict || 'unknown',
    severity: cacheDoc.severity || 'unknown',
    stats: cacheDoc.analysis?.stats || {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
    },
    threatIntel: {
      threatTypes: cacheDoc.threatIntel?.threatTypes || [],
      detections: cacheDoc.analysis?.threatIntel?.detections || [],
      confidence: cacheDoc.threatIntel?.confidence || 0,
      severity: cacheDoc.severity || 'unknown',
    },
    sources_available: cacheDoc.analysis?.sources_available || [],
    sources_failed: cacheDoc.analysis?.sources_failed || [],
    fetchedAt: cacheDoc.created_at?.toISOString?.() || new Date().toISOString(),
    cached: true,
  } as IOCAnalysisResult;
}

export async function getIOCFromCache(ioc: string, type: string) {
  await connectDB();
  const now = new Date();

  const cacheDoc = await IocCache.findOne({
    value: ioc,
    type: type as IocType,
    expiresAt: { $gt: now },
  })
    .lean<IocCacheRecord>()
    .exec();

  if (!cacheDoc) {
    return { success: false, notFound: true } as const;
  }

  const analysis = cacheDoc.analysis
    ? (cacheDoc.analysis as IOCAnalysisResult)
    : buildMinimalAnalysis(cacheDoc);

  return {
    success: true,
    data: analysis,
    cache: cacheDoc,
  } as const;
}

export async function saveIOCAnalysis(input: SaveIOCAnalysisInput) {
  await connectDB();

  const ttlSec = input.cacheTtlSec ?? DEFAULT_TTL_SEC;
  const expiresAt = new Date(Date.now() + ttlSec * 1000);
  const threatIntel = buildThreatIntelBasic(input.analysisResult);

  const riskScore =
    (input.analysisResult as any).riskScore ??
    input.analysisResult.threatIntel?.riskScore ??
    0;

  const cacheDoc = await IocCache.findOneAndUpdate(
    { value: input.ioc, type: input.type as IocType },
    {
      $set: {
        value: input.ioc,
        type: input.type as IocType,
        verdict: input.analysisResult.verdict || 'unknown',
        severity: input.analysisResult.severity || 'unknown',
        riskScore,
        threatIntel,
        analysis: input.analysisResult,
        expiresAt,
      },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (input.userId) {
    await IocUserHistory.create({
      userId: SYSTEM_USER_ID,
      value: input.ioc,
      type: input.type as IocType,
      searched_at: input.fetchedAt || new Date(),
      verdict: input.analysisResult.verdict || null,
      label: input.label || null,
      source: input.source || null,
      metadata: input.fileMetadata
        ? {
            filename: input.fileMetadata.originalFilename,
            filesize: input.fileMetadata.uploadedSize,
            filetype: input.fileMetadata.uploadedType,
          }
        : null,
    });
  }

  return { success: true, id: cacheDoc._id.toString() } as const;
}

export async function recordUserHistory(params: {
  userId: string;
  value: string;
  type: string;
  searchedAt?: Date;
  verdict?: string | null;
  label?: string | null;
  source?: string | null;
  metadata?: {
    filename?: string;
    filesize?: number;
    filetype?: string;
  } | null;
}) {
  await connectDB();
  await IocUserHistory.create({
    userId: SYSTEM_USER_ID,
    value: params.value,
    type: params.type as IocType,
    searched_at: params.searchedAt || new Date(),
    verdict: params.verdict ?? null,
    label: params.label ?? null,
    source: params.source ?? null,
    metadata: params.metadata ?? null,
  });
}

export async function getUserHistory(filters: UserHistoryFilters) {
  await connectDB();

  const page = Math.max(filters.page || 1, 1);
  const limit = Math.min(Math.max(filters.limit || 10, 1), 100);
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};

  if (!filters.includeAllUsers) {
    query.userId = filters.userId;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.verdict) {
    query.verdict = filters.verdict;
  }

  if (filters.source) {
    query.source = filters.source;
  }

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [{ value: regex }, { label: regex }];
  }

  if (filters.startDate || filters.endDate) {
    query.searched_at = {};
    if (filters.startDate) {
      query.searched_at.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.searched_at.$lte = filters.endDate;
    }
  }

  const [totalCount, records] = await Promise.all([
    IocUserHistory.countDocuments(query),
    IocUserHistory.find(query)
      .sort({ searched_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    records,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
      limit,
    },
  };
}

export async function getLatestHistoryRecord(
  userId: string,
  value: string
): Promise<IocHistoryRecord | null> {
  await connectDB();
  return IocUserHistory.findOne({ userId, value })
    .sort({ searched_at: -1 })
    .lean<IocHistoryRecord>()
    .exec();
}
