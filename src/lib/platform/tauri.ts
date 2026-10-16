/**
 * Detects whether the app is running inside a Tauri webview.
 *
 * Browser-only Vite sessions are useful for UI work, but Tauri plugins and
 * commands are unavailable there. Keep that distinction explicit at call sites.
 */
export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
