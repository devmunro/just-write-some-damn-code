import { invoke } from '@tauri-apps/api/core';
import {
  buildChallengePrompt,
  buildFeedbackPrompt,
  normalizeChallenge,
  normalizeFeedback,
  validateSettings
} from '$lib/ai/prompts';
import type { Challenge, DsaSubcategory, Feedback, OllamaSettings, PracticeCategory } from '$lib/domain/types';
import { isTauriRuntime } from '$lib/platform/tauri';

type OllamaMessage = {
  role: 'system' | 'user';
  content: string;
};

export async function generateChallenge(
  category: PracticeCategory,
  recentHistory: string[],
  settings: OllamaSettings,
  dsaSubcategory?: DsaSubcategory
): Promise<Challenge> {
  const settingsError = validateSettings(settings);
  if (settingsError) throw new Error(settingsError);

  const content = await runOllama(
    settings,
    buildChallengePrompt(category, recentHistory, { dsaSubcategory })
  );
  return normalizeChallenge(parseJson(content));
}

export async function reviewSubmission(
  challenge: Challenge,
  submission: string,
  settings: OllamaSettings
): Promise<Feedback> {
  const settingsError = validateSettings(settings);
  if (settingsError) throw new Error(settingsError);
  if (!isSubstantiveSubmission(submission)) {
    throw new Error('Please submit real work before requesting feedback.');
  }

  const content = await runOllama(settings, buildFeedbackPrompt(challenge, submission));
  return normalizeFeedback(parseJson(content));
}

async function runOllama(settings: OllamaSettings, messages: OllamaMessage[]): Promise<string> {
  if (settings.provider === 'gemini') {
    return runGemini(settings, messages);
  }

  if (isTauriRuntime()) {
    return invoke<string>('ollama_chat', {
      baseUrl: settings.baseUrl,
      model: settings.model,
      messages
    });
  }

  const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      stream: false,
      format: 'json'
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content ?? '';
}

async function runGemini(settings: OllamaSettings, messages: OllamaMessage[]): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new Error('Add a Gemini API key first.');
  }

  const response = await fetch(
    `${settings.baseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.apiKey.trim()
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: messages.find((message) => message.role === 'system')?.content ?? '' }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  messages
                    .filter((message) => message.role === 'user')
                    .map((message) => message.content)
                    .join('\n\n') || ''
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return (
    data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ??
    ''
  );
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  const json = start >= 0 && end >= start ? unfenced.slice(start, end + 1) : unfenced;
  return JSON.parse(json) as Record<string, unknown>;
}

function isSubstantiveSubmission(submission: string): boolean {
  const text = submission.trim();
  if (text.length < 12) return false;
  const alphaNumericCount = (text.match(/[a-z0-9]/gi) ?? []).length;
  if (alphaNumericCount < 6) return false;
  if (text === '#' || text === '##' || text === '###') return false;
  return true;
}
