export type Category =
  | 'promotional'
  | 'old_unread'
  | 'bulk_sender'
  | 'inactive_subscription'
  | 'newsletter'
  | 'keep';

export type CleanupBucket = 'recommended' | 'review' | 'keep';

export type AggressivenessLevel = 'conservative' | 'balanced' | 'aggressive';

export interface CategoryInfo {
  id: Category;
  label: string;
  color: string;
  description: string;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  promotional: {
    id: 'promotional',
    label: 'Promotional',
    color: '#c2410c',
    description: 'Sales, discounts, and marketing emails',
  },
  old_unread: {
    id: 'old_unread',
    label: 'Old Unread',
    color: '#1d4ed8',
    description: 'Unread emails older than your threshold',
  },
  bulk_sender: {
    id: 'bulk_sender',
    label: 'Bulk Senders',
    color: '#7c3aed',
    description: 'Senders with high email volume',
  },
  inactive_subscription: {
    id: 'inactive_subscription',
    label: 'Inactive Subscriptions',
    color: '#047857',
    description: 'Subscriptions you never open',
  },
  newsletter: {
    id: 'newsletter',
    label: 'Newsletters',
    color: '#b45309',
    description: 'Newsletters, digests, and notifications',
  },
  keep: {
    id: 'keep',
    label: 'Keep',
    color: '#374151',
    description: 'Emails that should be kept',
  },
};

export interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromName: string;
  fromDomain: string;
  date: number;
  ageDays: number;
  isUnread: boolean;
  sizeEstimate: number;
  categories: Category[];
  cleanupScore: number;
  cleanupBucket: CleanupBucket;
  listUnsubscribeHeader?: string;
  listUnsubscribePostHeader?: string;
  snippet: string;
}

export interface SenderStats {
  domain: string;
  address: string;
  count: number;
  unreadCount: number;
  totalSize: number;
}

export interface ScanSummary {
  totalScanned: number;
  totalFlagged: number;
  categoryCounts: Record<Category, number>;
  storageReclaimableBytes: number;
  topSenders: SenderStats[];
  scanDurationMs: number;
  scanCompletedAt: number;
}

export interface ScanOptions {
  labelIds?: string[];
  query?: string;
  maxMessages?: number;
}

export interface UserProfile {
  email: string;
  name: string;
  pictureUrl?: string;
}

export interface AppSettings {
  oldEmailThresholdDays: 30 | 60 | 90 | 180;
  bulkSenderThreshold: 10 | 20 | 50 | 100;
  autoScanFrequency: 'off' | 'daily' | 'weekly';
  aggressiveness: AggressivenessLevel;
}

export const DEFAULT_SETTINGS: AppSettings = {
  oldEmailThresholdDays: 60,
  bulkSenderThreshold: 20,
  autoScanFrequency: 'off',
  aggressiveness: 'balanced',
};

export const AGGRESSIVENESS_THRESHOLDS: Record<AggressivenessLevel, number> = {
  conservative: 0.65,
  balanced: 0.55,
  aggressive: 0.45,
};

export interface UnsubscribeInfo {
  type: 'rfc8058' | 'mailto' | 'http' | 'none';
  url?: string;
  email?: string;
  postData?: string;
}
