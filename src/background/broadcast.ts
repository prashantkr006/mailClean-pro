import type { BGMessage } from '@/types/messages';

/**
 * Broadcasts a message to all open extension pages.
 * Silently swallows "Receiving end does not exist" — expected when no UI is open.
 */
export function safeBroadcast(message: BGMessage): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // No extension page is listening — normal for background-only operations.
  });
}
