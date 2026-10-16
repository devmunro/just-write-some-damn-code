<script lang="ts">
  import { CheckCircle2 } from '@lucide/svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import type { OllamaSettings } from '$lib/domain/types';
  import { isLocalOllamaUrl } from '$lib/practice/repository';
  import { checkOllama } from '$lib/ai/ollama';

  export let settings: OllamaSettings;
  export let onClose: () => void;
  export let onSave: (settings: OllamaSettings) => void;
  let draft = { ...settings };
  let availableModels: string[] = [];
  let checking = false;
  let connectionError = '';
  $: valid = isLocalOllamaUrl(draft.baseUrl) && draft.model.trim().length > 0;

  async function findModels() {
    checking = true;
    connectionError = '';
    try {
      availableModels = await checkOllama({ ...draft, model: draft.model || 'local-check' });
      if (!availableModels.length) connectionError = 'Ollama is reachable, but no models are installed yet.';
      else if (!availableModels.includes(draft.model)) draft.model = availableModels[0];
    } catch (cause) { connectionError = cause instanceof Error ? cause.message : String(cause); }
    finally { checking = false; }
  }

  function save() {
    if (valid) onSave({ baseUrl: draft.baseUrl.trim(), model: draft.model.trim() });
  }
</script>

<Drawer title="Local AI settings" {onClose}>
  <div class="space-y-4">
    <p class="text-sm text-steel">AI requests go only to an Ollama service running on this computer. AI is optional; challenges, editing, and local saving work without it.</p>
    <label class="block">
      <span class="mb-1 block text-sm font-semibold">Ollama local URL</span>
      <input class="field" bind:value={draft.baseUrl} placeholder="http://localhost:11434" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-semibold">Installed model name</span>
      {#if availableModels.length}
        <select class="field" bind:value={draft.model}>{#each availableModels as model}<option value={model}>{model}</option>{/each}</select>
      {:else}
        <input class="field" bind:value={draft.model} placeholder="e.g. llama3.1:8b" />
      {/if}
    </label>
    <button class="text-button" type="button" disabled={checking || !isLocalOllamaUrl(draft.baseUrl)} on:click={findModels}>{#if checking}<span class="spin">◌</span>{:else}Find installed models{/if}</button>
    {#if connectionError}<p class="text-sm text-amber-200">{connectionError}</p>{/if}
    {#if !isLocalOllamaUrl(draft.baseUrl)}<p class="text-sm text-red-300">Use localhost, 127.0.0.1, or ::1 over HTTP.</p>{/if}
    <button class="primary-button" type="button" disabled={!valid} on:click={save}><CheckCircle2 size={16} />Save local settings</button>
  </div>
</Drawer>
