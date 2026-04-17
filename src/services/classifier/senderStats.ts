import type { GmailMessage } from '@/types/gmail';
import type { SenderStats } from '@/types/domain';
import { getHeader } from '@/services/gmail/headerParser';
import { extractEmailParts } from '@/utils/format';

export class SenderStatsTracker {
  private stats = new Map<string, SenderStats>();

  track(message: GmailMessage): void {
    const headers = message.payload?.headers ?? [];
    const from = getHeader(headers, 'From') ?? '';
    if (!from) return;

    const { address, domain } = extractEmailParts(from);
    const isUnread = message.labelIds?.includes('UNREAD') ?? false;

    const existing = this.stats.get(address);
    if (existing) {
      existing.count += 1;
      if (isUnread) existing.unreadCount += 1;
      existing.totalSize += message.sizeEstimate ?? 0;
    } else {
      this.stats.set(address, {
        domain,
        address,
        count: 1,
        unreadCount: isUnread ? 1 : 0,
        totalSize: message.sizeEstimate ?? 0,
      });
    }
  }

  getStats(address: string): SenderStats | undefined {
    return this.stats.get(address);
  }

  getSenderCount(address: string): number {
    return this.stats.get(address)?.count ?? 0;
  }

  isNeverOpened(address: string): boolean {
    const stats = this.stats.get(address);
    if (!stats) return false;
    return stats.count >= 5 && stats.unreadCount === stats.count;
  }

  getTopSenders(n = 10): SenderStats[] {
    return [...this.stats.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  getAll(): Map<string, SenderStats> {
    return this.stats;
  }
}
