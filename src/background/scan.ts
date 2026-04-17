import type { ScanOptions, ScanSummary, EmailSummary, Category } from '@/types/domain';
import { gmailClient } from '@/services/gmail/GmailClient';
import { paginateMessages } from '@/services/gmail/pagination';
import { classifyMessage } from '@/services/classifier/rules';
import { calculateCleanupScore, getCleanupBucket } from '@/services/classifier/scoring';
import { SenderStatsTracker } from '@/services/classifier/senderStats';
import { getHeader, parseUnsubscribeHeaders } from '@/services/gmail/headerParser';
import { getAgeDays, extractEmailParts } from '@/utils/format';
import type { GmailMessage } from '@/types/gmail';
import { getSettings } from './settings';
import { safeBroadcast } from './broadcast';

const FETCH_CHUNK = 2000;

export async function performScan(options: ScanOptions = {}): Promise<void> {
  const tokenResult = await gmailClient.getToken();
  if (!tokenResult.ok) {
    safeBroadcast({ type: 'SCAN_ERROR', message: 'Authentication required. Please sign in.' });
    return;
  }

  const settings = await getSettings();
  const startTime = Date.now();

  // Phase 1: collect ALL message IDs via pagination
  safeBroadcast({ type: 'SCAN_PROGRESS', scanned: 0, total: 0, phase: 'Listing messages…' });

  const messageIds: string[] = [];
  let totalEstimate = 0;

  for await (const pageResult of paginateMessages({
    ...options,
    token: tokenResult.value,
    onPage: (refs, estimate) => {
      for (const r of refs) messageIds.push(r.id);
      totalEstimate = Math.max(estimate, messageIds.length);
      safeBroadcast({
        type: 'SCAN_PROGRESS',
        scanned: messageIds.length,
        total: totalEstimate,
        phase: `Listing messages… (${messageIds.length.toLocaleString()} found)`,
      });
    },
  })) {
    if (!pageResult.ok) {
      safeBroadcast({ type: 'SCAN_ERROR', message: pageResult.error.message });
      return;
    }
  }

  if (messageIds.length === 0) {
    safeBroadcast({
      type: 'SCAN_COMPLETE',
      summary: {
        totalScanned: 0, totalFlagged: 0,
        categoryCounts: { promotional: 0, old_unread: 0, bulk_sender: 0, inactive_subscription: 0, newsletter: 0, keep: 0 },
        storageReclaimableBytes: 0, topSenders: [],
        scanDurationMs: Date.now() - startTime, scanCompletedAt: Date.now(),
      },
      emails: [],
    });
    return;
  }

  const total = messageIds.length;

  // Phase 2: fetch metadata in chunks — builds sender stats, no classification yet
  const tracker = new SenderStatsTracker();
  const rawMessages: GmailMessage[] = [];
  let fetched = 0;

  for (let i = 0; i < total; i += FETCH_CHUNK) {
    const chunkIds = messageIds.slice(i, i + FETCH_CHUNK);

    const result = await gmailClient.batchGetMessages(chunkIds, (done) => {
      safeBroadcast({
        type: 'SCAN_PROGRESS',
        scanned: fetched + done,
        total,
        phase: `Fetching details… (${(fetched + done).toLocaleString()} / ${total.toLocaleString()})`,
      });
    });

    if (!result.ok) {
      safeBroadcast({ type: 'SCAN_ERROR', message: result.error.message });
      return;
    }

    for (const msg of result.value) {
      tracker.track(msg);
      rawMessages.push(msg);
    }
    fetched += result.value.length;
  }

  // Phase 3: classify all emails with complete sender stats (single pass, O(n))
  safeBroadcast({
    type: 'SCAN_PROGRESS',
    scanned: total,
    total,
    phase: `Classifying ${total.toLocaleString()} emails…`,
  });

  const emails = classifyAll(rawMessages, tracker, settings);
  const summary = buildSummary(emails, tracker, startTime);

  safeBroadcast({ type: 'SCAN_COMPLETE', summary, emails });
}

function classifyAll(
  messages: GmailMessage[],
  tracker: SenderStatsTracker,
  settings: Awaited<ReturnType<typeof getSettings>>,
): EmailSummary[] {
  return messages.map((message) => {
    const headers = message.payload?.headers ?? [];
    const fromHeader = getHeader(headers, 'From') ?? '';
    const subject = getHeader(headers, 'Subject') ?? '';
    const { name: fromName, address: fromAddress, domain: fromDomain } = extractEmailParts(fromHeader);
    const ageDays = getAgeDays(message.internalDate ?? '0');
    const isUnread = message.labelIds?.includes('UNREAD') ?? false;
    const senderCount = tracker.getSenderCount(fromAddress);
    const neverOpened = tracker.isNeverOpened(fromAddress);
    const { listUnsubscribe, listUnsubscribePost } = parseUnsubscribeHeaders(headers);

    const categories = classifyMessage({
      message,
      oldEmailThresholdDays: settings.oldEmailThresholdDays,
      bulkSenderThreshold: settings.bulkSenderThreshold,
      senderCount,
      neverOpened,
    });

    const score = calculateCleanupScore({
      categories,
      ageDays,
      isUnread,
      senderFrequency: senderCount,
      neverOpenedFromSender: neverOpened,
    });

    return {
      id: message.id,
      threadId: message.threadId,
      subject,
      from: fromHeader,
      fromName,
      fromDomain,
      date: parseInt(message.internalDate ?? '0', 10),
      ageDays,
      isUnread,
      sizeEstimate: message.sizeEstimate ?? 0,
      categories,
      cleanupScore: score,
      cleanupBucket: getCleanupBucket(score, settings.aggressiveness),
      ...(listUnsubscribe && { listUnsubscribeHeader: listUnsubscribe }),
      ...(listUnsubscribePost && { listUnsubscribePostHeader: listUnsubscribePost }),
      snippet: message.snippet ?? '',
    };
  });
}

function buildSummary(
  emails: EmailSummary[],
  tracker: SenderStatsTracker,
  startTime: number,
): ScanSummary {
  const categoryCounts: Record<Category, number> = {
    promotional: 0, old_unread: 0, bulk_sender: 0, inactive_subscription: 0, newsletter: 0, keep: 0,
  };

  for (const email of emails) {
    if (email.categories.length === 0) categoryCounts.keep += 1;
    else for (const cat of email.categories) categoryCounts[cat] += 1;
  }

  const flagged = emails.filter((e) => e.cleanupBucket !== 'keep');

  return {
    totalScanned: emails.length,
    totalFlagged: flagged.length,
    categoryCounts,
    storageReclaimableBytes: flagged.reduce((s, e) => s + e.sizeEstimate, 0),
    topSenders: tracker.getTopSenders(10),
    scanDurationMs: Date.now() - startTime,
    scanCompletedAt: Date.now(),
  };
}
