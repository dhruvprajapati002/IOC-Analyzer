// src/lib/threat-intel/types/storage.types.ts

import { Severity, Verdict } from "./threat-intel.types";

export interface IOCStorageDocument {
  // === CORE IDENTIFICATION ===
  _id: string;
  ioc: string;
  ioc_type: 'ip' | 'domain' | 'url' | 'hash';
  label?: string;
  
  // === VERDICT & RISK ===
 verdict: Verdict;    // ✅ Use imported type (includes 'clean', 'whitelisted', etc.)
  severity: Severity; 
 confidence: number;
  
  // === DETECTION STATISTICS (✅ FIX: Use actual counts) ===
  stats: {
    malicious: number;           // 26 in your example
    suspicious: number;           // 0
    harmless: number;             // 0
    undetected: number;           // 36
    timeout: number;              // 0
    failure: number;              // 1
    type_unsupported: number;     // 12
    total_engines: number;        // 75 (62 usable)
  };
  
  // === THREAT INTELLIGENCE (Aggregated from all sources) ===
  threat_intel: {
    threat_types: string[];            // ["Trojan", "Malware", "Backdoor", "Botnet"]
    threat_names: string[];            // ["mirai", "gafgyt"]
    suggested_threat_label?: string;   // ✅ NEW: "trojan.mirai/gafgyt"
    malware_families: string[];        // ["Mirai"]
    tags: string[];                    // ["elf", "upx", "Mirai", "detect-debug-environment"]
    
    // Top 20 malicious detections only
    detections: Array<{
      engine: string;
      category: string;
      result: string;
      method: string;                  // ✅ NEW: "blacklist"
    }>;
  };
  
  // === VIRUSTOTAL DATA ===
  vt_data: {
    // Basic info
    status: string;                    // "served_live" or "served_from_cache"
    vt_link: string;
    last_analysis_date: Date;
    
    // Threat classification
    threat_classification: {
      suggested_label?: string;        // "trojan.mirai/gafgyt"
      categories: Array<{
        value: string;                 // "trojan"
        count: number;                 // 18
      }>;
      threat_names: Array<{
        value: string;                 // "mirai"
        count: number;                 // 16
      }>;
    };
    
    // Detection stats (actual counts from last_analysis_stats)
    detection_stats: {
      malicious: number;
      suspicious: number;
      harmless: number;
      undetected: number;
      timeout: number;
      failure: number;
      type_unsupported: number;
    };
    
    // Community feedback
    community: {
      votes_harmless: number;
      votes_malicious: number;
    };
    
    // Reputation score
    reputation: number;                // -12 (negative = bad)
    
    // Submission info
    submission: {
      first_date: Date;
      last_date: Date;
      times_submitted: number;
      unique_sources: number;
    };
    
    // ✅ FILE INFO (for hashes only)
    file_info?: {
      sha256: string;
      sha1: string;
      md5: string;
      size: number;
      type: string;                    // "elf"
      type_description: string;        // "ELF"
      type_tags: string[];             // ["executable", "linux", "elf"]
      meaningful_name?: string;        // "tvkrkabdb.exe"
      file_names: string[];            // ["tvkrkabdb.exe", "ub8ehJSePAfc9FYqZIT6.arm6.elf"]
      magic: string;                   // "ELF 32-bit LSB executable, ARM..."
      ssdeep?: string;                 // Fuzzy hash
      tlsh?: string;                   // Trend Micro Locality Sensitive Hash
      vhash?: string;                  // VirusTotal hash
    };
    
    // ✅ PACKER/OBFUSCATION DETECTION
    packers?: {
      detected: string[];              // ["upx"]
      details: Record<string, string>; // {"Gandelf": "upx"}
    };
    
    // ✅ DETECT IT EASY (DIE) - File analysis tool
    detectiteasy?: {
      filetype: string;                // "ELF32"
      detections: Array<{
        name: string;                  // "Unix", "UPX"
        type: string;                  // "Operation system", "Packer"
        info: string;                  // "EXEC ARM-32", "LZMA,brute"
        version?: string;              // "3.94"
      }>;
    };
    
    // ✅ ELF-SPECIFIC INFO (for Linux malware)
    elf_info?: {
      class: string;                   // "ELF32"
      machine: string;                 // "ARM"
      os_abi: string;                  // "UNIX - Linux"
      type: string;                    // "EXEC (Executable file)"
      packers: string[];               // ["upx"]
      entrypoint: number;
    };
    
    // ✅ YARA RULES (only rule metadata, not full results)
    yara_matches?: Array<{
      rule_name: string;
      ruleset_name: string;
      description?: string;
      author?: string;
      source?: string;
    }>;

     // ✅ ADD THIS:
    sandbox_analysis?: {
      verdicts: Array<{
        sandbox_name: string;
        category: string;
        malware_classification: string[];
        malware_names: string[];
        confidence: number;
      }>;
    };
  };
  
  // === MULTI-SOURCE DATA ===
  multi_source_data: {
    malwarebazaar?: {
      available: boolean;
      verdict?: 'malicious' | 'clean';
      score?: number;
      signature?: string;              // "Mirai"
      file_name?: string;
      file_type?: string;
      file_size?: number;
      malware_families?: string[];
      tags?: string[];
    };
    
    greynoise?: {
      available: boolean;
      classification?: string;
      noise?: boolean;
      riot?: boolean;
      tags?: string[];
    };
    
    ipqs?: {
      available: boolean;
      fraud_score?: number;
      is_proxy?: boolean;
      is_vpn?: boolean;
      is_tor?: boolean;
    };
  };
  
  // === METADATA ===
  sources_available: string[];
  sources_failed: string[];
  fetched_at: Date;
  updated_at: Date;
  cached: boolean;
  cache_ttl_sec: number;
  
  meta?: {
    created_by?: string;
    case_id?: string;
    tags?: string[];
  };
}
