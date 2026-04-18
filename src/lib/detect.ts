import { IOCType } from './validators';

// Regular expressions for IOC detection
const IP_V4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IP_V6_REGEX = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?$/;
const MD5_REGEX = /^[a-f0-9]{32}$/i;
const SHA1_REGEX = /^[a-f0-9]{40}$/i;
const SHA256_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Extract base domain from URL or domain string for consistent matching
 */
export function extractBaseDomain(ioc: string): string {
  let domain = ioc.trim().toLowerCase();
  
  // Remove protocol (http://, https://)
  domain = domain.replace(/^https?:\/\//, '');
  
  // Remove www. prefix
  domain = domain.replace(/^www\./, '');
  
  // Remove trailing slash and path
  domain = domain.split('/')[0];
  
  // Remove port number
  domain = domain.split(':')[0];
  
  // Remove query parameters and fragments
  domain = domain.split('?')[0].split('#')[0];
  
  return domain;
}

/**
 * Check if two domains match, considering subdomains
 */
export function domainsMatch(inputDomain: string, whitelistDomain: string): boolean {
  const normalizedInput = extractBaseDomain(inputDomain);
  const normalizedWhitelist = whitelistDomain.toLowerCase();
  
  // Exact match
  if (normalizedInput === normalizedWhitelist) {
    return true;
  }
  
  // Subdomain match (e.g., www.google.com matches google.com)
  if (normalizedInput.endsWith('.' + normalizedWhitelist)) {
    return true;
  }
  
  return false;
}

/**
 * Normalize IOC input by trimming and applying type-specific formatting
 */
export function normalizeIOC(ioc: string, type?: IOCType): string {
  let normalized = ioc.trim();
  
  if (type === 'domain' || (!type && DOMAIN_REGEX.test(normalized))) {
    // For domains, use the enhanced base domain extraction
    normalized = extractBaseDomain(normalized);
  } else if (type === 'url') {
    // For URLs, keep protocol but normalize the domain part
    const urlMatch = normalized.match(/^(https?:\/\/)(.+)/);
    if (urlMatch) {
      const protocol = urlMatch[1];
      const restOfUrl = urlMatch[2];
      const domainPart = restOfUrl.split('/')[0];
      const pathPart = restOfUrl.substring(domainPart.length);
      
      // Normalize just the domain part
      let normalizedDomain = domainPart.toLowerCase();
      normalizedDomain = normalizedDomain.replace(/^www\./, '');
      
      normalized = protocol + normalizedDomain + pathPart;
    } else {
      normalized = normalized.toLowerCase();
    }
  } else if (type === 'hash' || (!type && isHash(normalized))) {
    // Normalize hash to lowercase
    normalized = normalized.toLowerCase();
  } else if (type === 'ip' || (!type && isIP(normalized))) {
    // Keep IP as-is after trim
    normalized = normalized.toLowerCase();
  }
  
  return normalized;
}

/**
 * Detect IOC type from the input string
 */
export function detectIOCType(ioc: string): IOCType {
  const normalized = ioc.trim();
  
  if (isIP(normalized)) {
    return 'ip';
  } else if (isHash(normalized)) {
    return 'hash';
  } else if (URL_REGEX.test(normalized)) {
    return 'url';
  } else if (DOMAIN_REGEX.test(normalized.replace(/^https?:\/\//, ''))) {
    return 'domain';
  }
  
  // Default fallback - treat as domain if it looks domain-like
  return 'domain';
}

/**
 * Check if string is a valid IP address
 */
function isIP(str: string): boolean {
  return IP_V4_REGEX.test(str) || IP_V6_REGEX.test(str);
}

/**
 * Check if string is a valid hash
 */
function isHash(str: string): boolean {
  return MD5_REGEX.test(str) || SHA1_REGEX.test(str) || SHA256_REGEX.test(str);
}

/**
 * Get hash type for a given hash string
 */
export function getHashType(hash: string): 'md5' | 'sha1' | 'sha256' | null {
  if (MD5_REGEX.test(hash)) return 'md5';
  if (SHA1_REGEX.test(hash)) return 'sha1';
  if (SHA256_REGEX.test(hash)) return 'sha256';
  return null;
}

/**
 * Validate and clean a list of IOCs
 */
export function validateIOCList(iocs: string[]): {
  valid: Array<{ ioc: string; type: IOCType; normalized: string }>;
  invalid: Array<{ ioc: string; error: string }>;
} {
  const valid: Array<{ ioc: string; type: IOCType; normalized: string }> = [];
  const invalid: Array<{ ioc: string; error: string }> = [];
  
  for (const ioc of iocs) {
    if (!ioc.trim()) {
      invalid.push({ ioc, error: 'Empty IOC' });
      continue;
    }
    
    try {
      const type = detectIOCType(ioc);
      const normalized = normalizeIOC(ioc, type);
      valid.push({ ioc: ioc.trim(), type, normalized });
    } catch (error) {
      invalid.push({ ioc, error: 'Invalid IOC format' });
    }
  }
  
  return { valid, invalid };
}
