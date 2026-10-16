<script lang="ts">
  export let title: string;
  export let items: string[];
</script>

<section>
  <h4 class="mb-2 text-sm font-bold">{title}</h4>
  <ul class="space-y-2">
    {#each items as item}
      <li class="rounded-md border border-line bg-raised px-3 py-2 text-sm leading-5">{item}</li>
    {/each}
  </ul>
</section>
