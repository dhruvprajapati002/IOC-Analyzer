import { apiFetch } from '@/lib/apiFetch';
import type { GeolocationData, AbuseIPDBData } from '../types/threat-intel.types';
import { apiKeyManager } from '../utils/api-key-manager';

const INTERNAL_GEO_API_URL = (process.env.IP_GEOLOCATION_API_URL || '').replace(/\/$/, '');

/**
 * Fetch with retry and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 2,
  timeout = 5000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await apiFetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // If rate limited, wait and retry
      if (response.status === 429 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[IPReputation] ⏳ Rate limited, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError') {
        console.log(`[IPReputation] ⏱️ Timeout on attempt ${attempt + 1}/${maxRetries + 1}`);
      } else {
        console.log(`[IPReputation] ❌ Error on attempt ${attempt + 1}:`, error.message);
      }

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Get geolocation from configured internal provider
 */
async function getGeoFromInternalProvider(ip: string): Promise<GeolocationData | null> {
  if (!INTERNAL_GEO_API_URL) {
    return null;
  }

  try {
    console.log(`[IPReputation] 🛰️ Trying internal geolocation API for ${ip}...`);

    const response = await fetchWithRetry(
      `${INTERNAL_GEO_API_URL}/${ip}`,
      {},
      2,
      8000
    );

    const data = await response.json();

    if (!data.country || !data.location) {
      console.log(`[IPReputation] ⚠️ Internal geolocation API returned incomplete data`);
      return null;
    }

    const subdivision = data.subdivisions?.[0];
    const region = subdivision?.names?.en || 'Unknown';

    console.log(`[IPReputation] ✅ Internal geolocation API success: ${data.country.names.en}`);

    return {
      countryCode: data.country.iso_code || 'XX',
      countryName: data.country.names?.en || 'Unknown',
      region: region,
      city: data.city?.names?.en || 'Unknown',
      latitude: data.location.latitude || 0,
      longitude: data.location.longitude || 0,
      timezone: data.location.time_zone || 'UTC',
      isp: data.traits?.isp || 'Unknown',
      org: data.traits?.organization || 'Unknown',
      asn: data.traits?.autonomous_system_number ? `AS${data.traits.autonomous_system_number}` : 'Unknown',
      asnName: data.traits?.autonomous_system_organization || 'Unknown ASN'
    };

  } catch (error: any) {
    console.error(`[IPReputation] ❌ Internal geolocation API error:`, error.message);
    return null;
  }
}

/**
 * Get geolocation from ip-api.com (Fallback)
 */
async function getGeoFromIPAPI(ip: string): Promise<GeolocationData | null> {
  try {
    console.log(`[IPReputation] 🌍 Trying ip-api.com for ${ip}...`);

    const response = await fetchWithRetry(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,asname`,
      {},
      2,
      5000
    );

    const data = await response.json();

    if (data.status !== 'success') {
      console.log(`[IPReputation] ⚠️ ip-api.com failed: ${data.message || 'Unknown'}`);
      return null;
    }

    console.log(`[IPReputation] ✅ ip-api.com success: ${data.country}`);
    return {
      countryCode: data.countryCode || 'XX',
      countryName: data.country || 'Unknown',
      region: data.regionName || 'Unknown',
      city: data.city || 'Unknown',
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      timezone: data.timezone || 'UTC',
      isp: data.isp || 'Unknown',
      org: data.org || 'Unknown',
      asn: data.as?.split(' ')[0] || 'Unknown',
      asnName: data.asname || 'Unknown ASN'
    };

  } catch (error: any) {
    console.error(`[IPReputation] ❌ ip-api.com error:`, error.message);
    return null;
  }
}

/**
 * Main geolocation function with fallback
 */
export async function getGeolocationData(ip: string): Promise<GeolocationData | null> {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    console.log(`[IPReputation] ⚠️ Invalid IP format: ${ip}`);
    return null;
  }

  console.log(`[IPReputation] 🌍 Fetching geolocation for ${ip}...`);

  const providers = [
    getGeoFromInternalProvider,
    getGeoFromIPAPI
  ];

  for (const provider of providers) {
    const result = await provider(ip);
    if (result) {
      return result;
    }
  }

  console.log(`[IPReputation] ❌ All providers failed for ${ip}`);
  return null;
}

/**
 * Check AbuseIPDB
 */
export async function checkAbuseIPDB(ip: string): Promise<AbuseIPDBData | null> {
  // Get next API key using round-robin
  const apiKey = apiKeyManager.getNextKey('abuseipdb');

  if (!apiKey) {
    console.log('[IPReputation] ⚠️ AbuseIPDB API key not configured');
    return null;
  }

  try {
    console.log(`[IPReputation] 🔍 Checking AbuseIPDB for ${ip}...`);

    const response = await fetchWithRetry(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`,
      {
        headers: {
          Key: apiKey,
          Accept: 'application/json'
        }
      },
      1,
      8000
    );

    const fullData = await response.json();

    if (!fullData.data) {
      console.log('[IPReputation] ⚠️ No data returned');
      // Report failure to key manager
      apiKeyManager.reportFailure('abuseipdb', apiKey);
      return null;
    }

    const data = fullData.data;
    const confidence = data.abuseConfidenceScore || 0;

    console.log(`[IPReputation] ✅ Confidence: ${confidence}%`);

    // Report success to key manager
    apiKeyManager.reportSuccess('abuseipdb', apiKey);
    return {
      abuseConfidenceScore: confidence,
      usageType: data.usageType || 'Unknown',
      isWhitelisted: data.isWhitelisted || false,
      totalReports: data.totalReports || 0,
      numDistinctUsers: data.numDistinctUsers || 0,
      lastReportedAt: data.lastReportedAt || null
    };
  } catch (error: any) {
    console.error('[IPReputation] ❌ Error:', error.message);
    // Report failure to key manager
    apiKeyManager.reportFailure('abuseipdb', apiKey);
    return null;
  }
}
