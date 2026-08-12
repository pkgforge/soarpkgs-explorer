<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import FacetGroup from '$lib/components/FacetGroup.svelte';
	import PackageRow from '$lib/components/PackageRow.svelte';
	import { datasetMeta, facets, searchEntries } from '$lib/catalog';
	import { archLabel } from '$lib/format';
	import {
		activeFilterCount,
		isDefaultState,
		parseState,
		queryEntries,
		toQueryString,
		type BrowseState,
		type FacetKey,
		type SortKey,
		NATURAL_DIR
	} from '$lib/search';

	// During prerender the query is unknown, so fall back to the default view;
	// the browser reads real URL state after hydration.
	const view = $derived(parseState(browser ? page.url.searchParams : new URLSearchParams()));
	const results = $derived(queryEntries(searchEntries, view));
	const filterCount = $derived(activeFilterCount(view));

	let listEl = $state<HTMLElement | null>(null);
	// The column header pins below the toolbar, whose height moves with the
	// filter chips, so it is measured rather than assumed.
	let headHeight = $state(0);
	let filtersOpen = $state(false);

	const PER_PAGE = 50;
	const pageCount = $derived(Math.max(1, Math.ceil(results.length / PER_PAGE)));
	// A page beyond the end is reachable by editing the URL or by filtering a
	// long listing down, so read it back within range rather than showing none.
	const current = $derived(Math.min(view.page, pageCount));
	const visible = $derived(results.slice((current - 1) * PER_PAGE, current * PER_PAGE));
	const firstShown = $derived(results.length === 0 ? 0 : (current - 1) * PER_PAGE + 1);
	const lastShown = $derived(Math.min(current * PER_PAGE, results.length));

	// Lock background scroll while the mobile filters drawer is open.
	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = filtersOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	const facetConfig: {
		key: FacetKey;
		title: string;
		options: string[];
		labelOf?: (v: string) => string;
	}[] = $derived([
		{ key: 'types', title: 'Format', options: facets.types },
		{ key: 'arches', title: 'Architecture', options: facets.arches, labelOf: archLabel },
		{ key: 'categories', title: 'Category', options: facets.categories },
		{ key: 'maintainers', title: 'Maintainer', options: facets.maintainers }
	]);

	function apply(next: BrowseState) {
		goto(`${base}/${toQueryString(next)}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	// Any change to what is listed starts again from the first page.
	function applyFiltered(next: Omit<BrowseState, 'page'>) {
		apply({ ...next, page: 1 });
	}

	function goToPage(page: number) {
		apply({ ...view, page });
		// Back to the very top: scrolling the rows into view would tuck the
		// first of them under the pinned toolbar and column header.
		listEl?.closest('main')?.scrollTo(0, 0);
	}

	function toggleFacet(key: FacetKey, value: string) {
		const set = new Set(view[key]);
		if (set.has(value)) set.delete(value);
		else set.add(value);
		applyFiltered({ ...view, [key]: [...set] });
	}

	function clearFilters() {
		applyFiltered({ ...view, types: [], categories: [], maintainers: [], arches: [] });
	}

	function setSort(event: Event) {
		// A new key brings its own natural direction rather than inheriting
		// the last one, which would leave "Name" reading Z to A.
		const sort = (event.currentTarget as HTMLSelectElement).value as SortKey;
		applyFiltered({ ...view, sort, dir: NATURAL_DIR[sort] });
	}

	function toggleDir() {
		applyFiltered({ ...view, dir: view.dir === 'asc' ? 'desc' : 'asc' });
	}

	const dirLabel = $derived(
		view.sort === 'size'
			? view.dir === 'desc'
				? 'Largest first'
				: 'Smallest first'
			: view.dir === 'asc'
				? 'A to Z'
				: 'Z to A'
	);

	function focusResult(index: number) {
		listEl?.querySelector<HTMLElement>(`[data-result="${index}"]`)?.focus();
	}

	function focusSearch() {
		document.querySelector<HTMLElement>('input[name="q"]')?.focus();
	}

	// Keyboard navigation: Arrow keys move focus through results, Enter opens.
	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && filtersOpen) {
			filtersOpen = false;
			return;
		}
		if (!visible.length || event.metaKey || event.ctrlKey || event.altKey) return;
		const active = document.activeElement as HTMLElement | null;
		const inSearch = active?.getAttribute('type') === 'search';
		const inResults = !!listEl && !!active && listEl.contains(active);
		const focused = active?.hasAttribute('data-result')
			? Number(active.getAttribute('data-result'))
			: -1;

		if (event.key === 'ArrowDown' && (inSearch || inResults)) {
			event.preventDefault();
			focusResult(Math.min(visible.length - 1, focused + 1));
		} else if (event.key === 'ArrowUp' && inResults) {
			event.preventDefault();
			if (focused <= 0) focusSearch();
			else focusResult(focused - 1);
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
	{#if filtersOpen}
		<button
			type="button"
			class="scrim"
			aria-label="Close filters"
			onclick={() => (filtersOpen = false)}
		></button>
	{/if}
	<aside class="sidebar" class:open={filtersOpen}>
		<div class="sidebar-head">
			<h2>Filters</h2>
			<div class="sidebar-actions">
				{#if filterCount > 0}
					<button type="button" class="clear" onclick={clearFilters}>Clear ({filterCount})</button>
				{/if}
				<button
					type="button"
					class="drawer-close"
					aria-label="Close filters"
					onclick={() => (filtersOpen = false)}
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
						<path
							d="m6 6 12 12M18 6 6 18"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>
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
		<div class="panel-head" bind:clientHeight={headHeight}>
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
				<div class="sort">
					<label class="sort-label">
						<span>Sort</span>
						<select value={view.sort} onchange={setSort}>
							<option value="name">Name</option>
							<option value="size">Size</option>
						</select>
					</label>
					<button
						type="button"
						class="dir"
						onclick={toggleDir}
						title={dirLabel}
						aria-label={`Sort direction: ${dirLabel}`}
					>
						<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
							<path
								d="M8 3v10M8 13l-3.5-3.5M8 13l3.5-3.5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
								transform={view.dir === 'asc' ? 'rotate(180 8 8)' : ''}
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
		</div>

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
			<div class="list">
				<div class="list-head" style="top: {headHeight}px" aria-hidden="true">
					<span>Package</span>
					<span>Description</span>
					<span class="r">Version</span>
					<span class="r">Size</span>
					<span>Arch</span>
				</div>
				<div class="list-rows" bind:this={listEl}>
					{#each visible as entry, index (entry.slug)}
						<PackageRow {entry} {index} />
					{/each}
				</div>
			</div>

			{#if pageCount > 1}
				<nav class="pager" aria-label="Pagination">
					<button type="button" disabled={current === 1} onclick={() => goToPage(current - 1)}>
						Previous
					</button>
					<span class="pager-at">{firstShown}–{lastShown} of {results.length}</span>
					<button
						type="button"
						disabled={current === pageCount}
						onclick={() => goToPage(current + 1)}
					>
						Next
					</button>
				</nav>
			{/if}
		{/if}
	</section>
</div>

<style>
	/* Hidden rather than removed, so revealing it cannot shift the layout. */
	:global(html[data-pending]) .browse {
		visibility: hidden;
	}

	.browse {
		display: grid;
		grid-template-columns: 232px minmax(0, 1fr);
		gap: 28px;
		align-items: start;
	}

	.sidebar {
		position: sticky;
		/* Sticky within the content area, which is the scrollport now, so the
		   header no longer has to be accounted for in the offset. */
		top: 0;
		max-height: calc(100dvh - var(--header-h) - var(--footer-h) - 24px);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 12px 8px 0 0;
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

	.sidebar-actions {
		display: flex;
		align-items: center;
		gap: 10px;
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

	/* Drawer affordances, shown only on mobile. */
	.scrim {
		display: none;
	}

	.drawer-close {
		display: none;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	/* Held in place so scrolling moves the results and nothing else. The side
	   bleed keeps a card's hover lift from showing past its edges. */
	.panel-head {
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--bg);
		margin-inline: -8px;
		padding: 12px 8px 14px;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.86rem;
		color: var(--text-dim);
		white-space: nowrap;
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

	.sort-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.dir {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.dir:hover {
		color: var(--text);
		border-color: var(--text-dim);
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
		margin-top: 12px;
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

	.list {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		/* Clip, not hidden: `hidden` would make this a scroll container and the
		   column header would stick to it instead of to the content area. */
		overflow: clip;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		margin-top: 20px;
		font-size: 0.84rem;
		color: var(--text-muted);
	}

	.pager button {
		color: var(--text-dim);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 6px 14px;
		cursor: pointer;
	}

	.pager button:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}

	.pager button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.pager-at {
		font-family: var(--font-mono);
		font-size: 0.78rem;
	}

	/* Column template must match PackageRow. */
	.list-head {
		position: sticky;
		z-index: 10;
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

		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 55;
			padding: 0;
			background: rgb(0 0 0 / 0.5);
			border: none;
			animation: scrim-in 160ms ease;
		}

		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 60;
			width: min(320px, 84vw);
			max-height: none;
			padding: 18px 18px calc(18px + env(safe-area-inset-bottom));
			background: var(--surface);
			border-right: 1px solid var(--border);
			transform: translateX(-100%);
			transition: transform 220ms ease;
		}

		.sidebar.open {
			transform: translateX(0);
			box-shadow: 10px 0 40px rgb(0 0 0 / 0.28);
		}

		.drawer-close {
			display: inline-flex;
		}
	}

	@keyframes scrim-in {
		from {
			opacity: 0;
		}
	}

	@media (max-width: 540px) {
		.toolbar {
			flex-wrap: wrap;
			gap: 10px 12px;
		}

		.sort {
			margin-left: 0;
		}
	}
</style>
