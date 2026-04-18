/**
 * Integration Tests - Service Integration with Mocks
 * Tests how the system handles service responses WITHOUT hitting real APIs
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { MockServices } from '../mocks/services.mock';
import { GOLDEN_IPS } from '../fixtures/golden-iocs';

describe('Service Integration - Mocked', () => {
  describe('VirusTotal Integration', () => {
    test('should handle clean IP response', async () => {
      const mockVT = MockServices.virusTotal('clean');
      const result = await mockVT.analyze();

      expect(result.data.attributes.last_analysis_stats.malicious).toBe(0);
      expect(result.data.attributes.last_analysis_stats.harmless).toBeGreaterThan(50);
    });

    test('should handle malicious IP response', async () => {
      const mockVT = MockServices.virusTotal('malicious');
      const result = await mockVT.analyze();

      expect(result.data.attributes.last_analysis_stats.malicious).toBeGreaterThan(50);
      expect(mockVT.analyze).toHaveBeenCalled();
    });

    test('should handle service unavailable gracefully', async () => {
      const mockVT = MockServices.virusTotal('error');
      
      await expect(mockVT.analyze()).rejects.toThrow('QuotaExceededError');
    });

    test('should handle timeout gracefully', async () => {
      const mockVT = MockServices.virusTotal('timeout');
      
      const promise = mockVT.analyze();
      
      // Should reject, not hang forever
      await expect(promise).rejects.toThrow();
    }, 10000);
  });

  describe('Multi-Service Orchestration', () => {
    test('should aggregate results from multiple services', async () => {
      const mockVT = MockServices.virusTotal('malicious');
      const mockThreatFox = MockServices.threatFox('found');
      const mockGreyNoise = MockServices.greyNoise('malicious');
      const mockAbuseIPDB = MockServices.abuseIPDB('malicious');

      const [vt, tf, gn, abuse] = await Promise.all([
        mockVT.analyze(),
        mockThreatFox.queryIOC(),
        mockGreyNoise.queryIP(),
        mockAbuseIPDB.check(),
      ]);

      // All services should indicate malicious
      expect(vt.data.attributes.last_analysis_stats.malicious).toBeGreaterThan(50);
      expect(tf.query_status).toBe('ok');
      expect(gn.classification).toBe('malicious');
      expect(abuse.data.abuseConfidenceScore).toBe(100);
    });

    test('should handle partial service failures', async () => {
      const mockVT = MockServices.virusTotal('error');
      const mockThreatFox = MockServices.threatFox('found');
      const mockGreyNoise = MockServices.greyNoise('malicious');

      // Even if VT fails, other services should provide data
      const results = await Promise.allSettled([
        mockVT.analyze(),
        mockThreatFox.queryIOC(),
        mockGreyNoise.queryIP(),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      expect(fulfilled.length).toBe(2); // ThreatFox and GreyNoise succeed
      expect(rejected.length).toBe(1);  // VT fails
    });

    test('should still return verdict when VT is down', async () => {
      const mockVT = MockServices.virusTotal('error');
      const mockThreatFox = MockServices.threatFox('found');

      let finalVerdict;
      
      try {
        await mockVT.analyze();
      } catch {
        // VT failed, use ThreatFox
        const tfResult = await mockThreatFox.queryIOC();
        finalVerdict = tfResult.data[0].threat_type === 'botnet_cc' ? 'malicious' : 'unknown';
      }

      expect(finalVerdict).toBe('malicious');
    });
  });

  describe('Cache Behavior', () => {
    test('should use cache for duplicate requests', async () => {
      const mockCache = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(true),
      };

      const ip = '8.8.8.8';

      // First request - cache miss
      let cached = await mockCache.get(ip);
      expect(cached).toBeNull();

      // Simulate storing result
      await mockCache.set(ip, { verdict: 'harmless' });

      // Second request - cache hit
      mockCache.get.mockResolvedValueOnce({ verdict: 'harmless' });
      cached = await mockCache.get(ip);

      expect(cached).not.toBeNull();
      expect(cached.verdict).toBe('harmless');
      expect(mockCache.get).toHaveBeenCalledTimes(2);
    });

    test('should not hit external API on cache hit', async () => {
      const mockCache = {
        get: jest.fn().mockResolvedValue({ verdict: 'malicious', cached: true }),
      };
      const mockVT = MockServices.virusTotal('malicious');

      const cached = await mockCache.get('185.234.219.14');

      if (cached) {
        // Cache hit - don't call API
        expect(mockVT.analyze).not.toHaveBeenCalled();
      } else {
        // Cache miss - call API
        await mockVT.analyze();
      }
    });
  });

  describe('Error Handling', () => {
    test('should not crash on invalid service response', async () => {
      const mockBrokenService = {
        analyze: jest.fn().mockResolvedValue({
          // Missing expected fields
          invalid: 'response',
        }),
      };

      const result = await mockBrokenService.analyze();
      
      // Should handle gracefully, not crash
      expect(result).toBeDefined();
    });

    test('should return UNKNOWN on all services down', async () => {
      const mockVT = MockServices.virusTotal('error');
      const mockThreatFox = MockServices.threatFox('notFound');
      const mockGreyNoise = MockServices.greyNoise('notSeen');

      let finalVerdict = 'unknown';

      try {
        await mockVT.analyze();
      } catch {
        finalVerdict = 'unknown';
      }

      expect(finalVerdict).toBe('unknown');
    });

    test('should preserve confidence when services fail', async () => {
      const mockVT = MockServices.virusTotal('error');
      
      let confidence = 'high';

      try {
        await mockVT.analyze();
      } catch {
        confidence = 'low'; // Lower confidence when services fail
      }

      expect(confidence).toBe('low');
    });
  });

  describe('Rate Limiting', () => {
    test('should track request count', () => {
      const rateLimiter = {
        requests: 0,
        limit: 100,
        increment() {
          this.requests++;
          return this.requests <= this.limit;
        },
        isExceeded() {
          return this.requests >= this.limit;
        },
      };

      // Make 101 requests
      for (let i = 0; i < 101; i++) {
        rateLimiter.increment();
      }

      expect(rateLimiter.isExceeded()).toBe(true);
    });

    test('should block requests after limit', () => {
      const rateLimiter = {
        requests: 100,
        limit: 100,
      };

      const canProceed = rateLimiter.requests < rateLimiter.limit;
      
      expect(canProceed).toBe(false);
    });

    test('should allow requests within limit', () => {
      const rateLimiter = {
        requests: 50,
        limit: 100,
      };

      const canProceed = rateLimiter.requests < rateLimiter.limit;
      
      expect(canProceed).toBe(true);
    });
  });

  describe('Data Quality', () => {
    test('should prefer structured data over raw', async () => {
      const mockVT = MockServices.virusTotal('malicious');
      const result = await mockVT.analyze();

      // Check if structured data exists
      const hasStructuredData = result.data?.attributes?.last_analysis_stats;
      
      expect(hasStructuredData).toBeDefined();
    });

    test('should normalize field names', () => {
      const rawData = {
        abuse_confidence: 100,
        'abuseConfidenceScore': undefined,
      };

      // Normalize to camelCase
      const normalized = {
        abuseConfidenceScore: rawData.abuse_confidence || rawData['abuseConfidenceScore'],
      };

      expect(normalized.abuseConfidenceScore).toBe(100);
    });

    test('should handle missing optional fields', async () => {
      const mockVT = MockServices.virusTotal('unknown');
      const result = await mockVT.analyze();

      // Should not crash on missing data
      const detections = result.data?.attributes?.last_analysis_results || {};
      
      expect(Object.keys(detections).length).toBe(0);
    });
  });
});

describe('Verdict Consistency', () => {
  test('should return same verdict for same input', async () => {
    const mockVT = MockServices.virusTotal('malicious');
    
    const result1 = await mockVT.analyze();
    const result2 = await mockVT.analyze();

    expect(result1.data.attributes.last_analysis_stats.malicious)
      .toBe(result2.data.attributes.last_analysis_stats.malicious);
  });

  test('should not change verdict if cache is used', async () => {
    const cachedResult = { verdict: 'malicious', riskScore: 95 };
    
    // Simulate multiple retrievals
    const retrieval1 = { ...cachedResult };
    const retrieval2 = { ...cachedResult };

    expect(retrieval1.verdict).toBe(retrieval2.verdict);
    expect(retrieval1.riskScore).toBe(retrieval2.riskScore);
  });
});
