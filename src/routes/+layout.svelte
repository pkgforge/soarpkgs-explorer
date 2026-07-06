<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { datasetMeta } from '$lib/catalog';
	import { initTheme } from '$lib/theme.svelte';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(initTheme);

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

<main id="main" class="container page">
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
		width: 100%;
		padding-block: 28px 40px;
	}

	.site-footer {
		position: sticky;
		bottom: 0;
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

	.foot code {
		color: var(--text-dim);
	}
</style>
