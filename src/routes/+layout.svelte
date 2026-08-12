<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { datasetMeta } from '$lib/catalog';
	import { initTheme } from '$lib/theme.svelte';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();
	let main = $state<HTMLElement | null>(null);

	onMount(() => {
		initTheme();
		delete document.documentElement.dataset.pending;
	});

	// SvelteKit restores the window's scroll, which no longer moves, so a new
	// page has to be taken back to the top here. Same-page navigations are the
	// listing rewriting its own query and are left where they are.
	afterNavigate(({ from, to }) => {
		if (from?.url.pathname !== to?.url.pathname) main?.scrollTo(0, 0);
	});

	// The content area is the scrollport now, so the header's raised state and
	// its progress line are driven from here rather than from the window, which
	// no longer scrolls.
	function onMainScroll(event: Event) {
		const el = event.currentTarget as HTMLElement;
		const root = document.documentElement;
		root.toggleAttribute('data-scrolled', el.scrollTop > 2);
		const travel = el.scrollHeight - el.clientHeight;
		root.style.setProperty('--scroll-progress', travel > 0 ? String(el.scrollTop / travel) : '0');
	}

	// Smooth cross-fade between pages where the browser supports it.
	onNavigate((navigation) => {
		const startViewTransition = document.startViewTransition?.bind(document);
		if (!startViewTransition) return;
		return new Promise((resolve) => {
			startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

<Header />

<main id="main" class="container page" bind:this={main} onscroll={onMainScroll}>
	{@render children()}
</main>

<footer class="site-footer">
	<div class="container foot">
		<span>
			Data from
			<a href="https://github.com/pkgforge/soarpkgs" rel="noreferrer">pkgforge/soarpkgs</a>
			· release <code>{datasetMeta.release}</code>
		</span>
		<span>
			Install with <a href="https://github.com/pkgforge/soar" rel="noreferrer">Soar</a>
		</span>
	</div>
</footer>

<style>
	.page {
		flex: 1;
		/* Without this a flex child refuses to shrink below its content, and
		   the page would scroll instead of this element. */
		min-height: 0;
		width: 100%;
		overflow-y: auto;
		/* The header's progress line reports the position instead, so the bar
		   itself is hidden and cannot shift the layout as content changes. */
		scrollbar-width: none;
		/* No top padding: a sticky child is held below it, which would leave a
		   band of scrolling content showing above the sticky element. Pages
		   space themselves from the header instead. */
		padding-block: 0 40px;
	}

	.site-footer {
		flex-shrink: 0;
		z-index: 40;
		min-height: var(--footer-h);
		display: flex;
		align-items: center;
		background: color-mix(in srgb, var(--bg) 86%, transparent);
		backdrop-filter: saturate(1.4) blur(10px);
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.82rem;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding-block: 10px;
	}

	.page::-webkit-scrollbar {
		display: none;
	}

	.foot code {
		color: var(--text-dim);
	}
</style>
