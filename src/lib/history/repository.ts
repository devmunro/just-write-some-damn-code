import Database from '@tauri-apps/plugin-sql';
import { createHistoryRecord, mapHistoryRow, type ChallengeHistoryRow } from '$lib/history/record';
import type { Challenge, ChallengeHistoryItem } from '$lib/domain/types';
import { isTauriRuntime } from '$lib/platform/tauri';

const DB_URL = 'sqlite:practice.db';
const BROWSER_HISTORY_KEY = 'jwsdc.browser-history';

let dbPromise: Promise<Database> | null = null;

export async function addChallengeToHistory(challenge: Challenge): Promise<void> {
  if (!isTauriRuntime()) {
    addBrowserHistoryRecord(createHistoryRecord(challenge));
    return;
  }

  const db = await getDb();
  const record = createHistoryRecord(challenge);
  await db.execute(
    'INSERT INTO challenge_history (id, challenge_text, created_at) VALUES ($1, $2, $3)',
    [record.id, record.challenge_text, record.created_at]
  );
}

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
  return db;
}

function addBrowserHistoryRecord(record: ChallengeHistoryRow): void {
  if (typeof localStorage === 'undefined') return;
  const rows = [record, ...listBrowserHistoryRecords(49)];
  localStorage.setItem(BROWSER_HISTORY_KEY, JSON.stringify(rows));
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
