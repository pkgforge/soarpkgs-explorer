/**
 * Shared data model for the soarpkgs explorer.
 *
 * These types describe the normalized dataset produced by the build-time
 * metadata pipeline and consumed by the app when prerendering pages.
 */

/** Supported target architectures, matching soarpkgs release asset names. */
export type Arch = 'x86_64-linux' | 'aarch64-linux';

/** A program produced by a package. */
export interface Provide {
	name: string;
	strategy: string | null;
	symlink_to_bin: boolean;
	target: string | null;
}

/** A package maintainer. */
export interface Maintainer {
	name: string;
	contact: string;
}

/** Per-architecture build and download details that can differ across arches. */
export interface ArchBuild {
	version: string;
	size: number | null;
	download_url: string;
	ghcr_pkg: string | null;
	ghcr_url: string | null;
	ghcr_size: number | null;
	ghcr_blob: string | null;
	bsum: string | null;
	build_id: string | null;
	build_date: string | null;
	build_script: string | null;
}

/** A canonical package, merged across the architectures it is available for. */
export interface Package {
	slug: string;
	pkg_name: string;
	pkg_id: string;
	pkg_family: string | null;
	pkg_type: string | null;
	app_id: string | null;
	description: string | null;
	homepages: string[];
	source_urls: string[];
	licenses: string[];
	categories: string[];
	tags: string[];
	notes: string[];
	provides: Provide[];
	maintainers: Maintainer[];
	desktop_integration: boolean | null;
	portable: boolean | null;
	arches: Arch[];
	builds: Partial<Record<Arch, ArchBuild>>;
}

/** Trimmed package entry used for client-side browsing and search. */
export interface SearchEntry {
	slug: string;
	name: string;
	id: string;
	type: string | null;
	description: string | null;
	categories: string[];
	tags: string[];
	maintainers: string[];
	arches: Arch[];
	version: string;
	size: number | null;
}

/** Precomputed facet values for filtering the listing. */
export interface Facets {
	types: string[];
	categories: string[];
	tags: string[];
	maintainers: string[];
	arches: Arch[];
}

/** Metadata about a dataset build. */
export interface DatasetMeta {
	release: string;
	builtAt: string;
	arches: Arch[];
	packageCount: number;
}
