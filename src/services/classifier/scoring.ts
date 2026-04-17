import type { Category, CleanupBucket, AggressivenessLevel } from '@/types/domain';
import { AGGRESSIVENESS_THRESHOLDS } from '@/types/domain';

export interface ScoringInput {
  categories: Category[];
  ageDays: number;
  isUnread: boolean;
  senderFrequency: number;
  neverOpenedFromSender: boolean;
}

export function calculateCleanupScore(input: ScoringInput): number {
  const { categories, ageDays, isUnread, senderFrequency, neverOpenedFromSender } = input;

  const isPromotional = categories.includes('promotional');

  // Normalize factors to [0,1]
  const ageFactor = Math.min(ageDays / 365, 1);
  const unreadFactor = isUnread ? 1 : 0;
  const frequencyFactor = Math.min(senderFrequency / 50, 1);
  const promoFactor = isPromotional ? 1 : 0;
  const neverOpenedFactor = neverOpenedFromSender ? 1 : 0;

  // Weighted sum
  const score =
    0.25 * ageFactor +
    0.20 * unreadFactor +
    0.20 * frequencyFactor +
    0.20 * promoFactor +
    0.15 * neverOpenedFactor;

  return Math.min(score, 1);
}

export function getCleanupBucket(
  score: number,
  aggressiveness: AggressivenessLevel,
): CleanupBucket {
  const threshold = AGGRESSIVENESS_THRESHOLDS[aggressiveness];
  if (score >= threshold) return 'recommended';
  if (score >= threshold - 0.1) return 'review';
  return 'keep';
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return value >= min ? 1 : 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export { type AggressivenessLevel, type CleanupBucket } from '@/types/domain';