# V1 architecture

## Product loop

1. Browse the built-in original DSA curriculum or one of the single-file build briefs.
2. Choose a language and write a solution in Monaco. No solution or starter code is shipped.
3. Optionally run the public examples in the desktop container sandbox.
4. Optionally ask local Ollama for a fresh variant or qualitative feedback.
5. Keep the latest draft and exercise status on this device.

## Main modules

- `src/lib/practice/catalog.ts` holds the authored curriculum and JSON examples.
- `src/lib/practice/repository.ts` stores drafts, progress, editor preferences, and Ollama settings in SQLite, with localStorage for browser-only development.
- `src/lib/components/CodeEditor.svelte` configures Monaco for syntax assistance only. Suggestions and inline completions are disabled; indentation and closing pairs are user preferences saved per language.
- `src/lib/ai` builds strict JSON prompts, validates generated examples and feedback, and talks only to local Ollama loopback endpoints.
- `src-tauri/src/lib.rs` provides SQLite migrations, local Ollama commands, sandbox status, one-time runner setup, and code execution.
- `src-tauri/runner` builds a local container image containing Python, Node/TypeScript, and PHP harnesses.

## Data migration

The existing `challenge_history` table stays intact. SQLite migration version 2 adds:

```sql
CREATE TABLE exercise_progress (
  exercise_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE exercise_drafts (
  exercise_id TEXT NOT NULL,
  language TEXT NOT NULL,
  source TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (exercise_id, language)
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

The old browser settings key is migrated to the local settings shape. Gemini provider and API-key fields are discarded. New feedback and generated variants remain session-only.

## Run protocol

Every runnable brief has `solve(input) -> JSON` and public JSON cases. The Rust command validates the language, source and case sizes, then packages only those values into an in-memory tar stream. It does not create a host-side source file.

The app setup action builds `jwsdc-runner:1.0.0`. A run starts that image with networking disabled, read-only root, a temporary workspace, no extra capabilities, a non-root UID, PID/CPU/memory/output limits, and a four second wall-clock timeout. The runner process is killed and its named container is removed if it times out or exceeds output limits. AI responses are never passed to this command.

## Content and licensing

The exercise set is independently authored and uses only broad topic coverage from public practice collections. The app links externally to the NeetCode 250 and LeetCode Top Interview 150 pages. It does not scrape, redistribute, or claim affiliation with those collections.

## Later versions

- V2 adds multi-file workspaces while keeping local drafts.
- V3 adds local server tasks and networking only when the task explicitly requests it.
- V4 adds integrated mock or local-service builds.
