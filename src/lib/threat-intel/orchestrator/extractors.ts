// src/lib/threat-intel/orchestrator/extractors.ts

export class VTDataExtractor {
  
  /**
   * Extract detection stats from VT response
   */
  static extractDetectionStats(vtRaw: any): any {
    const attrs = vtRaw?.data?.attributes;
    if (!attrs?.last_analysis_stats) {
      return {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
        timeout: 0,
        failure: 0,
        type_unsupported: 0,
      };
    }
    
    const stats = attrs.last_analysis_stats;
    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      timeout: stats.timeout || 0,
      failure: stats.failure || 0,
      type_unsupported: stats['type-unsupported'] || 0,
    };
  }
  
  /**
   * Extract file info from VT response
   */
  static extractFileInfo(vtRaw: any): any | undefined {
    const attrs = vtRaw?.data?.attributes;
    if (!attrs) return undefined;
    
    return {
      sha256: attrs.sha256,
      sha1: attrs.sha1,
      md5: attrs.md5,
      size: attrs.size,
      type: attrs.type_tag,
      type_description: attrs.type_description,
      type_tags: attrs.type_tags || [],
      meaningful_name: attrs.meaningful_name,
      file_names: attrs.names || [],
      magic: attrs.magic,
      ssdeep: attrs.ssdeep,
      tlsh: attrs.tlsh,
      vhash: attrs.vhash,
    };
  }
  
  /**
   * Extract threat classification
   */
  static extractThreatClassification(vtRaw: any): any {
    const popular = vtRaw?.data?.attributes?.popular_threat_classification;
    if (!popular) {
      return {
        suggested_label: undefined,
        categories: [],
        threat_names: [],
      };
    }
    
    return {
      suggested_label: popular.suggested_threat_label,
      categories: popular.popular_threat_category || [],
      threat_names: popular.popular_threat_name || [],
    };
  }
  
  /**
   * Extract community votes
   */
  static extractCommunityVotes(vtRaw: any): any {
    const votes = vtRaw?.data?.attributes?.total_votes;
    return {
      votes_harmless: votes?.harmless || 0,
      votes_malicious: votes?.malicious || 0,
    };
  }
  
  /**
   * Extract submission info
   */
  static extractSubmissionInfo(vtRaw: any): any {
    const attrs = vtRaw?.data?.attributes;
    return {
      first_date: attrs?.first_submission_date 
        ? new Date(attrs.first_submission_date * 1000) 
        : undefined,
      last_date: attrs?.last_submission_date 
        ? new Date(attrs.last_submission_date * 1000) 
        : undefined,
      times_submitted: attrs?.times_submitted || 0,
      unique_sources: attrs?.unique_sources || 0,
    };
  }
  
  /**
   * Extract packer info
   */
  static extractPackers(vtRaw: any): any | undefined {
    const attrs = vtRaw?.data?.attributes;
    const packers = attrs?.packers;
    const elfPackers = attrs?.elf_info?.packers;
    
    if (!packers && !elfPackers) return undefined;
    
    const detected = new Set<string>();
    if (elfPackers) elfPackers.forEach((p: string) => detected.add(p));
    if (packers) Object.values(packers).forEach((p: any) => detected.add(p));
    
    return {
      detected: Array.from(detected),
      details: packers || {},
    };
  }
  
  /**
   * Extract DetectItEasy info
   */
  static extractDetectItEasy(vtRaw: any): any | undefined {
    const die = vtRaw?.data?.attributes?.detectiteasy;
    if (!die) return undefined;
    
    return {
      filetype: die.filetype,
      detections: die.values?.map((v: any) => ({
        name: v.name,
        type: v.type,
        info: v.info,
        version: v.version,
      })) || [],
    };
  }
  
  /**
   * Extract ELF info
   */
  static extractELFInfo(vtRaw: any): any | undefined {
    const elf = vtRaw?.data?.attributes?.elf_info;
    if (!elf) return undefined;
    
    return {
      class: elf.header?.class,
      machine: elf.header?.machine,
      os_abi: elf.header?.os_abi,
      type: elf.header?.type,
      packers: elf.packers || [],
      entrypoint: elf.header?.entrypoint,
    };
  }
  
  /**
   * Extract YARA matches (metadata only)
   */
  static extractYARAMatches(vtRaw: any): any[] | undefined {
    const yara = vtRaw?.data?.attributes?.crowdsourced_yara_results;
    if (!yara || yara.length === 0) return undefined;
    
    return yara.map((rule: any) => ({
      rule_name: rule.rule_name,
      ruleset_name: rule.ruleset_name,
      description: rule.description,
      author: rule.author,
      source: rule.source,
    }));
  }
  
  /**
   * Extract detections (method, engine_name, category, result only)
   */
  static extractDetections(vtRaw: any, limit: number = 20): any[] {
    const results = vtRaw?.data?.attributes?.last_analysis_results;
    if (!results) return [];
    
    const detections: any[] = [];
    
    for (const [engineName, engineData] of Object.entries(results)) {
      const data = engineData as any;
      
      // Only include malicious and suspicious detections
      if (data.category === 'malicious' || data.category === 'suspicious') {
        detections.push({
          engine: data.engine_name || engineName,
          method: data.method,
          category: data.category,
          result: data.result,
        });
      }
    }
    
    // Sort by category (malicious first) and return top N
    return detections
      .sort((a, b) => {
        if (a.category === 'malicious' && b.category !== 'malicious') return -1;
        if (a.category !== 'malicious' && b.category === 'malicious') return 1;
        return 0;
      })
      .slice(0, limit);
  }
  
  /**
   * Extract sandbox analysis verdicts
   */
  static extractSandboxAnalysis(vtRaw: any): {
    verdicts: Array<{
      sandbox_name: string;
      category: string;
      malware_classification: string[];
      malware_names: string[];
      confidence: number;
    }>;
  } {
    const verdicts: any[] = [];
    
    const sandboxData = vtRaw?.data?.attributes?.sandbox_verdicts;
    if (!sandboxData) {
      return { verdicts: [] };
    }
    
    // Iterate through each sandbox result
    Object.entries(sandboxData).forEach(([sandboxName, verdict]: [string, any]) => {
      if (verdict && typeof verdict === 'object') {
        verdicts.push({
          sandbox_name: sandboxName,
          category: verdict.category || 'unknown',
          malware_classification: verdict.malware_classification || [],
          malware_names: verdict.malware_names || [],
          confidence: verdict.confidence || 0,
        });
      }
    });
    
    return { verdicts };
  }
}
