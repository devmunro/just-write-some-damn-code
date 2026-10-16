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

The app should be able to grow into voice-authored challenges and richer projects without putting microphone handling, AI generation, and code execution into the Svelte page as one feature. Keep the page as the user-facing flow and put each capability behind a small boundary with typed input and output.

### Extension boundaries

- **Challenge intake:** A future `ChallengeRequest` should be independent of how the user supplied the idea. Text and an edited voice transcript can both become the same request: goal, topic, difficulty, language, project size, constraints, and requested capabilities. Voice is an optional input adapter; it must not be required to browse, write, or run existing exercises.
- **Voice capture:** Start microphone capture only after an explicit user action. Convert speech to a transcript with an optional local speech-to-text adapter, show the transcript for editing, then pass the confirmed text to challenge generation. Discard raw audio when transcription completes; storing recordings would require a separate user-facing choice. Keep the transcript usable as ordinary text if local speech recognition is unavailable.
- **Retrieval and generation:** Put retrieval behind an `ExerciseRetriever` boundary and generation behind a `ChallengeGenerator` boundary. The local index can grow from authored exercises and pattern guides to user-added content packs, with source and license metadata. Keep the existing local Ollama integration as one generator adapter. A generated challenge is an untrusted candidate: validate its schema, size, difficulty, language, examples, and execution profile before showing or saving it. Mark its provenance clearly. Never turn generated source code into an implementation or execute it as the learner’s submission.
- **Exercise formats:** Treat the current `solve(input) -> JSON` contract as one execution profile. Future profiles can describe a multi-file project, a local HTTP server, or a WebSocket task without changing the meaning of the current profile. Store profile and required capabilities as data on a future challenge bundle so the UI can explain what will run before the user starts it.
- **Evaluation and feedback:** Keep the Tauri runner as the execution boundary. Evolve `RunRequest` and `RunResult` through versioned profile-specific data rather than letting the UI start arbitrary processes. The runner should receive user code, bounded test data, and fixed app-owned harnesses; validate resource limits and network policy on the host side. The runner owns deterministic pass/fail results. AI may propose extra JSON input cases, but generated expected outputs are untrusted and must be labeled as experimental unless independently verified. After a user asks, AI feedback can review the submission alongside structured run evidence; it must not override runner results or turn them into a score.
- **Local storage:** Persist a user-saved generated challenge as a versioned local content record with its source request and provenance. Keep unsaved variants session-only, and keep recordings and feedback out of persistent storage by default. Database changes should be additive migrations so existing drafts and progress remain intact.

### Version path

- **V2 — project workspaces:** Add multi-file workspaces and a typed workspace execution profile. Continue to use the existing local runner boundary and local draft storage.
- **V3 — voice and local services:** Add optional voice-to-transcript intake, user-edited challenge requests, and local AI-generated challenge candidates. Add HTTP and WebSocket tasks through explicit runner profiles. Networking stays disabled unless the selected task declares the smallest required local capability; do not give every task general network access.
- **V4 — integrated builds:** Add larger projects such as dashboards, chatbots, and image-generation clients using mock or user-configured local services. Let challenge bundles describe setup, files, evaluation, and allowed capabilities, while keeping AI generation, qualitative review, and sandbox execution as separate services.

These are architecture boundaries and sequencing only. V1 does not capture audio, request microphone permission, add speech models, run generated code, or enable networked tasks.

The intended future loop is: **voice or text → editable challenge request → local retrieval and AI-generated challenge candidate → validated challenge → user-written code → sandbox run → optional qualitative AI feedback using the run evidence.** The same challenge request and validation flow should work if the voice adapter or AI provider is unavailable.
