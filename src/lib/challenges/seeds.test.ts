import { describe, expect, it } from 'vitest';
import { chooseSeed } from '$lib/challenges/seeds';

describe('chooseSeed', () => {
  it('excludes seeds that appear in recent challenge history', () => {
    const seed = chooseSeed('Build', ['# Internal deployment checklist'], { random: () => 0 });

    expect(seed.title).not.toBe('Internal deployment checklist');
  });

  it('falls back to the category seeds when all are recent', () => {
    const seed = chooseSeed(
      'Build',
      ['Internal deployment checklist\nIncident notes workspace\nFeature flag console'],
      { random: () => 0 }
    );

    expect(seed.title).toBe('Internal deployment checklist');
  });
});
