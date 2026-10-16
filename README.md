# Just Write Some Damn Code

A local-first desktop practice app. Pick an exercise, write the solution yourself, and run it against public examples. The editor provides syntax highlighting, indentation, and optional bracket or quote closing. It does not offer AI completions, inline suggestions, starter implementations, scores, or answer keys.

## What is in V1

- 250 original DSA exercises across 15 topic areas, with 75 beginner, 125 intermediate, and 50 advanced briefs.
- 12 single-file build tasks for small practical utilities.
- Monaco editor modes for Python, JavaScript, TypeScript, and PHP.
- A consistent `solve(input) -> JSON` exercise contract, with public input and output examples.
- Local SQLite storage for the latest draft by exercise and language, exercise status, settings, and preserved prototype challenge history.
- Optional, explicit Ollama actions for original exercise variants and qualitative code feedback. AI output is validated, marked as AI-generated, and never run by the app.
- A disposable local container runner with networking disabled and CPU, memory, time, process, and output limits.

In PHP, JSON objects arrive as `stdClass` objects and JSON arrays arrive as PHP arrays.

## Run the app

Install Node.js, Rust/Cargo, and Tauri's desktop prerequisites. Then:

```bash
npm install
npm run tauri dev
```

`npm run dev` starts the browser UI for front-end work. It supports browsing, editing, and local draft storage; code execution is available only in the desktop app.

## Set up local code execution

Install and start Podman or Docker. In the app, choose **Set up runner** once. This builds `jwsdc-runner:1.0.0` from the pinned app recipe and downloads the base image and language packages. The setup step needs network access. Subsequent runs do not.

Each run starts a disposable container with no network, a read-only root filesystem, a temporary workspace, no Linux capabilities, a non-root user, one CPU, 256 MB memory, 64 processes, a 4 second time limit, and a 128 KB output limit. The app sends only the current source file and the selected public examples to that container.

The desktop runner has not yet been exercised on this development machine because Rust/Cargo and a container engine are not installed here. See the test section below for the current verification status.

## Optional local AI

Install Ollama and download a model on the same machine. Open **Settings**, use **Find installed models**, then save a model. Requests are restricted to `localhost`, `127.0.0.1`, or `::1` over HTTP. AI calls happen only when you click **Feedback** or the variant button. Feedback stays in the current session.

The app's original exercises use topic coverage as inspiration from public study plans, without bundling external question lists or statements. [NeetCode 250](https://neetcode.io/practice/practice/neetcode250) and [LeetCode Top Interview 150](https://leetcode.com/studyplan/top-interview-150/) open as external links.

## Development checks

```bash
npm run check
npm test
npm run build
```

Tauri packaging and the container runner require Rust/Cargo and Podman or Docker, respectively.

## Roadmap

- **V2:** Multi-file project workspaces.
- **V3:** Flask/FastAPI tasks, HTTP, and WebSockets with explicit local networking.
- **V4:** Larger integrated builds such as dashboards, chatbots, and image-generation clients using local or mock services.
