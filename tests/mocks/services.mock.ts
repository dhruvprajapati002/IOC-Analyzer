/**
 * Mock VirusTotal API Responses
 */

export const mockVirusTotalResponses = {
  // Clean IP
  ip_clean: {
    data: {
      id: '8.8.8.8',
      type: 'ip_address',
      attributes: {
        last_analysis_stats: {
          harmless: 85,
          malicious: 0,
          suspicious: 0,
          undetected: 5,
          timeout: 0,
        },
        last_analysis_results: {},
        country: 'US',
        as_owner: 'Google LLC',
        asn: 15169,
      },
    },
  },

  // Malicious IP
  ip_malicious: {
    data: {
      id: '185.234.219.14',
      type: 'ip_address',
      attributes: {
        last_analysis_stats: {
          harmless: 2,
          malicious: 78,
          suspicious: 10,
          undetected: 0,
          timeout: 0,
        },
        last_analysis_results: {
          'Criminal IP': {
            category: 'malicious',
            result: 'malicious',
            method: 'blacklist',
            engine_name: 'Criminal IP',
          },
          'Fortinet': {
            category: 'malicious',
            result: 'malware',
            method: 'blacklist',
            engine_name: 'Fortinet',
          },
          'CINS Army': {
            category: 'malicious',
            result: 'malicious',
            method: 'blacklist',
            engine_name: 'CINS Army',
          },
        },
        country: 'RU',
        as_owner: 'AS-CHOOPA',
        asn: 20473,
      },
    },
  },

  // EICAR test file
  file_eicar: {
    data: {
      id: '44d88612fea8a8f36de82e1278abb02f',
      type: 'file',
      attributes: {
        last_analysis_stats: {
          harmless: 0,
          type_unsupported: 0,
          suspicious: 2,
          confirmed_timeout: 0,
          timeout: 0,
          failure: 0,
          malicious: 68,
          undetected: 2,
        },
        last_analysis_results: {
          'Kaspersky': {
            category: 'malicious',
            engine_name: 'Kaspersky',
            result: 'EICAR-Test-File',
            method: 'signature',
          },
          'Microsoft': {
            category: 'malicious',
            engine_name: 'Microsoft',
            result: 'Virus:DOS/EICAR_Test_File',
            method: 'signature',
          },
        },
        popular_threat_label: 'eicar',
        threat_names: ['EICAR-Test-File', 'Test-File'],
        meaningful_name: 'eicar.com',
        size: 68,
        type_description: 'DOS/MBR boot sector',
      },
    },
  },

  // Unknown file
  file_unknown: {
    data: {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1',
      type: 'file',
      attributes: {
        last_analysis_stats: {
          harmless: 0,
          malicious: 0,
          suspicious: 0,
          undetected: 0,
        },
        last_analysis_results: {},
      },
    },
    error: {
      code: 'NotFoundError',
      message: 'File not found',
    },
  },

  // Service error
  error_rateLimit: {
    error: {
      code: 'QuotaExceededError',
      message: 'Quota exceeded',
    },
  },

  error_timeout: {
    error: {
      code: 'TimeoutError',
      message: 'Request timeout',
    },
  },
};

export const mockMalwareBazaarResponses = {
  found: {
    query_status: 'ok',
    data: [
      {
        sha256_hash: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f',
        md5_hash: '44d88612fea8a8f36de82e1278abb02f',
        sha1_hash: '3395856ce81f2b7382dee72602f798b642f14140',
        file_type: 'exe',
        file_size: 73802,
        signature: 'Emotet',
        firstseen: '2024-01-15',
        lastseen: '2024-01-20',
        reporter: 'abuse_ch',
        origin_country: 'US',
        intelligence: {
          clamav: 'Trojan.Emotet',
          downloads: 150,
          uploads: 50,
        },
      },
    ],
  },

  notFound: {
    query_status: 'no_results',
  },

  error: {
    query_status: 'error',
    message: 'Service unavailable',
  },
};

export const mockThreatFoxResponses = {
  found: {
    query_status: 'ok',
    data: [
      {
        id: 12345,
        ioc: '185.234.219.14',
        threat_type: 'botnet_cc',
        malware: 'Emotet',
        malware_alias: 'Epoch4',
        confidence_level: 100,
        first_seen: '2024-01-10',
        last_seen: '2024-01-22',
        reporter: 'abuse_ch',
        tags: ['emotet', 'botnet', 'c2'],
      },
    ],
  },

  notFound: {
    query_status: 'no_result',
  },
};

export const mockGreyNoiseResponses = {
  malicious: {
    ip: '185.234.219.14',
    seen: true,
    classification: 'malicious',
    name: 'unknown',
    link: 'https://viz.greynoise.io/ip/185.234.219.14',
    last_seen: '2024-01-22',
    message: 'IP is classified as malicious',
    tags: ['scanner', 'brute-force'],
  },

  benign: {
    ip: '8.8.8.8',
    seen: true,
    classification: 'benign',
    name: 'Google Public DNS',
    link: 'https://viz.greynoise.io/ip/8.8.8.8',
    last_seen: '2024-01-22',
    message: 'IP is classified as benign',
  },

  notSeen: {
    ip: '1.2.3.4',
    seen: false,
    message: 'IP not seen in GreyNoise',
  },
};

export const mockAbuseIPDBResponses = {
  malicious: {
    data: {
      ipAddress: '185.234.219.14',
      isPublic: true,
      ipVersion: 4,
      isWhitelisted: false,
      abuseConfidenceScore: 100,
      countryCode: 'RU',
      usageType: 'Data Center/Web Hosting/Transit',
      isp: 'AS-CHOOPA',
      domain: 'choopa.com',
      totalReports: 5804,
      numDistinctUsers: 1234,
      lastReportedAt: '2024-01-22T10:30:00+00:00',
    },
  },

  clean: {
    data: {
      ipAddress: '8.8.8.8',
      isPublic: true,
      ipVersion: 4,
      isWhitelisted: true,
      abuseConfidenceScore: 0,
      countryCode: 'US',
      usageType: 'Content Delivery Network',
      isp: 'Google LLC',
      domain: 'google.com',
      totalReports: 0,
      numDistinctUsers: 0,
      lastReportedAt: null,
    },
  },
};

/**
 * Mock service factory
 */
export class MockServices {
  static virusTotal(scenario: 'clean' | 'malicious' | 'unknown' | 'error' | 'timeout') {
    return {
      analyze: jest.fn().mockImplementation(() => {
        switch (scenario) {
          case 'clean':
            return Promise.resolve(mockVirusTotalResponses.ip_clean);
          case 'malicious':
            return Promise.resolve(mockVirusTotalResponses.ip_malicious);
          case 'unknown':
            return Promise.resolve(mockVirusTotalResponses.file_unknown);
          case 'error':
            return Promise.reject(new Error('QuotaExceededError'));
          case 'timeout':
            return new Promise((_, reject) => 
              setTimeout(() => reject(new Error('TimeoutError')), 5000)
            );
          default:
            return Promise.resolve(mockVirusTotalResponses.ip_clean);
        }
      }),
    };
  }

  static malwareBazaar(scenario: 'found' | 'notFound' | 'error') {
    return {
      queryHash: jest.fn().mockImplementation(() => {
        switch (scenario) {
          case 'found':
            return Promise.resolve(mockMalwareBazaarResponses.found);
          case 'notFound':
            return Promise.resolve(mockMalwareBazaarResponses.notFound);
          case 'error':
            return Promise.reject(new Error('Service unavailable'));
          default:
            return Promise.resolve(mockMalwareBazaarResponses.notFound);
        }
      }),
    };
  }

  static threatFox(scenario: 'found' | 'notFound') {
    return {
      queryIOC: jest.fn().mockImplementation(() => {
        return scenario === 'found'
          ? Promise.resolve(mockThreatFoxResponses.found)
          : Promise.resolve(mockThreatFoxResponses.notFound);
      }),
    };
  }

  static greyNoise(scenario: 'malicious' | 'benign' | 'notSeen') {
    return {
      queryIP: jest.fn().mockImplementation(() => {
        switch (scenario) {
          case 'malicious':
            return Promise.resolve(mockGreyNoiseResponses.malicious);
          case 'benign':
            return Promise.resolve(mockGreyNoiseResponses.benign);
          case 'notSeen':
            return Promise.resolve(mockGreyNoiseResponses.notSeen);
        }
      }),
    };
  }

  static abuseIPDB(scenario: 'malicious' | 'clean') {
    return {
      check: jest.fn().mockImplementation(() => {
        return scenario === 'malicious'
          ? Promise.resolve(mockAbuseIPDBResponses.malicious)
          : Promise.resolve(mockAbuseIPDBResponses.clean);
      }),
    };
  }
}
