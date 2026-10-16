<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type * as Monaco from 'monaco-editor';
  import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
  import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
  import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
  import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
  import type { EditorLanguage } from '$lib/submission/modes';

  export let value: string;
  export let language: EditorLanguage;

  let container: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let monaco: typeof Monaco | null = null;

  type MonacoEnvironmentConfig = {
    getWorker(workerId: string, label: string): Worker;
  };

  onMount(async () => {
    configureWorkers();
    monaco = await import('monaco-editor');
    editor = monaco.editor.create(container, {
      value,
      language,
      automaticLayout: true,
      fontSize: 13,
      lineHeight: 20,
      minimap: { enabled: false },
      padding: { top: 12, bottom: 12 },
      scrollBeyondLastLine: false,
      theme: 'vs-dark',
      wordWrap: 'on'
    });

    editor.onDidChangeModelContent(() => {
      value = editor?.getValue() ?? '';
    });
  });

  onDestroy(() => {
    editor?.dispose();
  });

  $: if (editor && value !== editor.getValue()) {
    editor.setValue(value);
  }

  $: if (editor && monaco) {
    const model = editor.getModel();
    if (model && model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
  }

  function configureWorkers() {
    const monacoGlobal = globalThis as typeof globalThis & {
      MonacoEnvironment?: MonacoEnvironmentConfig;
    };

    monacoGlobal.MonacoEnvironment = {
      getWorker(_workerId: string, label: string) {
        if (label === 'json') return new JsonWorker();
        if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
        if (label === 'typescript' || label === 'javascript') return new TsWorker();
        return new EditorWorker();
      }
    };
  }
</script>

<div class="h-80 overflow-hidden rounded-md border border-line bg-[#1e1e1e]">
  <div bind:this={container} class="h-full w-full"></div>
</div>
