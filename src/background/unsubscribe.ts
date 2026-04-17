import { gmailClient } from '@/services/gmail/GmailClient';
import { parseUnsubscribeHeaders, extractUnsubscribeUrl } from '@/services/gmail/headerParser';
import { safeBroadcast } from './broadcast';

export async function performUnsubscribe(messageId: string): Promise<void> {
  const messagesResult = await gmailClient.batchGetMessages([messageId]);
  if (!messagesResult.ok || messagesResult.value.length === 0) {
    safeBroadcast({ type: 'UNSUBSCRIBE_ERROR', messageId, message: 'Failed to fetch message details' });
    return;
  }

  const message = messagesResult.value[0];
  if (!message) {
    safeBroadcast({ type: 'UNSUBSCRIBE_ERROR', messageId, message: 'Message not found' });
    return;
  }

  const headers = message.payload?.headers ?? [];
  const { listUnsubscribe, listUnsubscribePost } = parseUnsubscribeHeaders(headers);

  if (!listUnsubscribe) {
    safeBroadcast({ type: 'UNSUBSCRIBE_ERROR', messageId, message: 'No unsubscribe header found' });
    return;
  }

  // RFC 8058 one-click POST unsubscribe
  if (listUnsubscribePost) {
    const postUrl = extractUnsubscribeUrl(listUnsubscribe).httpUrl;
    if (postUrl) {
      const result = await gmailClient.oneClickUnsubscribe(postUrl, listUnsubscribePost);
      if (result.ok) {
        await gmailClient.batchTrash([messageId]);
        safeBroadcast({ type: 'UNSUBSCRIBE_COMPLETE', messageId });
        return;
      }
    }
  }

  // Fallback: open mailto or HTTP link in a new tab
  const { httpUrl, mailtoUrl } = extractUnsubscribeUrl(listUnsubscribe);
  if (httpUrl) {
    chrome.tabs.create({ url: httpUrl });
  } else if (mailtoUrl) {
    chrome.tabs.create({ url: mailtoUrl });
  } else {
    safeBroadcast({ type: 'UNSUBSCRIBE_ERROR', messageId, message: 'No valid unsubscribe URL found' });
    return;
  }

  await gmailClient.batchTrash([messageId]);
  safeBroadcast({ type: 'UNSUBSCRIBE_COMPLETE', messageId });
}
