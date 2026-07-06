/**
 * Server-only access to the full package dataset.
 *
 * This module imports the large `packages.json`; keeping it `.server` ensures
 * the full dataset is only used while prerendering and never shipped to the
 * client. Each prerendered page serializes just the data it returns.
 */
import packages from '$lib/generated/packages.json';
import meta from '$lib/generated/meta.json';
import type { DatasetMeta, Package } from '$lib/types';

const bySlug = new Map(packages.map((pkg) => [pkg.slug, pkg]));

/** All packages, sorted by name. */
export function allPackages(): Package[] {
	return packages;
}

/** Every package slug, for prerender entry generation. */
export function packageSlugs(): string[] {
	return packages.map((pkg) => pkg.slug);
}

/** Look up a package by its slug. */
export function packageBySlug(slug: string): Package | undefined {
	return bySlug.get(slug);
}

/** Metadata about the current dataset build. */
export function datasetMeta(): DatasetMeta {
	return meta;
}
