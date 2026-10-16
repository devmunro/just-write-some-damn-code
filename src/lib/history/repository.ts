import Database from '@tauri-apps/plugin-sql';
import { mapHistoryRow, type ChallengeHistoryRow } from '$lib/history/record';
import type { ChallengeHistoryItem, PassedExerciseHistoryItem } from '$lib/domain/types';
import { isTauriRuntime } from '$lib/platform/tauri';

const DB_URL = 'sqlite:practice.db';
const BROWSER_HISTORY_KEY = 'jwsdc.browser-history';
const BROWSER_PASSED_KEY = 'jwsdc.practice.passed-exercises';
const PASSED_HISTORY_LIMIT = 100;

let dbPromise: Promise<Database> | null = null;

export async function listChallengeHistory(limit = 20): Promise<ChallengeHistoryItem[]> {
  if (!isTauriRuntime()) {
    return listBrowserHistoryRecords(limit).map(mapHistoryRow);
  }

  const db = await getDb();
  const rows = await db.select<ChallengeHistoryRow[]>(
    'SELECT id, challenge_text, created_at FROM challenge_history ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(mapHistoryRow);
}

export async function listPassedExercises(limit = PASSED_HISTORY_LIMIT): Promise<PassedExerciseHistoryItem[]> {
  if (!isTauriRuntime()) {
    return listBrowserPassedExercises(limit);
  }

  const db = await getDb();
  const rows = await db.select<Array<{ exercise_id: string; title: string; language: PassedExerciseHistoryItem['language']; passed_at: string }>>(
    'SELECT exercise_id, title, language, passed_at FROM passed_exercises ORDER BY passed_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(({ exercise_id, title, language, passed_at }) => ({ exerciseId: exercise_id, title, language, passedAt: passed_at }));
}

/** Stores only that an exercise passed; submitted source code is never written to history. */
export async function recordExercisePassed(item: Omit<PassedExerciseHistoryItem, 'passedAt'>): Promise<void> {
  const passedAt = new Date().toISOString();
  if (!isTauriRuntime()) {
    if (typeof localStorage === 'undefined') return;
    const rows = listBrowserPassedExercises(Number.MAX_SAFE_INTEGER)
      .filter((row) => row.exerciseId !== item.exerciseId);
    rows.unshift({ ...item, passedAt });
    try { localStorage.setItem(BROWSER_PASSED_KEY, JSON.stringify(rows.slice(0, PASSED_HISTORY_LIMIT))); } catch { /* storage can be unavailable */ }
    return;
  }

  const db = await getDb();
  await db.execute(`INSERT INTO passed_exercises (exercise_id, title, language, passed_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(exercise_id) DO UPDATE SET title = excluded.title, language = excluded.language, passed_at = excluded.passed_at`,
    [item.exerciseId, item.title, item.language, passedAt]);
}

async function getDb(): Promise<Database> {
  dbPromise ??= initializeDb();
  return dbPromise;
}

async function initializeDb(): Promise<Database> {
  const db = await Database.load(DB_URL);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS challenge_history (
      id TEXT PRIMARY KEY,
      challenge_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE TABLE IF NOT EXISTS passed_exercises (
    exercise_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    passed_at TEXT NOT NULL
  )`);
  return db;
}

function listBrowserPassedExercises(limit: number): PassedExerciseHistoryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const rows = JSON.parse(localStorage.getItem(BROWSER_PASSED_KEY) ?? '[]') as unknown;
    if (!Array.isArray(rows)) return [];
    return rows
      .filter(isPassedExerciseHistoryItem)
      .sort((left, right) => right.passedAt.localeCompare(left.passedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function isPassedExerciseHistoryItem(value: unknown): value is PassedExerciseHistoryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PassedExerciseHistoryItem>;
  return typeof item.exerciseId === 'string'
    && typeof item.title === 'string'
    && ['python', 'javascript', 'typescript', 'php'].includes(item.language ?? '')
    && typeof item.passedAt === 'string';
}

function listBrowserHistoryRecords(limit: number): ChallengeHistoryRow[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(BROWSER_HISTORY_KEY);
  if (!raw) return [];

  try {
    const rows = JSON.parse(raw) as ChallengeHistoryRow[];
    return rows
      .filter(isHistoryRow)
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function isHistoryRow(value: unknown): value is ChallengeHistoryRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ChallengeHistoryRow>;
  return (
    typeof row.id === 'string' &&
    typeof row.challenge_text === 'string' &&
    typeof row.created_at === 'string'
  );
}
