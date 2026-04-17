import { gmailClient } from '@/services/gmail/GmailClient';
import { safeBroadcast } from './broadcast';

export async function performTrash(ids: string[]): Promise<void> {
  const result = await gmailClient.batchTrash(ids);

  if (!result.ok) {
    safeBroadcast({ type: 'TRASH_ERROR', message: result.error.message });
    return;
  }

  safeBroadcast({ type: 'TRASH_COMPLETE', count: ids.length });
}
