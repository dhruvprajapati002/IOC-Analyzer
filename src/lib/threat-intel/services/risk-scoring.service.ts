import type { UnifiedThreatData, Verdict } from '../types/threat-intel.types';
import { APP_COLORS } from '@/lib/colors';

export interface RiskScoreResult {
  score: number;  // 0-100
  level: 'critical' | 'high' | 'medium' | 'low';
  verdict: Verdict;
  confidence: number;
  severity: string;
}

export interface RiskDetails {
  level: string;
  color: string;
  badge: string;
  label: string;
  description: string;
  recommendation: string;
  action: string;
}

/**
 * Calculate unified risk score for IPs (with AbuseIPDB + multi-source)
 */
export function calculateIPRiskScore(
  multiSourceData: Record<string, UnifiedThreatData>,
  abuseData: any | null
): RiskScoreResult {
  let totalScore = 0;
  let totalWeight = 0;
  
  // Weight sources - VT gets highest weight due to multi-engine consensus
  const weights: Record<string, number> = {
    'VirusTotal': 0.40,      // Increased from 0.30 - most authoritative
    'AbuseIPDB': 0.25,
    'ThreatFox': 0.15,       // Reduced from 0.20
    'IPQualityScore': 0.12,  // Reduced from 0.15
    'GreyNoise': 0.08        // Reduced from 0.10
  };
  
  // Aggregate scores from multi-source
  Object.entries(multiSourceData).forEach(([, data]) => {
    if (data.available && data.score !== undefined) {
      const weight = weights[data.source] || 0.10;
      totalScore += data.score * weight;
      totalWeight += weight;
      
      console.log(`[RiskScore] ${data.source}: score=${data.score}, weight=${weight}`);
    }
  });
  
  // Add AbuseIPDB boost if available
  if (abuseData && abuseData.abuseConfidenceScore > 0) {
    const abuseWeight = weights['AbuseIPDB'];
    totalScore += abuseData.abuseConfidenceScore * abuseWeight;
    totalWeight += abuseWeight;
    
    console.log(`[RiskScore] AbuseIPDB: score=${abuseData.abuseConfidenceScore}, weight=${abuseWeight}`);
  }
  
  // Calculate final score
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  
  // Determine risk level
  let level: 'critical' | 'high' | 'medium' | 'low';
  let verdict: Verdict;
  let severity: string;
  
  if (finalScore >= 80) {
    level = 'critical';
    verdict = 'malicious';
    severity = 'critical';
  } else if (finalScore >= 60) {
    level = 'high';
    verdict = 'malicious';
    severity = 'high';
  } else if (finalScore >= 40) {
    level = 'medium';
    verdict = 'suspicious';
    severity = 'medium';
  } else if (finalScore > 0) {
    level = 'low';
    verdict = 'suspicious';
    severity = 'low';
  } else {
    level = 'low';
    verdict = 'clean';
    severity = 'clean';
  }
  
  const confidence = totalWeight / Object.values(weights).reduce((a, b) => a + b, 0);
  
  console.log(
    `[RiskScore] Final: score=${finalScore}, level=${level}, ` +
    `verdict=${verdict}, confidence=${confidence.toFixed(2)}`
  );
  
  return {
    score: finalScore,
    level,
    verdict,
    confidence,
    severity
  };
}

/**
 * Enhanced VT score calculation for hash IOCs
 * Considers malicious+suspicious counts with better weighting
 */
export function calculateVTScore(stats: any): number {
  if (!stats) return 0;
  
  const malicious = stats.malicious || 0;
  const suspicious = stats.suspicious || 0;
  const harmless = stats.harmless || 0;
  const undetected = stats.undetected || 0;
  const total = malicious + suspicious + harmless + undetected;
  
  if (total === 0) return 0;
  
  // Base ratio score
  const maliciousRatio = malicious / total;
  const suspiciousRatio = suspicious / total;
  let score = Math.round((maliciousRatio * 100) + (suspiciousRatio * 50));
  
  // Boost score for high malicious counts (strong consensus)
  if (malicious >= 40) score = Math.min(score + 15, 100);      // 40+ engines: +15
  else if (malicious >= 30) score = Math.min(score + 12, 100); // 30+ engines: +12
  else if (malicious >= 20) score = Math.min(score + 10, 100); // 20+ engines: +10
  else if (malicious >= 10) score = Math.min(score + 7, 100);  // 10+ engines: +7
  else if (malicious >= 5) score = Math.min(score + 5, 100);   // 5+ engines: +5
  
  // Penalty for low total scans (unreliable)
  if (total < 20) score = Math.round(score * 0.7);
  
  console.log(
    `[RiskScore] VT Calculation: ${malicious}M/${suspicious}S/${total}T ` +
    `→ ratio=${maliciousRatio.toFixed(2)}, final=${score}`
  );
  
  return score;
}

/**
 * Calculate severity for non-IP IOCs (hash/domain/url)
 */
export function calculateNonIPSeverity(
  multiSourceData: Record<string, UnifiedThreatData>,
  vtStats?: any
): RiskScoreResult {
  let maxScore = 0;
  let verdict: Verdict = 'unknown';
  let confidence = 0;
  
  // Special handling for VT with enhanced scoring
  if (vtStats) {
    const vtScore = calculateVTScore(vtStats);
    if (vtScore > maxScore) {
      maxScore = vtScore;
      const malicious = vtStats.malicious || 0;
      if (malicious >= 10) {
        verdict = 'malicious';
        confidence = 0.9;
      } else if (malicious >= 3) {
        verdict = 'suspicious';
        confidence = 0.75;
      } else if (malicious > 0) {
        verdict = 'suspicious';
        confidence = 0.6;
      }
    }
    console.log(`[RiskScore] VT Enhanced: score=${vtScore}, verdict=${verdict}`);
  }
  
  // Get highest score from all sources
  Object.values(multiSourceData).forEach(data => {
    if (data.available && data.score > maxScore) {
      maxScore = data.score;
      verdict = data.verdict;
      confidence = Math.max(confidence, data.confidence);
    }
  });
  
  let severity: string;
  let level: 'critical' | 'high' | 'medium' | 'low';
  
  if (maxScore >= 80) {
    severity = 'critical';
    level = 'critical';
  } else if (maxScore >= 60) {
    severity = 'high';
    level = 'high';
  } else if (maxScore >= 40) {
    severity = 'medium';
    level = 'medium';
  } else if (maxScore > 0) {
    severity = 'low';
    level = 'low';
  } else {
    severity = 'clean';
    level = 'low';
  }
  
  console.log(
    `[RiskScore] Non-IP Severity: ${severity}, ` +
    `maxScore=${maxScore}, verdict=${verdict}`
  );
  
  return {
    score: maxScore,
    level,
    verdict,
    confidence,
    severity
  };
}

/**
 * Get risk level details for UI display
 */
export function getRiskLevelDetails(level: string, score: number): RiskDetails {
  switch (level) {
    case 'critical':
      return {
        level: 'critical',
        color: APP_COLORS.dangerDark,
        badge: '🔴',
        label: 'Critical Risk',
        description: 'Confirmed malicious activity detected',
        recommendation: 'Block immediately and investigate all related connections',
        action: 'BLOCK'
      };
    case 'high':
      return {
        level: 'high',
        color: APP_COLORS.warningOrange,
        badge: '🟠',
        label: 'High Risk',
        description: 'Strong indicators of malicious behavior',
        recommendation: 'Block and monitor all traffic',
        action: 'BLOCK'
      };
    case 'medium':
      return {
        level: 'medium',
        color: APP_COLORS.warning,
        badge: '🟡',
        label: 'Medium Risk',
        description: 'Suspicious activity detected',
        recommendation: 'Monitor closely and consider blocking',
        action: 'MONITOR'
      };
    case 'low':
      if (score === 0) {
        return {
          level: 'low',
          color: APP_COLORS.successGreen,
          badge: '🟢',
          label: 'Clean',
          description: 'No threats detected',
          recommendation: 'No action required',
          action: 'ALLOW'
        };
      } else {
        return {
          level: 'low',
          color: APP_COLORS.accentBlue,
          badge: '🔵',
          label: 'Low Risk',
          description: 'Minor concerns detected',
          recommendation: 'Continue monitoring',
          action: 'MONITOR'
        };
      }
    default:
      return {
        level: 'unknown',
        color: APP_COLORS.textMuted,
        badge: '⚪',
        label: 'Unknown',
        description: 'Insufficient data',
        recommendation: 'Gather more information',
        action: 'INVESTIGATE'
      };
  }
}
