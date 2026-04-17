import type { GmailMessage } from '@/types/gmail';
import type { Category } from '@/types/domain';
import { getHeader, parseFrom, parseUnsubscribeHeaders } from '@/services/gmail/headerParser';
import { getAgeDays } from '@/utils/format';

const PROMO_SUBJECT_RE = /\b(sale|discount|offer|promo|coupon|deal|% off|limited time)\b/i;
const NEWSLETTER_SUBJECT_RE = /\b(newsletter|digest|weekly|daily|notification|update|roundup)\b/i;

const KNOWN_ESP_DOMAINS = new Set([
  'mailchimp.com',
  'list-manage.com',
  'sendgrid.net',
  'klaviyo.com',
  'constantcontact.com',
  'campaignmonitor.com',
  'hubspot.com',
  'marketo.com',
  'salesforce.com',
  'exacttarget.com',
  'sailthru.com',
  'braze.com',
  'iterable.com',
  'drip.com',
  'convertkit.com',
  'aweber.com',
  'getresponse.com',
  'mailerlite.com',
  'activecampaign.com',
  'customerio.com',
  'sendinblue.com',
  'brevo.com',
]);

export interface ClassificationInput {
  message: GmailMessage;
  oldEmailThresholdDays: number;
  bulkSenderThreshold: number;
  senderCount: number;
  neverOpened: boolean;
}

export function classifyMessage(input: ClassificationInput): Category[] {
  const { message, oldEmailThresholdDays, bulkSenderThreshold, senderCount, neverOpened } = input;
  const categories: Category[] = [];
  const headers = message.payload?.headers ?? [];

  const labelIds = message.labelIds ?? [];
  const isUnread = labelIds.includes('UNREAD');
  const ageDays = getAgeDays(message.internalDate ?? '0');

  const fromHeader = getHeader(headers, 'From') ?? '';
  const { domain: senderDomain } = parseFrom(fromHeader);
  const subject = getHeader(headers, 'Subject') ?? '';
  const { listUnsubscribe } = parseUnsubscribeHeaders(headers);

  // A. Promotional
  const isPromoLabel = labelIds.includes('CATEGORY_PROMOTIONS');
  const isPromoSubject = PROMO_SUBJECT_RE.test(subject);
  const isKnownESP = KNOWN_ESP_DOMAINS.has(senderDomain);
  if (isPromoLabel || isPromoSubject || (listUnsubscribe && isKnownESP)) {
    categories.push('promotional');
  }

  // B. Old Unread
  if (isUnread && ageDays >= oldEmailThresholdDays) {
    categories.push('old_unread');
  }

  // C. Bulk Sender
  if (senderCount >= bulkSenderThreshold) {
    categories.push('bulk_sender');
  }

  // D. Inactive Subscription
  if (neverOpened && listUnsubscribe) {
    categories.push('inactive_subscription');
  }

  // E. Newsletter
  const isNewsletterSubject = NEWSLETTER_SUBJECT_RE.test(subject);
  if (isNewsletterSubject || (listUnsubscribe && !categories.includes('promotional'))) {
    categories.push('newsletter');
  }

  return categories;
}
