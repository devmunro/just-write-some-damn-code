<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type * as Monaco from 'monaco-editor';
  import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
  import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
  import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
  import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
  import type { EditorLanguage } from '$lib/submission/modes';
  import type { EditorPreferences } from '$lib/domain/types';

  export let value: string;
  export let language: EditorLanguage;
  export let preferences: EditorPreferences = { autoIndent: true, autoCloseBrackets: true, autoCloseQuotes: true };
  const dispatch = createEventDispatcher<{
    input: string;
    typography: { fontSize: number; lineHeight: number };
    editorfocus: true;
    editorblur: true;
  }>();

  let container: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let monaco: typeof Monaco | null = null;

  type MonacoEnvironmentConfig = {
    getWorker(workerId: string, label: string): Worker;
  };

  onMount(async () => {
    configureWorkers();
    monaco = await import('monaco-editor');
    configurePhpBehavior(monaco);
    monaco.editor.defineTheme('jwsdc-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
        'editorGutter.background': '#000000',
        'editorLineNumber.foreground': '#515151',
        'editorLineNumber.activeForeground': '#a7a7a7',
        'editorCursor.foreground': '#81d4ad',
        'editor.lineHighlightBackground': '#080808',
        'editor.selectionBackground': '#24533d80',
        'editor.inactiveSelectionBackground': '#19352760',
        'editorWidget.background': '#090909',
        'editorSuggestWidget.background': '#090909'
      }
    });
    editor = monaco.editor.create(container, {
      value,
      language,
      automaticLayout: true,
      fontSize: 15,
      mouseWheelZoom: true,
      ariaLabel: 'Code space',
      lineHeight: 24,
      minimap: { enabled: false },
      padding: { top: 12, bottom: 12 },
      scrollBeyondLastLine: false,
      theme: 'jwsdc-black',
      wordWrap: 'on',
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      inlineSuggest: { enabled: false },
      wordBasedSuggestions: 'off',
      parameterHints: { enabled: false },
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      snippetSuggestions: 'none',
      autoIndent: preferences.autoIndent ? 'full' : 'none',
      autoClosingBrackets: preferences.autoCloseBrackets ? 'languageDefined' : 'never',
      autoClosingQuotes: preferences.autoCloseQuotes ? 'languageDefined' : 'never'
    });
    const codeEditor = editor;
    const fontSizeOption = monaco.editor.EditorOption.fontSize;
    const lineHeightOption = monaco.editor.EditorOption.lineHeight;
    const reportTypography = () => {
      dispatch('typography', {
        fontSize: codeEditor.getOption(fontSizeOption),
        lineHeight: codeEditor.getOption(lineHeightOption)
      });
    };

    codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {});
    codeEditor.onDidChangeConfiguration((event) => {
      if (event.hasChanged(fontSizeOption)) {
        const fontSize = codeEditor.getOption(fontSizeOption);
        const matchingLineHeight = Math.round(fontSize * 1.6);
        if (codeEditor.getOption(lineHeightOption) !== matchingLineHeight) {
          codeEditor.updateOptions({ lineHeight: matchingLineHeight });
        }
      }

      if (event.hasChanged(fontSizeOption) || event.hasChanged(lineHeightOption)) {
        reportTypography();
      }
    });
    reportTypography();

    codeEditor.onDidChangeModelContent(() => {
      value = editor?.getValue() ?? '';
      dispatch('input', value);
    });
    codeEditor.onDidFocusEditorText(() => dispatch('editorfocus', true));
    codeEditor.onDidBlurEditorText(() => dispatch('editorblur', true));
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

  $: if (editor) {
    editor.updateOptions({
      autoIndent: preferences.autoIndent ? 'full' : 'none',
      autoClosingBrackets: preferences.autoCloseBrackets ? 'languageDefined' : 'never',
      autoClosingQuotes: preferences.autoCloseQuotes ? 'languageDefined' : 'never',
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      inlineSuggest: { enabled: false },
      wordBasedSuggestions: 'off',
      parameterHints: { enabled: false },
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      snippetSuggestions: 'none'
    });
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

  function configurePhpBehavior(monacoApi: typeof Monaco) {
    monacoApi.languages.setLanguageConfiguration('php', {
      comments: { lineComment: '//' },
      brackets: [['{', '}'], ['[', ']'], ['(', ')']],
      autoClosingPairs: [
        { open: '{', close: '}', notIn: ['string', 'comment'] },
        { open: '[', close: ']', notIn: ['string', 'comment'] },
        { open: '(', close: ')', notIn: ['string', 'comment'] },
        { open: '"', close: '"', notIn: ['string', 'comment'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      indentationRules: {
        increaseIndentPattern: /^.*(?:\{[^}]*|\([^)]*|\[[^\]]*)$/,
        decreaseIndentPattern: /^\s*(?:\}|\]|\))/
      },
      onEnterRules: [
        {
          beforeText: /^\s*(?:if|elseif|else|for|foreach|while|switch|catch|function|class|interface|trait|enum|namespace)\b.*\{[^}]*$/,
          afterText: /^\s*\}/,
          action: { indentAction: monacoApi.languages.IndentAction.IndentOutdent }
        }
      ],
      folding: {
        markers: {
          start: /^\s*(?:#|\/\/)region\b/,
          end: /^\s*(?:#|\/\/)endregion\b/
        }
      }
    });
  }
</script>

<div class="h-full w-full overflow-hidden bg-black">
  <div bind:this={container} class="h-full w-full"></div>
</div>
