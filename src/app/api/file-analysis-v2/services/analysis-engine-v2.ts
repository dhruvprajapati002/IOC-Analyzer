// app/api/file-analysis-v2/services/analysis-engine.ts

import crypto from 'crypto';
import { getIOCFromCache, saveIOCAnalysis } from '@/lib/ioc-cache';
import { getCacheTTL } from '@/lib/cache/cache-ttl';
import { MultiSourceOrchestrator } from '@/lib/threat-intel/orchestrator/multi-source.orchestrator';
import type { IOCAnalysisResult } from '@/lib/threat-intel/types/threat-intel.types';
import { SYSTEM_USER, SYSTEM_USER_ID } from '@/lib/system-user';

// Initialize orchestrator for hash analysis
const orchestrator = new MultiSourceOrchestrator();

// ============================================================================
// FILE SIGNATURES & THREAT PATTERNS
// ============================================================================

const FILE_SIGNATURES = {
  // Executables
  'PE': { signature: [0x4D, 0x5A], type: 'executable', description: 'Windows PE Executable', risk: 'high' },
  'ELF': { signature: [0x7F, 0x45, 0x4C, 0x46], type: 'executable', description: 'Linux ELF Executable', risk: 'high' },
  'MACHO': { signature: [0xFE, 0xED, 0xFA, 0xCE], type: 'executable', description: 'macOS Mach-O', risk: 'high' },
  'MACHO64': { signature: [0xFE, 0xED, 0xFA, 0xCF], type: 'executable', description: 'macOS Mach-O 64-bit', risk: 'high' },
  // Archives
  'ZIP': { signature: [0x50, 0x4B, 0x03, 0x04], type: 'archive', description: 'ZIP Archive', risk: 'medium' },
  'APK': { signature: [0x50, 0x4B, 0x03, 0x04], type: 'mobile', description: 'Android APK', risk: 'high' },
  'RAR': { signature: [0x52, 0x61, 0x72, 0x21], type: 'archive', description: 'RAR Archive', risk: 'medium' },
  '7Z': { signature: [0x37, 0x7A, 0xBC, 0xAF], type: 'archive', description: '7-Zip Archive', risk: 'medium' },
  'GZIP': { signature: [0x1F, 0x8B], type: 'archive', description: 'GZIP Archive', risk: 'medium' },
  'TAR': { signature: [0x75, 0x73, 0x74, 0x61, 0x72], type: 'archive', description: 'TAR Archive', risk: 'medium' },
  'CAB': { signature: [0x4D, 0x53, 0x43, 0x46], type: 'archive', description: 'Cabinet Archive', risk: 'medium' },
  'ISO': { signature: [0x43, 0x44, 0x30, 0x30, 0x31], type: 'archive', description: 'ISO Image', risk: 'medium' },
  // Documents
  'PDF': { signature: [0x25, 0x50, 0x44, 0x46], type: 'document', description: 'PDF Document', risk: 'low' },
  'DOC': { signature: [0xD0, 0xCF, 0x11, 0xE0], type: 'document', description: 'MS Office Document', risk: 'medium' },
  'RTF': { signature: [0x7B, 0x5C, 0x72, 0x74, 0x66], type: 'document', description: 'RTF Document', risk: 'low' },
  // Images
  'JPEG': { signature: [0xFF, 0xD8, 0xFF], type: 'image', description: 'JPEG Image', risk: 'low' },
  'PNG': { signature: [0x89, 0x50, 0x4E, 0x47], type: 'image', description: 'PNG Image', risk: 'low' },
  'GIF': { signature: [0x47, 0x49, 0x46, 0x38], type: 'image', description: 'GIF Image', risk: 'low' },
  'BMP': { signature: [0x42, 0x4D], type: 'image', description: 'BMP Image', risk: 'low' },
  'WEBP': { signature: [0x52, 0x49, 0x46, 0x46], type: 'image', description: 'WebP Image', risk: 'low' },
  // Scripts
  'BAT': { signature: [], type: 'script', description: 'Batch Script', risk: 'high' },
  'PS1': { signature: [], type: 'script', description: 'PowerShell Script', risk: 'high' },
  'SH': { signature: [0x23, 0x21], type: 'script', description: 'Shell Script', risk: 'high' },
  'VBS': { signature: [], type: 'script', description: 'VBScript', risk: 'high' },
  'JS': { signature: [], type: 'script', description: 'JavaScript File', risk: 'medium' },
  'PY': { signature: [], type: 'script', description: 'Python Script', risk: 'medium' },
  'PHP': { signature: [0x3C, 0x3F, 0x70, 0x68, 0x70], type: 'script', description: 'PHP Script', risk: 'medium' },
  // Other
  'SWF': { signature: [0x46, 0x57, 0x53], type: 'flash', description: 'Flash File', risk: 'high' },
  'DMG': { signature: [0x78, 0x01, 0x73, 0x0D], type: 'disk_image', description: 'macOS DMG', risk: 'medium' },
  'DEX': { signature: [0x64, 0x65, 0x78, 0x0A], type: 'mobile', description: 'Android DEX', risk: 'high' },
};

const YARA_RULES = [
  {
    name: 'Ransomware_Indicators',
    description: 'Detects potential ransomware behaviors',
    patterns: [
      { regex: /\.(encrypt|lock|crypt|coded|crypto)\b/gi, weight: 30, description: 'Ransomware file extensions' },
      { regex: /bitcoin|btc|wallet|ransom|payment|decrypt|unlock/gi, weight: 25, description: 'Ransomware payment terms' },
      { regex: /your\s+files?\s+(have\s+been\s+)?encrypted/gi, weight: 35, description: 'Ransomware message' },
    ],
    risk: 'critical'
  },
  {
    name: 'APT_Techniques',
    description: 'Advanced Persistent Threat indicators',
    patterns: [
      { regex: /schtasks|at\.exe|wmic|reg\.exe/gi, weight: 20, description: 'Windows admin tools' },
      { regex: /rundll32|regsvr32|mshta|cscript|wscript/gi, weight: 25, description: 'LOLBins usage' },
      { regex: /powershell\s+-enc|-encodedcommand|-windowstyle\s+hidden/gi, weight: 30, description: 'PowerShell obfuscation' },
    ],
    risk: 'high'
  },
  {
    name: 'Banking_Trojan',
    description: 'Banking trojan indicators',
    patterns: [
      { regex: /keylog|keystroke|clipboard/gi, weight: 25, description: 'Data harvesting' },
      { regex: /webinject|form\s*grab|browser\s*hook/gi, weight: 30, description: 'Web injection' },
      { regex: /bank|paypal|visa|mastercard|account|login/gi, weight: 15, description: 'Financial keywords' },
    ],
    risk: 'high'
  },
  {
    name: 'Credential_Harvesting',
    description: 'Credential theft indicators',
    patterns: [
      { regex: /mimikatz|lsass|sam\.hive|ntds\.dit/gi, weight: 35, description: 'Credential dumping tools' },
      { regex: /password|passwd|credentials|token/gi, weight: 15, description: 'Credential keywords' },
      { regex: /chrome|firefox|edge.*password|login.*data/gi, weight: 20, description: 'Browser credential theft' },
    ],
    risk: 'high'
  },
  {
    name: 'Network_Backdoor',
    description: 'Network backdoor and C2 indicators',
    patterns: [
      { regex: /reverse\s*shell|bind\s*shell|netcat|nc\.exe/gi, weight: 30, description: 'Shell access tools' },
      { regex: /connection\s*refused|socket\s*error|bind\s*failed/gi, weight: 15, description: 'Network operations' },
      { regex: /command\s+control|c2\s*server|beacon\s+home/gi, weight: 25, description: 'C2 communication' },
    ],
    risk: 'high'
  }
];

const THREAT_PATTERNS = [
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, type: 'ip_address', risk: 'medium', description: 'IP addresses found' },
  { pattern: /https?:\/\/[^\s]+/gi, type: 'urls', risk: 'low', description: 'URLs detected' },
  { pattern: /cmd\.exe\s|powershell\.exe\s|\/bin\/bash\s|\/bin\/sh\s/gi, type: 'shell_commands', risk: 'high', description: 'Shell execution commands' },
  { pattern: /HKEY_[A-Z_]+\\[^\s]+/gi, type: 'registry_keys', risk: 'high', description: 'Windows registry manipulation' },
  { pattern: /password|passwd|pwd|credentials/gi, type: 'credentials', risk: 'medium', description: 'Credential references' },
  { pattern: /encrypt|decrypt|AES|RSA|crypto/gi, type: 'encryption', risk: 'medium', description: 'Cryptographic operations' },
  { pattern: /keylogger|backdoor|rootkit|trojan/gi, type: 'malware_terms', risk: 'critical', description: 'Malware-related terms' },
  { pattern: /bitcoin|wallet|ransom|payment/gi, type: 'financial', risk: 'critical', description: 'Financial/ransom indicators' },
  { pattern: /base64\s+encode|decode\s+base64|zlib\s+compress|gzip\s+compress/gi, type: 'encoding', risk: 'low', description: 'Legitimate encoding operations' },
  { pattern: /startup|autorun|persistence|run\s*registry|startup\s*folder/gi, type: 'persistence', risk: 'high', description: 'Persistence mechanisms' },
];

// Known threats database (currently not used - kept for future reference)
// const KNOWN_THREATS = new Set([
//   '84c82835a5d21bbcf75a61707d8bd3fd1f46b8490fe95edc05fae5e23f4188ab',
//   '027cc450ef5f8c5f653329641ec1fed91f694e0d229928963b30f6b0d7d3fb7',
//   'b88a11dc2fa1042314cab873562f1609e351cdb274edcc0f4aa06de6170a95e8',
// ]);

const KNOWN_MALICIOUS_IPS = new Set([
  '195.154.21.70', '185.254.97.6', '103.155.54.170', '45.142.182.99', '162.142.125.227',
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function analyzeWithYaraRules(content: string) {
  const ruleMatches = [];
  let totalScore = 0;

  for (const rule of YARA_RULES) {
    let ruleScore = 0;
    const patternMatches = [];

    for (const pattern of rule.patterns) {
      const matches = content.match(pattern.regex) || [];
      if (matches.length > 0) {
        const matchScore = pattern.weight * Math.min(matches.length, 5);
        ruleScore += matchScore;
        
        patternMatches.push({
          pattern: pattern.regex.source,
          weight: pattern.weight,
          description: pattern.description,
          count: matches.length
        });
      }
    }

    if (ruleScore > 0) {
      ruleMatches.push({
        ruleName: rule.name,
        description: rule.description,
        risk: rule.risk,
        score: ruleScore,
        matches: patternMatches
      });
      totalScore += ruleScore;
    }
  }

  return { matches: ruleMatches, totalScore };
}

function extractAdvancedMetadata(buffer: Buffer, filename: string) {
  const metadata: any = {
    fileStructure: {},
    executionInfo: {},
    documentProperties: {}
  };

  if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
    metadata.fileStructure.type = 'PE';
    metadata.executionInfo.isExecutable = true;
    metadata.executionInfo.platform = 'Windows';
  } else if (buffer.toString('utf8', 0, 4) === '%PDF') {
    metadata.fileStructure.type = 'PDF';
    const content = buffer.toString('utf8');
    
    if (content.includes('/JavaScript') || content.includes('/JS')) {
      metadata.executionInfo.containsScript = true;
      metadata.executionInfo.scriptType = 'JavaScript';
    }
  } else if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    metadata.fileStructure.type = 'Archive';
    
    if (filename.match(/\.(docx|xlsx|pptx)$/i)) {
      metadata.fileStructure.type = 'OfficeDocument';
      metadata.documentProperties.isOfficeDoc = true;
    }
  }
  
  return metadata;
}

async function checkIpReputation(ip: string) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(ip)) {
    return { verdict: 'unknown', confidence: 0, reason: 'Invalid IP format' };
  }

  const parts = ip.split('.').map(Number);
  const isPrivate = 
    (parts[0] === 10) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 127);

  if (isPrivate) {
    return { 
      verdict: 'private', 
      confidence: 0.9, 
      reason: 'Private/Reserved IP range'
    };
  }

  if (KNOWN_MALICIOUS_IPS.has(ip)) {
    return { 
      verdict: 'malicious', 
      confidence: 0.95, 
      reason: 'Known malicious IP',
      details: { source: 'threat_intel' }
    };
  }

  return {
    verdict: 'harmless',
    confidence: 0.7,
    reason: 'Clean IP reputation'
  };
}

function calculateEntropy(buffer: Buffer): number {
  const frequencies = new Array(256).fill(0);
  
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }
  
  let entropy = 0;
  const length = buffer.length;
  
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

function detectFileType(buffer: Buffer, filename: string) {
  for (const [, info] of Object.entries(FILE_SIGNATURES)) {
    if (info.signature.length === 0) continue;
    
    const matches = info.signature.every((byte, index) => 
      buffer.length > index && buffer[index] === byte
    );
    
    if (matches) {
      return { ...info, confidence: 0.95 };
    }
  }
  
  const ext = filename.toLowerCase().split('.').pop() || '';
  const extensionMap: { [key: string]: any } = {
    // Executables
    'exe': { type: 'executable', description: 'Windows Executable', risk: 'high' },
    'dll': { type: 'library', description: 'Dynamic Link Library', risk: 'medium' },
    'scr': { type: 'executable', description: 'Screen Saver Executable', risk: 'high' },
    'com': { type: 'executable', description: 'DOS Command File', risk: 'high' },
    'msi': { type: 'executable', description: 'Windows Installer', risk: 'high' },
    'bin': { type: 'executable', description: 'Binary Executable', risk: 'high' },
    'elf': { type: 'executable', description: 'Linux Executable', risk: 'high' },
    // Scripts
    'bat': { type: 'script', description: 'Batch Script', risk: 'high' },
    'cmd': { type: 'script', description: 'Command Script', risk: 'high' },
    'ps1': { type: 'script', description: 'PowerShell Script', risk: 'high' },
    'vbs': { type: 'script', description: 'VBScript File', risk: 'high' },
    'js': { type: 'script', description: 'JavaScript File', risk: 'medium' },
    'sh': { type: 'script', description: 'Shell Script', risk: 'high' },
    'bash': { type: 'script', description: 'Bash Script', risk: 'high' },
    'py': { type: 'script', description: 'Python Script', risk: 'medium' },
    'rb': { type: 'script', description: 'Ruby Script', risk: 'medium' },
    'pl': { type: 'script', description: 'Perl Script', risk: 'medium' },
    'php': { type: 'script', description: 'PHP Script', risk: 'medium' },
    'asp': { type: 'script', description: 'ASP Script', risk: 'medium' },
    'aspx': { type: 'script', description: 'ASP.NET Script', risk: 'medium' },
    // Archives
    'jar': { type: 'archive', description: 'Java Archive', risk: 'medium' },
    'zip': { type: 'archive', description: 'ZIP Archive', risk: 'medium' },
    'rar': { type: 'archive', description: 'RAR Archive', risk: 'medium' },
    '7z': { type: 'archive', description: '7-Zip Archive', risk: 'medium' },
    'tar': { type: 'archive', description: 'TAR Archive', risk: 'medium' },
    'gz': { type: 'archive', description: 'GZIP Archive', risk: 'medium' },
    'bz2': { type: 'archive', description: 'BZIP2 Archive', risk: 'medium' },
    'tgz': { type: 'archive', description: 'TAR GZIP Archive', risk: 'medium' },
    'cab': { type: 'archive', description: 'Cabinet Archive', risk: 'medium' },
    'iso': { type: 'archive', description: 'ISO Disk Image', risk: 'medium' },
    // Mobile
    'apk': { type: 'mobile', description: 'Android Package', risk: 'high' },
    'ipa': { type: 'mobile', description: 'iOS App Package', risk: 'high' },
    'dex': { type: 'mobile', description: 'Android DEX File', risk: 'high' },
    // Documents
    'txt': { type: 'text', description: 'Text File', risk: 'low' },
    'log': { type: 'text', description: 'Log File', risk: 'low' },
    'pdf': { type: 'document', description: 'PDF Document', risk: 'low' },
    'doc': { type: 'document', description: 'Word Document', risk: 'medium' },
    'docx': { type: 'document', description: 'Word Document', risk: 'low' },
    'xls': { type: 'document', description: 'Excel Spreadsheet', risk: 'medium' },
    'xlsx': { type: 'document', description: 'Excel Spreadsheet', risk: 'low' },
    'ppt': { type: 'document', description: 'PowerPoint Presentation', risk: 'medium' },
    'pptx': { type: 'document', description: 'PowerPoint Presentation', risk: 'low' },
    'rtf': { type: 'document', description: 'Rich Text Format', risk: 'low' },
    'odt': { type: 'document', description: 'OpenDocument Text', risk: 'low' },
    'ods': { type: 'document', description: 'OpenDocument Spreadsheet', risk: 'low' },
    // Images
    'jpg': { type: 'image', description: 'JPEG Image', risk: 'low' },
    'jpeg': { type: 'image', description: 'JPEG Image', risk: 'low' },
    'png': { type: 'image', description: 'PNG Image', risk: 'low' },
    'gif': { type: 'image', description: 'GIF Image', risk: 'low' },
    'bmp': { type: 'image', description: 'Bitmap Image', risk: 'low' },
    'svg': { type: 'image', description: 'SVG Image', risk: 'low' },
    'ico': { type: 'image', description: 'Icon File', risk: 'low' },
    'webp': { type: 'image', description: 'WebP Image', risk: 'low' },
    // Other
    'class': { type: 'java', description: 'Java Class File', risk: 'medium' },
    'swf': { type: 'flash', description: 'Flash File', risk: 'high' },
    'dmg': { type: 'disk_image', description: 'macOS Disk Image', risk: 'medium' },
    'pkg': { type: 'package', description: 'macOS Package', risk: 'medium' },
    'deb': { type: 'package', description: 'Debian Package', risk: 'medium' },
    'rpm': { type: 'package', description: 'RPM Package', risk: 'medium' },
  };
  
  if (extensionMap[ext]) {
    return { ...extensionMap[ext], confidence: 0.8 };
  }
  
  return { type: 'unknown', description: 'Unknown File Type', risk: 'medium', confidence: 0.1 };
}

async function analyzeFileContent(buffer: Buffer, filename: string) {
  let content: string;
  try {
    content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 1024));
    const nullCount = (content.match(/\0/g) || []).length;
    if (nullCount > content.length * 0.1) {
      content = buffer.toString('latin1', 0, Math.min(buffer.length, 1024 * 1024));
    }
  } catch {
    content = buffer.toString('latin1', 0, Math.min(buffer.length, 1024 * 1024));
  }
  
  console.log(`[Analysis] 📝 Content preview: ${content.substring(0, 200).replace(/\n/g, '\\n')}`);
  
  const foundPatterns: any[] = [];
  const indicators: string[] = [];
  let riskScore = 0;
  
  const yaraAnalysis = analyzeWithYaraRules(content);
  const yaraMatches = yaraAnalysis.matches;
  riskScore += Math.min(yaraAnalysis.totalScore, 60);

  console.log(`[Analysis] 🔬 YARA: ${yaraMatches.length} rules matched, score: ${yaraAnalysis.totalScore}`);
  
  for (const match of yaraMatches) {
    indicators.push(`${match.ruleName}: ${match.description} (Score: ${match.score})`);
  }
  
  const advancedMetadata = extractAdvancedMetadata(buffer, filename);
  
  if (advancedMetadata.executionInfo.isExecutable) {
    riskScore += 10;
    indicators.push('Executable file detected');
  }
  
  if (advancedMetadata.executionInfo.containsScript) {
    riskScore += 15;
    indicators.push(`Embedded ${advancedMetadata.executionInfo.scriptType} detected`);
  }
  
  const ipAddresses = [];
  const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ipMatches = content.match(ipPattern) || [];
  const uniqueIps = [...new Set(ipMatches)];
  
  for (const ip of uniqueIps) {
    try {
      const reputation = await checkIpReputation(ip);
      ipAddresses.push({
        ip,
        verdict: reputation.verdict,
        confidence: reputation.confidence,
        reason: reputation.reason,
        details: reputation.details
      });
      
      if (reputation.verdict === 'malicious') {
        riskScore += 30;
        indicators.push(`Malicious IP detected: ${ip}`);
      } else if (reputation.verdict === 'suspicious') {
        riskScore += 15;
        indicators.push(`Suspicious IP detected: ${ip}`);
      }
    } catch (error) {
      console.error(`[Analysis] Error checking IP ${ip}:`, error);
    }
  }
  
  for (const { pattern, type, risk, description } of THREAT_PATTERNS) {
    const matches = content.match(pattern) || [];
    if (matches.length > 0) {
      const uniqueMatches = [...new Set(matches)];
      foundPatterns.push({
        type,
        description,
        risk,
        count: matches.length,
        samples: uniqueMatches.slice(0, 5)
      });
      
      if (type !== 'ip_address') {
        indicators.push(`${description} (${matches.length} occurrences)`);
        
        const isLowRiskPattern = type === 'encoding';
        let riskMultiplier;
        
        if (risk === 'critical') {
          riskMultiplier = 25;
        } else if (risk === 'high') {
          riskMultiplier = 15;
        } else if (risk === 'medium') {
          riskMultiplier = 8;
        } else {
          riskMultiplier = isLowRiskPattern ? 0.5 : 3;
        }
        
        const contribution = Math.min(matches.length * riskMultiplier, isLowRiskPattern ? 5 : 40);
        riskScore += contribution;
      }
    }
  }
  
  return { 
    patterns: foundPatterns, 
    riskScore: Math.min(riskScore, 100), 
    indicators,
    ipAddresses,
    yaraMatches,
    advancedMetadata
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function performFileAnalysis(
  buffer: Buffer,
  filename: string,
  fileSize: number,
  userId: string,
  label?: string
) {
  const startTime = Date.now();
  console.log(`[Analysis] 🔍 Analyzing file: ${filename} (${fileSize} bytes)`);

  // ✅ STEP 1: Calculate hashes
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // ✅ STEP 2: Check Mongo cache by SHA256
  let existingCachedData: any = null;
  try {
    const cachedData = await getIOCFromCache(sha256, 'hash');
    if (cachedData && cachedData.success && cachedData.data) {
      console.log(`[Analysis] ✅ Cache hit: ${sha256.substring(0, 16)}...`);

      // If cached data has full VT data, return it immediately
      if (cachedData.data.multiSourceData?.virustotal?.full_data) {
        console.log(`[Analysis] ✅ Returning cached data with full VT information`);
        return {
          ...cachedData.data,
          cached: true
        };
      }

      // Store for potential merge later if fresh analysis fails
      existingCachedData = cachedData.data;
      console.log(`[Analysis] ⚠️ Cached data found but missing VT data, will attempt fresh analysis`);
    }
  } catch (cacheError: any) {
    console.log(`[Cache] ⚠️ Cache check failed: ${cacheError.message}`);
  }

  console.log(`[Cache] ❌ Not found in cache with complete data: ${sha256.substring(0, 16)}...`);
  console.log(`[Analysis] ❌ Performing fresh analysis`);

  // ✅ STEP 3: Get hash reputation using multi-source orchestrator
  console.log(`[Analysis] 🔍 Using MultiSourceOrchestrator for hash analysis...`);
  let hashAnalysisResult: any;
  try {
    hashAnalysisResult = await orchestrator.analyzeIOC(sha256, 'hash');
    console.log(
      `[Analysis] ✅ Hash analysis complete: ${hashAnalysisResult.verdict} (score: ${hashAnalysisResult.stats.malicious}/${hashAnalysisResult.stats.malicious + hashAnalysisResult.stats.suspicious + hashAnalysisResult.stats.harmless})`
    );
    // ✅ CRITICAL: Wait for VT data to be fully populated
    if (hashAnalysisResult.vtData && !hashAnalysisResult.vtData.last_analysis_stats) {
      console.log('[Analysis] ⚠️ VT data incomplete, waiting for async processing...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error: any) {
    console.error(`[Analysis] ⚠️ Hash analysis failed: ${error.message}`);
    // Create minimal result if orchestrator fails
    hashAnalysisResult = {
      ioc: sha256,
      type: 'hash',
      verdict: 'unknown',
      severity: 'unknown',
      stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
      threatIntel: { threatTypes: [], detections: [], confidence: 0, severity: 'unknown' },
      sources_available: [],
      sources_failed: [],
      fetchedAt: new Date().toISOString(),
      cached: false
    };
  }

  // ✅ STEP 4: Perform file-specific local analysis
  const fileTypeInfo = detectFileType(buffer, filename);
  const entropy = calculateEntropy(buffer);
  const isPackedOrEncrypted = entropy > 7.5;
  const contentAnalysis = await analyzeFileContent(buffer, filename);

  // ✅ STEP 5: Calculate custom threat score (local + multi-source + manual)

  // 5.1 Local score (your existing logic moved into localScore)
  let localScore = 0;

  // Content analysis score
  localScore += contentAnalysis.riskScore;
  console.log(`[Analysis] 🎯 Content analysis: ${contentAnalysis.riskScore}`);

  // File type risk
  const fileTypeRisk = fileTypeInfo.risk;
  if (fileTypeRisk === 'high') {
    localScore += 20;
    console.log(`[Analysis] 🎯 File type (high): +20 → Local total: ${localScore}`);
  } else if (fileTypeRisk === 'medium') {
    localScore += 10;
    console.log(`[Analysis] 🎯 File type (medium): +10 → Local total: ${localScore}`);
  } else if (fileTypeRisk === 'low') {
    localScore += 2;
    console.log(`[Analysis] 🎯 File type (low): +2 → Local total: ${localScore}`);
  }

  // Document adjustment
  const isDocument = ['pdf', 'doc', 'docx', 'xlsx', 'pptx'].includes(fileTypeInfo.type.toLowerCase());
  if (
    isDocument &&
    localScore > 0 &&
    hashAnalysisResult.verdict !== 'malicious' &&
    hashAnalysisResult.verdict !== 'suspicious'
  ) {
    const beforeAdjustment = localScore;
    localScore = Math.max(0, localScore * 0.7);
    console.log(`[Analysis] 🎯 Document adjustment: ${beforeAdjustment} → ${localScore}`);
  }

  // Packed/encrypted detection
  if (isPackedOrEncrypted && fileTypeInfo.type === 'executable') {
    localScore += 25;
    console.log(`[Analysis] 🎯 Packed/encrypted: +25 → Local total: ${localScore}`);
    contentAnalysis.indicators.push('High entropy detected (possibly packed/encrypted)');
  }

  // File size considerations
  if (fileSize > 100 * 1024 * 1024) {
    localScore += 5;
    console.log(`[Analysis] 🎯 Large file: +5 → Local total: ${localScore}`);
    contentAnalysis.indicators.push('Unusually large file size');
  } else if (fileSize < 100 && fileTypeInfo.type === 'executable') {
    localScore += 15;
    console.log(`[Analysis] 🎯 Tiny executable: +15 → Local total: ${localScore}`);
    contentAnalysis.indicators.push('Suspiciously small executable');
  }

  console.log(`[Analysis] 🎯 Local score final: ${localScore}`);

  // 5.2 Multi-source score (VT + ThreatFox + MalwareBazaar)
  // 5.2 Multi-source score (VT + ThreatFox + MalwareBazaar)
let multiSourceScore = 0;
const ms = hashAnalysisResult.multiSourceData;

// VirusTotal-based score: use stats directly, do NOT depend on ms.virustotal
if (hashAnalysisResult.stats) {
  const s = hashAnalysisResult.stats;
  const totalEngines =
    s.malicious + s.suspicious + s.harmless + s.undetected || 1;

  // malicious full weight, suspicious half weight
  const vtRaw = ((s.malicious + s.suspicious * 0.5) / totalEngines) * 100;
  // You can tune this; 0.7 gives VT strong influence
  const vtWeighted = vtRaw * 0.7;

  multiSourceScore += vtWeighted;
  console.log(
    `[Analysis] 🎯 VT raw score: ${vtRaw.toFixed(1)} (weighted: ${vtWeighted.toFixed(1)})`
  );
}

// ThreatFox score (25% of multi-source) – unchanged
if (ms?.threatfox?.available) {
  const tfScore = ms.threatfox.score || 0;
  const tfWeighted = tfScore * 0.25;
  multiSourceScore += tfWeighted;
  console.log(
    `[Analysis] 🎯 ThreatFox score: ${tfScore} (weighted: ${tfWeighted.toFixed(1)})`
  );
}

// MalwareBazaar score (25% of multi-source) – unchanged
if (ms?.malwarebazaar?.available) {
  const mbScore = ms.malwarebazaar.score || 0;
  const mbWeighted = mbScore * 0.25;
  multiSourceScore += mbWeighted;
  console.log(
    `[Analysis] 🎯 MalwareBazaar score: ${mbScore} (weighted: ${mbWeighted.toFixed(1)})`
  );
}

console.log(
  `[Analysis] 🎯 Multi-source score final: ${multiSourceScore.toFixed(1)}`
);


  // 5.3 Manual score hook (for future analyst overrides)
  const manualScore = 0;
  // e.g. if you later store analyst_override.severity, map to 0–100 here

  // 5.4 Combine scores based on what is available
  let threatScore: number;
  const hasMulti = multiSourceScore > 0;
  const hasManual = manualScore > 0;

  if (hasMulti && hasManual) {
    // 50% multi-source, 30% manual, 20% local
    threatScore = multiSourceScore * 0.5 + manualScore * 0.3 + localScore * 0.2;
    console.log(
      `[Analysis] 🎯 Combined score (multi+manual+local): ${threatScore.toFixed(1)}`
    );
  } else if (hasMulti && !hasManual) {
    // 70% multi-source, 30% local
    threatScore = multiSourceScore * 0.7 + localScore * 0.3;
    console.log(
      `[Analysis] 🎯 Combined score (multi+local): ${threatScore.toFixed(1)}`
    );
  } else if (!hasMulti && hasManual) {
    // 70% manual, 30% local
    threatScore = manualScore * 0.7 + localScore * 0.3;
    console.log(
      `[Analysis] 🎯 Combined score (manual+local): ${threatScore.toFixed(1)}`
    );
  } else {
    // Only local analysis available
    threatScore = localScore;
    console.log(`[Analysis] 🎯 Local-only score used: ${threatScore.toFixed(1)}`);
  }

  const riskScore = Math.min(Math.round(threatScore), 100);
  console.log(`[Analysis] 🎯 ===== FINAL RISK SCORE: ${riskScore} =====`);

  // ✅ STEP 7: Determine verdict based on risk score
  let verdict: 'harmless' | 'clean' | 'unknown' | 'suspicious' | 'malicious' = 'harmless';
  let confidence = 0.7;

  if (riskScore >= 70) {
    verdict = 'malicious';
    confidence = 0.9;
  } else if (riskScore >= 35) {
    verdict = 'suspicious';
    confidence = 0.75;
  } else if (riskScore >= 15) {
    verdict = 'unknown';
    confidence = 0.6;
  }

  // ✅ Smart override: Only allow orchestrator to UPGRADE severity, never downgrade
  const severityRank: Record<string, number> = { 
    'harmless': 0, 
    'clean': 0, 
    'unknown': 1, 
    'suspicious': 2, 
    'malicious': 3 
  };
  const currentSeverity = severityRank[verdict] || 0;
  const orchestratorSeverity = severityRank[hashAnalysisResult.verdict] || 0;

  if (hashAnalysisResult.threatIntel.confidence > confidence && orchestratorSeverity > currentSeverity) {
    // Only override if orchestrator is more severe
    verdict = hashAnalysisResult.verdict;
    confidence = hashAnalysisResult.threatIntel.confidence;
    console.log(
      `[Analysis] 🎯 Verdict upgraded by orchestrator: ${verdict} (confidence: ${confidence})`
    );
  } else if (orchestratorSeverity < currentSeverity) {
    console.log(
      `[Analysis] 🛡️ Keeping local verdict '${verdict}' (risk: ${riskScore}) - orchestrator suggested '${hashAnalysisResult.verdict}' but local analysis indicates higher threat`
    );
  }

  const riskLevel =
    riskScore >= 70 ? 'critical' :
    riskScore >= 35 ? 'high' :
    riskScore >= 15 ? 'medium' : 'low';

  // ✅ Normalize 'clean' to 'harmless' for consistency
  if (verdict === 'clean') {
    verdict = 'harmless';
  }

  // ✅ STEP 8: Use detections from orchestrator result
  const allDetections = hashAnalysisResult.threatIntel.detections || [];
  console.log(`[Analysis] 📊 Total detections from orchestrator: ${allDetections.length}`);

  const username = SYSTEM_USER.username;

  // ✅ STEP 10: Enhance orchestrator result with file-specific data
  const now = new Date();

  // Merge cached VT data if needed (unchanged)
  if (
    existingCachedData &&
    existingCachedData.multiSourceData?.virustotal?.full_data &&
    (!hashAnalysisResult.multiSourceData?.virustotal ||
      !hashAnalysisResult.multiSourceData.virustotal.full_data)
  ) {
    console.log(`[Analysis] 🔄 Merging cached VT data into fresh analysis result`);

    if (!hashAnalysisResult.multiSourceData) {
      hashAnalysisResult.multiSourceData = {};
    }
    hashAnalysisResult.multiSourceData.virustotal =
      existingCachedData.multiSourceData.virustotal;

    if (existingCachedData.stats && existingCachedData.stats.malicious > 0) {
      hashAnalysisResult.stats = existingCachedData.stats;
    }

    if (
      existingCachedData.threat_intel &&
      existingCachedData.threat_intel.detections?.length > 0
    ) {
      hashAnalysisResult.threatIntel = {
        ...hashAnalysisResult.threatIntel,
        detections: existingCachedData.threat_intel.detections,
        threatTypes:
          existingCachedData.threat_intel.threatTypes ||
          hashAnalysisResult.threatIntel.threatTypes,
        confidence: Math.max(
          existingCachedData.threat_intel.confidence || 0,
          hashAnalysisResult.threatIntel.confidence || 0
        )
      };
    }

    if (!hashAnalysisResult.sources_available) {
      hashAnalysisResult.sources_available = [];
    }
    if (
      existingCachedData.sources_available?.includes('virustotal') &&
      !hashAnalysisResult.sources_available.includes('virustotal')
    ) {
      hashAnalysisResult.sources_available.push('virustotal');
    }

    if (hashAnalysisResult.sources_failed) {
      hashAnalysisResult.sources_failed = hashAnalysisResult.sources_failed.filter(
        (s: string) => s !== 'virustotal'
      );
    }

    console.log(`[Analysis] ✅ Cached VT data merged successfully`);
  }

  const enhancedResult: IOCAnalysisResult = {
    ...hashAnalysisResult,
    fileInfo: {
      name: filename,
      type: fileTypeInfo.description,
      size: fileSize,
      md5,
      sha1,
      sha256,
      firstSeen: now.toISOString(),
      lastAnalysis: now.toISOString(),
      uploadDate: now.toISOString()
    },
    sandboxAnalysis: contentAnalysis.yaraMatches.length > 0 ? {
      verdicts: contentAnalysis.yaraMatches.map((rule: any) => ({
        sandbox: 'YARA',
        verdict: 'malicious',
        malware_classification: [rule.name],
        confidence: 0.85,
        sandbox_name: 'Custom YARA Rules'
      })),
      summary: {
        malicious: contentAnalysis.yaraMatches.filter((r: any) => r.risk === 'critical').length,
        suspicious: contentAnalysis.yaraMatches.filter((r: any) => r.risk === 'high').length,
        clean: 0,
        total: contentAnalysis.yaraMatches.length
      }
    } : undefined
  };

  // ✅ STEP 11: Save enhanced result
const analysisTime = Date.now() - startTime;
const cacheTtlSec = getCacheTTL('hash', 'file_analysis');

const enrichedForStorage = {
  ...enhancedResult,
  verdict: verdict as any,
  severity: riskLevel,
  riskLevel,
  confidence,
  riskScore,
  updatedAt: now,
  cacheTtlSec,
  analysisTime,
};

await saveIOCAnalysis({
  ioc: sha256,
  type: 'hash',
  userId: SYSTEM_USER_ID,
  username,
  label: label || 'File Analysis',
  source: 'file_analysis',
  fileMetadata: {
    originalFilename: filename,
    uploadedSize: fileSize,
    uploadedType: fileTypeInfo.description,
    uploadedAt: now.toISOString(),
  },
  analysisResult: enrichedForStorage as any,
  fetchedAt: now,
  cacheTtlSec,
});

  return {
    ...enhancedResult,
    verdict: verdict as any,
    severity: riskLevel,
    riskLevel,
    confidence,
    riskScore,
    updatedAt: now,
  cacheTtlSec,
  analysisTime,
    vtData: enhancedResult.vtData,       // frontend uses this
    threatfoxData: enhancedResult.threatfoxData,
    malwarebazaarData: enhancedResult.malwarebazaarData,
    threatIntel: {
      ...enhancedResult.threatIntel,
      yaraAnalysis: contentAnalysis.yaraMatches.length > 0 ? {
        totalMatches: contentAnalysis.yaraMatches.length,
        rules: contentAnalysis.yaraMatches,
        totalScore: contentAnalysis.yaraMatches.reduce(
          (sum: number, rule: any) => sum + rule.score,
          0
        )
      } : undefined,
      ipReputation: contentAnalysis.ipAddresses.length > 0 ? {
        totalIps: contentAnalysis.ipAddresses.length,
        maliciousIps: contentAnalysis.ipAddresses.filter(
          (ip: any) => ip.verdict === 'malicious'
        ).length,
        suspiciousIps: contentAnalysis.ipAddresses.filter(
          (ip: any) => ip.verdict === 'suspicious'
        ).length,
        ips: contentAnalysis.ipAddresses
      } : undefined,
      patterns: contentAnalysis.patterns,
      indicators: contentAnalysis.indicators,
      advancedMetadata: contentAnalysis.advancedMetadata
    },
    fetchedAt: now,
    
  };
}

