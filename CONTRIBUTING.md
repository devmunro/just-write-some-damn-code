# Contributing

Thanks for helping make this a better place to practice. The project is in alpha, so small, focused changes are easiest to review.

## Before you change code

- Keep the editor as the main event. Avoid adding AI completions, answer code, scores, leaderboards, or unnecessary status text.
- Keep data local by default. Any future network feature needs a clear, user-triggered purpose and a small permission boundary.
- Keep the sandbox boundary in the Tauri runner. Do not execute user code in the Svelte UI or send generated AI code to the runner.
- Keep editor behavior configurable per language where syntax differs.
- Remove unused components and stale styles when replacing an interface.

## Adding an exercise

- Write an original prompt; do not copy a LeetCode, NeetCode, or other third-party statement.
- Add a unique ID, concise title, topic, difficulty, tags, constraints, and valid JSON examples to `src/lib/practice/catalog.ts`.
- Use the shared `solve(input) -> JSON` contract for runnable single-file tasks.
- Include examples that cover ordinary input and at least one useful boundary case.
- Do not add starter implementations, solutions, hidden answer fields, or answer keys.
- Preserve the expected catalog counts and the existing catalog validation tests.

## Local checks

Install Node.js and run:

```bash
npm ci
npm run check
npm test
npm run build
```

Desktop changes also need the Rust toolchain and the platform prerequisites in the [Tauri guide](https://v2.tauri.app/start/prerequisites/). Runner changes should be checked with Podman or Docker on the target platform; the runner image uses no network during code execution.

## Pull requests

Describe the user-facing change, list the checks you ran, and call out any platform-specific work that could not be verified. Include screenshots for meaningful interface changes. Keep screenshots free of personal data and local paths.

## License

The project license has not been selected yet. Please do not assume that public repository access grants reuse or redistribution rights.
