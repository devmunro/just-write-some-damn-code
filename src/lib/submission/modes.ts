import type { PracticeCategory } from '$lib/domain/types';

export type SubmissionMode = 'code' | 'written';

export type EditorLanguage = 'typescript' | 'javascript' | 'python' | 'sql' | 'json' | 'rust' | 'markdown';

const codeFirstCategories = new Set<PracticeCategory>([
  'Build',
  'LeetCode / DSA',
  'Frontend',
  'Backend',
  'Debugging',
  'Refactoring'
]);

/**
 * Most practice is either implementation-heavy or explanation-heavy. Default
 * the editor accordingly, while still letting the user switch modes per task.
 */
export function defaultSubmissionMode(category: PracticeCategory): SubmissionMode {
  return codeFirstCategories.has(category) ? 'code' : 'written';
}

export function defaultLanguage(category: PracticeCategory): EditorLanguage {
  if (category === 'Database Design') return 'sql';
  if (category === 'Debugging' || category === 'Refactoring') return 'javascript';
  return defaultSubmissionMode(category) === 'code' ? 'typescript' : 'markdown';
}

export const editorLanguages: Array<{ value: EditorLanguage; label: string }> = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'rust', label: 'Rust' },
  { value: 'markdown', label: 'Markdown' }
];
