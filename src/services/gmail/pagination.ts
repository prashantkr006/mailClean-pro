import type { GmailMessageRef, Result } from '@/types/gmail';
import type { ScanOptions } from '@/types/domain';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';
const PAGE_SIZE = 500;

export interface ListMessagesOptions extends ScanOptions {
  token: string;
  onPage?: (refs: GmailMessageRef[], total: number) => void;
}

export async function* paginateMessages(
  options: ListMessagesOptions,
): AsyncGenerator<Result<GmailMessageRef[]>> {
  const { token, labelIds, query, maxMessages, onPage } = options;
  let pageToken: string | undefined;
  let fetched = 0;

  do {
    const params = new URLSearchParams();
    params.set('maxResults', String(Math.min(PAGE_SIZE, maxMessages ? maxMessages - fetched : PAGE_SIZE)));
    if (labelIds?.length) {
      for (const id of labelIds) params.append('labelIds', id);
    }
    if (query) params.set('q', query);
    if (pageToken) params.set('pageToken', pageToken);

    const url = `${GMAIL_API}/users/me/messages?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      yield { ok: false, error: { code: 'Network', message: 'Network error listing messages' } };
      return;
    }

    if (!response.ok) {
      const errorCode = response.status === 401 ? 'AuthExpired' : response.status === 429 ? 'RateLimited' : 'Unknown';
      yield {
        ok: false,
        error: {
          code: errorCode,
          message: `Gmail API error: ${response.status}`,
          status: response.status,
          ...(errorCode === 'RateLimited' && response.status === 429 && {
            retryAfter: parseInt(response.headers.get('Retry-After') ?? '5', 10),
          }),
        },
      };
      return;
    }

    const data = await response.json() as {
      messages?: GmailMessageRef[];
      nextPageToken?: string;
      resultSizeEstimate?: number;
    };

    const messages = data.messages ?? [];
    pageToken = data.nextPageToken;
    fetched += messages.length;

    onPage?.(messages, data.resultSizeEstimate ?? fetched);

    yield { ok: true, value: messages };

    if (maxMessages && fetched >= maxMessages) break;
  } while (pageToken);
}
