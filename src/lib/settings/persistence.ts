import type { OllamaSettings } from '$lib/domain/types';

const SETTINGS_KEY = 'jwsdc.ollama-settings';
export const OLLAMA_BASE_URL = 'http://localhost:11434';
export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';

export const defaultSettings: OllamaSettings = {
  provider: (import.meta.env.VITE_AI_PROVIDER as 'ollama' | 'gemini') ?? 'ollama',
  baseUrl: (import.meta.env.VITE_AI_PROVIDER as 'ollama' | 'gemini') === 'gemini'
    ? GEMINI_BASE_URL
    : OLLAMA_BASE_URL,
  apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '',
  model: ''
};

export function loadSettings(): OllamaSettings {
  if (typeof localStorage === 'undefined') return defaultSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<OllamaSettings>) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: OllamaSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
