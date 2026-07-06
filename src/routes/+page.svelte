<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import FacetGroup from '$lib/components/FacetGroup.svelte';
	import PackageCard from '$lib/components/PackageCard.svelte';
	import PackageRow from '$lib/components/PackageRow.svelte';
	import { datasetMeta, facets, searchEntries } from '$lib/catalog';
	import { getView, initView, setView } from '$lib/view.svelte';
	import { onMount } from 'svelte';
	import { archLabel } from '$lib/format';
	import {
		activeFilterCount,
		isDefaultState,
		parseState,
		queryEntries,
		toQueryString,
		type BrowseState,
		type FacetKey,
		type SortKey
	} from '$lib/search';

	// During prerender the query is unknown, so fall back to the default view;
	// the browser reads real URL state after hydration.
	const view = $derived(parseState(browser ? page.url.searchParams : new URLSearchParams()));
	const results = $derived(queryEntries(searchEntries, view));
	const filterCount = $derived(activeFilterCount(view));

	let gridEl = $state<HTMLElement | null>(null);
	let listEl = $state<HTMLElement | null>(null);
	let filtersOpen = $state(false);
	const viewMode = $derived(getView());
	// Both layouts are rendered; CSS shows one. Keyboard nav targets the active.
	const resultsEl = $derived(viewMode === 'list' ? listEl : gridEl);

	onMount(initView);

	const facetConfig: {
		key: FacetKey;
		title: string;
		options: string[];
		labelOf?: (v: string) => string;
	}[] = $derived([
		{ key: 'types', title: 'Format', options: facets.types },
		{ key: 'arches', title: 'Architecture', options: facets.arches, labelOf: archLabel },
		{ key: 'categories', title: 'Category', options: facets.categories },
		{ key: 'maintainers', title: 'Maintainer', options: facets.maintainers },
		{ key: 'tags', title: 'Tag', options: facets.tags }
	]);

	function apply(next: BrowseState) {
		goto(`${base}/${toQueryString(next)}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function toggleFacet(key: FacetKey, value: string) {
		const set = new Set(view[key]);
		if (set.has(value)) set.delete(value);
		else set.add(value);
		apply({ ...view, [key]: [...set] });
	}

	function clearFilters() {
		apply({ ...view, types: [], categories: [], tags: [], maintainers: [], arches: [] });
	}

	function setSort(event: Event) {
		apply({ ...view, sort: (event.currentTarget as HTMLSelectElement).value as SortKey });
	}

	function focusResult(index: number) {
		const el = resultsEl?.querySelector<HTMLElement>(`[data-result="${index}"]`);
		el?.focus();
	}

	function focusSearch() {
		document.querySelector<HTMLElement>('input[name="q"]')?.focus();
	}

	// Keyboard navigation: Arrow keys move focus through results, Enter opens.
	function onKeydown(event: KeyboardEvent) {
		if (!results.length || event.metaKey || event.ctrlKey || event.altKey) return;
		const active = document.activeElement as HTMLElement | null;
		const inSearch = active?.getAttribute('type') === 'search';
		const inResults = !!resultsEl && !!active && resultsEl.contains(active);
		const current = active?.hasAttribute('data-result')
			? Number(active.getAttribute('data-result'))
			: -1;

		if (event.key === 'ArrowDown' && (inSearch || inResults)) {
			event.preventDefault();
			focusResult(Math.min(results.length - 1, current + 1));
		} else if (event.key === 'ArrowUp' && inResults) {
			event.preventDefault();
			if (current <= 0) focusSearch();
			else focusResult(current - 1);
		}
	}

	const activeChips = $derived(
		facetConfig.flatMap((facet) =>
			view[facet.key].map((value) => ({
				key: facet.key,
				value,
				label: facet.labelOf ? facet.labelOf(value) : value
			}))
		)
	);
</script>

<svelte:head>
	<title>soarpkgs explorer</title>
	<meta
		name="description"
		content="Browse and search {datasetMeta.packageCount} packages from the pkgforge soarpkgs repository."
	/>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<div class="browse">
	<aside class="sidebar" class:open={filtersOpen}>
		<div class="sidebar-head">
			<h2>Filters</h2>
			{#if filterCount > 0}
				<button type="button" class="clear" onclick={clearFilters}>Clear ({filterCount})</button>
			{/if}
		</div>
		{#each facetConfig as facet (facet.key)}
			{#if facet.options.length > 0}
				<FacetGroup
					title={facet.title}
					options={facet.options}
					selected={view[facet.key]}
					labelOf={facet.labelOf}
					onToggle={(value) => toggleFacet(facet.key, value)}
				/>
			{/if}
		{/each}
	</aside>

	<section class="results-panel">
		<div class="toolbar">
			<button
				type="button"
				class="filters-btn"
				onclick={() => (filtersOpen = !filtersOpen)}
				aria-expanded={filtersOpen}
			>
				Filters{filterCount > 0 ? ` (${filterCount})` : ''}
			</button>
			<span class="count">
				{results.length}
				{results.length === 1 ? 'package' : 'packages'}
				{#if !isDefaultState(view)}<span class="of">of {datasetMeta.packageCount}</span>{/if}
			</span>
			<label class="sort">
				<span>Sort</span>
				<select value={view.sort} onchange={setSort}>
					<option value="name">Name</option>
					<option value="size">Size</option>
					<option value="updated">Recently built</option>
				</select>
			</label>

			<div class="view-toggle" role="group" aria-label="View mode">
				<button
					type="button"
					class:active={viewMode === 'grid'}
					aria-pressed={viewMode === 'grid'}
					aria-label="Grid view"
					onclick={() => setView('grid')}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
						<rect
							x="3.5"
							y="3.5"
							width="7"
							height="7"
							rx="1.5"
							stroke="currentColor"
							stroke-width="1.7"
						/>
						<rect
							x="13.5"
							y="3.5"
							width="7"
							height="7"
							rx="1.5"
							stroke="currentColor"
							stroke-width="1.7"
						/>
						<rect
							x="3.5"
							y="13.5"
							width="7"
							height="7"
							rx="1.5"
							stroke="currentColor"
							stroke-width="1.7"
						/>
						<rect
							x="13.5"
							y="13.5"
							width="7"
							height="7"
							rx="1.5"
							stroke="currentColor"
							stroke-width="1.7"
						/>
					</svg>
				</button>
				<button
					type="button"
					class:active={viewMode === 'list'}
					aria-pressed={viewMode === 'list'}
					aria-label="List view"
					onclick={() => setView('list')}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
						<path
							d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>
		</div>

		{#if activeChips.length > 0}
			<div class="chips">
				{#each activeChips as chip (chip.key + chip.value)}
					<button type="button" class="chip" onclick={() => toggleFacet(chip.key, chip.value)}>
						{chip.label}
						<span class="x" aria-hidden="true">×</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if results.length === 0}
			<div class="empty">
				<svg viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden="true">
					<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6" />
					<path
						d="m16.5 16.5 4 4"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
					/>
					<path d="M8.5 11h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
				<p class="empty-title">No packages found</p>
				<p>Try a different search or clear your filters.</p>
			</div>
		{:else}
			<div class="grid" bind:this={gridEl}>
				{#each results as entry, index (entry.slug)}
					<PackageCard {entry} {index} />
				{/each}
			</div>
			<div class="list">
				<div class="list-head" aria-hidden="true">
					<span>Package</span>
					<span>Description</span>
					<span class="r">Version</span>
					<span class="r">Size</span>
					<span>Arch</span>
				</div>
				<div class="list-rows" bind:this={listEl}>
					{#each results as entry, index (entry.slug)}
						<PackageRow {entry} {index} />
					{/each}
				</div>
			</div>
		{/if}
	</section>
</div>

<style>
	.browse {
		display: grid;
		grid-template-columns: 232px minmax(0, 1fr);
		gap: 28px;
		align-items: start;
	}

	.sidebar {
		position: sticky;
		top: calc(var(--header-h) + 20px);
		max-height: calc(100dvh - var(--header-h) - var(--footer-h) - 28px);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-right: 8px;
	}

	.results-panel {
		min-width: 0;
	}

	.sidebar-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 4px;
	}

	.sidebar-head h2 {
		font-size: 0.95rem;
	}

	.clear {
		font-size: 0.78rem;
		color: var(--accent-strong);
		background: none;
		border: none;
	}

	.clear:hover {
		text-decoration: underline;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 16px;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.86rem;
		color: var(--text-dim);
	}

	.count .of {
		color: var(--text-muted);
	}

	.sort {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.sort select {
		font: inherit;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 5px 8px;
	}

	.filters-btn {
		display: none;
		font-size: 0.82rem;
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 6px 12px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 8px 3px 10px;
		font-size: 0.8rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	.chip:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}

	.chip .x {
		font-size: 1rem;
		line-height: 1;
		color: var(--text-muted);
	}

	.view-toggle {
		display: inline-flex;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.view-toggle button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 30px;
		color: var(--text-muted);
		background: var(--surface);
		border: none;
		transition:
			color var(--transition),
			background var(--transition);
	}

	.view-toggle button + button {
		border-left: 1px solid var(--border);
	}

	.view-toggle button:hover {
		color: var(--text-dim);
	}

	.view-toggle button.active {
		color: var(--accent-strong);
		background: var(--accent-soft);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 14px;
	}

	/* Layout is chosen by the pre-paint `data-view` attribute to avoid a flash;
	   the default (no attribute / no JS) shows the grid. */
	.list {
		display: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	:global(html[data-view='list']) .grid {
		display: none;
	}

	:global(html[data-view='list']) .list {
		display: block;
	}

	/* Column template must match PackageRow. */
	.list-head {
		display: grid;
		grid-template-columns: minmax(195px, 1.2fr) minmax(0, 2.4fr) 96px 76px 120px;
		gap: 18px;
		padding: 10px 18px;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		background: var(--surface-2);
		border-bottom: 1px solid var(--border);
	}

	.list-head .r {
		text-align: right;
	}

	.list-rows :global(.row:last-child) {
		border-bottom: none;
	}

	@media (max-width: 720px) {
		.list-head {
			grid-template-columns: 1fr auto;
		}

		.list-head span:nth-child(2),
		.list-head span:nth-child(3) {
			display: none;
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 64px 24px;
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
	}

	.empty svg {
		margin-bottom: 6px;
		color: var(--text-muted);
		opacity: 0.7;
	}

	.empty-title {
		font-family: var(--font-mono);
		font-size: 1.05rem;
		color: var(--text-dim);
		margin-bottom: 4px;
	}

	@media (max-width: 800px) {
		.browse {
			grid-template-columns: 1fr;
		}

		.filters-btn {
			display: inline-block;
		}

		.sidebar {
			display: none;
			position: static;
		}

		.sidebar.open {
			display: block;
			margin-bottom: 8px;
			padding: 4px 14px 14px;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: var(--radius);
		}
	}
</style>
