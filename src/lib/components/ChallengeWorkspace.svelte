<script lang="ts">
  import { AlertCircle, Loader2, Play, RotateCcw } from '@lucide/svelte';
  import ChallengeList from '$lib/components/ChallengeList.svelte';
  import type { Challenge, DsaSubcategory, PracticeCategory } from '$lib/domain/types';

  export let categories: readonly PracticeCategory[];
  export let dsaSubcategories: readonly DsaSubcategory[];
  export let selectedCategory: PracticeCategory;
  export let selectedDsaSubcategory: DsaSubcategory;
  export let challenge: Challenge | null;
  export let error: string;
  export let isGenerating: boolean;
  export let canGenerate: boolean;
  export let settingsReady: boolean;
  export let onCategoryChange: (category: PracticeCategory) => void;
  export let onDsaSubcategoryChange: (subcategory: DsaSubcategory) => void;
  export let onGenerate: () => void;
  export let onReset: () => void;

  function handleCategoryChange(event: Event) {
    onCategoryChange((event.currentTarget as HTMLSelectElement).value as PracticeCategory);
  }

  function handleDsaSubcategoryChange(event: Event) {
    onDsaSubcategoryChange((event.currentTarget as HTMLSelectElement).value as DsaSubcategory);
  }
</script>

<section class="panel min-h-[420px] rounded-md p-4">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="section-title">Challenge</p>
      <h3 class="mt-1 text-xl font-bold">{challenge?.title ?? 'Choose practice, then generate a challenge.'}</h3>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <label class="sr-only" for="practice-category">Practice category</label>
      <select
        id="practice-category"
        class="field h-9 w-56 py-1"
        value={selectedCategory}
        on:change={handleCategoryChange}
      >
        {#each categories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
      {#if selectedCategory === 'LeetCode / DSA'}
        <label class="sr-only" for="practice-dsa-subcategory">DSA subtype</label>
        <select
          id="practice-dsa-subcategory"
          class="field h-9 w-48 py-1"
          value={selectedDsaSubcategory}
          on:change={handleDsaSubcategoryChange}
        >
          {#each dsaSubcategories as subcategory}
            <option value={subcategory}>{subcategory}</option>
          {/each}
        </select>
      {/if}
      {#if challenge}
        <button class="text-button" type="button" on:click={onReset}>
          <RotateCcw size={16} />
          Reset
        </button>
      {/if}
      <button class="primary-button" type="button" disabled={!canGenerate} on:click={onGenerate}>
        {#if isGenerating}
          <Loader2 class="animate-spin" size={16} />
        {:else}
          <Play size={16} />
        {/if}
        Generate
      </button>
    </div>
  </div>

  {#if error}
    <div class="mb-4 flex items-start gap-2 rounded-md border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
      <AlertCircle class="mt-0.5 shrink-0" size={16} />
      <p>{error}</p>
    </div>
  {/if}

  {#if !settingsReady}
    <div class="mb-4 rounded-md border border-line bg-raised p-3 text-sm text-steel">
      Set an Ollama model before generating practice.
    </div>
  {/if}

  {#if challenge}
    <article class="space-y-5">
      <p class="whitespace-pre-line text-sm leading-6 text-ink/90">{challenge.description}</p>
      <ChallengeList title="Requirements" items={challenge.requirements} />
      <ChallengeList title="Constraints" items={challenge.constraints} />
      <ChallengeList title="Stretch goals" items={challenge.stretchGoals} />
    </article>
  {:else}
    <div class="flex min-h-[300px] items-center justify-center rounded-md border border-dashed border-line bg-raised/45 p-6 text-center text-sm text-steel">
      <p>Pick a category and generate a realistic practice challenge. Then do the work here, in your editor, or wherever you think best.</p>
    </div>
  {/if}
</section>
