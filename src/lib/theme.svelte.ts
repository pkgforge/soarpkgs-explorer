/**
 * Reactive light/dark theme state.
 *
 * The initial theme is applied before paint by an inline script in `app.html`;
 * this module keeps a reactive copy for the UI and persists user overrides.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

let theme = $state<Theme>('dark');

function systemTheme(): Theme {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Read the theme already applied to the document (set by the inline script). */
export function initTheme(): void {
	const applied = document.documentElement.dataset.theme;
	theme = applied === 'light' || applied === 'dark' ? applied : systemTheme();
}

/** The current theme (reactive). */
export function getTheme(): Theme {
	return theme;
}

/** Set, apply, and persist the theme. */
export function setTheme(next: Theme): void {
	theme = next;
	document.documentElement.dataset.theme = next;
	document.documentElement.style.colorScheme = next;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Ignore storage failures (private mode, etc).
	}
}

/** Toggle between light and dark. */
export function toggleTheme(): void {
	setTheme(theme === 'dark' ? 'light' : 'dark');
}
