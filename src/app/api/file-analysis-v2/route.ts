// app/api/file-analysis-v2/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { performFileAnalysis } from './services/analysis-engine-v2';
import { checkRateLimit } from './services/rate-limit';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ✅ Authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;

    // ✅ Rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          resetAt: new Date(rateLimit.resetAt).toISOString(),
          remaining: 0,
          maxRequests: rateLimit.maxRequests
        },
        { status: 429 }
      );
    }

    // ✅ Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const label = (formData.get('label') as string) || 'File Analysis';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ✅ Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large',
          maxSize,
          actualSize: file.size
        },
        { status: 413 }
      );
    }

    // ✅ Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[FileAnalysisV2] 📦 Processing: ${file.name} (${file.size} bytes) for user ${userId}`);

    // ✅ Perform analysis
    const result: any = await performFileAnalysis(buffer, file.name, file.size, userId, label);

    // ✅ Transform VT data structure to match frontend expectations (BOTH fresh and cached)
    // For fresh analysis: data is in result.vtData.raw_data.raw.data.attributes
    // For cached analysis: data is in result.multiSourceData.virustotal.full_data
    const vtFullData = result.multiSourceData?.virustotal?.full_data || 
                       result.vtData?.raw_data?.raw?.data?.attributes;

if (vtFullData) {
  console.log('[FileAnalysisV2] 🔄 Transforming VT data structure for frontend');
  
  
  // Create or enhance vtData with all VT-specific fields
  result.vtData = {
    ...(result.vtData || {}),
    // Analysis stats
    last_analysis_stats: vtFullData.last_analysis_stats,
    // Sandbox verdicts
    sandbox_verdicts: vtFullData.sandbox_verdicts,
    // File information
    meaningful_name: vtFullData.meaningful_name,
    names: vtFullData.names,
    size: vtFullData.size,
    first_submission_date: vtFullData.first_submission_date,
    last_submission_date: vtFullData.last_submission_date,
    // File type info
    type_tag: vtFullData.type_tag,
    type_description: vtFullData.type_description,
    // Technical details
    trid: vtFullData.trid,
    elf_info: vtFullData.elf_info,
    detectiteasy: vtFullData.detectiteasy,
    pe_info: vtFullData.pe_info,
    // Hashes
    md5: vtFullData.md5,
    sha1: vtFullData.sha1,
    sha256: vtFullData.sha256,
    // Threat labels
    popular_threat_label: vtFullData.popular_threat_classification?.suggested_threat_label,
    threat_categories: result.multiSourceData?.virustotal?.malware_families || [],
    family_labels: result.multiSourceData?.virustotal?.malware_families || [],
    // MITRE ATT&CK
    mitre_attack_techniques: vtFullData.mitre_attack_techniques,
    // Sigma analysis
    sigma_analysis_results: vtFullData.sigma_analysis_results,
    sigma_analysis_stats: vtFullData.sigma_analysis_stats,
    // Other fields
    tags: vtFullData.tags,
    reputation: vtFullData.reputation,
    crowdsourced_yara_results: vtFullData.crowdsourced_yara_results,
    crowdsourced_ids_results: vtFullData.crowdsourced_ids_results,
    creation_date: vtFullData.creation_date,
    last_analysis_date: vtFullData.last_analysis_date
  };
  
  // Ensure hashes at root level
  if (!result.hashes || !result.hashes.sha256) {
    result.hashes = {
      md5: vtFullData.md5 || '',
      sha1: vtFullData.sha1 || '',
      sha256: vtFullData.sha256 || result.ioc || ''
    };
  }
  
  // Get malware families from appropriate location
  const malwareFamilies = result.multiSourceData?.virustotal?.malware_families || 
                          vtFullData.popular_threat_classification?.popular_threat_name?.map((n: any) => n.value) ||
                          [];
  
  // Create vtIntelligence for MITRE ATT&CK and threat data
  result.vtIntelligence = {
    popular_threat_label: vtFullData.popular_threat_classification?.suggested_threat_label,
    threat_categories: malwareFamilies,
    family_labels: malwareFamilies,
    mitre_attack: vtFullData.mitre_attack_techniques,
    code_insights: null
  };
  
  // Enhance fileInfo with VT data if not already complete
  if (!result.fileInfo || !result.fileInfo.firstSeen) {
    result.fileInfo = {
      ...(result.fileInfo || {}),
      name: vtFullData.meaningful_name || result.fileInfo?.name,
      type: vtFullData.type_description || result.fileInfo?.type,
      size: vtFullData.size || result.fileInfo?.size,
      md5: vtFullData.md5,
      sha1: vtFullData.sha1,
      sha256: vtFullData.sha256,
      firstSeen: vtFullData.first_submission_date ? new Date(vtFullData.first_submission_date * 1000).toISOString() : undefined,
      lastAnalysis: vtFullData.last_submission_date ? new Date(vtFullData.last_submission_date * 1000).toISOString() : undefined
    };
  }
  
  // 🔥 KEY FIX: Remove VT full_data from response to avoid duplication
  if (result.multiSourceData?.virustotal?.full_data) {
    delete result.multiSourceData.virustotal.full_data;
  }
  console.log('[FileAnalysisV2] ✅ VT data transformed successfully');
}

    
    // ✅ Transform multi-source data to match frontend expectations
    if (result.multiSourceData) {
      if (!result.threatfoxData) {
        result.threatfoxData = result.multiSourceData.threatfox ? {
          available: true,
          verdict: result.multiSourceData.threatfox.verdict || 'unknown',
          score: result.multiSourceData.threatfox.score || 0
        } : { available: false, verdict: 'unknown', score: 0 };
      }
      
      if (!result.malwarebazaarData) {
        result.malwarebazaarData = result.multiSourceData.malwarebazaar || { available: false, verdict: 'unknown', score: 0 };
      }
    }

    const analysisTime = Date.now() - startTime;
    
    // Prepare response with VT upload status
    const responseData: any = {
      success: true,
      results: [result],
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      analysisTimeMs: analysisTime
    };
    
    // Include VT upload info if file was uploaded
    if ('virusTotal' in result && result.virusTotal && typeof result.virusTotal === 'object' && 'uploadStatus' in result.virusTotal && result.virusTotal.uploadStatus === 'pending') {
      responseData.vtUpload = {
        status: 'pending',
        message: 'File uploaded to VirusTotal. Analysis results will be available in a few minutes.',
        analysisId: (result.virusTotal as any).analysisId,
        link: (result.virusTotal as any).link
      };
    }

    return NextResponse.json(
      responseData,
      {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          'X-Analysis-Time': `${analysisTime}ms`,
          'X-Cache-Hit': result.cached ? 'true' : 'false'
        }
      }
    );

  } catch (error) {
    console.error('[FileAnalysisV2] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: 'File Analysis API v2',
    version: '2.0.0',
    endpoint: 'POST /api/file-analysis-v2',
    limits: {
      maxFileSize: '50MB',
      rateLimit: '10 requests per hour'
    },
    features: [
      'Real-time malware detection',
      'YARA-style behavior analysis',
      'Hash-based threat intelligence',
      'VirusTotal integration',
      'IP reputation checking',
      'Content pattern analysis',
      'Mongo cache with TTL',
      'Risk scoring with custom algorithms'
    ]
  });
}
