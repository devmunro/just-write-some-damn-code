import type { PracticeLanguage } from '$lib/domain/types';

export type EditorLanguage = PracticeLanguage;
export const editorLanguages: Array<{ value: EditorLanguage; label: string }> = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'php', label: 'PHP' }
];

export const editorBehaviorProfiles: Record<EditorLanguage, {
  indentLabel: string;
  quoteLabel: string;
  syntaxNote: string;
}> = {
  python: {
    indentLabel: 'Indent Python blocks',
    quoteLabel: 'Close quotes',
    syntaxNote: 'Indentation follows Python colon blocks. Quotes and brackets use Python’s string and comment rules.'
  },
  javascript: {
    indentLabel: 'Indent JS blocks',
    quoteLabel: 'Close quotes and backticks',
    syntaxNote: 'Indentation follows JavaScript braces. Quote pairs include template literal backticks.'
  },
  typescript: {
    indentLabel: 'Indent TS blocks',
    quoteLabel: 'Close quotes and backticks',
    syntaxNote: 'Indentation follows TypeScript braces and comment blocks. Backticks close template literals.'
  },
  php: {
    indentLabel: 'Indent PHP braces',
    quoteLabel: 'Close quotes',
    syntaxNote: 'Indentation follows PHP braces and multiline brackets. Quote and bracket pairs stay out of strings and comments.'
  }
};

export function fileNameForLanguage(language: PracticeLanguage): string {
  return { python: 'main.py', javascript: 'main.js', typescript: 'main.ts', php: 'main.php' }[language];
}
