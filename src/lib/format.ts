/** Small presentation helpers shared across the UI. */
import type { Arch, Package } from '$lib/types';

type PackageRef = Pick<Package, 'pkg_name'>;

/**
 * How soar is asked for this package.
 *
 * A name is enough: soarpkgs no longer publishes the family or id that the
 * `family/name` and `name#id` forms disambiguated with.
 */
export function packageRef(pkg: PackageRef): string {
	return pkg.pkg_name;
}

/** The `soar install` command for a package. */
export function installCommand(pkg: PackageRef): string {
	return `soar install ${packageRef(pkg)}`;
}

/**
 * A `soar://` link that hands the package to a local soar.
 *
 * soar refuses anything outside a plain package query, so the reference is
 * passed through as-is rather than escaped into something it would reject.
 */
export function soarLink(pkg: PackageRef, version?: string): string {
	const ref = packageRef(pkg);
	return `soar://install/${version ? `${ref}@${version}` : ref}`;
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
