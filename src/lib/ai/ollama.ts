import { invoke } from '@tauri-apps/api/core';
import type { Exercise, Feedback, GeneratedVariant, OllamaSettings } from '$lib/domain/types';
import { isLocalOllamaUrl } from '$lib/practice/repository';
import { buildExerciseFeedbackPrompt, buildVariantPrompt, normalizeFeedback, normalizeGeneratedVariant, validateSettings, type OllamaMessage } from '$lib/ai/prompts';
import { isTauriRuntime } from '$lib/platform/tauri';

export async function generateExerciseVariant(exercise: Exercise, settings: OllamaSettings): Promise<GeneratedVariant> {
  const invalid = validateSettings(settings);
  if (invalid) throw new Error(invalid);
  const response = await runOllama(settings, buildVariantPrompt(exercise));
  return normalizeGeneratedVariant(parseJson(response), exercise);
}

export async function reviewExerciseSubmission(exercise: Exercise, source: string, settings: OllamaSettings): Promise<Feedback> {
  const invalid = validateSettings(settings);
  if (invalid) throw new Error(invalid);
  if (source.trim().length < 12) throw new Error('Write a little code before asking for feedback.');
  const response = await runOllama(settings, buildExerciseFeedbackPrompt(exercise, source));
  const parsed = parseJson(response);
  if (Object.keys(parsed).some((key) => /score|grade|rating/i.test(key))) throw new Error('Feedback did not follow the no-scores format. Try again.');
  return normalizeFeedback(parsed as Partial<Feedback>);
}

export async function checkOllama(settings: OllamaSettings): Promise<string[]> {
  if (!isLocalOllamaUrl(settings.baseUrl)) throw new Error('Ollama must use a local HTTP address.');
  if (isTauriRuntime()) return invoke<string[]>('ollama_models', { baseUrl: settings.baseUrl });
  const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/api/tags`, { method: 'GET', redirect: 'error' });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}.`);
  const data = await response.json() as { models?: Array<{ name?: string }> };
  return (data.models ?? []).map((model) => model.name).filter((name): name is string => Boolean(name));
}

async function runOllama(settings: OllamaSettings, messages: OllamaMessage[]): Promise<string> {
  if (!isLocalOllamaUrl(settings.baseUrl)) throw new Error('Ollama must use a local HTTP address.');
  if (isTauriRuntime()) return invoke<string>('ollama_chat', { baseUrl: settings.baseUrl, model: settings.model, messages });
  const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: settings.model, messages, stream: false, format: 'json' })
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
  const data = await response.json() as { message?: { content?: string } };
  return data.message?.content ?? '';
}

function parseJson(content: string): Record<string, unknown> {
  if (content.length > 100_000) throw new Error('Ollama response is too large.');
  const text = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  const body = start >= 0 && end >= start ? text.slice(start, end + 1) : text;
  const value: unknown = JSON.parse(body);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ollama returned an invalid JSON object.');
  return value as Record<string, unknown>;
}
