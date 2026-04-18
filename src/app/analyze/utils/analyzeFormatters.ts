export function formatDateTime(value?: string | Date | null): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatBytes(bytes?: number | null): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
    return 'Unknown';
  }
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, power);

  return `${size.toFixed(size >= 10 || power === 0 ? 0 : 2)} ${units[power]}`;
}

export function truncateMiddle(value: string, maxLength = 32): string {
  if (value.length <= maxLength) return value;

  const side = Math.floor((maxLength - 1) / 2);
  return `${value.slice(0, side)}...${value.slice(-side)}`;
}

export function getRelativeTime(from?: string | Date | null): string {
  if (!from) return 'just now';
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return 'just now';

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}m ago`;
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)}h ago`;
  return `${Math.floor(deltaSeconds / 86400)}d ago`;
}

export function toTitleCase(value?: string | null): string {
  if (!value) return 'Unknown';
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
