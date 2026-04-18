export interface DetectionStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function formatFileSize(bytes: number | null | undefined): string {
  const value = safeNumber(bytes);
  if (value <= 0) return 'Unknown';

  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (value >= gb) return `${(value / gb).toFixed(1)} GB`;
  if (value >= mb) return `${(value / mb).toFixed(1)} MB`;
  if (value >= kb) return `${Math.round(value / kb)} KB`;
  return `${value} B`;
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'just now';

  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return 'just now';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function formatAbsoluteDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatRiskScore(score: number | null | undefined): string {
  const value = Number(score);
  if (!Number.isFinite(value)) return '--';
  return `${Math.max(0, Math.min(100, Math.round(value)))}`;
}

export function formatDetectionRate(stats: DetectionStats): number {
  const malicious = safeNumber(stats.malicious);
  const suspicious = safeNumber(stats.suspicious);
  const harmless = safeNumber(stats.harmless);
  const undetected = safeNumber(stats.undetected);
  const total = malicious + suspicious + harmless + undetected;

  if (total <= 0) return 0;
  return Math.round(((malicious + suspicious) / total) * 100);
}

export function truncateIOC(ioc: string, maxLen: number): string {
  if (!ioc || ioc.length <= maxLen) return ioc;

  const keep = Math.max(4, Math.floor((maxLen - 3) / 2));
  return `${ioc.slice(0, keep)}...${ioc.slice(-keep)}`;
}
