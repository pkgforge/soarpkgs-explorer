/** Small presentation helpers shared across the UI. */
import type { Arch, Package } from '$lib/types';

type PackageRef = Pick<Package, 'slug' | 'pkg_name' | 'pkg_id'>;

/**
 * Unambiguous soar package reference.
 *
 * Soar accepts `name#pkg_id@version:repo`; the `#pkg_id` form is used only when
 * the package name is shared by more than one package (its slug differs from
 * the name), so commands stay unambiguous.
 */
export function packageRef(pkg: PackageRef): string {
	return pkg.slug === pkg.pkg_name ? pkg.pkg_name : `${pkg.pkg_name}#${pkg.pkg_id}`;
}

/** The `soar install` command for a package. */
export function installCommand(pkg: PackageRef): string {
	return `soar install ${packageRef(pkg)}`;
}

/** The `soar run` command (runs without installing to PATH). */
export function runCommand(pkg: PackageRef): string {
	return `soar run ${packageRef(pkg)}`;
}

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

/** Resolve a `{{version}}` placeholder in a URL template. */
export function resolveVersion(template: string, version: string): string {
	return template.replaceAll('{{version}}', version);
}

/** Host label for a URL, e.g. `https://alacritty.org/x` -> `alacritty.org`. */
export function hostLabel(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

/** Format an ISO timestamp as a short calendar date. */
export function formatDate(iso: string | null): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
