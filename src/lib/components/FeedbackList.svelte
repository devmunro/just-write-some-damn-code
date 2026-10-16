<script lang="ts">
  import { CheckCircle2 } from '@lucide/svelte';

  export let title: string;
  export let items: string[];
  export let positive = false;
</script>

<section>
  <h4 class="mb-2 text-sm font-bold">{title}</h4>
  <ul class="space-y-2">
    {#each items as item}
      <li class="flex gap-2 rounded-md border border-line bg-raised px-3 py-2 text-sm leading-5">
        {#if positive}
          <CheckCircle2 class="mt-0.5 shrink-0 text-action" size={15} />
        {/if}
        <span>{item}</span>
      </li>
    {/each}
  </ul>
</section>
