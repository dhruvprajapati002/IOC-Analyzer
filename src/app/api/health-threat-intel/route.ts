/**
 * Threat Intelligence Health Check API
 * Tests all services, clients, and orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeIOC } from '@/lib/threat-intel/services/ioc-analyzer.service';
import { MultiSourceOrchestrator } from '@/lib/threat-intel/orchestrator/multi-source.orchestrator';
import { VirusTotalClient } from '@/lib/threat-intel/clients/vt.client';
import { GreyNoiseClient } from '@/lib/threat-intel/clients/greynoise.client';
import { IPQSClient } from '@/lib/threat-intel/clients/ipqs.client';
import { ThreatFoxClient } from '@/lib/threat-intel/clients/threatfox.client';
import { MalwareBazaarClient } from '@/lib/threat-intel/clients/malwarebazaar.client';
import { URLhausClient } from '@/lib/threat-intel/clients/urlhaus.client';
import { getGeolocationData, checkAbuseIPDB } from '@/lib/threat-intel/services/ip-reputation.service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Get test mode from query params
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'quick';
  const testIOC = searchParams.get('ioc') || '8.8.8.8';
  
  console.log(`[Health-TI] 🏥 Starting health check (mode: ${mode})...`);

  const results: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: mode,
    checks: {}
  };

  try {
    // 1. Test Threat Intel Clients
    console.log('[Health-TI] 🔌 Testing threat intel clients...');
    const clients = [
      { name: 'VirusTotal', client: new VirusTotalClient() },
      { name: 'GreyNoise', client: new GreyNoiseClient() },
      { name: 'IPQS', client: new IPQSClient() },
      { name: 'ThreatFox', client: new ThreatFoxClient() },
      { name: 'MalwareBazaar', client: new MalwareBazaarClient() },
      { name: 'URLhaus', client: new URLhausClient() }
    ];

    results.checks.clients = {};
    
    for (const { name, client } of clients) {
      try {
        const available = await client.isAvailable();
        const quota = await client.getQuota();
        
        results.checks.clients[name] = {
          status: available ? 'available' : 'unavailable',
          configured: available,
          quota: quota === -1 ? 'unlimited' : quota,
          supports: client.supports
        };
      } catch (error: any) {
        results.checks.clients[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    // 2. Test IP Reputation Services
    console.log('[Health-TI] 🌍 Testing IP reputation services...');
    if (mode === 'full') {
      try {
        const geoTest = await getGeolocationData('8.8.8.8');
        results.checks.geolocation = {
          status: geoTest ? 'healthy' : 'failed',
          provider: geoTest ? 'available' : 'unavailable'
        };
      } catch (error: any) {
        results.checks.geolocation = {
          status: 'error',
          error: error.message
        };
      }

      try {
        const abuseTest = await checkAbuseIPDB('8.8.8.8');
        results.checks.abuseipdb = {
          status: abuseTest ? 'healthy' : 'not_configured',
          configured: !!process.env.ABUSEIPDB_API_KEY
        };
      } catch (error: any) {
        results.checks.abuseipdb = {
          status: 'error',
          error: error.message
        };
      }
    } else {
      results.checks.geolocation = {
        status: 'skipped',
        message: 'Use mode=full to test geolocation'
      };
      results.checks.abuseipdb = {
        status: 'skipped',
        message: 'Use mode=full to test AbuseIPDB'
      };
    }

    // 3. Test Orchestrator
    console.log('[Health-TI] 🎯 Testing orchestrator...');
    try {
      new MultiSourceOrchestrator(); // Initialize to test
      results.checks.orchestrator = {
        status: 'healthy',
        initialized: true,
        sources: 7
      };
    } catch (error: any) {
      results.checks.orchestrator = {
        status: 'error',
        error: error.message
      };
      results.status = 'degraded';
    }

    // 4. Test Full Analysis (only in full mode)
    if (mode === 'full') {
      console.log(`[Health-TI] 🔬 Testing full analysis with ${testIOC}...`);
      try {
        const analysisStart = Date.now();
        const analysisResult = await analyzeIOC(testIOC, 'Health Check', 'health-test');
        const analysisTime = Date.now() - analysisStart;
        
        results.checks.fullAnalysis = {
          status: 'success',
          ioc: testIOC,
          verdict: analysisResult.verdict,
          severity: analysisResult.severity,
          sources_available: analysisResult.sources_available?.length || 0,
          sources_failed: analysisResult.sources_failed?.length || 0,
          analysisTime: `${analysisTime}ms`,
          riskScore: analysisResult.riskScore,
          riskLevel: analysisResult.riskLevel
        };
      } catch (error: any) {
        results.checks.fullAnalysis = {
          status: 'failed',
          error: error.message,
          stack: error.stack
        };
        results.status = 'unhealthy';
      }
    } else {
      results.checks.fullAnalysis = {
        status: 'skipped',
        message: `Use mode=full&ioc=${testIOC} to test full analysis`
      };
    }

    // 5. Environment Check
    console.log('[Health-TI] 🔧 Checking environment...');
    results.checks.environment = {
      node_env: process.env.NODE_ENV || 'development',
      api_keys: {
        virustotal: !!process.env.VIRUSTOTAL_API_KEY || !!process.env.VT_API_KEYS,
        abuseipdb: !!process.env.ABUSEIPDB_API_KEY,
        greynoise: !!process.env.GREYNOISE_API_KEY,
        ipqs: !!process.env.IPQS_API_KEY,
        abuse_ch: !!process.env.ABUSE_CH_API_KEY
      }
    };

    // Calculate overall status
    const clientsHealthy = Object.values(results.checks.clients).every(
      (c: any) => c.status === 'available' || c.status === 'unavailable'
    );
    
    if (!clientsHealthy) {
      results.status = 'degraded';
    }

    if (results.checks.fullAnalysis?.status === 'failed') {
      results.status = 'unhealthy';
    }

    results.responseTime = Date.now() - startTime;
    
    console.log(`[Health-TI] ✅ Health check complete: ${results.status} (${results.responseTime}ms)`);

    return NextResponse.json(results, {
      status: results.status === 'healthy' ? 200 : results.status === 'degraded' ? 207 : 503
    });

  } catch (error: any) {
    console.error('[Health-TI] ❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ioc, label } = body;

    if (!ioc) {
      return NextResponse.json({
        success: false,
        error: 'IOC is required'
      }, { status: 400 });
    }

    console.log(`[Health-TI] 🧪 Test analysis: ${ioc}`);
    
    const startTime = Date.now();
    const result = await analyzeIOC(ioc, label || 'Test Analysis', 'health-test');
    const analysisTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis: {
        ioc: result.ioc,
        type: result.type,
        verdict: result.verdict,
        severity: result.severity,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        stats: result.stats,
        threatIntel: {
          threatTypes: result.threatIntel.threatTypes,
          detectionsCount: result.threatIntel.detections.length,
          severity: result.threatIntel.severity
        },
        sources: {
          available: result.sources_available || [],
          failed: result.sources_failed || []
        },
        analysisTime: `${analysisTime}ms`
      }
    });

  } catch (error: any) {
    console.error('[Health-TI] ❌ Test analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
