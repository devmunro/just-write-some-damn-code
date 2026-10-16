<script lang="ts">
  import { X } from '@lucide/svelte';

  export let title: string;
  export let onClose: () => void;
</script>

<div class="fixed inset-0 z-40 bg-black/60" role="presentation" on:click={onClose}></div>
<aside class="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-4 shadow-xl">
  <div class="mb-4 flex items-center justify-between gap-3">
    <h2 class="text-lg font-bold">{title}</h2>
    <button class="icon-button" type="button" title="Close" aria-label="Close" on:click={onClose}>
      <X size={18} />
    </button>
  </div>
  <slot />
</aside>
