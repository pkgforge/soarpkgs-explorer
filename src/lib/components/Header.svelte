<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { datasetMeta } from '$lib/catalog';
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let input = $state<HTMLInputElement | null>(null);
	let query = $state('');
	let scrolled = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function onScroll() {
		scrolled = window.scrollY > 2;
	}

	onMount(onScroll);

	const home = `${base}/`;
	const onHome = $derived(page.url.pathname === home);

	// Keep the field in sync with the URL query so search state is shareable.
	$effect(() => {
		query = page.url.searchParams.get('q') ?? '';
	});

	/** Preserve any active filters/sort while replacing just the query. */
	function urlWithQuery(q: string): string {
		const params = new URLSearchParams(page.url.search);
		if (q.trim()) params.set('q', q.trim());
		else params.delete('q');
		const search = params.toString();
		return search ? `${home}?${search}` : home;
	}

	function onInput() {
		if (!onHome) return;
		// Live-filter the browse page as the user types.
		clearTimeout(timer);
		timer = setTimeout(() => {
			goto(urlWithQuery(query), { replaceState: true, keepFocus: true, noScroll: true });
		}, 90);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		clearTimeout(timer);
		await goto(urlWithQuery(query), { keepFocus: true, noScroll: true });
	}

	function onSearchKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (query) {
			query = '';
			clearTimeout(timer);
			if (onHome) goto(urlWithQuery(''), { replaceState: true, keepFocus: true, noScroll: true });
		} else {
			input?.blur();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
		const el = event.target as HTMLElement | null;
		const tag = el?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
		event.preventDefault();
		input?.focus();
	}
</script>

<svelte:window onkeydown={onKeydown} onscroll={onScroll} />

<header class="site-header" class:scrolled>
	<div class="container bar">
		<a class="brand" href="/">
			<span class="prompt">$</span>
			<span class="name">soarpkgs</span>
			<span class="sub">explorer</span>
		</a>

		<form class="search" role="search" onsubmit={submit}>
			<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
				<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8" />
				<path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
			<input
				bind:this={input}
				bind:value={query}
				oninput={onInput}
				onkeydown={onSearchKeydown}
				type="search"
				name="q"
				placeholder="Search packages"
				aria-label="Search packages"
				autocomplete="off"
				spellcheck="false"
			/>
			<kbd>/</kbd>
		</form>

		<div class="actions">
			<span class="count">{datasetMeta.packageCount} pkgs</span>
			<ThemeToggle />
		</div>
	</div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: color-mix(in srgb, var(--bg) 86%, transparent);
		backdrop-filter: saturate(1.4) blur(10px);
		border-bottom: 1px solid var(--border);
		transition:
			border-color var(--transition),
			box-shadow var(--transition);
	}

	.site-header.scrolled {
		border-bottom-color: var(--border-strong);
		box-shadow:
			0 1px 0 var(--border),
			0 6px 20px rgb(0 0 0 / 0.06);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 16px;
		height: var(--header-h);
	}

	.brand {
		display: inline-flex;
		align-items: baseline;
		gap: 7px;
		font-family: var(--font-mono);
		color: var(--text);
	}

	.brand:hover {
		text-decoration: none;
	}

	.brand .prompt {
		color: var(--accent);
		font-weight: 700;
	}

	.brand .name {
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.brand .sub {
		color: var(--text-muted);
		font-size: 0.82em;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 0;
		max-width: 460px;
		margin-inline: auto;
		padding: 0 10px;
		height: 38px;
		color: var(--text-muted);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		transition:
			border-color var(--transition),
			box-shadow var(--transition);
	}

	.search:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.search .icon {
		flex: none;
	}

	.search input {
		flex: 1;
		min-width: 0;
		font: inherit;
		color: var(--text);
		background: none;
		border: none;
		outline: none;
	}

	.search input::placeholder {
		color: var(--text-muted);
	}

	.search input::-webkit-search-cancel-button {
		appearance: none;
	}

	.search kbd {
		flex: none;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.brand .sub,
		.search kbd,
		.count {
			display: none;
		}

		.search {
			max-width: none;
		}
	}
</style>
