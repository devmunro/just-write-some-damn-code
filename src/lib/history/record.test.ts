import { describe, expect, it } from 'vitest';
import { mapHistoryRow } from '$lib/history/record';

describe('legacy challenge history', () => {
  it('keeps existing persisted rows readable without rewriting their content', () => {
    const row = { id: 'old-1', challenge_text: '# Saved challenge\n\nOriginal notes', created_at: '2026-06-24T12:00:00.000Z' };
    expect(mapHistoryRow(row)).toEqual({ id: 'old-1', challengeText: row.challenge_text, createdAt: row.created_at });
  });
});
