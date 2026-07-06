/** Small presentation helpers shared across the UI. */
import type { Arch } from '$lib/types';

/** Format a byte count as a compact human-readable size. */
export function formatSize(bytes: number | null): string {
	if (bytes == null || bytes <= 0) return '—';
	const units = ['B', 'KB', 'MB', 'GB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	const rounded = value >= 100 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
	return `${rounded} ${units[unit]}`;
}

/** Short architecture label, e.g. `x86_64-linux` -> `x86_64`. */
export function archLabel(arch: Arch | string): string {
	return arch.replace(/-linux$/, '');
}

/** Format an ISO timestamp as a short calendar date. */
export function formatDate(iso: string | null): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
