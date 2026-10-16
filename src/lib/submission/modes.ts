import type { PracticeLanguage } from '$lib/domain/types';

export type EditorLanguage = PracticeLanguage;
export const editorLanguages: Array<{ value: EditorLanguage; label: string }> = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'php', label: 'PHP' }
];

export function fileNameForLanguage(language: PracticeLanguage): string {
  return { python: 'main.py', javascript: 'main.js', typescript: 'main.ts', php: 'main.php' }[language];
}
