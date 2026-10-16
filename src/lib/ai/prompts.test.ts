import { describe, expect, it } from 'vitest';
import { buildExerciseFeedbackPrompt, buildVariantPrompt, normalizeGeneratedVariant, validateSettings } from '$lib/ai/prompts';
import { DSA_EXERCISES } from '$lib/practice/catalog';
import type { Exercise } from '$lib/domain/types';

const exercise = DSA_EXERCISES[0] as Exercise;

describe('local AI contracts', () => {
  it('asks for a fresh exercise without implementation or answer material', () => {
    const prompt = buildVariantPrompt(exercise).map((message) => message.content).join('\n');
    expect(prompt).toContain('Do not give a solution');
    expect(prompt).toContain('Do not quote or reproduce an external problem statement');
    expect(prompt).toContain('expectedOutput');
  });

  it('keeps review qualitative and forbids scores or solutions', () => {
    const prompt = buildExerciseFeedbackPrompt(exercise, 'function solve(input) { return input; }').map((message) => message.content).join('\n');
    expect(prompt).toContain('Do not assign a numerical score or grade');
    expect(prompt).toContain('Never write a solution');
  });

  it('normalizes valid examples and labels variants as local AI output', () => {
    const variant = normalizeGeneratedVariant({
      title: 'Fresh records', prompt: 'Return the unique records.', tags: ['arrays'], constraints: ['Keep order.'],
      examples: [
        { label: 'Example 1', input: { values: [1, 1] }, expectedOutput: [1] },
        { label: 'Example 2', input: { values: [] }, expectedOutput: [] }
      ]
    }, exercise);
    expect(variant.generatedBy).toBe('ollama');
    expect(variant.sourceExerciseId).toBe(exercise.id);
    expect(variant.examples).toHaveLength(2);
  });

  it('rejects generated solution fields and malformed examples', () => {
    expect(() => normalizeGeneratedVariant({ solution: 'secret', title: 'x' }, exercise)).toThrow(/solution material/i);
    expect(() => normalizeGeneratedVariant({ title: 'x', prompt: 'x', tags: ['a'], constraints: ['b'], examples: [{ input: {}, expectedOutput: {} }] }, exercise)).toThrow(/two or three examples/i);
  });

  it('accepts only loopback Ollama endpoints', () => {
    expect(validateSettings({ baseUrl: 'http://localhost:11434', model: 'llama3.1' })).toBeNull();
    expect(validateSettings({ baseUrl: 'https://api.example.com', model: 'llama3.1' })).toMatch(/local HTTP/i);
    expect(validateSettings({ baseUrl: 'http://192.168.1.20:11434', model: 'llama3.1' })).toMatch(/local HTTP/i);
  });
});
