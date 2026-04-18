import { SourceConfig } from '../types/threat-intel.types';

export const SOURCES: Record<string, SourceConfig> = {
  virustotal: {
    name: 'virustotal',
    displayName: 'VirusTotal',
    enabled: !!process.env.VT_API_KEY,
    weight: 0.20,
    supports: ['ip', 'domain', 'url', 'hash'],
    quota: { daily: 500 },
    required: true,  // Platform works without VT now!
    priority: 2,
    apiKeyRequired: true
  },
  
  abuseipdb: {
    name: 'abuseipdb',
    displayName: 'AbuseIPDB',
    enabled: !!process.env.ABUSEIPDB_API_KEY,
    weight: 0.25,
    supports: ['ip'],
    quota: { daily: 1000 },
    required: true,  // Critical for IP reputation
    priority: 1,
    apiKeyRequired: true
  },
  
  ipqs: {
    name: 'ipqs',
    displayName: 'IPQualityScore',
    enabled: process.env.IPQS_ENABLED === 'true' && !!process.env.IPQS_API_KEY,
    weight: 0.15,
    supports: ['ip', 'domain', 'url'],
    quota: { monthly: 5000 },
    required: false,
    priority: 3,
    apiKeyRequired: true
  },
  
  malwarebazaar: {
    name: 'malwarebazaar',
    displayName: 'MalwareBazaar',
    enabled: process.env.MALWAREBAZAAR_ENABLED === 'true' && !!process.env.ABUSE_CH_API_KEY,
    weight: 0.20,
    supports: ['hash'],
    quota: { daily: -1 },  // Unlimited
    required: true,  // Critical for file analysis
    priority: 1,
    apiKeyRequired: true
  },
  
  threatfox: {
    name: 'threatfox',
    displayName: 'ThreatFox',
    enabled: process.env.THREATFOX_ENABLED === 'true' && !!process.env.ABUSE_CH_API_KEY,
    weight: 0.15,
    supports: ['ip', 'domain'],
    quota: { daily: -1 },  // Unlimited
    required: true,  // Critical for threat classification
    priority: 1,
    apiKeyRequired: true
  },
  
  urlhaus: {
    name: 'urlhaus',
    displayName: 'URLhaus',
    enabled: process.env.URLHAUS_ENABLED === 'true' && !!process.env.ABUSE_CH_API_KEY,
    weight: 0.15,
    supports: ['domain', 'url', 'hash'],
    quota: { daily: -1 },  // Unlimited
    required: false,
    priority: 2,
    apiKeyRequired: true
  },
  
  greynoise: {
    name: 'greynoise',
    displayName: 'GreyNoise',
    enabled: process.env.GREYNOISE_ENABLED === 'true' && !!process.env.GREYNOISE_API_KEY,
    weight: 0.10,
    supports: ['ip'],
    quota: { monthly: 10000 },
    required: false,
    priority: 4,
    apiKeyRequired: true
  }
};

/**
 * Get sources that support a specific IOC type
 */
export function getSourcesForIOCType(iocType: string): SourceConfig[] {
  return Object.values(SOURCES)
    .filter(source => source.enabled && source.supports.includes(iocType as any))
    .sort((a, b) => a.priority - b.priority);  // Sort by priority
}

/**
 * Get required sources (must work for platform stability)
 */
export function getRequiredSources(): SourceConfig[] {
  return Object.values(SOURCES).filter(source => source.enabled && source.required);
}

/**
 * Get enabled sources
 */
export function getEnabledSources(): SourceConfig[] {
  return Object.values(SOURCES).filter(source => source.enabled);
}

/**
 * Check if minimum required sources are available
 */
export function hasMinimumSources(iocType: string): boolean {
  const sources = getSourcesForIOCType(iocType);
  const requiredSources = sources.filter(s => s.required);
  return requiredSources.length >= 1;  // At least 1 required source must be available
}
