/**
 * Golden Test Fixtures - Known IOCs with Expected Results
 * These are truth sets for validating engine logic
 */

export const GOLDEN_IPS = {
  // ===== CLEAN IPS =====
  clean: [
    {
      input: '8.8.8.8',
      description: 'Google DNS - Known benign',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
        confidence: 'high',
        shouldHaveGeolocation: true,
      },
    },
    {
      input: '1.1.1.1',
      description: 'Cloudflare DNS - Known benign',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
        confidence: 'high',
        shouldHaveGeolocation: true,
      },
    },
  ],

  // ===== MALICIOUS IPS =====
  malicious: [
    {
      input: '185.234.219.14',
      description: 'Known C2 server',
      expected: {
        verdict: 'malicious',
        riskLevel: 'critical',
        confidence: 'high',
        shouldHaveReputation: true,
        shouldHaveAbuseData: true,
      },
    },
    {
      input: '45.142.212.61',
      description: 'Known botnet IP',
      expected: {
        verdict: 'malicious',
        riskLevel: 'high',
        confidence: 'high',
        shouldHaveReputation: true,
      },
    },
  ],

  // ===== SUSPICIOUS IPS =====
  suspicious: [
    {
      input: '194.165.16.58',
      description: 'Potentially compromised',
      expected: {
        verdict: 'suspicious',
        riskLevel: 'medium',
        confidence: 'medium',
      },
    },
  ],

  // ===== EDGE CASES =====
  edgeCases: [
    {
      input: '192.168.1.1',
      description: 'Private IP',
      expected: {
        verdict: 'unknown',
        riskLevel: 'low',
        shouldSkipExternalLookup: true,
      },
    },
    {
      input: '10.0.0.1',
      description: 'Private IP',
      expected: {
        verdict: 'unknown',
        riskLevel: 'low',
        shouldSkipExternalLookup: true,
      },
    },
    {
      input: '127.0.0.1',
      description: 'Localhost',
      expected: {
        verdict: 'unknown',
        riskLevel: 'low',
        shouldSkipExternalLookup: true,
      },
    },
    {
      input: '2001:4860:4860::8888',
      description: 'IPv6 Google DNS',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
      },
    },
  ],

  // ===== INVALID =====
  invalid: [
    '999.999.999.999',
    '256.1.1.1',
    'not-an-ip',
    '',
    '...',
  ],
};

export const GOLDEN_HASHES = {
  // ===== CLEAN FILES =====
  clean: [
    {
      input: 'd41d8cd98f00b204e9800998ecf8427e', // Empty file MD5
      type: 'md5',
      description: 'Empty file',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
        confidence: 'high',
      },
    },
  ],

  // ===== MALICIOUS FILES =====
  malicious: [
    {
      input: '44d88612fea8a8f36de82e1278abb02f',
      type: 'md5',
      description: 'EICAR test file',
      expected: {
        verdict: 'malicious',
        riskLevel: 'high',
        confidence: 'high',
        shouldHaveDetections: true,
        minDetectionCount: 50,
      },
    },
    {
      input: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f',
      type: 'sha256',
      description: 'Known ransomware sample',
      expected: {
        verdict: 'malicious',
        riskLevel: 'critical',
        confidence: 'high',
        shouldHaveFamilyLabels: true,
      },
    },
  ],

  // ===== UNKNOWN FILES =====
  unknown: [
    {
      input: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1',
      type: 'md5',
      description: 'Non-existent hash',
      expected: {
        verdict: 'unknown',
        riskLevel: 'low',
        confidence: 'low',
        shouldHaveZeroDetections: true,
      },
    },
  ],

  // ===== INVALID =====
  invalid: [
    'too-short',
    'gggggggggggggggggggggggggggggggg', // Invalid hex
    '',
    'not-a-hash-at-all',
  ],
};

export const GOLDEN_DOMAINS = {
  // ===== CLEAN DOMAINS =====
  clean: [
    {
      input: 'google.com',
      description: 'Google - Known benign',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
        confidence: 'high',
      },
    },
    {
      input: 'microsoft.com',
      description: 'Microsoft - Known benign',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
        confidence: 'high',
      },
    },
  ],

  // ===== MALICIOUS DOMAINS =====
  malicious: [
    {
      input: 'malware-test-site.net',
      description: 'Known malware distribution',
      expected: {
        verdict: 'malicious',
        riskLevel: 'high',
        confidence: 'high',
      },
    },
  ],

  // ===== SUSPICIOUS DOMAINS =====
  suspicious: [
    {
      input: 'newly-registered-suspicious.xyz',
      description: 'New domain with suspicious TLD',
      expected: {
        verdict: 'suspicious',
        riskLevel: 'medium',
      },
    },
  ],

  // ===== INVALID =====
  invalid: [
    'not a domain',
    'invalid..domain.com',
    '.com',
    '',
  ],
};

export const GOLDEN_URLS = {
  clean: [
    {
      input: 'https://google.com',
      expected: {
        verdict: 'harmless',
        riskLevel: 'low',
      },
    },
  ],
  malicious: [
    {
      input: 'http://malicious-phishing-site.tk/login',
      expected: {
        verdict: 'malicious',
        riskLevel: 'critical',
      },
    },
  ],
};

/**
 * Test expectations for service outages
 */
export const SERVICE_OUTAGE_SCENARIOS = {
  allServicesDown: {
    description: 'All external services unavailable',
    expectedBehavior: {
      shouldReturnUnknown: true,
      shouldNotCrash: true,
      shouldHaveErrorMessage: true,
    },
  },
  virusTotalOnly: {
    description: 'Only VirusTotal available',
    expectedBehavior: {
      shouldReturnVerdict: true,
      shouldUseCache: true,
    },
  },
  noVirusTotal: {
    description: 'VirusTotal unavailable, others work',
    expectedBehavior: {
      shouldReturnVerdict: true,
      shouldUseFallbacks: true,
    },
  },
};

/**
 * Abuse testing scenarios
 */
export const ABUSE_SCENARIOS = {
  rateLimiting: {
    requestCount: 150,
    timeWindow: 3600000, // 1 hour
    expectedBehavior: {
      shouldBlock: true,
      shouldReturn429: true,
      shouldPreserveCache: true,
    },
  },
  duplicateRequests: {
    sameIOC: '8.8.8.8',
    requestCount: 10,
    expectedBehavior: {
      shouldUseCache: true,
      shouldNotHitAPI: true,
      firstRequestOnly: true,
    },
  },
};
