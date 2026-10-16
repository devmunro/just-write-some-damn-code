import { describe, expect, it } from 'vitest';
import { createHistoryRecord } from '$lib/history/record';
import type { Challenge } from '$lib/domain/types';

const challenge: Challenge = {
  title: 'Rate-limited invite service',
  description: 'Implement an invite API with abuse prevention.',
  requirements: ['Accept invite requests'],
  constraints: ['No duplicate invites'],
  stretchGoals: ['Explain rate-limit trade-offs']
};

describe('history records', () => {
  it('stores only challenge text and date-oriented fields', () => {
    const record = createHistoryRecord(challenge, new Date('2026-06-24T12:00:00.000Z'), () => 'id-1');

    expect(record).toEqual({
      id: 'id-1',
      challenge_text: expect.stringContaining('Rate-limited invite service'),
      created_at: '2026-06-24T12:00:00.000Z'
    });
    expect(Object.keys(record).sort()).toEqual(['challenge_text', 'created_at', 'id']);
  });
});
