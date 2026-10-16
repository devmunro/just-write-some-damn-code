<script lang="ts">
  import { Code2, FileText, Loader2, Send } from '@lucide/svelte';
  import { editorLanguages, type EditorLanguage, type SubmissionMode } from '$lib/submission/modes';

  export let submission: string;
  export let mode: SubmissionMode;
  export let language: EditorLanguage;
  export let canReview: boolean;
  export let isReviewing: boolean;
  export let onModeChange: (mode: SubmissionMode) => void;
  export let onLanguageChange: (language: EditorLanguage) => void;
  export let onReview: () => void;

  function selectMode(nextMode: SubmissionMode) {
    onModeChange(nextMode);
  }

  function handleLanguageChange(event: Event) {
    onLanguageChange((event.currentTarget as HTMLSelectElement).value as EditorLanguage);
  }
</script>

<div class="panel rounded-md p-4">
  <div class="mb-3 flex items-center justify-between gap-3">
    <div>
      <p class="section-title">Submission</p>
      <h3 class="mt-1 text-base font-bold">{mode === 'code' ? 'Code' : 'Written answer'}</h3>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2">
      {#if mode === 'code'}
        <label class="sr-only" for="editor-language">Editor language</label>
        <select id="editor-language" class="field h-9 w-36 py-1" value={language} on:change={handleLanguageChange}>
          {#each editorLanguages as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      {/if}

      <div class="inline-flex h-9 overflow-hidden rounded-md border border-line bg-surface" aria-label="Submission mode">
        <button
          class="inline-flex items-center gap-2 px-3 text-sm font-medium {mode === 'code' ? 'bg-action text-[#08130f]' : 'text-steel hover:bg-raised'}"
          type="button"
          on:click={() => selectMode('code')}
        >
          <Code2 size={15} />
          Code
        </button>
        <button
          class="inline-flex items-center gap-2 border-l border-line px-3 text-sm font-medium {mode === 'written' ? 'bg-action text-[#08130f]' : 'text-steel hover:bg-raised'}"
          type="button"
          on:click={() => selectMode('written')}
        >
          <FileText size={15} />
          Written
        </button>
      </div>

      <button class="primary-button" type="button" disabled={!canReview} on:click={onReview}>
        {#if isReviewing}
          <Loader2 class="animate-spin" size={16} />
        {:else}
          <Send size={16} />
        {/if}
        Submit
      </button>
    </div>
  </div>

  {#if mode === 'code'}
    {#await import('$lib/components/CodeEditor.svelte') then editorModule}
      <svelte:component this={editorModule.default} bind:value={submission} {language} />
    {:catch}
      <textarea
        class="field min-h-80 font-mono text-xs leading-5"
        bind:value={submission}
        placeholder="Paste your code."
        aria-label="Code submission"
      ></textarea>
    {/await}
  {:else}
    <textarea
      class="field min-h-80 font-mono text-xs leading-5"
      bind:value={submission}
      placeholder="Write your design notes, trade-off analysis, review, or interview answer."
      aria-label="Written submission"
    ></textarea>
  {/if}
</div>
