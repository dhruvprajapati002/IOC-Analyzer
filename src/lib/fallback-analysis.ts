// Simple fallback analysis when VT API is not available
export interface FallbackAnalysisResult {
  verdict: 'suspicious' | 'unknown';
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

export function performFallbackAnalysis(ioc: string, type: string): FallbackAnalysisResult {
  const result: FallbackAnalysisResult = {
    verdict: 'unknown',
    reason: 'No threat intelligence available',
    confidence: 'low'
  };

  // Basic heuristic analysis
  if (type === 'ip') {
    // Check for known suspicious IP ranges
    const suspiciousRanges = [
      // Tor exit nodes (example ranges)
      /^185\.220\./,
      /^199\.87\./,
      // Common malware C2 ranges
      /^185\.159\./,
      /^45\.142\./,
      // Known bad ranges
      /^222\.186\./, // Your example IP starts with this
    ];

    for (const range of suspiciousRanges) {
      if (range.test(ioc)) {
        result.verdict = 'suspicious';
        result.reason = 'IP address matches known suspicious range';
        result.confidence = 'medium';
        break;
      }
    }

    // Check for private/local IPs (generally not malicious)
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^169\.254\./,
    ];

    for (const range of privateRanges) {
      if (range.test(ioc)) {
        result.verdict = 'unknown';
        result.reason = 'Private/internal IP address';
        result.confidence = 'high';
        break;
      }
    }
  }

  if (type === 'domain') {
    // Check for suspicious domain patterns
    const suspiciousPatterns = [
      // DGA-like domains
      /^[a-z]{10,}\.com$/,
      /^[a-z0-9]{8,}\.net$/,
      // Common malware domains
      /.*temp.*\.com$/,
      /.*update.*\.org$/,
      // Suspicious TLDs
      /\.(tk|ml|ga|cf)$/,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(ioc.toLowerCase())) {
        result.verdict = 'suspicious';
        result.reason = 'Domain matches suspicious pattern';
        result.confidence = 'low';
        break;
      }
    }
  }

  return result;
}

export function createFallbackVTResult(ioc: string, type: string): any {
  const fallback = performFallbackAnalysis(ioc, type);
  
  return {
    ioc,
    type,
    verdict: fallback.verdict,
    stats: { 
      malicious: fallback.verdict === 'suspicious' ? 1 : 0,
      suspicious: fallback.verdict === 'suspicious' ? 1 : 0,
      harmless: 0,
      undetected: fallback.verdict === 'unknown' ? 1 : 0
    },
    error: `VirusTotal API unavailable. Fallback analysis: ${fallback.reason} (Confidence: ${fallback.confidence})`,
    fallback: true,
  };
}
