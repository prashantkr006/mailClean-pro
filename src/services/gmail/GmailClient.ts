import type {
  GmailMessage,
  GmailBatchModifyRequest,
  Result,
  GmailError,
} from '@/types/gmail';
import { ok, err } from '@/types/gmail';
import { globalRateLimiter } from '@/utils/rateLimiter';
import { withBackoff, parseRetryAfter } from '@/utils/backoff';
import { getAuthToken, removeCachedToken } from '@/services/auth/authService';
import { getSessionToken, setSessionToken } from '@/services/auth/session';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';
const BATCH_API = 'https://gmail.googleapis.com/batch/gmail/v1';
const BATCH_SIZE = 100;
const TRASH_BATCH_SIZE = 1000;
const METADATA_HEADERS = ['From', 'Subject', 'Date', 'List-Unsubscribe', 'List-Unsubscribe-Post'];

function classifyHttpError(status: number, retryAfter?: string | null): GmailError {
  if (status === 401) return { code: 'AuthExpired', message: 'Authentication expired', status };
  if (status === 404) return { code: 'NotFound', message: 'Message not found', status };
  if (status === 429) {
    const retryAfterMs = parseRetryAfter(retryAfter ?? null);
    return {
      code: 'RateLimited',
      message: 'Rate limit exceeded',
      status,
      ...(retryAfterMs && { retryAfter: retryAfterMs }),
    };
  }
  if (status === 403) return { code: 'RateLimited', message: 'Quota exceeded', status };
  return { code: 'Unknown', message: `HTTP ${status}`, status };
}

export class GmailClient {
  private token: string | null = null;
  private retrying = false;

  async getToken(): Promise<Result<string>> {
    if (this.token) return ok(this.token);

    // Try session storage first (fast path, populated on sign-in)
    const stored = await getSessionToken();
    if (stored) {
      this.token = stored;
      return ok(stored);
    }

    // Session storage was cleared when the service worker was killed.
    // Chrome's identity system has its own persistent OAuth cache — use it.
    const identityResult = await getAuthToken(false);
    if (identityResult.ok) {
      this.token = identityResult.value;
      await setSessionToken(identityResult.value); // re-warm session for this SW lifetime
      return ok(identityResult.value);
    }

    return err({ code: 'AuthExpired', message: 'No auth token available — please sign in again.' });
  }

  private async handleTokenRefresh(): Promise<Result<string>> {
    if (this.retrying) {
      return err({ code: 'AuthExpired', message: 'Token refresh already attempted' });
    }
    this.retrying = true;
    if (this.token) await removeCachedToken(this.token);
    this.token = null;

    const result = await getAuthToken(false);
    if (result.ok) {
      this.token = result.value;
      await setSessionToken(result.value);
    }
    this.retrying = false;
    return result;
  }

  private async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Result<Response>> {
    const tokenResult = await this.getToken();
    if (!tokenResult.ok) return tokenResult;

    return globalRateLimiter.run(async () => {
      return withBackoff(
        async () => {
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${this.token}`,
            },
          });

          if (response.status === 401 && !this.retrying) {
            const refreshResult = await this.handleTokenRefresh();
            if (!refreshResult.ok) {
              return { ok: false as const, error: refreshResult.error };
            }
            const retry = await fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${this.token}`,
              },
            });
            if (!retry.ok) {
              return {
                ok: false as const,
                error: classifyHttpError(retry.status, retry.headers.get('Retry-After')),
              };
            }
            return { ok: true as const, value: retry };
          }

          if (!response.ok) {
            const error = classifyHttpError(response.status, response.headers.get('Retry-After'));
            if (error.code === 'RateLimited') {
              throw { ...error, __isRetryable: true };
            }
            return { ok: false as const, error };
          }

          return { ok: true as const, value: response };
        },
        { maxAttempts: 5 },
        (e) => {
          if (e && typeof e === 'object' && '__isRetryable' in e) {
            const error = e as GmailError & { __isRetryable: boolean; retryAfter?: number };
            return {
              retry: true,
              ...(error.retryAfter && { retryAfterMs: error.retryAfter }),
            };
          }
          return { retry: false };
        },
      );
    });
  }

  async batchGetMessages(
    messageIds: string[],
    onProgress?: (done: number) => void,
  ): Promise<Result<GmailMessage[]>> {
    const allMessages: GmailMessage[] = [];

    for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
      const chunk = messageIds.slice(i, i + BATCH_SIZE);
      const result = await this.batchGetChunk(chunk);
      if (!result.ok) return result;
      allMessages.push(...result.value);
      onProgress?.(Math.min(i + BATCH_SIZE, messageIds.length));
    }

    return ok(allMessages);
  }

  private async batchGetChunk(ids: string[]): Promise<Result<GmailMessage[]>> {
    const boundary = 'batch_boundary_' + Math.random().toString(36).slice(2);

    const parts = ids.map((id) => {
      const metaParams = METADATA_HEADERS.map((h) => `metadataHeaders=${encodeURIComponent(h)}`).join('&');
      return [
        `--${boundary}`,
        'Content-Type: application/http',
        '',
        `GET /gmail/v1/users/me/messages/${id}?format=metadata&${metaParams}`,
        '',
      ].join('\r\n');
    });

    const body = parts.join('\r\n') + `\r\n--${boundary}--`;

    const tokenResult = await this.getToken();
    if (!tokenResult.ok) return tokenResult;

    let response: Response;
    try {
      response = await globalRateLimiter.run(() =>
        fetch(BATCH_API, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': `multipart/mixed; boundary=${boundary}`,
          },
          body,
        }),
      );
    } catch {
      return err({ code: 'Network', message: 'Network error in batch get' });
    }

    if (!response.ok) {
      return err(classifyHttpError(response.status, response.headers.get('Retry-After')));
    }

    const text = await response.text();
    const messages = parseBatchResponse(text);
    return ok(messages);
  }

  async batchTrash(ids: string[]): Promise<Result<void>> {
    for (let i = 0; i < ids.length; i += TRASH_BATCH_SIZE) {
      const chunk = ids.slice(i, i + TRASH_BATCH_SIZE);
      const result = await this.batchModify({
        ids: chunk,
        addLabelIds: ['TRASH'],
      });
      if (!result.ok) return result;
    }
    return ok(undefined);
  }

  async batchModify(request: GmailBatchModifyRequest): Promise<Result<void>> {
    const result = await this.fetchWithAuth(
      `${GMAIL_API}/users/me/messages/batchModify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );

    if (!result.ok) return result;
    return ok(undefined);
  }

  async oneClickUnsubscribe(
    listUnsubscribePostUrl: string,
    postData: string,
  ): Promise<Result<void>> {
    try {
      const response = await fetch(listUnsubscribePostUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: postData,
      });
      if (!response.ok) {
        return err({ code: 'Unknown', message: `Unsubscribe request failed: ${response.status}` });
      }
      return ok(undefined);
    } catch {
      return err({ code: 'Network', message: 'Network error during unsubscribe' });
    }
  }
}

function parseBatchResponse(text: string): GmailMessage[] {
  const messages: GmailMessage[] = [];

  const parts = text.split(/--batch[^\r\n]*/);

  for (const part of parts) {
    if (!part.trim() || part.trim() === '--') continue;

    const bodyStart = part.indexOf('{');
    if (bodyStart === -1) continue;

    const jsonStr = part.slice(bodyStart, part.lastIndexOf('}') + 1);
    if (!jsonStr) continue;

    try {
      const parsed = JSON.parse(jsonStr) as Partial<GmailMessage> & { error?: unknown };
      if (parsed.error) continue;
      if (parsed.id) {
        messages.push(parsed as GmailMessage);
      }
    } catch {
      // skip malformed parts
    }
  }

  return messages;
}

export const gmailClient = new GmailClient();
