import type { AIProvider } from '$lib/domain/types';

export type ProviderModelOption = {
  value: string;
  label: string;
  provider: AIProvider;
  note?: string;
};

export const providerOptions: Array<{ value: AIProvider; label: string; description: string }> = [
  { value: 'ollama', label: 'Ollama', description: 'Local-first models on your machine.' },
  { value: 'gemini', label: 'Google Gemini', description: 'Google AI Studio / Gemini API.' }
];

export const modelOptions: Record<AIProvider, ProviderModelOption[]> = {
  ollama: [
    { value: 'llama3.1', label: 'llama3.1', provider: 'ollama' },
    { value: 'llama3.2', label: 'llama3.2', provider: 'ollama' },
    { value: 'qwen2.5', label: 'qwen2.5', provider: 'ollama' }
  ],
  gemini: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'gemini' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', provider: 'gemini' },
    { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', provider: 'gemini' },
    {
      value: 'antigravity-preview-05-2026',
      label: 'Antigravity Agent Preview',
      provider: 'gemini',
      note: 'Managed agent preview; not ideal for JSON-shaped practice feedback yet.'
    }
  ]
};

export function modelsForProvider(provider: AIProvider): ProviderModelOption[] {
  return modelOptions[provider];
}
