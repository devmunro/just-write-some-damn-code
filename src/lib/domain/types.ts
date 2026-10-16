/**
 * Shared domain contracts for the practice loop.
 *
 * These types intentionally avoid provider-specific fields so the UI can stay
 * stable when another AI provider is added after the Ollama MVP.
 */
export const PRACTICE_CATEGORIES = [
  'Build',
  'LeetCode / DSA',
  'Frontend',
  'Backend',
  'Debugging',
  'Refactoring',
  'System Design',
  'Architecture',
  'Database Design',
  'Security',
  'Technical Interview Practice'
] as const;

export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number];

export const DSA_SUBCATEGORIES = [
  'Arrays & Strings',
  'Hash Maps',
  'Two Pointers',
  'Sliding Window',
  'Stack & Queue',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Heaps',
  'Dynamic Programming',
  'Backtracking',
  'Intervals',
  'Greedy'
] as const;

export type DsaSubcategory = (typeof DSA_SUBCATEGORIES)[number];

export type Challenge = {
  title: string;
  description: string;
  requirements: string[];
  constraints: string[];
  stretchGoals: string[];
};

export type Feedback = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  followUpQuestions: string[];
};

export type ChallengeHistoryItem = {
  id: string;
  challengeText: string;
  createdAt: string;
};

export type OllamaSettings = {
  provider: 'ollama' | 'gemini';
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type AIProvider = OllamaSettings['provider'];

export type ChallengeSeed = {
  title: string;
  scenario: string;
  concepts: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  subcategory?: DsaSubcategory;
};
