export const DSA_TOPICS = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Stacks & Queues',
  'Linked Lists',
  'Trees & Tries',
  'Heaps',
  'Graphs',
  'Backtracking',
  'Dynamic Programming',
  'Greedy',
  'Intervals',
  'Bit Manipulation',
  'Math & Geometry'
] as const;

export type DsaTopic = (typeof DSA_TOPICS)[number];
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type PracticeLanguage = 'python' | 'javascript' | 'typescript' | 'php';
export type ExerciseKind = 'dsa' | 'build';
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type ExampleCase = {
  id: string;
  label: string;
  input: Record<string, JsonValue>;
  expectedOutput: JsonValue;
  hidden?: boolean;
};

export type Exercise = {
  id: string;
  kind: ExerciseKind;
  topic: DsaTopic | 'Single-file builds';
  title: string;
  difficulty: Difficulty;
  parameters: string[];
  tags: string[];
  prompt: string;
  constraints: string[];
  examples: ExampleCase[];
  hiddenCases: ExampleCase[];
  estimatedMinutes: number;
};

export type RunRequest = {
  exerciseId: string;
  language: PracticeLanguage;
  source: string;
  parameters: string[];
  cases: ExampleCase[];
};

export type RunCaseResult = {
  id: string;
  label: string;
  passed: boolean;
  hidden: boolean;
  runtimeError: boolean;
  actualOutput?: JsonValue;
  error?: string;
};

export type RunResult = {
  status: 'success' | 'incorrect_answer' | 'runtime_error' | 'timeout';
  cases: RunCaseResult[];
  stderr: string;
  durationMs: number;
  message?: string;
};

export type EditorPreferences = {
  autoIndent: boolean;
  autoCloseBrackets: boolean;
  autoCloseQuotes: boolean;
};

export type EditorPreferencesByLanguage = Record<PracticeLanguage, EditorPreferences>;

export type GeneratedVariant = Exercise & {
  generatedBy: 'ollama';
  generatedAt: string;
  sourceExerciseId: string;
};

export type OllamaSettings = {
  baseUrl: string;
  model: string;
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

export type PassedExerciseHistoryItem = {
  exerciseId: string;
  title: string;
  language: PracticeLanguage;
  passedAt: string;
};

