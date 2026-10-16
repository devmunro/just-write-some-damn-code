<script lang="ts">
  import { Check, Clock3 } from '@lucide/svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import type { PassedExerciseHistoryItem } from '$lib/domain/types';

  export let history: PassedExerciseHistoryItem[];
  export let onClose: () => void;
</script>

<Drawer title="History" {onClose}>
  {#if history.length}
    <div class="space-y-2">
      {#each history as item}
        <article class="flex items-center gap-3 rounded-md border border-line bg-raised p-3">
          <Check size={15} class="shrink-0 text-action" />
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-sm font-medium text-white">{item.title}</h2>
            <div class="mt-1 flex items-center gap-2 text-xs text-steel">
              <Clock3 size={12} />
              <time datetime={item.passedAt}>{new Date(item.passedAt).toLocaleString()}</time>
              <span>· {item.language}</span>
            </div>
          </div>
          <span class="shrink-0 text-xs text-action">Passed</span>
        </article>
      {/each}
    </div>
  {:else}
    <p class="rounded-md border border-dashed border-line bg-raised p-4 text-sm text-steel">Passed exercises will show up here.</p>
  {/if}
</Drawer>
