import type { Exercise, Feedback, GeneratedVariant, JsonValue, OllamaSettings } from '$lib/domain/types';
import { isLocalOllamaUrl } from '$lib/practice/repository';

export type OllamaMessage = { role: 'system' | 'user'; content: string };

export function buildVariantPrompt(exercise: Exercise): OllamaMessage[] {
  return [
    { role: 'system', content: 'Create a new original coding exercise variant. Do not give a solution, code, pseudocode, starter implementation, answer key, or hidden solution field. Use strict JSON only.' },
    { role: 'user', content: `Create a variant of this practice exercise. Keep the same underlying concept and JSON solve(input) contract, but use a fresh context and examples. The app will label the result AI-generated.\nBase topic: ${exercise.topic}\nDifficulty: ${exercise.difficulty}\nBase prompt: ${exercise.prompt}\nConstraints: ${exercise.constraints.join('; ')}\nDo not quote or reproduce an external problem statement.\nReturn exactly this shape: {"title":"...","prompt":"...","tags":["..."],"constraints":["..."],"examples":[{"label":"Example 1","input":{},"expectedOutput":{}}]}. Include 2 or 3 valid examples.` }
  ];
}

export function buildExerciseFeedbackPrompt(exercise: Exercise, source: string): OllamaMessage[] {
  return [
    { role: 'system', content: 'Give qualitative, evidence-based coaching on a coding practice submission. Never write a solution, replacement code, pseudocode, or answer key. Do not assign a numerical score or grade. Suggest one useful improvement and an optional next exercise. Return strict JSON only.' },
    { role: 'user', content: `Exercise: ${exercise.title}\nPrompt: ${exercise.prompt}\nSubmission:\n${source.slice(0, 16000)}\n\nReturn {"strengths":[...],"weaknesses":[...],"suggestions":[...],"followUpQuestions":[...]}. Keep each list short and refer only to evidence in the submission.` }
  ];
}

export function validateSettings(settings: OllamaSettings): string | null {
  if (!isLocalOllamaUrl(settings.baseUrl)) return 'Ollama must use a local HTTP address: localhost, 127.0.0.1, or ::1.';
  if (!settings.model.trim()) return 'Set the name of an installed Ollama model in Settings.';
  return null;
}

export function normalizeFeedback(value: Partial<Feedback>): Feedback {
  const list = (entry: unknown, fallback: string[]) => Array.isArray(entry)
    ? entry.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()).slice(0, 5)
    : fallback;
  return {
    strengths: list(value.strengths, ['The review could not identify a specific strength.']),
    weaknesses: list(value.weaknesses, ['The review could not identify a specific weakness.']),
    suggestions: list(value.suggestions, ['Try one focused improvement and run the examples again.']),
    followUpQuestions: list(value.followUpQuestions, ['What input would help you check this behavior?'])
  };
}

export function normalizeGeneratedVariant(value: unknown, base: Exercise): GeneratedVariant {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ollama returned an invalid variant object.');
  const raw = value as Record<string, unknown>;
  if (hasForbiddenAnswerField(raw)) throw new Error('The generated response included solution material. Try again.');
  const title = text(raw.title, 100);
  const prompt = text(raw.prompt, 4000);
  const tags = stringList(raw.tags, 8);
  const constraints = stringList(raw.constraints, 8);
  if (!Array.isArray(raw.examples) || raw.examples.length < 2 || raw.examples.length > 3) throw new Error('The generated variant needs two or three examples.');
  const examples = raw.examples.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`Example ${index + 1} is invalid.`);
    const example = entry as Record<string, unknown>;
    if (!('input' in example) || !('expectedOutput' in example) || !isJsonValue(example.input) || !isJsonValue(example.expectedOutput)) throw new Error(`Example ${index + 1} must contain valid JSON input and output.`);
    return { id: `variant-${index + 1}`, label: typeof example.label === 'string' ? example.label.slice(0, 50) : `Example ${index + 1}`, input: example.input as JsonValue, expectedOutput: example.expectedOutput as JsonValue };
  });
  const id = `variant-${crypto.randomUUID()}`;
  return { id, kind: base.kind, topic: base.topic, title, difficulty: base.difficulty, tags, prompt, constraints, examples, estimatedMinutes: base.estimatedMinutes, generatedBy: 'ollama', generatedAt: new Date().toISOString(), sourceExerciseId: base.id };
}

function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('The generated exercise text is missing or too long.');
  return value.trim();
}
function stringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems || value.some((item) => typeof item !== 'string' || !item.trim() || item.length > 300)) throw new Error('The generated tags or constraints are invalid.');
  return value.map((item) => (item as string).trim());
}
function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 20) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return typeof value !== 'string' || value.length <= 20_000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 2_000 && value.every((entry) => isJsonValue(entry, depth + 1));
  if (typeof value === 'object') return Object.keys(value as object).length <= 200 && Object.entries(value as Record<string, unknown>).every(([key, entry]) => key.length <= 200 && isJsonValue(entry, depth + 1));
  return false;
}
function hasForbiddenAnswerField(value: unknown, depth = 0): boolean {
  if (depth > 20 || !value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((entry) => hasForbiddenAnswerField(entry, depth + 1));
  return Object.entries(value as Record<string, unknown>).some(([key, entry]) => /^(solution|answer|answerkey|startercode|implementation|pseudocode)$/i.test(key.replace(/[^a-z]/gi, '')) || hasForbiddenAnswerField(entry, depth + 1));
}
