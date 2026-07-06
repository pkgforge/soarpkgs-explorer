/**
 * Ambient types for the build-time generated dataset.
 *
 * The JSON is produced by `bun run data` into `src/lib/generated/`. Declaring
 * the modules here gives them precise types and lets type-checking succeed
 * before the data has been generated.
 */
declare module '$lib/generated/packages.json' {
	import type { Package } from '$lib/types';
	const value: Package[];
	export default value;
}

declare module '$lib/generated/search-index.json' {
	import type { SearchEntry } from '$lib/types';
	const value: SearchEntry[];
	export default value;
}

declare module '$lib/generated/facets.json' {
	import type { Facets } from '$lib/types';
	const value: Facets;
	export default value;
}

declare module '$lib/generated/meta.json' {
	import type { DatasetMeta } from '$lib/types';
	const value: DatasetMeta;
	export default value;
}
