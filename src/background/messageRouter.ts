import type { UIMessage, MessageResponse } from '@/types/messages';
import { assertNever } from '@/types/messages';
import { performScan } from './scan';
import { performTrash } from './trash';
import { performUnsubscribe } from './unsubscribe';
import { getAuthStatusPayload, performSignIn, performSignOut } from './auth';

export function messageRouter(
  message: UIMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void,
): boolean {
  (async () => {
    try {
      switch (message.type) {
        case 'SCAN_START':
          await performScan(message.options);
          sendResponse({ ok: true });
          break;

        case 'TRASH_EMAILS':
          await performTrash(message.ids);
          sendResponse({ ok: true });
          break;

        case 'UNSUBSCRIBE':
          await performUnsubscribe(message.messageId);
          sendResponse({ ok: true });
          break;

        case 'AUTH_REQUEST':
          await performSignIn();
          sendResponse({ ok: true });
          break;

        case 'AUTH_SIGN_OUT':
          await performSignOut();
          sendResponse({ ok: true });
          break;

        case 'GET_AUTH_STATUS': {
          // Return auth state directly in the response so the popup gets it
          // even if it was closed during OAuth and has just reopened.
          const payload = await getAuthStatusPayload();
          sendResponse({ ok: true, data: payload });
          break;
        }

        case 'OPEN_DASHBOARD':
          chrome.tabs.create({
            url: chrome.runtime.getURL('src/pages/dashboard/index.html'),
          });
          sendResponse({ ok: true });
          break;

        default:
          assertNever(message);
      }
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();

  return true;
}
