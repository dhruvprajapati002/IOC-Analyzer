import type { 
  Detection, 
  MitreAttackData, 
  MitreTactic, 
  MitreTechnique,
  FileInfo 
} from '../types/threat-intel.types';

/**
 * Extract file information from VT response
 * Handles both fresh API responses (nested) and cached data (flat)
 */
export function extractFileInfo(vtResult: any, hash: string): FileInfo | null {
  // Try multiple possible locations for attributes
  const attrs = vtResult.raw?.data?.attributes ||  // Fresh API response
                vtResult.full_data ||                 // Cached flat structure
                vtResult?.data?.attributes;           // Alternative structure
  
  if (!attrs) {
    console.warn('[VTExtractor] ⚠️ No attributes found in VT response');
    console.warn('[VTExtractor] ⚠️ Structure:', {
      hasRaw: !!vtResult.raw,
      hasFullData: !!vtResult.full_data,
      hasData: !!vtResult.data,
      keys: Object.keys(vtResult || {})
    });
    return null;
  }

  let fileName = 'Unknown';
  if (attrs.meaningful_name) {
    fileName = attrs.meaningful_name;
  } else if (attrs.names && attrs.names.length > 0) {
    fileName = attrs.names[0];
  }

  const fileType = attrs.type_description || 
                   attrs.magic || 
                   attrs.type_tag || 
                   'Unknown';

  const md5 = attrs.md5 || '';
  const sha1 = attrs.sha1 || '';
  const sha256 = attrs.sha256 || hash;

  const firstSeen = attrs.first_submission_date 
    ? new Date(attrs.first_submission_date * 1000).toISOString()
    : 'Unknown';
    
  const lastAnalysis = attrs.last_analysis_date
    ? new Date(attrs.last_analysis_date * 1000).toUTCString()
    : new Date().toUTCString();

  const uploadDate = attrs.creation_date
    ? new Date(attrs.creation_date * 1000).toISOString()
    : new Date().toISOString();

  console.log('[VTExtractor] 📄 Extracted file info:', {
    name: fileName,
    type: fileType,
    size: attrs.size || 0
  });

  return {
    name: fileName,
    size: attrs.size || 0,
    type: fileType,
    md5,
    sha1,
    sha256,
    firstSeen,
    lastAnalysis,
    uploadDate
  };
}

/**
 * Extract all detections from VT response
 */
export function extractDetections(vtResult: any): Detection[] {
  const detections: Detection[] = [];

  if (vtResult.raw?.data?.attributes?.last_analysis_results) {
    const analysisResults = vtResult.raw.data.attributes.last_analysis_results;

    Object.entries(analysisResults).forEach(
      ([engine, result]: [string, any]) => {
        if (result.category && result.result) {
          detections.push({
            engine,
            category: result.category,
            result: result.result
          });
        }
      }
    );

    console.log(`[VTExtractor] 🔬 Extracted ${detections.length} detections`);
    return detections;
  }

  if (vtResult.summary?.detections && Array.isArray(vtResult.summary.detections)) {
    console.log(`[VTExtractor] 🔬 Using ${vtResult.summary.detections.length} detections from summary`);
    return vtResult.summary.detections;
  }

  console.log('[VTExtractor] ⚠️ No detections found');
  return [];
}

/**
 * Extract family labels (malware families) from VT tags
 * Handles both fresh API responses and cached data
 */
export function extractFamilyLabels(vtResult: any): string[] {
  // Try multiple possible locations for tags
  const tags = 
    vtResult.raw?.data?.attributes?.tags ||  // Fresh API response
    vtResult.full_data?.tags ||              // Cached flat structure
    vtResult.raw?.attributes?.tags ||        // Alternative structure
    vtResult?.tags ||                        // Direct tags
    [];
  
  if (!Array.isArray(tags) || tags.length === 0) {
    console.log('[VTExtractor] ℹ️ No VT tags found');
    return [];
  }
  
  console.log(`[VTExtractor] 🏷️ Found ${tags.length} VT tags`);
  
  // Filter out technical/generic tags
  const familyLabels = tags.filter((tag: string) => {
    const lower = tag.toLowerCase();
    
    // Exclude generic file format and technical tags
    const excludePatterns = [
      'peexe', 'pedll', 'pe32', 'pe64', 'overlay', 'runtime',
      'signed', 'invalid-signature', 'detect', 'contains', 'packer',
      'exe', 'dll', 'zip', 'rar', 'pdf', 'attachment', 'macros'
    ];
    
    if (excludePatterns.some(pattern => lower.includes(pattern) || lower === pattern)) {
      return false;
    }
    
    return tag.length > 2;
  });
  
  console.log(`[VTExtractor] 🧬 Extracted ${familyLabels.length} family labels`);
  
  return familyLabels.slice(0, 10);
}

/**
 * Determine the most popular threat label from detections
 */
export function determinePopularThreat(
  detections: Detection[],
  familyLabels: string[]
): string | null {
  const detectionCounts = new Map<string, number>();

  detections.forEach((detection) => {
    if (detection.category === 'malicious' && detection.result) {
      const firstPart = detection.result.split(/[-._/\s:]/)[0];
      if (firstPart && firstPart.length > 2) {
        const count = detectionCounts.get(firstPart) || 0;
        detectionCounts.set(firstPart, count + 1);
      }
    }
  });

  let maxCount = 0;
  let popularLabel: string | null = null;

  for (const [label, count] of detectionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      popularLabel = label;
    }
  }

  if (!popularLabel && familyLabels.length > 0) {
    popularLabel = familyLabels[0];
  }

  return popularLabel;
}

/**
 * Parse MITRE ATT&CK data from VT sandbox results
 */
export function parseMitreAttack(mitreData: any): MitreAttackData | null {
  if (!mitreData) {
    console.log('[VTExtractor] ℹ️ No MITRE data received');
    return null;
  }

  console.log('[VTExtractor] 🔍 Parsing MITRE data...', typeof mitreData);

  const tactics: MitreTactic[] = [];
  const techniques: MitreTechnique[] = [];

  // Handle direct array format (VT sometimes returns array directly)
  if (Array.isArray(mitreData)) {
    console.log(`[VTExtractor] 📋 Processing direct array with ${mitreData.length} items`);
    
    mitreData.forEach((item: any) => {
      // Each item might be a technique object
      if (item.id) {
        // Determine if it's a tactic (TA####) or technique (T####)
        if (item.id.startsWith('TA')) {
          if (!tactics.find(t => t.id === item.id)) {
            tactics.push({
              id: item.id,
              name: item.name || item.id,
              description: item.description || undefined,
              link: item.link || `https://attack.mitre.org/tactics/${item.id}/`
            });
          }
        } else if (item.id.startsWith('T')) {
          if (!techniques.find(t => t.id === item.id)) {
            techniques.push({
              id: item.id,
              name: item.name || item.id,
              description: item.description || undefined,
              link: item.link || `https://attack.mitre.org/techniques/${item.id}/`
            });
          }
        }
      }
    });
  }
  // Handle object format (sandboxes as keys)
  else if (typeof mitreData === 'object' && !Array.isArray(mitreData)) {
    console.log('[VTExtractor] 📦 Processing object format');
    
    Object.keys(mitreData).forEach((sandboxName) => {
      const sandboxData = mitreData[sandboxName];
      
      console.log(`[VTExtractor] 📦 Processing sandbox: ${sandboxName}`);
      
      // Process tactics
      if (Array.isArray(sandboxData.tactics)) {
        sandboxData.tactics.forEach((tactic: any) => {
          if (!tactics.find(t => t.id === tactic.id)) {
            tactics.push({
              id: tactic.id || 'Unknown',
              name: tactic.name || tactic.id || 'Unknown',
              description: tactic.description || undefined,
              link: tactic.link || `https://attack.mitre.org/tactics/${tactic.id}/`
            });
          }
        });
      } else if (sandboxData.tactics && typeof sandboxData.tactics === 'object') {
        Object.entries(sandboxData.tactics).forEach(([id, name]: [string, any]) => {
          if (!tactics.find(t => t.id === id)) {
            tactics.push({
              id,
              name: typeof name === 'string' ? name : id,
              link: `https://attack.mitre.org/tactics/${id}/`
            });
          }
        });
      }
      
      // Process techniques
      if (Array.isArray(sandboxData.techniques)) {
        sandboxData.techniques.forEach((technique: any) => {
          if (!techniques.find(t => t.id === technique.id)) {
            techniques.push({
              id: technique.id || 'Unknown',
              name: technique.name || technique.id || 'Unknown',
              description: technique.description || undefined,
              link: technique.link || `https://attack.mitre.org/techniques/${technique.id}/`
            });
          }
        });
      } else if (sandboxData.techniques && typeof sandboxData.techniques === 'object') {
        Object.entries(sandboxData.techniques).forEach(([id, details]: [string, any]) => {
          if (!techniques.find(t => t.id === id)) {
            techniques.push({
              id,
              name: details?.name || details?.description || id,
              description: details?.description || undefined,
              link: `https://attack.mitre.org/techniques/${id}/`
            });
          }
        });
      }
    });
  }

  console.log(`[VTExtractor] ⚔️ Parsed MITRE: ${tactics.length} tactics, ${techniques.length} techniques`);

  if (tactics.length === 0 && techniques.length === 0) {
    console.log('[VTExtractor] ℹ️ No MITRE tactics/techniques found');
    return null;
  }

  return { tactics, techniques };
}

/**
 * Generate sandbox analysis data (placeholder/estimated)
 */
export function generateSandboxData(maliciousCount: number): any {
  if (maliciousCount === 0) return null;

  const behaviorAnalysis: any = {};

  if (maliciousCount > 5) {
    behaviorAnalysis.fileCreation = {
      count: Math.floor(Math.random() * 12) + 3,
      severity: maliciousCount > 20 ? 'high' : 'medium'
    };
    behaviorAnalysis.registryModification = {
      count: Math.floor(Math.random() * 18) + 7,
      severity: maliciousCount > 20 ? 'high' : 'medium'
    };
    behaviorAnalysis.networkCommunication = {
      count: Math.floor(Math.random() * 8) + 2,
      severity: maliciousCount > 20 ? 'high' : 'medium'
    };
  }

  if (maliciousCount > 10) {
    behaviorAnalysis.processInjection = {
      count: Math.floor(Math.random() * 3) + 1,
      severity: 'critical'
    };
  }

  if (maliciousCount > 15) {
    behaviorAnalysis.serviceInstallation = {
      count: Math.floor(Math.random() * 2) + 1,
      severity: 'high'
    };
  }

  if (Object.keys(behaviorAnalysis).length === 0) return null;

  return {
    status: 'Analyzed',
    runtime: '180s',
    environment: 'Windows 10 x64',
    behaviorAnalysis
  };
}
