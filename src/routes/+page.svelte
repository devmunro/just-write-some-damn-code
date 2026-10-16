<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { BookOpen, Bot, Braces, Check, CheckCircle2, ChevronDown, Circle, Code2, Container, Dices, FileCode2, History, ListFilter, Loader2, MessageSquareText, PanelLeftClose, PanelLeftOpen, Play, Search, Settings2, Sparkles, Terminal, X } from '@lucide/svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import HistoryDrawer from '$lib/components/HistoryDrawer.svelte';
  import SettingsDrawer from '$lib/components/SettingsDrawer.svelte';
  import { DSA_EXERCISES, BUILD_EXERCISES } from '$lib/practice/catalog';
  import { editorBehaviorProfiles, editorLanguages, type EditorLanguage } from '$lib/submission/modes';
  import type { EditorPreferencesByLanguage, Exercise, Feedback, GeneratedVariant, JsonValue, OllamaSettings, PassedExerciseHistoryItem, PracticeLanguage, RunRequest, RunResult } from '$lib/domain/types';
  import { listPassedExercises, recordExercisePassed } from '$lib/history/repository';
  import { loadDraft, saveDraft, loadEditorPreferences, saveEditorPreferences, loadOllamaSettings, saveOllamaSettings } from '$lib/practice/repository';
  import { generateExerciseVariant, reviewExerciseSubmission } from '$lib/ai/ollama';
  import { isTauriRuntime } from '$lib/platform/tauri';

  type SandboxStatus = { engine: string | null; imageAvailable: boolean; imageTag: string };
  type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';
  const difficultyOptions: Array<{ value: DifficultyFilter; label: string }> = [
    { value: 'Beginner', label: 'Easy' },
    { value: 'Intermediate', label: 'Medium' },
    { value: 'Advanced', label: 'Hard' },
    { value: 'all', label: 'All' }
  ];
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
  let editorTypography = { fontSize: 15, lineHeight: 24 };
  let isCodeEditorFocused = false;
  let preferences = emptyPreferences;
  let submission = '';
  let loadedDraftKey = '';
  let result: RunResult | null = null;
  let sandbox: SandboxStatus = { engine: null, imageAvailable: false, imageTag: 'jwsdc-runner:1.0.0' };
  let settings: OllamaSettings = { baseUrl: 'http://localhost:11434', model: '' };
  let feedback: Feedback | null = null;
  let history: PassedExerciseHistoryItem[] = [];
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
  let showSidebar = true;
  let showEditorOptions = false;
  let detailsDialog: HTMLDialogElement;
  let draftTimer: ReturnType<typeof setTimeout> | undefined;

  $: topicExercises = track === 'build' ? BUILD_EXERCISES : DSA_EXERCISES.filter((exercise) => selectedTopic === 'All topics' || exercise.topic === selectedTopic);
  $: baseTrackExercises = difficultyFilter === 'all'
    ? topicExercises
    : topicExercises.filter((exercise) => exercise.difficulty === difficultyFilter);
  $: trackExercises = [
    ...(generatedVariant && generatedVariant.kind === track && (difficultyFilter === 'all' || generatedVariant.difficulty === difficultyFilter) ? [generatedVariant] : []),
    ...baseTrackExercises
  ];
  $: visibleExercises = trackExercises.filter((exercise) => !query.trim() || `${exercise.title} ${exercise.tags.join(' ')} ${exercise.prompt}`.toLowerCase().includes(query.toLowerCase()));
  $: difficultyCounts = {
    all: topicExercises.length,
    Beginner: topicExercises.filter((exercise) => exercise.difficulty === 'Beginner').length,
    Intermediate: topicExercises.filter((exercise) => exercise.difficulty === 'Intermediate').length,
    Advanced: topicExercises.filter((exercise) => exercise.difficulty === 'Advanced').length
  };
  $: currentPreferences = preferences[editorLanguage];
  $: currentEditorBehavior = editorBehaviorProfiles[editorLanguage];
  $: isGenerated = Boolean(selectedExercise && 'generatedBy' in selectedExercise);

  onMount(async () => {
    showSidebar = localStorage.getItem('practice-sidebar-visible') !== 'false';
    try {
      [settings, preferences, history] = await Promise.all([
        loadOllamaSettings(), loadEditorPreferences(), listPassedExercises()
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
    isCodeEditorFocused = false;
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
    difficultyFilter = 'Beginner';
    if (next === 'build') await selectExercise(BUILD_EXERCISES.find((exercise) => exercise.difficulty === 'Beginner'));
    else {
      selectedTopic = 'All topics';
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
    const catalog = track === 'build' ? BUILD_EXERCISES : DSA_EXERCISES.filter((exercise) => selectedTopic === 'All topics' || exercise.topic === selectedTopic);
    const generatedMatch = generatedVariant && generatedVariant.kind === track && (next === 'all' || generatedVariant.difficulty === next)
      ? generatedVariant
      : undefined;
    await selectExercise(generatedMatch ?? catalog.find((exercise) => next === 'all' || exercise.difficulty === next));
  }

  async function changeLanguage(event: Event) {
    const next = (event.currentTarget as HTMLSelectElement).value as PracticeLanguage;
    if (next === editorLanguage) return;
    if (selectedExercise && loadedDraftKey === `${selectedExercise.id}:${editorLanguage}`) await saveDraft(selectedExercise.id, editorLanguage, submission);
    editorLanguage = next;
    isCodeEditorFocused = false;
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
      if (result.status === 'passed') {
        try {
          await recordExercisePassed({ exerciseId: selectedExercise.id, title: selectedExercise.title, language: editorLanguage });
          history = await listPassedExercises();
          notice = 'Added to History.';
        } catch {
          notice = 'Passed. Could not save to History.';
        }
      }
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
    history = await listPassedExercises();
    showHistory = true;
  }

  function pretty(value: unknown): string { return JSON.stringify(value, null, 2); }
  function formatExampleValue(value: JsonValue): string {
    if (Array.isArray(value)) return `[${value.map(formatExampleValue).join(', ')}]`;
    if (value !== null && typeof value === 'object') {
      return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${formatExampleValue(item)}`).join(', ')}}`;
    }
    return JSON.stringify(value) ?? 'null';
  }
  function formatExampleInput(value: JsonValue): string {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).map(([name, item]) => `${name} = ${formatExampleValue(item)}`).join(', ');
    }
    return formatExampleValue(value);
  }
  function displayDifficulty(difficulty: Exercise['difficulty']) {
    return difficulty === 'Beginner' ? 'Easy' : difficulty === 'Intermediate' ? 'Medium' : 'Hard';
  }
  function compactDifficulty(difficulty: Exercise['difficulty']) {
    return difficulty === 'Beginner' ? 'Easy' : difficulty === 'Intermediate' ? 'Med' : 'Hard';
  }
  function exerciseListTitle(exercise: Exercise) {
    const separator = exercise.title.indexOf(' · ');
    return separator < 0
      ? exercise.title
      : `${exercise.title.slice(separator + 3)} · ${exercise.title.slice(0, separator)}`;
  }
  function toggleSidebar() {
    showSidebar = !showSidebar;
    localStorage.setItem('practice-sidebar-visible', String(showSidebar));
  }
  function handleEditorInput(value: string) {
    submission = value;
    if (draftTimer) clearTimeout(draftTimer);
    if (selectedExercise && loadedDraftKey === `${selectedExercise.id}:${editorLanguage}`) {
      const exerciseId = selectedExercise.id;
      const language = editorLanguage;
      draftTimer = setTimeout(() => { void saveDraft(exerciseId, language, value); }, 350);
    }
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
    <div class="topbar-brand-group">
      <div class="brand-lockup" role="img" aria-label="Just Write Some Damn Code">
        <div class="brand-name" aria-hidden="true"><span class="brand-just">just</span><span class="brand-write">WRITE</span><span class="brand-some">some</span><span class="brand-damn">DAMN</span><span class="brand-code">code</span></div>
      </div>
    </div>
    <div class="topbar-actions">
      <button class="quiet-button" on:click={openHistory} aria-label="Open saved history"><History size={16} /><span>History</span></button>
      <button class="quiet-button" on:click={() => (showSettings = true)} aria-label="Open settings"><Settings2 size={16} /><span>Settings</span></button>
    </div>
  </header>

  <main class="workspace-grid" class:sidebar-collapsed={!showSidebar}>
    <aside class="sidebar">
      <div class="sidebar-switcher" aria-label="Practice track">
        <button class:active={track === 'dsa'} on:click={() => chooseTrack('dsa')}><Braces size={15} /> DSA</button>
        <button class:active={track === 'build'} on:click={() => chooseTrack('build')}><FileCode2 size={15} /> Build</button>
        <button class="sidebar-toggle" on:click={toggleSidebar} aria-label="Hide exercise sidebar" title="Hide exercise sidebar"><PanelLeftClose size={17} /></button>
      </div>

      {#if track === 'dsa'}
        <div class="catalog-controls">
          <label class="topic-select-wrap"><span>TOPIC</span><span class="topic-select-control"><select value={selectedTopic} on:change={changeTopic} aria-label="Filter by topic">
            <option value="All topics">All topics</option>
          {#each allDsaTopics as topic}
              <option value={topic}>{topic}</option>
          {/each}
          </select><ChevronDown size={14} /></span></label>
          <div class="difficulty-filters" aria-label="Difficulty">
            {#each difficultyOptions as option}
              <button class:level-active={difficultyFilter === option.value} class:level-beginner={option.value === 'Beginner'} class:level-intermediate={option.value === 'Intermediate'} class:level-advanced={option.value === 'Advanced'} disabled={difficultyCounts[option.value] === 0} on:click={() => changeDifficulty(option.value)}>{option.label}<span>{difficultyCounts[option.value]}</span></button>
            {/each}
          </div>
        </div>
      {:else}
        <div class="build-track-controls">
          <div class="build-track-note"><span class="track-icon"><FileCode2 size={16} /></span><div><strong>Small builds</strong><p>12 single-file tasks. Pick a level.</p></div></div>
          <div class="difficulty-filters" aria-label="Build difficulty">
            {#each difficultyOptions as option}
              <button class:level-active={difficultyFilter === option.value} class:level-beginner={option.value === 'Beginner'} class:level-intermediate={option.value === 'Intermediate'} class:level-advanced={option.value === 'Advanced'} disabled={difficultyCounts[option.value] === 0} on:click={() => changeDifficulty(option.value)}>{option.label}<span>{difficultyCounts[option.value]}</span></button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="exercise-browser">
        <div class="sidebar-section-heading exercise-heading"><span>{track === 'dsa' ? 'CHALLENGES' : 'BUILD TASKS'}</span><span>{visibleExercises.length}</span></div>
        <label class="search-box"><Search size={14} /><input bind:value={query} placeholder="Search this list" aria-label="Search exercises" /></label>
        <div class="exercise-list">
          {#each visibleExercises as exercise}
            <button class:exercise-active={selectedId === exercise.id} class="exercise-row" aria-label={`${exercise.title} · ${displayDifficulty(exercise.difficulty)}`} on:click={() => selectExercise(exercise)}>
              <span class="exercise-row-copy"><span class="exercise-row-title" title={exercise.title}>{exerciseListTitle(exercise)}</span></span>
              <span class="exercise-difficulty" class:diff-easy={exercise.difficulty === 'Beginner'} class:diff-medium={exercise.difficulty === 'Intermediate'} class:diff-hard={exercise.difficulty === 'Advanced'} title={`${displayDifficulty(exercise.difficulty)} difficulty`}>{compactDifficulty(exercise.difficulty)}</span>
            </button>
          {:else}
            <p class="empty-search">No exercises match that search.</p>
          {/each}
        </div>
      </div>
    </aside>

    <section class="editor-pane" aria-label="Code editor and runner">
      {#if !showSidebar}<button class="sidebar-reopen" on:click={toggleSidebar} aria-label="Show exercise sidebar" title="Show exercise sidebar"><PanelLeftOpen size={17} /></button>{/if}
      {#if selectedExercise}
        <div class="challenge-summary">
          <div class="challenge-summary-top"><h1>{selectedExercise.title}</h1>
            <div class="summary-actions"><button class="summary-button" on:click={openExerciseDetails}><BookOpen size={14} /><span>Prompt & examples</span></button><button class="summary-button summary-variant" title="Generate a new version of this challenge with local Ollama" disabled={isGenerating} on:click={requestVariant}>{#if isGenerating}<Loader2 class="spin" size={14} />{:else}<Dices size={14} />{/if}<span>Variant</span></button></div>
          </div>
        </div>
      {:else}
        <div class="challenge-summary empty-summary"><BookOpen size={17} /><span>Choose a challenge to start writing.</span></div>
      {/if}

      <div class="editor-toolbar">
        <div class="file-tab" title="Code space. Hold Ctrl and scroll to zoom the code text."><span class="file-dot" class:file-python={editorLanguage === 'python'} class:file-php={editorLanguage === 'php'}>{#if editorLanguage === 'python'}Py{:else if editorLanguage === 'php'}Php{:else}JS{/if}</span><span>Code space</span><span class="tab-file-name">main.{editorLanguage === 'javascript' ? 'js' : editorLanguage === 'typescript' ? 'ts' : editorLanguage === 'python' ? 'py' : 'php'}</span><span class="dirty-indicator" title="Draft saved locally"></span></div>
        <div class="editor-actions">
          <label class="language-select-label"><span class="sr-only">Programming language</span><select value={editorLanguage} on:change={changeLanguage}>{#each editorLanguages as language}<option value={language.value}>{language.label}</option>{/each}</select><ChevronDown size={13} /></label>
          <div class="options-anchor"><button class="icon-quiet" title="Editor behavior" aria-expanded={showEditorOptions} on:click={() => (showEditorOptions = !showEditorOptions)}><Settings2 size={16} /></button>
            {#if showEditorOptions}<div class="options-popover"><div class="popover-heading">Editor behavior <span>{editorLanguages.find((item) => item.value === editorLanguage)?.label}</span></div>
              <label><span>{currentEditorBehavior.indentLabel}</span><input type="checkbox" checked={currentPreferences.autoIndent} on:change={() => changePreference('autoIndent')} /></label>
              <label><span>Close brackets</span><input type="checkbox" checked={currentPreferences.autoCloseBrackets} on:change={() => changePreference('autoCloseBrackets')} /></label>
              <label><span>{currentEditorBehavior.quoteLabel}</span><input type="checkbox" checked={currentPreferences.autoCloseQuotes} on:change={() => changePreference('autoCloseQuotes')} /></label>
              <p>Saved separately for {editorLanguages.find((item) => item.value === editorLanguage)?.label}. {currentEditorBehavior.syntaxNote} Suggestions stay off.</p>
              <div class="shortcut-list" aria-label="Code space shortcuts">
                <div class="shortcut-heading">CODE SPACE SHORTCUTS</div>
                <div class="shortcut-row"><kbd>Ctrl + Enter</kbd><span>Run examples</span></div>
                <div class="shortcut-row"><kbd>Ctrl + scroll</kbd><span>Zoom code text</span></div>
                <div class="shortcut-row"><kbd>Ctrl + F</kbd><span>Find in code</span></div>
                <div class="shortcut-row"><kbd>Ctrl + Z</kbd><span>Undo</span></div>
                <div class="shortcut-row"><kbd>Ctrl + Shift + Z</kbd><span>Redo</span></div>
              </div>
            </div>{/if}
          </div>
          <button class="review-button" disabled={isReviewing || !submission.trim()} on:click={requestFeedback} title="Ask local Ollama for qualitative feedback">{#if isReviewing}<Loader2 class="spin" size={14} />{:else}<MessageSquareText size={14} />{/if}<span>Feedback</span></button>
        </div>
      </div>

      <div class="editor-surface" role="region" aria-label="Code space">
        <CodeEditor bind:value={submission} language={editorLanguage} preferences={currentPreferences} on:input={(event) => handleEditorInput((event as CustomEvent<string>).detail)} on:typography={(event) => (editorTypography = event.detail)} on:editorfocus={() => (isCodeEditorFocused = true)} on:editorblur={() => (isCodeEditorFocused = false)} />
        {#if !submission && !isCodeEditorFocused}<div class="editor-placeholder" style={`--editor-font-size: ${editorTypography.fontSize}px; --editor-line-height: ${editorTypography.lineHeight}px`}>Write code here.</div>{/if}
      </div>

      {#if error}<div class="message-banner error-banner"><X size={15} /><span>{error}</span><button on:click={() => (error = '')} aria-label="Dismiss error"><X size={13} /></button></div>{/if}
      {#if notice}<div class="message-banner notice-banner"><CheckCircle2 size={15} /><span>{notice}</span><button on:click={() => (notice = '')} aria-label="Dismiss message"><X size={13} /></button></div>{/if}

      <div class="runner-panel">
        <div class="runner-header"><div class="runner-title"><Terminal size={16} /><strong>Run code</strong></div></div>
        {#if result}
          <div class="run-result" class:result-pass={result.status === 'passed'} class:result-fail={result.status !== 'passed'}>
            <div class="result-summary"><span class="result-symbol">{#if result.status === 'passed'}<CheckCircle2 size={16} />{:else}<X size={16} />{/if}</span><strong>{result.status === 'passed' ? 'Examples passed' : result.status === 'timeout' ? 'Run timed out' : result.status === 'error' ? 'Run error' : 'Some examples failed'}</strong><span>{result.cases.filter((item) => item.passed).length} of {result.cases.length} examples passed</span><span class="result-duration">{result.durationMs} ms</span><button class="run-button" disabled={!sandbox.imageAvailable || isRunning || !submission.trim()} on:click={runExamples}>{#if isRunning}<Loader2 class="spin" size={15} />{:else}<Play size={15} fill="currentColor" />{/if}<span>{isRunning ? 'Running…' : 'Run examples'}</span><kbd>Ctrl + Enter</kbd></button></div>
            {#if result.message}<p class="result-message">{result.message}</p>{/if}
            {#if result.cases.length}<div class="case-results">{#each result.cases as item}<div class="case-result"><span class:case-pass={item.passed} class:case-fail={!item.passed}>{#if item.passed}<Check size={12} />{:else}<X size={12} />{/if}</span><span>{item.label}</span>{#if item.error}<code>{item.error}</code>{:else if !item.passed}<span class="case-actual">Got {pretty(item.actualOutput)}</span>{/if}</div>{/each}</div>{/if}
            {#if result.stderr}<pre class="runner-stderr">{result.stderr}</pre>{/if}
          </div>
        {:else if !sandbox.imageAvailable}
          <div class="runner-not-ready"><div class="runner-not-ready-icon"><Container size={16} /></div><div class="runner-not-ready-copy"><div class="runner-not-ready-heading"><strong>{sandbox.engine ? 'One-time setup' : 'No container engine found'}</strong><div class="runner-actions">
            {#if sandbox.engine}<button class="setup-button" disabled={isSettingUp} on:click={setupSandbox}>{#if isSettingUp}<Loader2 class="spin" size={14} />{:else}<span class="download-glyph">↓</span>{/if}{isSettingUp ? 'Setting up' : 'Set up runner'}</button>{/if}
            <button class="run-button" disabled={!sandbox.imageAvailable || isRunning || !submission.trim()} on:click={runExamples}>{#if isRunning}<Loader2 class="spin" size={15} />{:else}<Play size={15} fill="currentColor" />{/if}<span>{isRunning ? 'Running…' : 'Run examples'}</span><kbd>Ctrl + Enter</kbd></button>
          </div></div><p>{#if sandbox.engine}Build the local runner image. Network access is needed once.{:else}Install <a href="https://podman.io/docs/installation" target="_blank" rel="noreferrer">Podman</a> or <a href="https://docs.docker.com/get-started/get-docker/" target="_blank" rel="noreferrer">Docker</a> to run examples.{/if}</p></div>
          </div>
        {:else}
          <div class="runner-empty"><Circle size={13} /><span>Run your code against the public examples. No network access inside the runner.</span><button class="run-button" disabled={!sandbox.imageAvailable || isRunning || !submission.trim()} on:click={runExamples}>{#if isRunning}<Loader2 class="spin" size={15} />{:else}<Play size={15} fill="currentColor" />{/if}<span>{isRunning ? 'Running…' : 'Run examples'}</span><kbd>Ctrl + Enter</kbd></button></div>
        {/if}
      </div>
    </section>
  </main>
</div>

{#if selectedExercise}
  <dialog class="details-dialog" bind:this={detailsDialog} aria-labelledby="details-title">
    <div class="details-dialog-header"><div><span class="dialog-eyebrow">CHALLENGE DETAILS</span><h2 id="details-title">{selectedExercise.title}</h2></div><button class="icon-quiet" on:click={closeExerciseDetails} aria-label="Close challenge details"><X size={17} /></button></div>
    <div class="details-dialog-body">
      <div class="details-meta"><span>{selectedExercise.topic}</span><span class="details-meta-divider"></span><span class="details-difficulty">{displayDifficulty(selectedExercise.difficulty)}</span><span class="details-meta-divider"></span><span>{selectedExercise.estimatedMinutes} MIN</span>{#if isGenerated}<span class="ai-generated-badge"><Sparkles size={11} /> AI generated</span>{/if}</div>
      <section class="prompt-panel" aria-labelledby="prompt-heading"><h3 id="prompt-heading">THE CHALLENGE</h3><p>{selectedExercise.prompt}</p></section>
      <div class="contract-card"><div class="contract-heading"><Code2 size={14} /><span>WHAT TO WRITE</span></div><code>solve(input) → JSON</code><p>Write the function yourself. The runner passes each example as a JSON value.</p></div>
      <section class="detail-section constraints-section"><h3><ListFilter size={14} /> CONSTRAINTS</h3><ul>{#each selectedExercise.constraints as constraint}<li>{constraint}</li>{/each}</ul></section>
      <section class="detail-section examples-section"><div class="section-header"><h3><BookOpen size={14} /> EXAMPLES</h3><span>{selectedExercise.examples.length} examples</span></div>
        {#each selectedExercise.examples as example}
          <div class="example-card"><div class="example-label">{example.label}</div><div class="example-io"><div class="example-line"><span>Input:</span><pre>{formatExampleInput(example.input)}</pre></div><div class="example-line"><span>Output:</span><pre>{formatExampleValue(example.expectedOutput)}</pre></div></div></div>
        {/each}
      </section>
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
