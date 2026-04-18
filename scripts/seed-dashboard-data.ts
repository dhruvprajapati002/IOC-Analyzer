import connectDB from '../src/lib/db';
import { IocUserHistory } from '../src/lib/models/IocUserHistory';
import { IocCache } from '../src/lib/models/IocCache';

type IocType = 'ip' | 'domain' | 'url' | 'hash';
type Verdict = 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown';
type Severity = 'critical' | 'high' | 'medium' | 'low';

const SEED_USER_ID = 'seed_user_001';

const IOC_TYPE_COUNTS: Array<{ type: IocType; count: number }> = [
  { type: 'ip', count: 60 },
  { type: 'domain', count: 38 },
  { type: 'url', count: 30 },
  { type: 'hash', count: 22 },
];

const VERDICT_COUNTS: Array<{ verdict: Verdict; count: number }> = [
  { verdict: 'malicious', count: 45 },
  { verdict: 'suspicious', count: 23 },
  { verdict: 'harmless', count: 68 },
  { verdict: 'undetected', count: 11 },
  { verdict: 'unknown', count: 3 },
];

const SOURCES = ['virustotal', 'greynoise', 'threatfox', 'urlhaus', 'file_analysis'] as const;
const THREAT_TYPES = ['ransomware', 'trojan', 'botnet', 'phishing', 'c2', 'scanner', 'miner'] as const;
const ENGINES = ['VirusTotal', 'GreyNoise', 'ThreatFox', 'URLhaus', 'MalwareBazaar'] as const;
const MALWARE_FAMILIES = ['Emotet', 'Cobalt Strike', 'Mirai', 'WannaCry', 'RedLine', 'AgentTesla', 'Qakbot', 'AsyncRAT'] as const;
const FILE_TYPES = ['PE32', 'PDF', 'DOCX', 'ZIP', 'PS1'] as const;
const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'KR', name: 'South Korea' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'FR', name: 'France' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomPick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomSubset<T>(items: readonly T[], minSize: number, maxSize: number): T[] {
  const copy = [...items];
  const size = randomInt(minSize, Math.min(maxSize, copy.length));
  const result: T[] = [];
  for (let i = 0; i < size; i += 1) {
    const idx = randomInt(0, copy.length - 1);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

function shuffle<T>(items: T[]): T[] {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function buildTypeSeries(): IocType[] {
  const items: IocType[] = [];
  for (const entry of IOC_TYPE_COUNTS) {
    for (let i = 0; i < entry.count; i += 1) {
      items.push(entry.type);
    }
  }
  return shuffle(items);
}

function buildVerdictSeries(): Verdict[] {
  const items: Verdict[] = [];
  for (const entry of VERDICT_COUNTS) {
    for (let i = 0; i < entry.count; i += 1) {
      items.push(entry.verdict);
    }
  }
  return shuffle(items);
}

function generateIpValue(index: number): string {
  return `185.220.101.${(index % 240) + 1}`;
}

function generateDomainValue(index: number): string {
  const suffix = ['ru', 'cn', 'tk', 'top', 'xyz', 'site'][index % 6];
  return `malware-cdn-${index + 1}.${suffix}`;
}

function generateUrlValue(index: number): string {
  const tld = ['tk', 'ru', 'top', 'cn'][index % 4];
  const path = ['login', 'invoice', 'verify', 'portal', 'secure'][index % 5];
  return `http://phish-${index + 1}.${tld}/${path}`;
}

function generateHashValue(index: number): string {
  const seed = `${index}${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  let hash = '';
  while (hash.length < 64) {
    hash += seed;
  }
  return hash.slice(0, 64);
}

function generateIocValue(type: IocType, index: number): string {
  if (type === 'ip') return generateIpValue(index);
  if (type === 'domain') return generateDomainValue(index);
  if (type === 'url') return generateUrlValue(index);
  return generateHashValue(index);
}

function severityFromVerdict(verdict: Verdict): Severity {
  if (verdict === 'malicious') {
    return Math.random() > 0.55 ? 'critical' : 'high';
  }
  if (verdict === 'suspicious') {
    return 'medium';
  }
  return 'low';
}

function riskScoreFromVerdict(verdict: Verdict): number {
  if (verdict === 'malicious') return randomInt(65, 95);
  if (verdict === 'suspicious') return randomInt(35, 65);
  if (verdict === 'harmless') return randomInt(0, 30);
  return randomInt(0, 25);
}

function makeMetadata(type: IocType, source: string, index: number) {
  if (type !== 'hash' && source !== 'file_analysis') {
    return null;
  }

  return {
    filename: `malware_${index + 1}.exe`,
    filesize: randomInt(50000, 5000000),
    filetype: randomPick(FILE_TYPES),
  };
}

function buildAnalysis(type: IocType, value: string, verdict: Verdict, severity: Severity, riskScore: number) {
  const country = randomPick(COUNTRIES);
  const threatTypes = randomSubset(THREAT_TYPES, 1, 3);
  const detections = ENGINES.map((engine) => {
    const likelyDetected = verdict === 'malicious'
      ? Math.random() > 0.15
      : verdict === 'suspicious'
        ? Math.random() > 0.45
        : Math.random() > 0.8;

    return {
      engine,
      detected: likelyDetected,
      confidence: randomFloat(0.5, 0.99),
    };
  });

  const families = randomSubset(MALWARE_FAMILIES, 1, 2).map((name) => ({
    name,
    count: randomInt(1, 20),
  }));

  return {
    ioc: value,
    type,
    verdict,
    severity,
    stats: {
      malicious: verdict === 'malicious' ? randomInt(10, 40) : randomInt(0, 8),
      suspicious: verdict === 'suspicious' ? randomInt(5, 20) : randomInt(0, 6),
      harmless: verdict === 'harmless' ? randomInt(10, 35) : randomInt(0, 10),
      undetected: verdict === 'undetected' ? randomInt(8, 25) : randomInt(0, 8),
    },
    threatIntel: {
      threatTypes,
      detections,
      severity,
      riskScore,
      confidence: randomFloat(0.5, 0.99),
    },
    reputation: {
      geolocation: {
        country: country.code,
        countryCode: country.code,
        countryName: country.name,
      },
    },
    vtData: {
      malware_families: families,
    },
    fetchedAt: new Date().toISOString(),
    cached: true,
  };
}

async function run() {
  await connectDB();

  const existing = await IocUserHistory.countDocuments({ userId: SEED_USER_ID });
  if (existing > 10) {
    console.log('Already seeded');
    return;
  }

  const typeSeries = buildTypeSeries();
  const verdictSeries = buildVerdictSeries();

  const historyRows: Array<any> = [];
  for (let i = 0; i < 150; i += 1) {
    const type = typeSeries[i];
    const verdict = verdictSeries[i];
    const value = generateIocValue(type, i);
    const source = randomPick(SOURCES);
    const metadata = makeMetadata(type, source, i);
    const searchedAt = new Date(Date.now() - randomInt(0, 30 * 86400 * 1000));

    historyRows.push({
      userId: SEED_USER_ID,
      value,
      type,
      searched_at: searchedAt,
      verdict,
      label: verdict,
      source,
      metadata,
    });
  }

  await IocUserHistory.insertMany(historyRows);

  const uniquePairs = new Map<string, { value: string; type: IocType; verdict: Verdict }>();
  for (const row of historyRows) {
    const key = `${row.value}::${row.type}`;
    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, {
        value: row.value,
        type: row.type,
        verdict: row.verdict,
      });
    }
  }

  const cacheSeedRows = shuffle(Array.from(uniquePairs.values())).slice(0, 80);
  const cacheWrites = cacheSeedRows.map((row) => {
    const severity = severityFromVerdict(row.verdict);
    const riskScore = riskScoreFromVerdict(row.verdict);
    const threatTypes = randomSubset(THREAT_TYPES, 1, 3);

    return {
      updateOne: {
        filter: { value: row.value, type: row.type },
        update: {
          $set: {
            value: row.value,
            type: row.type,
            verdict: row.verdict,
            severity,
            riskScore,
            threatIntel: {
              threatTypes,
              confidence: randomFloat(0.5, 0.99),
            },
            analysis: buildAnalysis(row.type, row.value, row.verdict, severity, riskScore),
            created_at: new Date(),
            expiresAt: new Date(Date.now() + 90 * 86400 * 1000),
          },
        },
        upsert: true,
      },
    };
  });

  if (cacheWrites.length > 0) {
    await IocCache.bulkWrite(cacheWrites, { ordered: false });
  }

  console.log(`Seeded ${historyRows.length} IocUserHistory docs for ${SEED_USER_ID}`);
  console.log(`Upserted ${cacheWrites.length} IocCache docs`);
}

run()
  .then(() => {
    console.log('Dashboard seed complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Dashboard seed failed:', error);
    process.exit(1);
  });
