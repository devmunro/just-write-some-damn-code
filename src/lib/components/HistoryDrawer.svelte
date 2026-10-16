<script lang="ts">
  import { Clock3 } from '@lucide/svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import type { ChallengeHistoryItem } from '$lib/domain/types';

  export let history: ChallengeHistoryItem[];
  export let onClose: () => void;
</script>

<Drawer title="History" {onClose}>
  {#if history.length}
    <div class="space-y-3">
      {#each history as item}
        <article class="rounded-md border border-line bg-raised p-3">
          <div class="mb-2 flex items-center gap-2 text-xs text-steel">
            <Clock3 size={14} />
            <time datetime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
          </div>
          <pre class="max-h-44 overflow-auto whitespace-pre-wrap font-sans text-sm leading-5">{item.challengeText}</pre>
        </article>
      {/each}
    </div>
  {:else}
    <p class="rounded-md border border-dashed border-line bg-raised p-4 text-sm text-steel">No challenge history yet.</p>
  {/if}
</Drawer>
