/**
 * Client-side browse state, filtering, ranking, and sorting.
 *
 * All functions are pure and operate on the prebuilt search index, so browsing
 * and search run entirely in the browser with no network requests.
 */
import type { SearchEntry } from '$lib/types';

export type SortKey = 'name' | 'size' | 'updated';

/** Facet keys and their URL query-parameter names. */
export const FACET_PARAMS = {
	types: 'type',
	categories: 'cat',
	tags: 'tag',
	maintainers: 'maint',
	arches: 'arch'
} as const;

export type FacetKey = keyof typeof FACET_PARAMS;

/** Decoded browse state, the single source of truth held in the URL. */
export interface BrowseState {
	q: string;
	types: string[];
	categories: string[];
	tags: string[];
	maintainers: string[];
	arches: string[];
	sort: SortKey;
}

const SORT_KEYS: SortKey[] = ['name', 'size', 'updated'];

function readList(params: URLSearchParams, name: string): string[] {
	const value = params.get(name);
	return value ? value.split(',').filter(Boolean) : [];
}

/** Parse browse state from URL search params. */
export function parseState(params: URLSearchParams): BrowseState {
	const sort = params.get('sort');
	return {
		q: params.get('q') ?? '',
		types: readList(params, FACET_PARAMS.types),
		categories: readList(params, FACET_PARAMS.categories),
		tags: readList(params, FACET_PARAMS.tags),
		maintainers: readList(params, FACET_PARAMS.maintainers),
		arches: readList(params, FACET_PARAMS.arches),
		sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : 'name'
	};
}

/** Serialize browse state to a query string (omitting defaults). */
export function toQueryString(state: BrowseState): string {
	const params = new URLSearchParams();
	if (state.q.trim()) params.set('q', state.q.trim());
	for (const key of Object.keys(FACET_PARAMS) as FacetKey[]) {
		if (state[key].length) params.set(FACET_PARAMS[key], state[key].join(','));
	}
	if (state.sort !== 'name') params.set('sort', state.sort);
	const query = params.toString();
	return query ? `?${query}` : '';
}

/** True when no search query, filters, or non-default sort are active. */
export function isDefaultState(state: BrowseState): boolean {
	return (
		!state.q.trim() &&
		state.sort === 'name' &&
		(Object.keys(FACET_PARAMS) as FacetKey[]).every((key) => state[key].length === 0)
	);
}

/** Count of active filter selections across all facets. */
export function activeFilterCount(state: BrowseState): number {
	return (Object.keys(FACET_PARAMS) as FacetKey[]).reduce((n, key) => n + state[key].length, 0);
}

function matchesFacet(values: string[], selected: string[]): boolean {
	return selected.length === 0 || values.some((v) => selected.includes(v));
}

function passesFilters(entry: SearchEntry, state: BrowseState): boolean {
	return (
		matchesFacet(entry.type ? [entry.type] : [], state.types) &&
		matchesFacet(entry.categories, state.categories) &&
		matchesFacet(entry.tags, state.tags) &&
		matchesFacet(entry.maintainers, state.maintainers) &&
		matchesFacet(entry.arches, state.arches)
	);
}

/** Score a single entry against a lowercased search token; 0 means no match. */
function scoreToken(entry: SearchEntry, token: string): number {
	const name = entry.name.toLowerCase();
	if (name === token) return 100;
	if (name.startsWith(token)) return 60;
	if (name.includes(token)) return 40;
	if (entry.id.toLowerCase().includes(token)) return 25;
	if (entry.tags.some((t) => t.toLowerCase().includes(token))) return 15;
	if (entry.categories.some((c) => c.toLowerCase().includes(token))) return 12;
	if (entry.description?.toLowerCase().includes(token)) return 8;
	if (entry.maintainers.some((m) => m.toLowerCase().includes(token))) return 5;
	return 0;
}

/** Score an entry against all query tokens; every token must match (AND). */
function scoreEntry(entry: SearchEntry, tokens: string[]): number {
	let total = 0;
	for (const token of tokens) {
		const score = scoreToken(entry, token);
		if (score === 0) return 0;
		total += score;
	}
	return total;
}

function compareBySort(a: SearchEntry, b: SearchEntry, sort: SortKey): number {
	switch (sort) {
		case 'size':
			return (b.size ?? 0) - (a.size ?? 0) || a.name.localeCompare(b.name);
		case 'updated':
			return (b.updated ?? '').localeCompare(a.updated ?? '') || a.name.localeCompare(b.name);
		default:
			return a.name.localeCompare(b.name);
	}
}

/**
 * Apply filters, search ranking, and sorting to the index.
 * When a query is present, results are ordered by relevance; otherwise by the
 * chosen sort key.
 */
export function queryEntries(entries: SearchEntry[], state: BrowseState): SearchEntry[] {
	const filtered = entries.filter((entry) => passesFilters(entry, state));
	const tokens = state.q.toLowerCase().split(/\s+/).filter(Boolean);

	if (tokens.length === 0) {
		return filtered.sort((a, b) => compareBySort(a, b, state.sort));
	}

	return filtered
		.map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
		.filter((ranked) => ranked.score > 0)
		.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
		.map((ranked) => ranked.entry);
}
