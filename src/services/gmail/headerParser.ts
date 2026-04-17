import type { GmailHeader } from '@/types/gmail';

export function getHeader(headers: GmailHeader[], name: string): string | undefined {
  const lower = name.toLowerCase();
  return headers.find((h) => h.name.toLowerCase() === lower)?.value;
}

export function parseFrom(from: string): { name: string; address: string; domain: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<?([^>]+)>?$/);
  const address = (match?.[2] ?? from).trim().toLowerCase();
  const name = (match?.[1] ?? '').trim() || (address.split('@')[0] ?? '');
  const domain = address.split('@')[1] ?? '';
  return { name, address, domain };
}

export interface UnsubscribeHeaders {
  listUnsubscribe?: string;
  listUnsubscribePost?: string;
}

export function parseUnsubscribeHeaders(headers: GmailHeader[]): UnsubscribeHeaders {
  const listUnsubscribe = getHeader(headers, 'List-Unsubscribe');
  const listUnsubscribePost = getHeader(headers, 'List-Unsubscribe-Post');
  return {
    ...(listUnsubscribe && { listUnsubscribe }),
    ...(listUnsubscribePost && { listUnsubscribePost }),
  };
}

export function extractUnsubscribeUrl(listUnsubscribe: string): {
  httpUrl?: string;
  mailtoUrl?: string;
} {
  const httpMatch = listUnsubscribe.match(/<(https?:\/\/[^>]+)>/);
  const mailtoMatch = listUnsubscribe.match(/<(mailto:[^>]+)>/);
  return {
    ...(httpMatch?.[1] && { httpUrl: httpMatch[1] }),
    ...(mailtoMatch?.[1] && { mailtoUrl: mailtoMatch[1] }),
  };
}
