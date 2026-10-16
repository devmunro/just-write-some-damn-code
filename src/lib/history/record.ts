import { challengeToHistoryText } from '$lib/ai/prompts';
import type { Challenge, ChallengeHistoryItem } from '$lib/domain/types';

export type ChallengeHistoryRow = {
  id: string;
  challenge_text: string;
  created_at: string;
};

/**
 * Converts a challenge into the only persisted practice-history shape.
 *
 * Keep this mapper tiny and explicit: the MVP must not store submissions,
 * feedback, analytics, or weakness data.
 */
export function createHistoryRecord(
  challenge: Challenge,
  now = new Date(),
  idFactory: () => string = crypto.randomUUID
): ChallengeHistoryRow {
  return {
    id: idFactory(),
    challenge_text: challengeToHistoryText(challenge),
    created_at: now.toISOString()
  };
}

export function mapHistoryRow(row: ChallengeHistoryRow): ChallengeHistoryItem {
  return {
    id: row.id,
    challengeText: row.challenge_text,
    createdAt: row.created_at
  };
}
