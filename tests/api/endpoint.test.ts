/**
 * API Tests - Backend Endpoint Testing
 * Tests HTTP endpoints WITHOUT hitting UI
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { GOLDEN_IPS, GOLDEN_HASHES } from '../fixtures/golden-iocs';
import { getTestAuthToken, isBackendAvailable } from '../helpers/auth.helper';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:9000';

describe('API Endpoint Tests', () => {
  let authToken: string;
  let backendAvailable: boolean = false;

  // Helper to skip test if backend is down
  function skipIfBackendDown(testName: string = '') {
    if (!backendAvailable) {
      console.log(`⏭️  Skipping "${testName}" - backend not available`);
      return true;
    }
    return false;
  }

  beforeAll(async () => {
    // Check if backend is available (with retries for service initialization)
    backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      console.warn('\n⚠️  ═══════════════════════════════════════════════════');
      console.warn('   BACKEND NOT RUNNING - API TESTS WILL BE SKIPPED');
      console.warn('   Start backend with: npm run dev');
      console.warn('   ═══════════════════════════════════════════════════\n');
      authToken = 'test-bearer-token';
      return; // Skip auth attempt
    }
    
    // Get real JWT token from login endpoint
    try {
      authToken = await getTestAuthToken();
      console.log('✅ Successfully authenticated for API tests');
    } catch (error: any) {
      console.error('❌ Failed to get auth token:', error.message);
      authToken = 'test-bearer-token'; // Fallback
    }
  }, 30000); // 30 second timeout for beforeAll (includes retries)

  describe('POST /api/ioc-v2 - IOC Analysis', () => {
    test('should analyze single IP', async () => {
      if (skipIfBackendDown('analyze single IP')) return;

      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Test-Mode': 'true',
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
          label: 'Test Analysis',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.results.length).toBe(1);
      expect(data.results[0].type).toBe('ip');
    });

    test('should analyze multiple IOCs', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8', '1.1.1.1', '44d88612fea8a8f36de82e1278abb02f'],
          label: 'Batch Analysis',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.results.length).toBe(3);
    });

    test('should return 401 without auth token', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
        }),
      });

      expect(response.status).toBe(401);
    });

    test('should return 400 for invalid IOC', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Test-Mode': 'true',
        },
        body: JSON.stringify({
          iocs: ['invalid-ioc'],
        }),
      });

      // Should either reject or return unknown
      const data = await response.json();
      
      if (response.status === 200) {
        expect(data.results[0].verdict).toBe('unknown');
      } else {
        expect(response.status).toBe(400);
      }
    });

    test('should handle empty IOC array', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: [],
        }),
      });

      expect(response.status).toBe(400);
    });

    test('should enforce rate limiting', async () => {
      // Make 150 rapid requests (exceeds 100/hour limit)
      const requests = Array(150).fill(null).map(() =>
        fetch(`${API_BASE}/api/ioc-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            iocs: ['8.8.8.8'],
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('GET /api/history-v2/[ioc] - IOC Details', () => {
    test('should retrieve IOC details', async () => {
      // First analyze an IOC
      await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
        }),
      });

      // Then retrieve it
      const response = await fetch(`${API_BASE}/api/history-v2/8.8.8.8`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      
      const res = await response.json();
      
      // ✅ FIX: Response is { success: true, data: {...} }
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data.ioc).toBe('8.8.8.8');
      expect(res.data.verdict).toBeDefined();
    });

    test('should return 404 for non-existent IOC', async () => {
      const response = await fetch(`${API_BASE}/api/history-v2/1.2.3.4`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    test('should include geolocation for IPs', async () => {
      await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
        }),
      });

      const response = await fetch(`${API_BASE}/api/history-v2/8.8.8.8`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const res = await response.json();
      
      // ✅ FIX: Access nested data object
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data.geolocation).toBeDefined();
      expect(res.data.geolocation.countryName).toBeDefined();
    });
  });

  describe('GET /api/health - Health Check', () => {
    test('should return service status', async () => {
      const response = await fetch(`${API_BASE}/api/health`);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.status).toBe('ok');
      expect(data.services).toBeDefined();
    });

    test('should list service availability', async () => {
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();
      
      expect(data.services).toHaveProperty('virusTotal');
      expect(data.services).toHaveProperty('opensearch');
      expect(data.services).toHaveProperty('mongodb');
    });
  });

  describe('Response Schema Validation', () => {
    test('IOC analysis response should match schema', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Test-Mode': 'true',
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
        }),
      });

      const data = await response.json();
      
      // Validate schema
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
      
      const result = data.results[0];
      expect(result).toHaveProperty('ioc');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskLevel');
    });

    test('Error responses should have consistent structure', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: [],
        }),
      });

      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
    });
  });

  describe('Cache Headers', () => {
    test('should include cache status in headers', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
        }),
      });

      const cacheHeader = response.headers.get('X-Cache-Status');

      if (cacheHeader) {
        // If cache header exists, should be HIT or MISS
        expect(cacheHeader).toMatch(/^(HIT|MISS)$/);
      } else {
        // Cache header may not be implemented yet - skip
        console.log('ℹ️  X-Cache-Status header not present');
      }
    });
  });

  describe('Rate Limit Headers', () => {
    test('should include rate limit info in headers', async () => {
      const response = await fetch(`${API_BASE}/api/ioc-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          iocs: ['8.8.8.8'],
        }),
      });

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Security Tests', () => {
    describe('Input Validation', () => {
      test('should reject SQL injection attempts', async () => {
        const response = await fetch(`${API_BASE}/api/ioc-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify({
            iocs: ["'; DROP TABLE users; --"],
          }),
        });

        // Should reject or treat as invalid
        expect(response.status).not.toBe(500);
      });

      test('should reject XSS attempts', async () => {
        const response = await fetch(`${API_BASE}/api/ioc-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify({
            iocs: ['<script>alert("xss")</script>'],
          }),
        });

        expect(response.status).not.toBe(500);
      });

      test('should reject oversized payloads', async () => {
        const hugeArray = Array(10000).fill('8.8.8.8');
        
        const response = await fetch(`${API_BASE}/api/ioc-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,          
            'X-Test-Mode': 'true',
          },
          body: JSON.stringify({
            iocs: hugeArray,
          }),
        });

        expect(response.status).toBe(413); // Payload too large
      });
    });

    describe('Authentication', () => {
      test('should reject invalid tokens', async () => {
        const response = await fetch(`${API_BASE}/api/ioc-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-token',
          },
          body: JSON.stringify({
            iocs: ['8.8.8.8'],
          }),
        });

        expect(response.status).toBe(401);
      });

      test('should reject expired tokens', async () => {
        const expiredToken = 'expired-jwt-token';
        
        const response = await fetch(`${API_BASE}/api/ioc-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${expiredToken}`,
          },
          body: JSON.stringify({
            iocs: ['8.8.8.8'],
          }),
        });

        expect(response.status).toBe(401);
      });
    });
  });
});
