export interface GmailMessageListResponse {
  messages?: GmailMessageRef[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailMessageRef {
  id: string;
  threadId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  sizeEstimate: number;
  payload?: GmailMessagePart;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

export interface GmailBatchModifyRequest {
  ids: string[];
  addLabelIds?: string[];
  removeLabelIds?: string[];
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type?: string;
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

export type GmailErrorCode =
  | 'AuthExpired'
  | 'RateLimited'
  | 'Network'
  | 'NotFound'
  | 'Unknown';

export interface GmailError {
  code: GmailErrorCode;
  message: string;
  status?: number;
  retryAfter?: number;
}

export type Result<T, E = GmailError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E = GmailError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export interface BatchGetRequest {
  messageIds: string[];
  metadataHeaders?: string[];
}

export interface GmailBatchResponse {
  messages: GmailMessage[];
  errors: Array<{ id: string; error: GmailError }>;
}
