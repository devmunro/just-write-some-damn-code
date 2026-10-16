<script lang="ts">
  import { CheckCircle2 } from '@lucide/svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import { defaultSettings, GEMINI_BASE_URL, OLLAMA_BASE_URL } from '$lib/settings/persistence';
  import { modelsForProvider, providerOptions } from '$lib/ai/models';
  import type { AIProvider, OllamaSettings } from '$lib/domain/types';

  export let settings: OllamaSettings;
  export let onClose: () => void;
  export let onSave: (settings: OllamaSettings) => void;

  let draft = { ...settings };
  $: modelList = modelsForProvider(draft.provider);

  function setProvider(provider: AIProvider) {
    draft = {
      ...draft,
      provider,
      model: '',
      apiKey: provider === 'gemini' ? draft.apiKey : '',
      baseUrl: provider === 'gemini' ? GEMINI_BASE_URL : OLLAMA_BASE_URL
    };
  }

  function save() {
    onSave({
      provider: draft.provider,
      baseUrl:
        draft.provider === 'gemini'
          ? GEMINI_BASE_URL
          : draft.baseUrl.trim() || defaultSettings.baseUrl,
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim()
    });
  }
</script>

<Drawer title="Settings" {onClose}>
  <div class="space-y-4">
    <label class="block">
      <span class="mb-1 block text-sm font-semibold">Provider</span>
      <select class="field" bind:value={draft.provider} on:change={(event) => setProvider((event.currentTarget as HTMLSelectElement).value as AIProvider)}>
        {#each providerOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>

    {#if draft.provider === 'gemini'}
      <label class="block">
        <span class="mb-1 block text-sm font-semibold">Gemini API key</span>
        <input class="field" bind:value={draft.apiKey} placeholder="Paste your Gemini API key here" type="password" />
      </label>
      <p class="text-xs text-steel">
        Antigravity Agent Preview is listed in the model menu for visibility, but it is not a good fit for this app's strict JSON review flow yet.
      </p>
    {:else}
      <label class="block">
        <span class="mb-1 block text-sm font-semibold">Ollama base URL</span>
        <input class="field" bind:value={draft.baseUrl} placeholder="http://localhost:11434" />
      </label>
    {/if}

    <label class="block">
      <span class="mb-1 block text-sm font-semibold">Model</span>
      <select class="field" bind:value={draft.model}>
        <option value="" disabled>Select a model</option>
        {#each modelList as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>
    <button class="primary-button" type="button" on:click={save}>
      <CheckCircle2 size={16} />
      Save
    </button>
  </div>
</Drawer>
