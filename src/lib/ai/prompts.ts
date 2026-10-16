import { chooseSeed } from '$lib/challenges/seeds';
import type {
  Challenge,
  ChallengeSeed,
  DsaSubcategory,
  Feedback,
  OllamaSettings,
  PracticeCategory
} from '$lib/domain/types';

type OllamaMessage = {
  role: 'system' | 'user';
  content: string;
};

/**
 * Builds the challenge-generation contract sent to the model.
 *
 * The guardrails are intentionally explicit: this app is a practice gym, so
 * model output should frame work without doing that work for the user.
 */
export function buildChallengePrompt(
  category: PracticeCategory,
  recentChallengeText: string[],
  options: {
    seed?: ChallengeSeed;
    dsaSubcategory?: DsaSubcategory;
  } = {}
): OllamaMessage[] {
  const seed = options.seed ?? chooseSeed(category, recentChallengeText, { dsaSubcategory: options.dsaSubcategory });
  const recent = recentChallengeText.length
    ? recentChallengeText.map((text, index) => `${index + 1}. ${text}`).join('\n\n')
    : 'No recent challenges yet.';

  return [
    {
      role: 'system',
      content:
        'You create deliberate software practice challenges. You do not provide solutions, implementation steps, starter code, or answer keys. Return strict JSON only.'
    },
    {
      role: 'user',
      content: `Create one realistic engineering practice challenge.

Category: ${category}
${seed.subcategory ? `DSA subtype: ${seed.subcategory}` : ''}
Seed title: ${seed.title}
Seed scenario: ${seed.scenario}
Concepts to practice: ${seed.concepts.join(', ')}
Difficulty: ${seed.difficulty}

Recent challenge history to avoid repeating:
${recent}

Avoid generic tutorial projects, especially todo apps, weather apps, and calculators, unless explicitly requested by the user.

Return JSON with this exact shape:
{
  "title": "short title",
  "description": "one or two paragraphs",
  "requirements": ["clear requirement"],
  "constraints": ["realistic constraint"],
  "stretchGoals": ["optional stretch goal"]
}`
    }
  ];
}

/**
 * Builds the feedback contract. The model can be direct and useful, but it must
 * leave the next implementation move to the developer.
 */
export function buildFeedbackPrompt(challenge: Challenge, submission: string): OllamaMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You review developer practice submissions.',
        'Only make claims that are directly supported by the submission text.',
        'Do not infer completed work, architecture quality, correctness, robustness, or trade-offs unless the submission clearly shows them.',
        'If the submission is too small, vague, or mostly placeholder text, say so plainly in the weaknesses and suggestions.',
        'Never write a complete solution, replacement implementation, or full answer key.',
        'Return strict JSON only.'
      ].join(' ')
    },
    {
      role: 'user',
      content: `Review this practice submission.

Challenge:
${formatChallengeForPrompt(challenge)}

Submission:
${submission}

Return JSON with this exact shape:
{
  "strengths": ["what was done well"],
  "weaknesses": ["what could be improved"],
  "suggestions": ["specific improvement to try next"],
  "followUpQuestions": ["question that encourages deeper thinking"]
}

For every item you produce, tie it to evidence from the submission.
If the submission does not contain enough information to judge a category, say that directly instead of guessing.
Do not provide a complete solution. If the submission is incomplete, focus on feedback and next thinking steps.`
    }
  ];
}

export function formatChallengeForPrompt(challenge: Challenge): string {
  return [
    `Title: ${challenge.title}`,
    `Description: ${challenge.description}`,
    `Requirements: ${challenge.requirements.join('; ')}`,
    `Constraints: ${challenge.constraints.join('; ')}`,
    `Stretch goals: ${challenge.stretchGoals.join('; ')}`
  ].join('\n');
}

export function challengeToHistoryText(challenge: Challenge): string {
  return [
    `# ${challenge.title}`,
    '',
    challenge.description,
    '',
    'Requirements:',
    ...challenge.requirements.map((item) => `- ${item}`),
    '',
    'Constraints:',
    ...challenge.constraints.map((item) => `- ${item}`),
    '',
    'Stretch goals:',
    ...challenge.stretchGoals.map((item) => `- ${item}`)
  ].join('\n');
}

export function validateSettings(settings: OllamaSettings): string | null {
  if (!settings.baseUrl.trim()) return 'Add an Ollama base URL first.';
  if (!settings.model.trim()) return 'Add an Ollama model first.';
  return null;
}

export function normalizeChallenge(value: Partial<Challenge>): Challenge {
  return {
    title: coerceText(value.title, 'Untitled practice challenge'),
    description: coerceText(value.description, 'Practice the requested category with realistic constraints.'),
    requirements: coerceList(value.requirements, ['Define the intended behavior clearly.']),
    constraints: coerceList(value.constraints, ['Do not ask AI to solve the challenge for you.']),
    stretchGoals: coerceList(value.stretchGoals, ['Explain the trade-offs in your approach.'])
  };
}

export function normalizeFeedback(value: Partial<Feedback>): Feedback {
  return {
    strengths: coerceList(value.strengths, ['You submitted work for review.']),
    weaknesses: coerceList(value.weaknesses, ['The review could not identify detailed weaknesses.']),
    suggestions: coerceList(value.suggestions, ['Try clarifying assumptions and edge cases.']),
    followUpQuestions: coerceList(value.followUpQuestions, ['What trade-off did you intentionally choose?'])
  };
}

function coerceText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function coerceList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length ? items.map((item) => item.trim()) : fallback;
}
