const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  const unit = UNITS[i];
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${unit}`;
}

export function formatRelativeDate(date: Date | number): string {
  const now = Date.now();
  const diff = now - (typeof date === 'number' ? date : date.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function getAgeDays(internalDate: string): number {
  const date = new Date(parseInt(internalDate, 10));
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export function extractEmailParts(from: string): { name: string; address: string; domain: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/);
  const address = match?.[2]?.trim() ?? from.trim();
  const name = match?.[1]?.trim() || (address.split('@')[0] ?? '');
  const domain = address.split('@')[1]?.toLowerCase() ?? '';
  return { name, address, domain };
}
