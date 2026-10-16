import { describe, expect, it } from 'vitest';
import { ALL_EXERCISES, BUILD_EXERCISES, DSA_EXERCISES, topicsWithCounts } from '$lib/practice/catalog';
import { DSA_TOPICS } from '$lib/domain/types';

describe('original practice catalog', () => {
  it('contains 250 unique DSA exercises with the requested difficulty progression', () => {
    expect(DSA_EXERCISES).toHaveLength(250);
    expect(new Set(DSA_EXERCISES.map((exercise) => exercise.id)).size).toBe(250);
    expect(new Set(DSA_EXERCISES.map((exercise) => exercise.title.toLowerCase())).size).toBe(250);
    expect(DSA_EXERCISES.filter((exercise) => exercise.difficulty === 'Beginner')).toHaveLength(75);
    expect(DSA_EXERCISES.filter((exercise) => exercise.difficulty === 'Intermediate')).toHaveLength(125);
    expect(DSA_EXERCISES.filter((exercise) => exercise.difficulty === 'Advanced')).toHaveLength(50);
  });

  it('covers every planned topic and includes multiple JSON examples per exercise', () => {
    expect(topicsWithCounts().map(({ topic }) => topic)).toEqual([...DSA_TOPICS]);
    expect(topicsWithCounts().every(({ count }) => count > 0)).toBe(true);
    for (const exercise of DSA_EXERCISES) {
      expect(exercise.examples.length).toBeGreaterThanOrEqual(2);
      for (const example of exercise.examples) {
        expect(() => JSON.stringify(example.input)).not.toThrow();
        expect(() => JSON.stringify(example.expectedOutput)).not.toThrow();
      }
    }
  });

  it('contains 12 original single-file build tasks with the same run contract', () => {
    expect(BUILD_EXERCISES).toHaveLength(12);
    expect(new Set(BUILD_EXERCISES.map((exercise) => exercise.id)).size).toBe(12);
    expect(new Set(BUILD_EXERCISES.map((exercise) => exercise.title.toLowerCase())).size).toBe(12);
    expect(ALL_EXERCISES).toHaveLength(262);
    expect(BUILD_EXERCISES.every((exercise) => exercise.prompt.includes('solve(input) -> JSON') && exercise.examples.length >= 2)).toBe(true);
  });
});
