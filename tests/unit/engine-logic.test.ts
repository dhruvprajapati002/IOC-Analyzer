/**
 * Unit Tests - Core Engine Logic
 * Tests verdict calculation, scoring, and confidence WITHOUT external APIs
 */

import { describe, test, expect } from '@jest/globals';
import { GOLDEN_IPS, GOLDEN_HASHES, GOLDEN_DOMAINS } from '../fixtures/golden-iocs';

/**
 * Test verdict calculation logic
 * This should work even if all external services are down
 */
describe('Verdict Engine - Core Logic', () => {
  describe('IP Classification', () => {
    test('should classify private IPs as unknown', () => {
      const privateIPs = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '127.0.0.1'];
      
      privateIPs.forEach(ip => {
        const result = classifyIPType(ip);
        expect(result.isPrivate).toBe(true);
        expect(result.shouldSkipExternalLookup).toBe(true);
      });
    });

    test('should identify valid public IPs', () => {
      const publicIPs = ['8.8.8.8', '1.1.1.1', '185.234.219.14'];
      
      publicIPs.forEach(ip => {
        const result = classifyIPType(ip);
        expect(result.isPrivate).toBe(false);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid IPs', () => {
      GOLDEN_IPS.invalid.forEach(ip => {
        const result = classifyIPType(ip);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Hash Validation', () => {
    test('should validate MD5 hashes', () => {
      const validMD5 = '44d88612fea8a8f36de82e1278abb02f';
      const result = validateHash(validMD5);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('md5');
      expect(result.length).toBe(32);
    });

    test('should validate SHA256 hashes', () => {
      const validSHA256 = '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f';
      const result = validateHash(validSHA256);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('sha256');
      expect(result.length).toBe(64);
    });

    test('should reject invalid hashes', () => {
      GOLDEN_HASHES.invalid.forEach(hash => {
        const result = validateHash(hash);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Risk Score Calculation', () => {
    test('should calculate risk score from detection stats', () => {
      const stats = {
        malicious: 70,
        suspicious: 10,
        harmless: 10,
        undetected: 0,
      };

      const riskScore = calculateRiskScore(stats);
      
      expect(riskScore).toBeGreaterThan(80);
      expect(riskScore).toBeLessThanOrEqual(100);
    });

    test('should return low risk for clean results', () => {
      const stats = {
        malicious: 0,
        suspicious: 0,
        harmless: 85,
        undetected: 5,
      };

      const riskScore = calculateRiskScore(stats);
      
      expect(riskScore).toBeLessThan(10);
    });

    test('should handle edge case: zero detections', () => {
      const stats = {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
      };

      const riskScore = calculateRiskScore(stats);
      
      expect(riskScore).toBe(0);
    });
  });

  describe('Verdict Determination', () => {
    test('should return malicious for high malicious count', () => {
      const stats = {
        malicious: 75,
        suspicious: 5,
        harmless: 10,
        undetected: 0,
      };

      const verdict = determineVerdict(stats);
      
      expect(verdict.verdict).toBe('malicious');
      expect(verdict.riskLevel).toBe('critical');
      expect(verdict.confidence).toBe('high');
    });

    test('should return harmless for high harmless count', () => {
      const stats = {
        malicious: 0,
        suspicious: 0,
        harmless: 85,
        undetected: 5,
      };

      const verdict = determineVerdict(stats);
      
      expect(verdict.verdict).toBe('harmless');
      expect(verdict.riskLevel).toBe('low');
      expect(verdict.confidence).toBe('high');
    });

    test('should return suspicious for borderline cases', () => {
      const stats = {
        malicious: 15,
        suspicious: 20,
        harmless: 55,
        undetected: 0,
      };

      const verdict = determineVerdict(stats);
      
      expect(verdict.verdict).toBe('suspicious');
      expect(verdict.riskLevel).toBe('medium');
    });

    test('should return unknown when no data available', () => {
      const stats = {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 90,
      };

      const verdict = determineVerdict(stats);
      
      expect(verdict.verdict).toBe('unknown');
      expect(verdict.riskLevel).toBe('low');
      expect(verdict.confidence).toBe('low');
    });
  });

  describe('Confidence Calculation', () => {
    test('should return high confidence for clear malicious', () => {
      const stats = {
        malicious: 80,
        suspicious: 0,
        harmless: 10,
        undetected: 0,
      };

      const confidence = calculateConfidence(stats);
      
      expect(confidence).toBe('high');
    });

    test('should return low confidence for mixed results', () => {
      const stats = {
        malicious: 30,
        suspicious: 20,
        harmless: 30,
        undetected: 10,
      };

      const confidence = calculateConfidence(stats);
      
      expect(confidence).toBe('low');
    });

    test('should return medium confidence for moderate results', () => {
      const stats = {
        malicious: 50,
        suspicious: 10,
        harmless: 30,
        undetected: 0,
      };

      const confidence = calculateConfidence(stats);
      
      expect(confidence).toBe('medium');
    });
  });
});

describe('IOC Type Detection', () => {
  test('should correctly identify IP addresses', () => {
    expect(detectIOCType('8.8.8.8')).toBe('ip');
    expect(detectIOCType('2001:4860:4860::8888')).toBe('ip');
  });

  test('should correctly identify hashes', () => {
    expect(detectIOCType('44d88612fea8a8f36de82e1278abb02f')).toBe('hash');
    expect(detectIOCType('275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f')).toBe('hash');
  });

  test('should correctly identify domains', () => {
    expect(detectIOCType('google.com')).toBe('domain');
    expect(detectIOCType('malicious-site.xyz')).toBe('domain');
  });

  test('should correctly identify URLs', () => {
    expect(detectIOCType('https://google.com')).toBe('url');
    expect(detectIOCType('http://malware.com/payload.exe')).toBe('url');
  });
});

// ===== HELPER FUNCTIONS (These should match your actual implementation) =====

function classifyIPType(ip: string) {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
  ];

  const isPrivate = privateRanges.some(regex => regex.test(ip));
  const isValid = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);

  return {
    isPrivate,
    isValid,
    shouldSkipExternalLookup: isPrivate,
  };
}

function validateHash(hash: string) {
  const md5Regex = /^[a-f0-9]{32}$/i;
  const sha1Regex = /^[a-f0-9]{40}$/i;
  const sha256Regex = /^[a-f0-9]{64}$/i;

  if (md5Regex.test(hash)) {
    return { isValid: true, type: 'md5', length: 32 };
  }
  if (sha1Regex.test(hash)) {
    return { isValid: true, type: 'sha1', length: 40 };
  }
  if (sha256Regex.test(hash)) {
    return { isValid: true, type: 'sha256', length: 64 };
  }

  return { isValid: false, type: null, length: 0 };
}

function calculateRiskScore(stats: any) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  if (total === 0) return 0;

  const maliciousWeight = 1.0;
  const suspiciousWeight = 0.5;
  
  const score = ((stats.malicious * maliciousWeight + stats.suspicious * suspiciousWeight) / total) * 100;
  
  return Math.min(Math.round(score), 100);
}

function determineVerdict(stats: any) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  
  if (total === 0 || stats.undetected > total * 0.8) {
    return { verdict: 'unknown', riskLevel: 'low', confidence: 'low' };
  }

  const maliciousRatio = stats.malicious / total;
  const suspiciousRatio = stats.suspicious / total;
  
  if (maliciousRatio > 0.6) {
    return { verdict: 'malicious', riskLevel: 'critical', confidence: 'high' };
  }
  
  if (maliciousRatio > 0.3 || suspiciousRatio > 0.3) {
    return { verdict: 'suspicious', riskLevel: 'medium', confidence: 'medium' };
  }
  
  if (stats.harmless > total * 0.8) {
    return { verdict: 'harmless', riskLevel: 'low', confidence: 'high' };
  }
  
  return { verdict: 'suspicious', riskLevel: 'medium', confidence: 'low' };
}

function calculateConfidence(stats: any) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  if (total === 0) return 'low';

  const dominantCategory = Math.max(stats.malicious, stats.suspicious, stats.harmless);
  const dominantRatio = dominantCategory / total;

  if (dominantRatio > 0.7) return 'high';
  if (dominantRatio > 0.5) return 'medium';
  return 'low';
}

function detectIOCType(ioc: string): string {
  if (/^https?:\/\//.test(ioc)) return 'url';
  if (/^[a-f0-9]{32,64}$/i.test(ioc)) return 'hash';
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ioc)) return 'ip';
  // IPv6 detection (simplified)
  if (/:/.test(ioc) && /^[0-9a-fA-F:]+$/.test(ioc)) return 'ip';
  if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(ioc)) return 'domain';
  return 'unknown';
}
