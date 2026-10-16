# Just Write Some Damn Code

A local desktop coding-practice gym. The user does the work; AI generates realistic challenges and gives feedback without replacing the thinking.

## Stack

- Tauri v2
- SvelteKit
- TypeScript
- TailwindCSS
- SQLite through the Tauri SQL plugin
- Ollama as the MVP AI provider

## Development

```bash
npm install
npm run dev
```

The web UI can run with Vite for frontend work. To run the desktop shell:

```bash
npm run tauri dev
```

Rust and Cargo must be installed for Tauri commands.

## Scripts

- `npm run check` - Svelte and TypeScript checks
- `npm run test` - unit tests
- `npm run build` - static SvelteKit build for Tauri
- `npm run tauri dev` - desktop development app

## MVP Boundaries

- Ollama is the only implemented AI provider.
- History stores only generated challenge text and creation date.
- Submissions and feedback are session-only and are not persisted.
- There are no accounts, cloud sync, XP, badges, streaks, leaderboards, courses, or social features.
