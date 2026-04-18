// // app/api/ioc-v2/types.ts

// export interface GeolocationData {
//   countryCode: string;
//   countryName: string;
//   region: string;
//   city: string;
//   latitude: number;
//   longitude: number;
//   timezone: string;
//   isp: string;
//   org: string;
//   asn: string;
//   asnName: string;
// }

// export interface AbuseIPDBData {
//   abuseConfidencePercentage: number;
//   abuseConfidenceScore: number;
//   usageType: string;
//   isWhitelisted: boolean;
//   totalReports: number;
//   numDistinctUsers?: number;
//   lastReportedAt?: string | null;
// }

// export interface Detection {
//   engine: string;
//   category: string;
//   result: string;
// }

// export interface ThreatIntel {
//   threatTypes: string[];
//   detections: Detection[];
//   severity: string;
//   firstSeen: Date;
//   lastSeen: Date;
//   confidence: number;
// }

// export interface IPReputationData {
//   riskScore: number;
//   verdict: string;
//   riskLevel: string;
//   confidence: number;
//   riskDetails: RiskDetails;
//   threats: ThreatInfo;
//   network: NetworkAnalysis;
//   intelligence: ThreatIntelligence;
//   virusTotal: any;
//   abuseStats: any;
// }

// export interface RiskDetails {
//   level: 'critical' | 'high' | 'medium' | 'low';
//   color: string;
//   badge: string;
//   label: string;
//   description: string;
//   recommendation: string;
//   action: string;
// }

// export interface ThreatInfo {
//   categories: string[];
//   tags: string[];
//   malwareFamilies: string[];
//   lastAnalysisDate: string;
// }

// export interface NetworkAnalysis {
//   whois: any;
//   dnsRecords: any[];
//   openPorts: number[];
//   services: string[];
// }

// export interface ThreatIntelligence {
//   blacklists: string[];
//   feeds: string[];
//   reports: number;
//   firstSeen: string;
//   lastSeen: string;
// }

// export interface MitreTactic {
//   id: string;
//   name: string;
//   description?: string;
//   link?: string;
// }

// export interface MitreTechnique {
//   id: string;
//   name: string;
//   description?: string;
//   link?: string;
// }

// export interface MitreAttackData {
//   tactics: MitreTactic[];
//   techniques: MitreTechnique[];
// }
