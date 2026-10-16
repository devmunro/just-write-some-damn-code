<script lang="ts">
  import { onMount } from 'svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import ChallengeWorkspace from '$lib/components/ChallengeWorkspace.svelte';
  import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
  import HistoryDrawer from '$lib/components/HistoryDrawer.svelte';
  import SettingsDrawer from '$lib/components/SettingsDrawer.svelte';
  import SubmissionPanel from '$lib/components/SubmissionPanel.svelte';
  import { generateChallenge, reviewSubmission } from '$lib/ai/ollama';
  import { addChallengeToHistory, listChallengeHistory } from '$lib/history/repository';
  import { defaultSettings, loadSettings, saveSettings } from '$lib/settings/persistence';
  import {
    defaultLanguage,
    defaultSubmissionMode,
    type EditorLanguage,
    type SubmissionMode
  } from '$lib/submission/modes';
  import {
    PRACTICE_CATEGORIES,
    DSA_SUBCATEGORIES,
    type Challenge,
    type ChallengeHistoryItem,
    type DsaSubcategory,
    type Feedback,
    type OllamaSettings,
    type PracticeCategory
  } from '$lib/domain/types';
  import { dsaSubcategoryOptions } from '$lib/challenges/seeds';

  let selectedCategory: PracticeCategory = 'Build';
  let selectedDsaSubcategory: DsaSubcategory = 'Arrays & Strings';
  let submissionMode: SubmissionMode = defaultSubmissionMode(selectedCategory);
  let editorLanguage: EditorLanguage = defaultLanguage(selectedCategory);
  let settings: OllamaSettings = defaultSettings;
  let challenge: Challenge | null = null;
  let submission = '';
  let feedback: Feedback | null = null;
  let history: ChallengeHistoryItem[] = [];
  let error = '';
  let isGenerating = false;
  let isReviewing = false;
  let showHistory = false;
  let showSettings = false;

  onMount(async () => {
    settings = loadSettings();
    await refreshHistory();
  });

  $: recentChallengeText = history.slice(0, 8).map((item) => item.challengeText);
  $: settingsReady = settings.provider === 'gemini'
    ? Boolean(settings.model.trim() && settings.apiKey.trim())
    : Boolean(settings.model.trim());
  $: canGenerate = settingsReady && !isGenerating;
  $: canReview = Boolean(challenge && submission.trim() && settingsReady && !isReviewing);

  async function refreshHistory() {
    try {
      history = await listChallengeHistory();
    } catch (cause) {
      history = [];
      console.warn('Could not load SQLite history.', cause);
    }
  }

  async function handleGenerate() {
    error = '';
    feedback = null;
    isGenerating = true;
    try {
      const nextChallenge = await generateChallenge(
        selectedCategory,
        recentChallengeText,
        settings,
        selectedCategory === 'LeetCode / DSA' ? selectedDsaSubcategory : undefined
      );
      challenge = nextChallenge;
      submission = '';
      await addChallengeToHistory(nextChallenge);
      await refreshHistory();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not generate a challenge.';
    } finally {
      isGenerating = false;
    }
  }

  async function handleReview() {
    if (!challenge) return;
    error = '';
    feedback = null;
    isReviewing = true;
    try {
      feedback = await reviewSubmission(challenge, submission, settings);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not review the submission.';
    } finally {
      isReviewing = false;
    }
  }

  function handleSaveSettings(nextSettings: OllamaSettings) {
    settings = nextSettings;
    saveSettings(settings);
    showSettings = false;
  }

  function startAgain() {
    challenge = null;
    submission = '';
    feedback = null;
    error = '';
  }

  function selectCategory(category: PracticeCategory) {
    selectedCategory = category;
    submissionMode = defaultSubmissionMode(category);
    editorLanguage = defaultLanguage(category);
    if (category !== 'LeetCode / DSA') {
      selectedDsaSubcategory = 'Arrays & Strings';
    }
  }
</script>

<svelte:head>
  <title>Just Write Some Damn Code</title>
</svelte:head>

<div class="flex min-h-screen bg-paper text-ink">
  <main class="flex min-w-0 flex-1 flex-col">
    <AppHeader
      onHistory={() => (showHistory = true)}
      onSettings={() => (showSettings = true)}
    />

    <div class="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
      <ChallengeWorkspace
        categories={PRACTICE_CATEGORIES}
        dsaSubcategories={dsaSubcategoryOptions}
        {selectedCategory}
        {selectedDsaSubcategory}
        {challenge}
        {error}
        {isGenerating}
        {canGenerate}
        {settingsReady}
        onCategoryChange={selectCategory}
        onDsaSubcategoryChange={(subcategory) => (selectedDsaSubcategory = subcategory)}
        onGenerate={handleGenerate}
        onReset={startAgain}
      />

      <section class="flex min-h-[420px] flex-col gap-4">
        <SubmissionPanel
          bind:submission
          mode={submissionMode}
          language={editorLanguage}
          {canReview}
          {isReviewing}
          onModeChange={(mode) => (submissionMode = mode)}
          onLanguageChange={(language) => (editorLanguage = language)}
          onReview={handleReview}
        />
        <FeedbackPanel {feedback} />
      </section>
    </div>
  </main>
</div>

{#if showHistory}
  <HistoryDrawer {history} onClose={() => (showHistory = false)} />
{/if}

{#if showSettings}
  <SettingsDrawer {settings} onClose={() => (showSettings = false)} onSave={handleSaveSettings} />
{/if}
