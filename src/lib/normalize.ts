import { VTNormalized, Verdict } from './validators';
import { APP_COLORS } from '@/lib/colors';

interface VTRawData {
  attributes: {
    last_analysis_stats?: {
      malicious: number;
      suspicious: number;
      undetected: number;
      harmless: number;
      timeout?: number;
    };
    reputation?: number;
    categories?: Record<string, string>;
    tags?: string[];
    last_modification_date?: number;
    creation_date?: number;
    last_analysis_results?: Record<string, {
      engine_name: string;
      category: string;
      result: string;
      method?: string;
    }>;
  };
  id: string;
  type: string;
}

/**
 * Normalize VirusTotal response to our standard format
 * 🔥 ENHANCED: Now extracts threat types
 */
export function normalizeVTResponse(vtData: VTRawData): VTNormalized {
  const attrs = vtData.attributes;
  const stats = attrs.last_analysis_stats || {
    malicious: 0,
    suspicious: 0,
    undetected: 0,
    harmless: 0,
  };

  // Compute verdict based on stats
  const verdict = computeVerdict(stats);

  // 🔥 NEW: Extract threat types and detections
  const { threatTypes, detections } = extractThreatIntelligence(attrs);

  // Extract provider information
  const providers = attrs.last_analysis_results
    ? Object.entries(attrs.last_analysis_results).map(([engine, result]) => ({
        engine: result.engine_name || engine,
        category: result.category,
        result: result.result,
        method: result.method
      }))
    : undefined;

  // Extract categories
  const categories = attrs.categories 
    ? Object.keys(attrs.categories)
    : undefined;

  // Format last analysis date
  const last_analysis_date = attrs.last_modification_date
    ? new Date(attrs.last_modification_date * 1000).toISOString()
    : undefined;

  return {
    verdict,
    stats: {
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      harmless: stats.harmless,
      undetected: stats.undetected,
      timeout: stats.timeout,
    },
    reputation: attrs.reputation,
    categories,
    tags: attrs.tags,
    last_analysis_date,
    providers,
    // 🔥 NEW: Include threat intelligence
    threatTypes,
    detections,
  };
}

/**
 * 🔥 NEW: Extract threat intelligence from VT response
 */
export function extractThreatIntelligence(attrs: VTRawData['attributes']): {
  threatTypes: string[];
  detections: Array<{
    engine: string;
    category: string;
    result: string;
    method?: string;
  }>;
} {
  const threatTypes = new Set<string>();
  const detections: Array<{
    engine: string;
    category: string;
    result: string;
    method?: string;
  }> = [];

  // Extract from tags
  if (attrs.tags) {
    attrs.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (tagLower.includes('trojan')) threatTypes.add('Trojan');
      if (tagLower.includes('malware')) threatTypes.add('Malware');
      if (tagLower.includes('virus')) threatTypes.add('Virus');
      if (tagLower.includes('worm')) threatTypes.add('Worm');
      if (tagLower.includes('ransomware')) threatTypes.add('Ransomware');
      if (tagLower.includes('backdoor')) threatTypes.add('Backdoor');
      if (tagLower.includes('spyware')) threatTypes.add('Spyware');
      if (tagLower.includes('adware')) threatTypes.add('Adware');
      if (tagLower.includes('botnet') || tagLower.includes('bot')) threatTypes.add('Botnet');
      if (tagLower.includes('phish')) threatTypes.add('Phishing');
      if (tagLower.includes('rootkit')) threatTypes.add('Rootkit');
      if (tagLower.includes('exploit')) threatTypes.add('Exploit');
      if (tagLower.includes('ddos')) threatTypes.add('DDoS');
      if (tagLower.includes('miner') || tagLower.includes('cryptominer')) threatTypes.add('Cryptominer');
    });
  }

  // Extract from categories
  if (attrs.categories) {
    Object.values(attrs.categories).forEach(category => {
      const catLower = category.toLowerCase();
      if (catLower.includes('malware')) threatTypes.add('Malware');
      if (catLower.includes('phish')) threatTypes.add('Phishing');
      if (catLower.includes('malicious')) threatTypes.add('Malware');
      if (catLower.includes('spam')) threatTypes.add('Spam');
    });
  }

  // Extract from analysis results
  if (attrs.last_analysis_results) {
    Object.entries(attrs.last_analysis_results).forEach(([engine, result]) => {
      if (result.category === 'malicious' || result.category === 'suspicious') {
        detections.push({
          engine: result.engine_name || engine,
          category: result.category,
          result: result.result,
          method: result.method
        });

        // Extract threat type from result string
        const resultLower = (result.result || '').toLowerCase();
        
        // Threat type detection patterns
        if (resultLower.includes('trojan')) threatTypes.add('Trojan');
        if (resultLower.includes('malware') || resultLower.includes('malicious')) threatTypes.add('Malware');
        if (resultLower.includes('virus')) threatTypes.add('Virus');
        if (resultLower.includes('worm')) threatTypes.add('Worm');
        if (resultLower.includes('ransom')) threatTypes.add('Ransomware');
        if (resultLower.includes('backdoor')) threatTypes.add('Backdoor');
        if (resultLower.includes('spyware') || resultLower.includes('spy')) threatTypes.add('Spyware');
        if (resultLower.includes('adware')) threatTypes.add('Adware');
        if (resultLower.includes('botnet') || resultLower.includes('bot.')) threatTypes.add('Botnet');
        if (resultLower.includes('phish')) threatTypes.add('Phishing');
        if (resultLower.includes('rootkit')) threatTypes.add('Rootkit');
        if (resultLower.includes('exploit')) threatTypes.add('Exploit');
        if (resultLower.includes('ddos')) threatTypes.add('DDoS');
        if (resultLower.includes('miner') || resultLower.includes('coinminer')) threatTypes.add('Cryptominer');
        if (resultLower.includes('stealer') || resultLower.includes('infostealer')) threatTypes.add('Info Stealer');
        if (resultLower.includes('loader')) threatTypes.add('Loader');
        if (resultLower.includes('rat') || resultLower.includes('remote access')) threatTypes.add('RAT');
      }
    });
  }

  // If malicious but no specific threat type found, add generic "Malware"
  if (attrs.last_analysis_stats && attrs.last_analysis_stats.malicious > 0 && threatTypes.size === 0) {
    threatTypes.add('Malware');
  }

  return {
    threatTypes: Array.from(threatTypes),
    detections: detections.slice(0, 20) // Top 20 detections
  };
}

/**
 * Compute verdict from analysis stats
 */
function computeVerdict(stats: {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}): Verdict {
  const { malicious, suspicious, harmless, undetected } = stats;

  if (malicious >= 1) {
    return 'malicious';
  } else if (suspicious >= 1) {
    return 'suspicious';
  } else if (harmless > 0 && malicious === 0 && suspicious === 0) {
    return 'harmless';
  } else if (malicious === 0 && suspicious === 0 && harmless === 0 && undetected >= 0) {
    return 'undetected';
  } else {
    return 'unknown';
  }
}

/**
 * Get verdict color for UI display
 */
export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case 'malicious':
      return 'destructive';
    case 'suspicious':
      return 'secondary';
    case 'harmless':
      return 'default';
    case 'undetected':
      return 'outline';
    case 'unknown':
    default:
      return 'secondary';
  }
}

/**
 * Get verdict display text
 */
export function getVerdictText(verdict: Verdict): string {
  switch (verdict) {
    case 'malicious':
      return 'Malicious';
    case 'suspicious':
      return 'Suspicious';
    case 'harmless':
      return 'Harmless';
    case 'undetected':
      return 'Undetected';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

/**
 * 🔥 NEW: Get severity level from stats
 */
export function getSeverityLevel(stats: {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}): 'critical' | 'high' | 'medium' | 'low' | 'unknown' {
  const { malicious, suspicious } = stats;
  
  if (malicious > 10) return 'critical';
  if (malicious > 5) return 'high';
  if (malicious > 0 || suspicious > 5) return 'medium';
  if (suspicious > 0) return 'low';
  return 'unknown';
}

/**
 * 🔥 NEW: Get threat type color for UI
 */
export function getThreatTypeColor(threatType: string): string {
  const colors: Record<string, string> = {
    'Trojan': APP_COLORS.dangerDark,
    'Malware': APP_COLORS.dangerHover,
    'Virus': APP_COLORS.accentOrange,
    'Worm': APP_COLORS.accentOrange,
    'Ransomware': APP_COLORS.dangerDark2,
    'Backdoor': APP_COLORS.dangerDarker,
    'Spyware': APP_COLORS.warningOrange,
    'Adware': APP_COLORS.warning,
    'Botnet': APP_COLORS.warningDark,
    'Phishing': APP_COLORS.warning,
    'Rootkit': APP_COLORS.orangeDark900,
    'Exploit': APP_COLORS.orangeDark700,
    'DDoS': APP_COLORS.orangeDark800,
    'Cryptominer': APP_COLORS.amberDark900,
    'Info Stealer': APP_COLORS.orangeDark950,
    'Loader': APP_COLORS.stoneDark800,
    'RAT': APP_COLORS.stoneDark900
  };

  return colors[threatType] || APP_COLORS.textMuted;
}

/**
 * 🔥 NEW: Get threat type icon emoji
 */
export function getThreatTypeIcon(threatType: string): string {
  const icons: Record<string, string> = {
    'Trojan': '🐴',
    'Malware': '🦠',
    'Virus': '🦠',
    'Worm': '🪱',
    'Ransomware': '🔐',
    'Backdoor': '🚪',
    'Spyware': '👁️',
    'Adware': '📢',
    'Botnet': '🤖',
    'Phishing': '🎣',
    'Rootkit': '🌳',
    'Exploit': '💥',
    'DDoS': '💣',
    'Cryptominer': '⛏️',
    'Info Stealer': '🕵️',
    'Loader': '📦',
    'RAT': '🐀'
  };
  
  return icons[threatType] || '⚠️';
}
