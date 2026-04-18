// lib/risk.ts
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type Verdict =
  | 'malicious'
  | 'suspicious'
  | 'harmless'
  | 'undetected'
  | 'unknown';

export interface VTReduced {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected?: number;
  totalScans: number;
}

export interface AbuseReduced {
  abuseConfidencePercentage: number;
  totalReports: number;
  isWhitelisted: boolean;
}

export interface UnifiedRisk {
  riskScore: number;   // 0-100
  riskLevel: RiskLevel;
  verdict: Verdict;
  confidence: number;  // 0-1
}

export function computeUnifiedRisk(
  vt: VTReduced | null,
  abuse: AbuseReduced | null
): UnifiedRisk {
  let riskScore = 0;
  let confidence = 0;

  // 1) Base from VirusTotal (more aggressive)
  if (vt && vt.totalScans > 0) {
    const { malicious = 0, suspicious = 0, totalScans } = vt;

    // New mapping:
    // 1–2 engines  -> medium
    // 3–4 engines  -> high
    // 5+ engines   -> critical
    if (malicious >= 10) riskScore = 95;
    else if (malicious >= 7) riskScore = 90;
    else if (malicious >= 5) riskScore = 85;      // 5+ -> high/critical
    else if (malicious >= 3) riskScore = 75;      // 3–4 -> critical floor
    else if (malicious === 2) riskScore = 55;     // 2 -> high
    else if (malicious === 1) riskScore = 40;     // 1 -> medium
    else if (suspicious >= 5) riskScore = 30;
    else if (suspicious >= 3) riskScore = 20;
    else if (suspicious > 0) riskScore = 10;
    else riskScore = 0;

    const maliciousRatio =
      totalScans > 0 ? malicious / totalScans : 0;
    if (maliciousRatio > 0.25)
      riskScore = Math.min(100, riskScore + 10);
    else if (maliciousRatio > 0.15)
      riskScore = Math.min(100, riskScore + 5);

    confidence = 0.95;
  } else {
    riskScore = 0;
    confidence = 0.3;
  }

  // 2) AbuseIPDB adjustments (keep as you wrote)
  if (abuse) {
    const abuseConf = abuse.abuseConfidencePercentage || 0;
    const reports = abuse.totalReports || 0;
    const isWhitelisted = abuse.isWhitelisted || false;

    confidence = Math.max(confidence, 0.85);

    if (isWhitelisted) {
      const reduction = Math.min(riskScore, 30);
      riskScore = Math.max(0, riskScore - reduction);
    } else if (abuseConf > 90) {
      const minFloor = 80;
      riskScore = Math.max(
        minFloor,
        Math.min(100, riskScore + 25)
      );
    } else if (abuseConf > 70) {
      riskScore = Math.min(100, riskScore + 20);
    } else if (abuseConf > 50) {
      riskScore = Math.min(100, riskScore + 15);
    } else if (abuseConf > 25) {
      riskScore = Math.min(100, riskScore + 10);
    } else if (abuseConf > 0) {
      const reduction = 5;
      riskScore = Math.max(0, riskScore - reduction);
    }

    if (reports > 100 && !isWhitelisted) {
      riskScore = Math.min(100, riskScore + 10);
    }
  }

  // 3) Map to level + verdict
  let riskLevel: RiskLevel;
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'medium';
  else riskLevel = 'low';

  let verdict: Verdict;
  if (riskScore >= 50) verdict = 'malicious';
  else if (riskScore >= 1) verdict = 'suspicious';
  else verdict = 'harmless';

  if (!vt && !abuse) {
    verdict = 'unknown';
    riskLevel = 'low';
    confidence = 0.1;
  }

  return { riskScore, riskLevel, verdict, confidence };
}
