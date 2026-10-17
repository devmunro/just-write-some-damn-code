# Just Write Some Damn Code

<p align="center">
  <img src="docs/screenshots/wordmark.png" width="500" alt="Just Write Some Damn Code!" />
</p>

<p align="center">
  <a href="https://github.com/devmunro/just-write-some-damn-code/releases"><img src="https://img.shields.io/github/v/release/devmunro/just-write-some-damn-code?include_prereleases&style=for-the-badge" alt="Latest release" /></a>
  <a href="https://github.com/devmunro/just-write-some-damn-code/actions/workflows/validate.yml"><img src="https://img.shields.io/github/actions/workflow/status/devmunro/just-write-some-damn-code/validate.yml?branch=main&style=for-the-badge&label=checks" alt="Frontend validation workflow status" /></a>
  <img src="https://img.shields.io/badge/desktop-Tauri%202-ffc131?style=for-the-badge&logo=tauri&logoColor=111" alt="Tauri 2 desktop app" />
  <img src="https://img.shields.io/badge/interface-Svelte%205-ff3e00?style=for-the-badge&logo=svelte&logoColor=fff" alt="Svelte 5 interface" />
  <img src="https://img.shields.io/badge/editor-Monaco-007acc?style=for-the-badge&logo=visualstudiocode&logoColor=fff" alt="Monaco editor" />
  <img src="https://img.shields.io/badge/autocomplete-none-252525?style=for-the-badge" alt="No autocomplete suggestions" />
</p>

**A desktop practice space for people who want to keep their coding skills sharp.** Pick a challenge, write the code yourself, and run it against examples. Syntax highlighting and editor conveniences are there; AI completions, answer keys, starter solutions, scores, and leaderboards are not.

> **Alpha software:** the release page provides installable Windows and macOS packages. The runner still needs cross-platform validation.

## The workspace

![The practice workspace with the exercise list, code editor, and local runner panel](docs/screenshots/practice-workspace.png)

Open a challenge when you want the full prompt, constraints, and examples:

![Challenge details with the prompt, solve(input) contract, constraints, and examples](docs/screenshots/challenge-details.png)

## What you can practice

- **250 original DSA exercises** across arrays and hashing, two pointers, sliding windows, binary search, stacks and queues, linked lists, trees and tries, heaps, graphs, backtracking, dynamic programming, greedy methods, intervals, bit manipulation, and math and geometry.
- **12 single-file build tasks** for small practical programs. Both tracks include Easy, Medium, and Hard challenges.
- **Four languages:** Python, JavaScript, TypeScript, and PHP.
- **One simple exercise contract:** implement `solve(input)` and return a JSON value. Every challenge includes public JSON input and expected-output examples.
- **A focused editor:** Monaco provides syntax coloring and basic editor behavior. Suggestions and inline completions stay off. Indentation and bracket or quote closing can be set per language.
- **Local progress:** the latest draft for each exercise and language, exercise status, and settings are saved locally. History records passed exercises; it does not keep source code or show solutions.

The DSA catalog has 75 beginner, 125 intermediate, and 50 advanced exercises. These appear in the app as Easy, Medium, and Hard. Build tasks also have all three difficulty levels.

## Optional local AI

AI is an optional tool you ask for when you want it. Connect a local [Ollama](https://ollama.com/download) installation to:

- Generate a fresh, AI-labeled variant of the selected exercise.
- Get qualitative feedback on your submission and a suggestion for what to try next.

The app accepts loopback Ollama addresses only. It does not send requests to a hosted AI service. Feedback is session-only; generated variants are labeled and validated, and AI output is never executed. The editor has no AI autocomplete.

## Run your code locally

The desktop app uses a disposable local Podman or Docker container for the runner. The browser version is useful for browsing, writing, and local drafts, but code execution requires the desktop app and a running container engine.

The first setup builds the local `jwsdc-runner:1.0.0` image and downloads its base image and language runtimes. After setup, runs have no network access. The container uses a read-only root filesystem, a temporary workspace, a non-root user, no extra Linux capabilities, and limits for CPU, memory, processes, time, and output. The runner receives the code you wrote and the selected public examples.

## Download and install

Open the [release page](https://github.com/devmunro/just-write-some-damn-code/releases) and download the installer for your computer:

- **Windows:** the `x64-setup.exe` installer.
- **Mac with Apple silicon:** the `aarch64.dmg` installer.
- **Mac with Intel:** the `x64.dmg` installer.

On Mac, open the DMG and drag **Just Write Some Damn Code** into Applications. On Windows, run the setup installer. These alpha builds are not signed by a commercial publisher; Windows SmartScreen or macOS Gatekeeper may ask you to confirm the app the first time you open it. SHA-256 checksum files are attached to each release.

Installing the app does not require Node.js or Rust. To run code examples, install and start [Podman](https://podman.io/docs/installation) or [Docker](https://docs.docker.com/get-started/get-docker/) and choose **Set up runner** in the app. Browsing, writing, and local drafts work without a container engine.

### Build from source

1. Install Node.js and the [Rust toolchain](https://rustup.rs/).
2. Install the desktop prerequisites for your operating system using the [Tauri v2 prerequisite guide](https://v2.tauri.app/start/prerequisites/).
3. Clone the repository and install the frontend dependencies:

   ```bash
   git clone https://github.com/devmunro/just-write-some-damn-code.git
   cd just-write-some-damn-code
   npm ci
   ```

4. Start the desktop app:

   ```bash
   npm run tauri dev
   ```

5. To run examples, install and start [Podman](https://podman.io/docs/installation) or [Docker](https://docs.docker.com/get-started/get-docker/), then choose **Set up runner** in the app. The one-time image setup needs network access. Podman on macOS and Windows runs containers through a Podman machine; follow Podman's setup instructions for your platform.

Without Rust and Tauri's system libraries, use the browser interface for frontend development:

```bash
npm run dev
```

The browser interface does not expose the native runner. Drafts and settings use browser-local storage during frontend development.

### Connect Ollama (optional)

1. Install Ollama and download a model on the same computer.
2. Open **Settings** in the app and select **Find installed models**.
3. Choose and save a model. Use the variant or feedback controls only when you want an AI action.

## Development

```bash
npm ci
npm run check
npm test
npm run build
npm run tauri dev
```

The first three commands cover Svelte and TypeScript checks, unit tests, and the frontend production build. Building the desktop application also needs Rust and the platform dependencies listed by Tauri. Running example code additionally needs Podman or Docker.

See [the architecture notes](docs/ARCHITECTURE.md) for storage migrations, runner boundaries, content rules, and the planned extension points.

## What's in the project

| Part | Technology | Job |
| --- | --- | --- |
| Desktop shell | Tauri 2 and Rust | Native window, local commands, SQLite migrations, and sandbox orchestration |
| Interface | Svelte 5, TypeScript, and Vite | Exercise catalog, settings, prompts, feedback, and workspace layout |
| Editor | Monaco Editor | Syntax-aware code editing without autocomplete suggestions |
| Local data | SQLite in the desktop app | Drafts, progress, settings, and passed-exercise history |
| Optional AI | Ollama on loopback | On-demand variants and qualitative submission feedback |
| Code runner | Podman or Docker | Disposable offline container for Python, JavaScript, TypeScript, and PHP |

## Project layout

```text
.
├── docs/
│   ├── ARCHITECTURE.md
│   └── screenshots/
├── src/
│   ├── lib/
│   │   ├── ai/             # Ollama prompts and validation
│   │   ├── components/     # Editor, settings, history, and shared UI
│   │   ├── domain/         # Shared TypeScript types
│   │   ├── history/        # Passed-exercise history
│   │   ├── practice/       # Exercise catalog and local persistence
│   │   └── submission/     # Language modes and editor preferences
│   └── routes/             # SvelteKit application screen
└── src-tauri/
    ├── runner/             # Container image and language harnesses
    └── src/                # Native commands, persistence, and runner boundary
```

## Roadmap

- **V1 — single-file practice:** original DSA challenges, small build tasks, local drafts, optional local AI, and an offline container runner.
- **V2 — project workspaces:** multi-file tasks and projects.
- **V3 — local services:** Flask and FastAPI challenges, HTTP and WebSocket exercises with explicitly permitted local networking, and optional voice-to-editable challenge requests.
- **V4 — integrated builds:** dashboards, chatbots, and image-generation clients using local or mock services.

## Challenge sources and license status

The exercises in this app are original. The catalog follows broad topic coverage from public study plans; it does not scrape or redistribute LeetCode or NeetCode problem lists or statements. Those collections are linked as optional external references: [NeetCode 250](https://neetcode.io/practice/practice/neetcode250) and [LeetCode Top Interview 150](https://leetcode.com/studyplan/top-interview-150/). This project is not affiliated with either service.

**Project license:** not selected yet. Public visibility does not by itself grant permission to reuse or redistribute this code. Third-party dependencies remain under their respective licenses.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the code and challenge-content guidelines.
