# Architecture

## Product Loop

The MVP implements one loop:

1. Choose a practice category.
2. Generate a challenge through Ollama.
3. Write or paste a submission.
4. Ask for feedback.
5. Repeat.

The AI is deliberately constrained to challenge-setting and review. Prompt builders explicitly reject complete solutions, starter code, replacement implementations, and answer keys.

## Folder Structure

- `src/lib/domain` contains shared product types.
- `src/lib/challenges` contains curated challenge seeds and seed selection.
- `src/lib/ai` contains prompt construction and the Ollama provider boundary.
- `src/lib/history` contains the SQLite repository and the pure persistence mapper.
- `src/lib/settings` contains local settings persistence.
- `src/lib/components` contains reusable Svelte UI pieces.
- `src/routes` contains the SvelteKit route shell.
- `src-tauri` contains the Tauri v2 host, SQL plugin wiring, and the Ollama command.

## Data Policy

The SQLite MVP schema is intentionally small:

```sql
CREATE TABLE challenge_history (
  id TEXT PRIMARY KEY,
  challenge_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

No submission text, feedback text, weakness analytics, streaks, or gamification data is persisted.

## AI Boundary

The frontend calls:

- `generateChallenge(category, recentHistory, settings)`
- `reviewSubmission(challenge, submission, settings)`

In a Tauri runtime those functions call the Rust `ollama_chat` command, which talks to `/api/chat`. In a browser-only dev runtime they fall back to `fetch` so the interface can still be exercised outside the desktop shell when CORS allows it.

## Development Fallbacks

Browser-only Vite sessions do not have access to Tauri plugins. The history repository therefore uses SQLite inside Tauri and a small `localStorage` fallback during browser-only development. Both paths use the same `ChallengeHistoryRow` shape and store only challenge text plus creation date.
