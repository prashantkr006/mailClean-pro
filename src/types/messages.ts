import type { ScanOptions, ScanSummary, UserProfile, EmailSummary } from './domain';

/** Messages sent FROM the UI TO the background service worker */
export type UIMessage =
  | { type: 'SCAN_START'; options: ScanOptions }
  | { type: 'TRASH_EMAILS'; ids: string[] }
  | { type: 'UNSUBSCRIBE'; messageId: string }
  | { type: 'AUTH_REQUEST' }
  | { type: 'AUTH_SIGN_OUT' }
  | { type: 'GET_AUTH_STATUS' }
  | { type: 'OPEN_DASHBOARD' };

/** Messages sent FROM the background service worker TO the UI */
export type BGMessage =
  | { type: 'SCAN_PROGRESS'; scanned: number; total: number; phase: string }
  | { type: 'SCAN_UPDATE'; summary: ScanSummary; emails: EmailSummary[] }
  | { type: 'SCAN_COMPLETE'; summary: ScanSummary; emails: EmailSummary[] }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'TRASH_PROGRESS'; trashed: number; total: number }
  | { type: 'TRASH_COMPLETE'; count: number }
  | { type: 'TRASH_ERROR'; message: string }
  | { type: 'UNSUBSCRIBE_COMPLETE'; messageId: string }
  | { type: 'UNSUBSCRIBE_ERROR'; messageId: string; message: string }
  | { type: 'AUTH_STATUS'; signedIn: boolean; user?: UserProfile };

/** Union of all messages (for shared listener typings) */
export type Message = UIMessage | BGMessage;

export type MessageType = Message['type'];

export interface MessageResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function assertNever(x: never): never {
  throw new Error(`Unhandled message type: ${JSON.stringify(x)}`);
}
