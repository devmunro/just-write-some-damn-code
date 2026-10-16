import { describe, expect, it } from 'vitest';
import { buildChallengePrompt, buildFeedbackPrompt, normalizeChallenge } from '$lib/ai/prompts';
import type { ChallengeSeed } from '$lib/domain/types';

const seed: ChallengeSeed = {
  title: 'Audit log platform',
  scenario: 'Design a reliable audit log for enterprise product events.',
  concepts: ['immutability', 'query patterns'],
  difficulty: 'Intermediate'
};

describe('prompt construction', () => {
  it('tells challenge generation not to provide solutions or generic tutorial projects', () => {
    const prompt = buildChallengePrompt('System Design', ['# Previous Challenge'], { seed })
      .map((message) => message.content)
      .join('\n');

    expect(prompt).toContain('do not provide solutions');
    expect(prompt).toContain('todo apps');
    expect(prompt).toContain('weather apps');
    expect(prompt).toContain('calculators');
    expect(prompt).toContain('"requirements"');
  });

  it('requires evidence-based feedback and forbids guessing', () => {
    const challenge = normalizeChallenge({ title: 'Build a thing' });
    const prompt = buildFeedbackPrompt(challenge, 'My submission')
      .map((message) => message.content)
      .join('\n');

    expect(prompt).toContain('Only make claims that are directly supported by the submission text.');
    expect(prompt).toContain('tie it to evidence from the submission');
    expect(prompt).toContain('"strengths"');
    expect(prompt).toContain('"weaknesses"');
    expect(prompt).toContain('"suggestions"');
    expect(prompt).toContain('"followUpQuestions"');
  });
});
