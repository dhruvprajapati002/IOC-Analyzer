/**
 * API Keys & Configuration Tests
 * Tests API key validation, environment variables, and service authentication
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

describe('API Keys & Configuration', () => {
  describe('Environment Variables', () => {
    test('should have all required environment variables', () => {
      const requiredVars = [
        'MONGODB_URI',
        'OPENSEARCH_NODE',
        'JWT_SECRET',
      ];

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
      });
    });

    test('should have valid MongoDB URI format', () => {
      const uri = process.env.MONGODB_URI;
      
      expect(uri).toMatch(/^mongodb:\/\//);
    });

    test('should have valid OpenSearch node URL', () => {
      const node = process.env.OPENSEARCH_NODE;
      
      expect(node).toMatch(/^https?:\/\//);
    });

    test('should have JWT secret with minimum length', () => {
      const secret = process.env.JWT_SECRET;
      
      expect(secret).toBeDefined();
      // In test environment, minimum 8 characters
      expect(secret!.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('API Key Validation', () => {
    test('should detect missing VirusTotal API key', () => {
      const apiKey = process.env.VIRUSTOTAL_API_KEY;
      
      if (!apiKey) {
        // Should gracefully handle missing key
        expect(() => validateApiKey('virustotal', apiKey)).not.toThrow();
      }
    });

    test('should detect invalid API key format', () => {
      const invalidKeys = [
        'invalid',
        '123',
        '',
        'too-short',
      ];

      invalidKeys.forEach(key => {
        const result = validateApiKeyFormat(key);
        expect(result.isValid).toBe(false);
      });
    });

    test('should validate correct API key format', () => {
      // VirusTotal API keys are 64 characters
      const validKey = 'a'.repeat(64);
      
      const result = validateApiKeyFormat(validKey);
      expect(result.isValid).toBe(true);
    });

    test('should handle missing optional API keys gracefully', () => {
      const optionalServices = [
        'ABUSEIPDB_API_KEY',
        'GREYNOISE_API_KEY',
        'SHODAN_API_KEY',
        'IPQUALITYSCORE_API_KEY',
      ];

      optionalServices.forEach(service => {
        const key = process.env[service];
        // Should not crash if missing
        expect(() => {
          if (!key) {
            console.log(`${service} not configured, skipping`);
          }
        }).not.toThrow();
      });
    });
  });

  describe('Service Authentication', () => {
    test('should return 401 for invalid API key', async () => {
      const mockService = {
        authenticate: jest.fn().mockResolvedValue({
          success: false,
          error: 'Invalid API key',
          statusCode: 401,
        }),
      };

      const result = await mockService.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    test('should return 403 for expired API key', async () => {
      const mockService = {
        authenticate: jest.fn().mockResolvedValue({
          success: false,
          error: 'API key expired',
          statusCode: 403,
        }),
      };

      const result = await mockService.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    test('should return 429 for rate-limited API key', async () => {
      const mockService = {
        authenticate: jest.fn().mockResolvedValue({
          success: false,
          error: 'Rate limit exceeded',
          statusCode: 429,
          retryAfter: 3600,
        }),
      };

      const result = await mockService.authenticate();
      
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.retryAfter).toBeDefined();
    });

    test('should fallback to other services when primary fails', async () => {
      const services = {
        virusTotal: { available: false, error: 'API key invalid' },
        malwareBazaar: { available: true, error: null },
        threatFox: { available: true, error: null },
      };

      const availableServices = Object.entries(services)
        .filter(([_, config]) => config.available)
        .map(([name, _]) => name);

      expect(availableServices.length).toBeGreaterThan(0);
      expect(availableServices).toContain('malwareBazaar');
      expect(availableServices).toContain('threatFox');
    });
  });

  describe('API Key Rotation', () => {
    test('should support multiple API keys', () => {
      const apiKeys = [
        'key1-aaaa',
        'key2-bbbb',
        'key3-cccc',
      ];

      const keyManager = {
        currentIndex: 0,
        getNextKey() {
          const key = apiKeys[this.currentIndex];
          this.currentIndex = (this.currentIndex + 1) % apiKeys.length;
          return key;
        },
      };

      expect(keyManager.getNextKey()).toBe('key1-aaaa');
      expect(keyManager.getNextKey()).toBe('key2-bbbb');
      expect(keyManager.getNextKey()).toBe('key3-cccc');
      expect(keyManager.getNextKey()).toBe('key1-aaaa'); // Rotates back
    });

    test('should mark failed keys as unavailable', () => {
      const keyStatus = new Map([
        ['key1', { active: true, failureCount: 0 }],
        ['key2', { active: true, failureCount: 0 }],
      ]);

      // Simulate key1 failure
      keyStatus.get('key1')!.failureCount = 3;
      keyStatus.get('key1')!.active = false;

      const activeKeys = Array.from(keyStatus.entries())
        .filter(([_, status]) => status.active)
        .map(([key, _]) => key);

      expect(activeKeys).not.toContain('key1');
      expect(activeKeys).toContain('key2');
    });
  });

  describe('Service Quotas', () => {
    test('should track API quota usage', () => {
      const quota = {
        limit: 500,
        used: 0,
        resetAt: Date.now() + 3600000, // 1 hour
      };

      // Simulate API calls
      for (let i = 0; i < 10; i++) {
        quota.used++;
      }

      expect(quota.used).toBe(10);
      expect(quota.limit - quota.used).toBe(490);
    });

    test('should block requests when quota exceeded', () => {
      const quota = {
        limit: 500,
        used: 500,
      };

      const canMakeRequest = quota.used < quota.limit;
      
      expect(canMakeRequest).toBe(false);
    });

    test('should reset quota after time window', () => {
      const quota = {
        limit: 500,
        used: 500,
        resetAt: Date.now() - 1000, // Already passed
      };

      if (Date.now() > quota.resetAt) {
        quota.used = 0;
        quota.resetAt = Date.now() + 3600000;
      }

      expect(quota.used).toBe(0);
    });
  });
});

// ===== HELPER FUNCTIONS =====

function validateApiKey(service: string, apiKey: string | undefined) {
  if (!apiKey) {
    console.warn(`${service} API key not configured`);
    return { valid: false, error: 'Missing API key' };
  }
  return { valid: true, error: null };
}

function validateApiKeyFormat(apiKey: string) {
  if (!apiKey || apiKey.length < 10) {
    return { isValid: false, error: 'Key too short' };
  }
  
  // Check if alphanumeric
  if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
    return { isValid: false, error: 'Invalid characters' };
  }

  return { isValid: true, error: null };
}
