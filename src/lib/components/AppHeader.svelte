<script lang="ts">
  import { History, Settings } from '@lucide/svelte';

  export let onHistory: () => void;
  export let onSettings: () => void;
</script>

<header class="flex min-h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4">
  <div class="min-w-0">
    <p class="section-title">Practice Gym</p>
    <h1 class="truncate text-lg font-black">Just Write Some Damn Code</h1>
  </div>
  <div class="flex items-center gap-2">
    <button class="icon-button" type="button" title="History" aria-label="History" on:click={onHistory}>
      <History size={18} />
    </button>
    <button class="icon-button" type="button" title="Settings" aria-label="Settings" on:click={onSettings}>
      <Settings size={18} />
    </button>
  </div>
</header>
