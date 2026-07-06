/**
 * Reactive browse layout preference (grid or list).
 *
 * This is a display preference rather than shareable state, so it is persisted
 * to localStorage. The value is applied to `<html>` before paint by an inline
 * script in `app.html` so the correct layout renders without a flash.
 */
export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'view';

let mode = $state<ViewMode>('grid');

/** Read the view mode already applied to the document (call once on mount). */
export function initView(): void {
	const applied = document.documentElement.dataset.view;
	mode = applied === 'list' ? 'list' : 'grid';
}

/** The current view mode (reactive). */
export function getView(): ViewMode {
	return mode;
}

/** Set, apply, and persist the view mode. */
export function setView(next: ViewMode): void {
	mode = next;
	document.documentElement.dataset.view = next;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Ignore storage failures.
	}
}
