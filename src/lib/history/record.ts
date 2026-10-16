import type { ChallengeHistoryItem } from '$lib/domain/types';

export type ChallengeHistoryRow = {
  id: string;
  challenge_text: string;
  created_at: string;
};

/** Maps the pre-practice prototype's persisted challenge rows without changing them. */
export function mapHistoryRow(row: ChallengeHistoryRow): ChallengeHistoryItem {
  return { id: row.id, challengeText: row.challenge_text, createdAt: row.created_at };
}
