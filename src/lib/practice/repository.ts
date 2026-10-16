import Database from '@tauri-apps/plugin-sql';
import type { EditorPreferencesByLanguage, ExerciseStatus, OllamaSettings, PracticeLanguage } from '$lib/domain/types';
import { isTauriRuntime } from '$lib/platform/tauri';

const DB_URL = 'sqlite:practice.db';
const PREFIX = 'jwsdc.practice.';
let dbPromise: Promise<Database> | undefined;

const defaultSettings: OllamaSettings = { baseUrl: 'http://localhost:11434', model: '' };
const languageDefaults = (): EditorPreferencesByLanguage => ({
  python: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true },
  javascript: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true },
  typescript: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true },
  php: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true }
});

export async function loadDraft(exerciseId: string, language: PracticeLanguage): Promise<string> {
  if (!isTauriRuntime()) return localStorageGet(`draft:${exerciseId}:${language}`) ?? '';
  const db = await getDb();
  const rows = await db.select<Array<{ source: string }>>(
    'SELECT source FROM exercise_drafts WHERE exercise_id = $1 AND language = $2', [exerciseId, language]
  );
  return rows[0]?.source ?? '';
}

export async function saveDraft(exerciseId: string, language: PracticeLanguage, source: string): Promise<void> {
  const updatedAt = new Date().toISOString();
  if (!isTauriRuntime()) {
    localStorageSet(`draft:${exerciseId}:${language}`, source);
    return;
  }
  const db = await getDb();
  await db.execute(`INSERT INTO exercise_drafts (exercise_id, language, source, updated_at)
    VALUES ($1, $2, $3, $4) ON CONFLICT(exercise_id, language) DO UPDATE SET source = excluded.source, updated_at = excluded.updated_at`,
    [exerciseId, language, source, updatedAt]);
}

export async function loadProgress(): Promise<Record<string, ExerciseStatus>> {
  if (!isTauriRuntime()) {
    try { return JSON.parse(localStorageGet('progress') ?? '{}') as Record<string, ExerciseStatus>; } catch { return {}; }
  }
  const rows = await (await getDb()).select<Array<{ exercise_id: string; status: ExerciseStatus }>>(
    'SELECT exercise_id, status FROM exercise_progress'
  );
  return Object.fromEntries(rows.map((row) => [row.exercise_id, row.status]));
}

export async function saveProgress(exerciseId: string, status: ExerciseStatus): Promise<void> {
  const updatedAt = new Date().toISOString();
  if (!isTauriRuntime()) {
    const progress = await loadProgress(); progress[exerciseId] = status; localStorageSet('progress', JSON.stringify(progress)); return;
  }
  await (await getDb()).execute(`INSERT INTO exercise_progress (exercise_id, status, updated_at)
    VALUES ($1, $2, $3) ON CONFLICT(exercise_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
    [exerciseId, status, updatedAt]);
}

export async function loadOllamaSettings(): Promise<OllamaSettings> {
  if (isTauriRuntime()) {
    const rows = await (await getDb()).select<Array<{ value: string }>>(
      'SELECT value FROM app_settings WHERE key = $1', ['ollama']
    );
    if (rows[0]) return normalizeSettings(parseSettings(rows[0].value));
  } else {
    const saved = localStorageGet('settings');
    if (saved) return normalizeSettings(parseSettings(saved));
  }

  // Migrate prototype localStorage settings. Any Gemini key/provider is dropped.
  let legacy: Record<string, unknown> = {};
  try { legacy = JSON.parse(localStorageGet('jwsdc.ollama-settings') ?? '{}') as Record<string, unknown>; } catch { /* use defaults */ }
  const migrated: OllamaSettings = {
    baseUrl: legacy.provider === 'ollama' && typeof legacy.baseUrl === 'string' ? legacy.baseUrl : defaultSettings.baseUrl,
    model: legacy.provider === 'ollama' && typeof legacy.model === 'string' ? legacy.model : ''
  };
  await saveOllamaSettings(migrated);
  try { localStorage.removeItem('jwsdc.ollama-settings'); } catch { /* storage can be unavailable */ }
  return migrated;
}

export async function saveOllamaSettings(settings: OllamaSettings): Promise<void> {
  const normalized = normalizeSettings(settings);
  if (!isTauriRuntime()) { localStorageSet('settings', JSON.stringify(normalized)); return; }
  await (await getDb()).execute(`INSERT INTO app_settings (key, value) VALUES ($1, $2)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, ['ollama', JSON.stringify(normalized)]);
}

export async function loadEditorPreferences(): Promise<EditorPreferencesByLanguage> {
  const defaults = languageDefaults();
  let saved: Partial<EditorPreferencesByLanguage> = {};
  if (isTauriRuntime()) {
    const rows = await (await getDb()).select<Array<{ value: string }>>(
      'SELECT value FROM app_settings WHERE key = $1', ['editor-preferences']
    );
    try { saved = rows[0] ? JSON.parse(rows[0].value) as Partial<EditorPreferencesByLanguage> : {}; } catch { /* defaults */ }
  } else {
    try { saved = JSON.parse(localStorageGet('editor-preferences') ?? '{}') as Partial<EditorPreferencesByLanguage>; } catch { /* defaults */ }
  }
  return Object.fromEntries(Object.entries(defaults).map(([language, base]) => [language, { ...base, ...saved[language as PracticeLanguage] }])) as EditorPreferencesByLanguage;
}

export async function saveEditorPreferences(preferences: EditorPreferencesByLanguage): Promise<void> {
  const value = JSON.stringify(preferences);
  if (!isTauriRuntime()) { localStorageSet('editor-preferences', value); return; }
  await (await getDb()).execute(`INSERT INTO app_settings (key, value) VALUES ($1, $2)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, ['editor-preferences', value]);
}

export function isLocalOllamaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(host) && !url.username && !url.password;
  } catch { return false; }
}

function normalizeSettings(value: Partial<OllamaSettings>): OllamaSettings {
  const baseUrl = typeof value.baseUrl === 'string' && isLocalOllamaUrl(value.baseUrl) ? value.baseUrl.replace(/\/$/, '') : defaultSettings.baseUrl;
  return { baseUrl, model: typeof value.model === 'string' ? value.model.trim() : '' };
}
function parseSettings(value: string): Partial<OllamaSettings> { try { return JSON.parse(value) as Partial<OllamaSettings>; } catch { return {}; } }
function localStorageGet(key: string): string | null { try { return localStorage.getItem(`${PREFIX}${key}`); } catch { return null; } }
function localStorageSet(key: string, value: string): void { try { localStorage.setItem(`${PREFIX}${key}`, value); } catch { /* storage unavailable */ } }

async function getDb(): Promise<Database> {
  dbPromise ??= (async () => {
    const db = await Database.load(DB_URL);
    await db.execute('CREATE TABLE IF NOT EXISTS exercise_progress (exercise_id TEXT PRIMARY KEY, status TEXT NOT NULL, updated_at TEXT NOT NULL)');
    await db.execute('CREATE TABLE IF NOT EXISTS exercise_drafts (exercise_id TEXT NOT NULL, language TEXT NOT NULL, source TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (exercise_id, language))');
    await db.execute('CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    return db;
  })();
  return dbPromise;
}
