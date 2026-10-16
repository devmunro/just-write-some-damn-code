<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { BookOpen, Bot, Braces, Check, CheckCircle2, ChevronDown, Circle, Clock3, Code2, ExternalLink, FileCode2, FlaskConical, History, ListFilter, Loader2, Play, Search, Settings2, Sparkles, Terminal, WandSparkles, X } from '@lucide/svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import HistoryDrawer from '$lib/components/HistoryDrawer.svelte';
  import SettingsDrawer from '$lib/components/SettingsDrawer.svelte';
  import { DSA_EXERCISES, BUILD_EXERCISES } from '$lib/practice/catalog';
  import { editorLanguages, type EditorLanguage } from '$lib/submission/modes';
  import type { EditorPreferencesByLanguage, Exercise, ExerciseStatus, Feedback, GeneratedVariant, OllamaSettings, PracticeLanguage, RunRequest, RunResult } from '$lib/domain/types';
  import { listChallengeHistory } from '$lib/history/repository';
  import { loadDraft, saveDraft, loadEditorPreferences, saveEditorPreferences, loadOllamaSettings, saveOllamaSettings, loadProgress, saveProgress } from '$lib/practice/repository';
  import { generateExerciseVariant, reviewExerciseSubmission } from '$lib/ai/ollama';
  import { isTauriRuntime } from '$lib/platform/tauri';
  import type { ChallengeHistoryItem } from '$lib/domain/types';

  type SandboxStatus = { engine: string | null; imageAvailable: boolean; imageTag: string };
  type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';
  const allDsaTopics = [...new Set(DSA_EXERCISES.map((exercise) => exercise.topic))];
  const emptyPreferences: EditorPreferencesByLanguage = {
    python: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true },
    javascript: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true },
    typescript: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true },
    php: { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true }
  };

  let track: 'dsa' | 'build' = 'dsa';
  let selectedTopic = 'All topics';
  let difficultyFilter: DifficultyFilter = 'Beginner';
  let selectedId = DSA_EXERCISES[0]?.id ?? '';
  let selectedExercise: Exercise | null = DSA_EXERCISES[0] ?? null;
  let generatedVariant: GeneratedVariant | null = null;
  let editorLanguage: PracticeLanguage = 'python';
  let preferences = emptyPreferences;
  let progress: Record<string, ExerciseStatus> = {};
  let submission = '';
  let loadedDraftKey = '';
  let result: RunResult | null = null;
  let sandbox: SandboxStatus = { engine: null, imageAvailable: false, imageTag: 'jwsdc-runner:1.0.0' };
  let settings: OllamaSettings = { baseUrl: 'http://localhost:11434', model: '' };
  let feedback: Feedback | null = null;
  let history: ChallengeHistoryItem[] = [];
  let query = '';
  let error = '';
  let notice = '';
  let loading = false;
  let isRunning = false;
  let isSettingUp = false;
  let isGenerating = false;
  let isReviewing = false;
  let showSettings = false;
  let showHistory = false;
  let showEditorOptions = false;
  let detailsDialog: HTMLDialogElement;
  let draftTimer: ReturnType<typeof setTimeout> | undefined;

  $: topicExercises = track === 'build' ? BUILD_EXERCISES : DSA_EXERCISES.filter((exercise) => selectedTopic === 'All topics' || exercise.topic === selectedTopic);
  $: baseTrackExercises = track === 'build' || difficultyFilter === 'all'
    ? topicExercises
    : topicExercises.filter((exercise) => exercise.difficulty === difficultyFilter);
  $: trackExercises = generatedVariant && generatedVariant.kind === track ? [generatedVariant, ...baseTrackExercises] : baseTrackExercises;
  $: visibleExercises = trackExercises.filter((exercise) => !query.trim() || `${exercise.title} ${exercise.tags.join(' ')} ${exercise.prompt}`.toLowerCase().includes(query.toLowerCase()));
  $: difficultyCounts = {
    all: topicExercises.length,
    Beginner: topicExercises.filter((exercise) => exercise.difficulty === 'Beginner').length,
    Intermediate: topicExercises.filter((exercise) => exercise.difficulty === 'Intermediate').length,
    Advanced: topicExercises.filter((exercise) => exercise.difficulty === 'Advanced').length
  };
  $: doneCount = Object.values(progress).filter((status) => status === 'done').length;
  $: currentPreferences = preferences[editorLanguage];
  $: isGenerated = Boolean(selectedExercise && 'generatedBy' in selectedExercise);

  onMount(async () => {
    try {
      [settings, preferences, progress, history] = await Promise.all([
        loadOllamaSettings(), loadEditorPreferences(), loadProgress(), listChallengeHistory()
      ]);
    } catch (cause) {
      console.warn('Could not load local practice data.', cause);
    }
    await refreshSandbox();
    await selectExercise(DSA_EXERCISES[0]);
  });

  async function selectExercise(exercise?: Exercise) {
    if (!exercise) return;
    if (detailsDialog?.open) detailsDialog.close();
    if (selectedExercise && loadedDraftKey === `${selectedExercise.id}:${editorLanguage}`) {
      await saveDraft(selectedExercise.id, editorLanguage, submission);
    }
    selectedExercise = exercise;
    selectedId = exercise.id;
    generatedVariant = 'generatedBy' in exercise ? exercise as GeneratedVariant : null;
    result = null;
    feedback = null;
    error = '';
    loadedDraftKey = '';
    const draft = await loadDraft(exercise.id, editorLanguage);
    if (selectedExercise?.id !== exercise.id) return;
    submission = draft;
    loadedDraftKey = `${exercise.id}:${editorLanguage}`;
  }

  function openExerciseDetails() { detailsDialog?.showModal(); }
  function closeExerciseDetails() { detailsDialog?.close(); }

  async function chooseTrack(next: 'dsa' | 'build') {
    track = next;
    generatedVariant = null;
    if (next === 'build') await selectExercise(BUILD_EXERCISES[0]);
    else {
      selectedTopic = 'All topics';
      difficultyFilter = 'Beginner';
      await selectExercise(DSA_EXERCISES.find((exercise) => exercise.difficulty === 'Beginner'));
    }
  }

  async function changeTopic(event: Event) {
    selectedTopic = (event.currentTarget as HTMLSelectElement).value;
    generatedVariant = null;
    const matches = DSA_EXERCISES.filter((exercise) => (selectedTopic === 'All topics' || exercise.topic === selectedTopic)
      && (difficultyFilter === 'all' || exercise.difficulty === difficultyFilter));
    await selectExercise(matches[0] ?? DSA_EXERCISES.find((exercise) => selectedTopic === 'All topics' || exercise.topic === selectedTopic));
  }

  async function changeDifficulty(next: DifficultyFilter) {
    difficultyFilter = next;
    generatedVariant = null;
    const matches = DSA_EXERCISES.filter((exercise) => (selectedTopic === 'All topics' || exercise.topic === selectedTopic)
      && (next === 'all' || exercise.difficulty === next));
    await selectExercise(matches[0]);
  }

  async function changeLanguage(event: Event) {
    const next = (event.currentTarget as HTMLSelectElement).value as PracticeLanguage;
    if (next === editorLanguage) return;
    if (selectedExercise && loadedDraftKey === `${selectedExercise.id}:${editorLanguage}`) await saveDraft(selectedExercise.id, editorLanguage, submission);
    editorLanguage = next;
    result = null;
    loadedDraftKey = '';
    if (selectedExercise) {
      const draft = await loadDraft(selectedExercise.id, next);
      submission = draft;
      loadedDraftKey = `${selectedExercise.id}:${next}`;
    }
  }

  async function changePreference(key: 'autoIndent' | 'autoCloseBrackets' | 'autoCloseQuotes') {
    preferences = { ...preferences, [editorLanguage]: { ...preferences[editorLanguage], [key]: !preferences[editorLanguage][key] } };
    await saveEditorPreferences(preferences);
  }

  async function markStatus(status: ExerciseStatus) {
    if (!selectedExercise) return;
    progress = { ...progress, [selectedExercise.id]: status };
    await saveProgress(selectedExercise.id, status);
  }

  async function refreshSandbox() {
    if (!isTauriRuntime()) return;
    try { sandbox = await invoke<SandboxStatus>('sandbox_status'); }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Could not inspect the local runner.'; }
  }

  async function setupSandbox() {
    isSettingUp = true; error = ''; notice = '';
    try {
      sandbox = await invoke<SandboxStatus>('setup_sandbox');
      notice = sandbox.imageAvailable ? 'The local runner is ready.' : 'Runner setup finished, but the image was not found.';
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { isSettingUp = false; }
  }

  async function runExamples() {
    if (!selectedExercise) return;
    error = ''; notice = ''; result = null; isRunning = true;
    try {
      if (!isTauriRuntime()) throw new Error('Run is available in the desktop app after setting up its local container runner. You can still write and save code here.');
      const request: RunRequest = { exerciseId: selectedExercise.id, language: editorLanguage, source: submission, cases: selectedExercise.examples };
      result = await invoke<RunResult>('run_code', { request });
      if (result.status === 'passed') notice = 'Examples passed. Keep exploring edge cases.';
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { isRunning = false; }
  }

  async function requestVariant() {
    if (!selectedExercise) return;
    error = ''; notice = ''; feedback = null; isGenerating = true;
    try {
      const variant = await generateExerciseVariant(selectedExercise, settings);
      generatedVariant = variant;
      track = variant.kind === 'build' ? 'build' : 'dsa';
      selectedExercise = variant;
      selectedId = variant.id;
      submission = '';
      loadedDraftKey = `${variant.id}:${editorLanguage}`;
      result = null;
      notice = 'AI-generated variant ready. It has not been executed.';
    } catch (cause) { error = cause instanceof Error ? cause.message : 'Could not generate a variant. Check local Ollama settings.'; }
    finally { isGenerating = false; }
  }

  async function requestFeedback() {
    if (!selectedExercise) return;
    error = ''; notice = ''; isReviewing = true;
    try { feedback = await reviewExerciseSubmission(selectedExercise, submission, settings); }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Could not get local feedback.'; }
    finally { isReviewing = false; }
  }

  async function saveSettings(next: OllamaSettings) {
    settings = next;
    await saveOllamaSettings(next);
    showSettings = false;
    notice = 'Settings saved on this device.';
  }

  async function openHistory() {
    history = await listChallengeHistory();
    showHistory = true;
  }

  function pretty(value: unknown): string { return JSON.stringify(value, null, 2); }
  function displayDifficulty(difficulty: Exercise['difficulty']) { return difficulty === 'Beginner' ? 'Easy' : difficulty; }
  function handleEditorInput(value: string) {
    submission = value;
    if (draftTimer) clearTimeout(draftTimer);
    if (selectedExercise && loadedDraftKey === `${selectedExercise.id}:${editorLanguage}`) {
      const exerciseId = selectedExercise.id;
      const language = editorLanguage;
      draftTimer = setTimeout(() => { void saveDraft(exerciseId, language, value); }, 350);
    }
    if (selectedExercise && value.trim() && (!progress[selectedExercise.id] || progress[selectedExercise.id] === 'not-started')) void markStatus('in-progress');
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void runExamples();
    }
  }
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<svelte:head>
  <title>Just Write Some Damn Code</title>
  <meta name="description" content="A local desktop practice space for writing code without AI autocomplete." />
</svelte:head>

<div class="app-shell">
  <header class="topbar">
    <div class="brand-lockup"><div class="brand-mark"><Braces size={18} strokeWidth={2.5} /></div><div class="brand-name">JUST WRITE SOME DAMN CODE</div></div>
    <div class="topbar-center"><span class="live-dot"></span><span>LOCAL</span><span class="topbar-divider"></span><span>{doneCount} DONE</span></div>
    <div class="topbar-actions">
      <button class="quiet-button" on:click={openHistory} aria-label="Open saved history"><History size={16} /><span>History</span></button>
      <button class="quiet-button" on:click={() => (showSettings = true)} aria-label="Open settings"><Settings2 size={16} /><span>Settings</span></button>
    </div>
  </header>

  <main class="workspace-grid">
    <aside class="sidebar">
      <div class="sidebar-switcher" aria-label="Practice track">
        <button class:active={track === 'dsa'} on:click={() => chooseTrack('dsa')}><Braces size={15} /> DSA</button>
        <button class:active={track === 'build'} on:click={() => chooseTrack('build')}><FileCode2 size={15} /> Build</button>
      </div>

      {#if track === 'dsa'}
        <div class="catalog-controls">
          <div class="catalog-heading"><span>DSA PRACTICE</span><span>250 drills</span></div>
          <label class="topic-select-wrap"><span>TOPIC</span><span class="topic-select-control"><select value={selectedTopic} on:change={changeTopic} aria-label="Filter by topic">
            <option value="All topics">All topics</option>
          {#each allDsaTopics as topic}
              <option value={topic}>{topic}</option>
          {/each}
          </select><ChevronDown size={14} /></span></label>
          <div class="difficulty-filters" aria-label="Difficulty">
            {#each [{ value: 'Beginner', label: 'Easy' }, { value: 'Intermediate', label: 'Medium' }, { value: 'Advanced', label: 'Hard' }, { value: 'all', label: 'All' }] as option}
              <button class:level-active={difficultyFilter === option.value} disabled={difficultyCounts[option.value as DifficultyFilter] === 0} on:click={() => changeDifficulty(option.value as DifficultyFilter)}>{option.label}<span>{difficultyCounts[option.value as DifficultyFilter]}</span></button>
            {/each}
          </div>
          <details class="study-links"><summary>Study maps <ChevronDown size={12} /></summary><a href="https://neetcode.io/practice/practice/neetcode250" target="_blank" rel="noreferrer"><ExternalLink size={12} /> NeetCode 250</a><a href="https://leetcode.com/studyplan/top-interview-150/" target="_blank" rel="noreferrer"><ExternalLink size={12} /> LeetCode Top Interview 150</a></details>
        </div>
      {:else}
        <div class="build-track-note"><span class="track-icon"><FileCode2 size={16} /></span><div><strong>Small builds</strong><p>12 practical projects. One file at a time.</p></div></div>
      {/if}

      <div class="exercise-browser">
        <div class="sidebar-section-heading exercise-heading"><span>{track === 'dsa' ? 'CHALLENGES' : 'BUILD TASKS'}</span><span>{visibleExercises.length}</span></div>
        <label class="search-box"><Search size={14} /><input bind:value={query} placeholder="Search this list" aria-label="Search exercises" /></label>
        <div class="exercise-list">
          {#each visibleExercises as exercise}
            <button class:exercise-active={selectedId === exercise.id} class="exercise-row" on:click={() => selectExercise(exercise)}>
              <span class="exercise-status-dot" class:status-done={progress[exercise.id] === 'done'} class:status-started={progress[exercise.id] === 'in-progress'}>{#if progress[exercise.id] === 'done'}<Check size={11} />{/if}</span>
              <span class="exercise-row-copy"><span class="exercise-row-title">{exercise.title}</span><span class="exercise-row-meta">{#if track === 'dsa'}<span class="exercise-row-context">{exercise.tags[2]}</span>{/if}<span>{displayDifficulty(exercise.difficulty)} · {exercise.estimatedMinutes} min</span></span></span>
            </button>
          {:else}
            <p class="empty-search">No exercises match that search.</p>
          {/each}
        </div>
      </div>
      <div class="sidebar-footnote"><span class="no-ai-mark"><X size={11} /></span> Just you and the code.</div>
    </aside>

    <section class="editor-pane" aria-label="Code editor and runner">
      {#if selectedExercise}
        <div class="challenge-summary">
          <div class="challenge-summary-top"><div class="challenge-kicker"><span>{selectedExercise.topic}</span><span class="crumb-slash">/</span><span>{displayDifficulty(selectedExercise.difficulty)}</span><span class="summary-time"><Clock3 size={13} /> {selectedExercise.estimatedMinutes} min</span>{#if isGenerated}<span class="ai-generated-badge"><Sparkles size={11} /> AI generated</span>{/if}</div>
            <div class="summary-actions"><button class="summary-button" on:click={openExerciseDetails}><BookOpen size={14} /><span>Prompt & examples</span></button><button class="summary-button summary-variant" title="Generate a variant with local Ollama" disabled={isGenerating} on:click={requestVariant}>{#if isGenerating}<Loader2 class="spin" size={14} />{:else}<WandSparkles size={14} />{/if}<span>Variant</span></button></div>
          </div>
          <h1>{selectedExercise.title}</h1>
          <p>{selectedExercise.prompt.split('\n')[0]}</p>
        </div>
      {:else}
        <div class="challenge-summary empty-summary"><BookOpen size={17} /><span>Choose a challenge to start writing.</span></div>
      {/if}

      <div class="editor-toolbar">
        <div class="file-tab"><span class="file-dot" class:file-python={editorLanguage === 'python'} class:file-php={editorLanguage === 'php'}>{#if editorLanguage === 'python'}Py{:else if editorLanguage === 'php'}Php{:else}JS{/if}</span><span>{editorLanguages.find((item) => item.value === editorLanguage)?.label}</span><span class="tab-file-name">main.{editorLanguage === 'javascript' ? 'js' : editorLanguage === 'typescript' ? 'ts' : editorLanguage === 'python' ? 'py' : 'php'}</span><span class="dirty-indicator" title="Draft saved locally"></span></div>
        <div class="editor-actions">
          <label class="language-select-label"><span class="sr-only">Programming language</span><select value={editorLanguage} on:change={changeLanguage}>{#each editorLanguages as language}<option value={language.value}>{language.label}</option>{/each}</select><ChevronDown size={13} /></label>
          <div class="options-anchor"><button class="icon-quiet" title="Editor behavior" aria-expanded={showEditorOptions} on:click={() => (showEditorOptions = !showEditorOptions)}><Settings2 size={16} /></button>
            {#if showEditorOptions}<div class="options-popover"><div class="popover-heading">Editor behavior <span>{editorLanguages.find((item) => item.value === editorLanguage)?.label}</span></div>
              <label><span>Auto indentation</span><input type="checkbox" checked={currentPreferences.autoIndent} on:change={() => changePreference('autoIndent')} /></label>
              <label><span>Close brackets</span><input type="checkbox" checked={currentPreferences.autoCloseBrackets} on:change={() => changePreference('autoCloseBrackets')} /></label>
              <label><span>Close quotes</span><input type="checkbox" checked={currentPreferences.autoCloseQuotes} on:change={() => changePreference('autoCloseQuotes')} /></label>
              <p>Indentation and closing pairs only. Suggestions stay off.</p>
            </div>{/if}
          </div>
          <button class="review-button" disabled={isReviewing || !submission.trim()} on:click={requestFeedback} title="Ask local Ollama for qualitative feedback">{#if isReviewing}<Loader2 class="spin" size={14} />{:else}<Sparkles size={14} />{/if}<span>Feedback</span></button>
        </div>
      </div>

      <div class="editor-surface">
        <CodeEditor bind:value={submission} language={editorLanguage} preferences={currentPreferences} on:input={(event) => handleEditorInput((event as CustomEvent<string>).detail)} />
        {#if !submission}<div class="editor-placeholder"><span>1</span><span>Write the code. Figure it out as you go.</span></div>{/if}
      </div>

      {#if error}<div class="message-banner error-banner"><X size={15} /><span>{error}</span><button on:click={() => (error = '')} aria-label="Dismiss error"><X size={13} /></button></div>{/if}
      {#if notice}<div class="message-banner notice-banner"><CheckCircle2 size={15} /><span>{notice}</span><button on:click={() => (notice = '')} aria-label="Dismiss message"><X size={13} /></button></div>{/if}

      <div class="runner-panel">
        <div class="runner-header"><div class="runner-title"><Terminal size={16} /><strong>Local runner</strong><span class="runner-tag">Sandboxed</span></div><div class="runner-engine">{#if sandbox.engine}{sandbox.engine}{:else}Engine not detected{/if}</div></div>
        {#if result}
          <div class="run-result" class:result-pass={result.status === 'passed'} class:result-fail={result.status !== 'passed'}>
            <div class="result-summary"><span class="result-symbol">{#if result.status === 'passed'}<CheckCircle2 size={16} />{:else}<X size={16} />{/if}</span><strong>{result.status === 'passed' ? 'Examples passed' : result.status === 'timeout' ? 'Run timed out' : result.status === 'error' ? 'Run error' : 'Some examples failed'}</strong><span>{result.cases.filter((item) => item.passed).length} of {result.cases.length} examples passed</span><span class="result-duration">{result.durationMs} ms</span></div>
            {#if result.message}<p class="result-message">{result.message}</p>{/if}
            {#if result.cases.length}<div class="case-results">{#each result.cases as item}<div class="case-result"><span class:case-pass={item.passed} class:case-fail={!item.passed}>{#if item.passed}<Check size={12} />{:else}<X size={12} />{/if}</span><span>{item.label}</span>{#if item.error}<code>{item.error}</code>{:else if !item.passed}<span class="case-actual">Got {pretty(item.actualOutput)}</span>{/if}</div>{/each}</div>{/if}
            {#if result.stderr}<pre class="runner-stderr">{result.stderr}</pre>{/if}
          </div>
        {:else if !sandbox.imageAvailable}
          <div class="runner-not-ready"><div class="runner-not-ready-icon"><FlaskConical size={18} /></div><div><strong>{sandbox.engine ? 'One-time runner setup' : 'No container engine found'}</strong><p>{#if sandbox.engine}Build the local {sandbox.imageTag} image. This needs network access once.{:else}The editor works without one. Install <a href="https://podman.io/docs/installation" target="_blank" rel="noreferrer">Podman</a> or <a href="https://docs.docker.com/get-started/get-docker/" target="_blank" rel="noreferrer">Docker</a> to run your code.{/if}</p></div>
            {#if sandbox.engine}<button class="setup-button" disabled={isSettingUp} on:click={setupSandbox}>{#if isSettingUp}<Loader2 class="spin" size={14} />{:else}<span class="download-glyph">↓</span>{/if}{isSettingUp ? 'Setting up' : 'Set up runner'}</button>{/if}
          </div>
        {:else}
          <div class="runner-empty"><Circle size={13} /><span>Run your code against the public examples. No network access inside the runner.</span></div>
        {/if}
        <div class="runner-footer"><span><span class="local-lock">●</span> Code stays on this device</span><button class="run-button" disabled={!sandbox.imageAvailable || isRunning || !submission.trim()} on:click={runExamples}>{#if isRunning}<Loader2 class="spin" size={15} />{:else}<Play size={15} fill="currentColor" />{/if}<span>{isRunning ? 'Running…' : 'Run examples'}</span><kbd>Ctrl ↵</kbd></button></div>
      </div>
    </section>
  </main>
</div>

{#if selectedExercise}
  <dialog class="details-dialog" bind:this={detailsDialog} aria-labelledby="details-title">
    <div class="details-dialog-header"><div><span class="dialog-eyebrow">CHALLENGE DETAILS</span><h2 id="details-title">{selectedExercise.title}</h2></div><button class="icon-quiet" on:click={closeExerciseDetails} aria-label="Close challenge details"><X size={17} /></button></div>
    <div class="details-dialog-body">
      <div class="task-breadcrumb"><span>{selectedExercise.topic}</span><span class="crumb-slash">/</span><span>{displayDifficulty(selectedExercise.difficulty)}</span>{#if isGenerated}<span class="ai-generated-badge"><Sparkles size={11} /> AI generated</span>{/if}</div>
      <div class="task-meta"><span><Clock3 size={13} /> {selectedExercise.estimatedMinutes} min</span><span class="difficulty-pill" class:diff-beginner={selectedExercise.difficulty === 'Beginner'} class:diff-advanced={selectedExercise.difficulty === 'Advanced'}>{displayDifficulty(selectedExercise.difficulty)}</span></div>
      <div class="tag-row">{#each selectedExercise.tags.slice(0, 4) as tag}<span class="tag-chip">{tag}</span>{/each}</div>
      <article class="prompt-copy"><p>{selectedExercise.prompt}</p></article>
      <div class="contract-card"><div class="contract-heading"><Code2 size={14} /><span>FUNCTION CONTRACT</span></div><code>solve(input) → JSON</code><p>Write the function yourself. The runner passes each example as a JSON value.</p></div>
      <section class="detail-section"><h2><ListFilter size={14} /> Constraints</h2><ul>{#each selectedExercise.constraints as constraint}<li>{constraint}</li>{/each}</ul></section>
      <section class="detail-section examples-section"><div class="section-header"><h2><BookOpen size={14} /> Examples</h2><span>{selectedExercise.examples.length} public cases</span></div>
        {#each selectedExercise.examples as example}
          <div class="example-card"><div class="example-label">{example.label}</div><div class="example-io"><div><span>INPUT</span><pre>{pretty(example.input)}</pre></div><div class="io-arrow">→</div><div><span>OUTPUT</span><pre>{pretty(example.expectedOutput)}</pre></div></div></div>
        {/each}
      </section>
      <section class="detail-section status-section"><label for="exercise-status">MY STATUS</label><div class="status-select-wrap"><select id="exercise-status" value={progress[selectedExercise.id] ?? 'not-started'} on:change={(event) => markStatus((event.currentTarget as HTMLSelectElement).value as ExerciseStatus)}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="done">Done</option></select><ChevronDown size={14} /></div></section>
      {#if feedback}
        <section class="feedback-card"><div class="feedback-title"><Bot size={15} /><strong>Local feedback</strong><button class="icon-quiet small" on:click={() => (feedback = null)} aria-label="Dismiss feedback"><X size={14} /></button></div>
          {#each [['Strengths', feedback.strengths], ['Could improve', feedback.weaknesses], ['Try next', feedback.suggestions], ['Think about', feedback.followUpQuestions]] as group}
            <div class="feedback-group"><span>{group[0]}</span><ul>{#each group[1] as item}<li>{item}</li>{/each}</ul></div>
          {/each}
        </section>
      {/if}
    </div>
  </dialog>
{/if}

{#if showHistory}<HistoryDrawer {history} onClose={() => (showHistory = false)} />{/if}
{#if showSettings}<SettingsDrawer {settings} onClose={() => (showSettings = false)} onSave={saveSettings} />{/if}
