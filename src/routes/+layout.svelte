<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { datasetMeta } from '$lib/catalog';
	import { initTheme } from '$lib/theme.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(initTheme);
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
		min-height: calc(100dvh - var(--header-h) - 64px);
		padding-block: 28px 48px;
	}

	.site-footer {
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px;
		padding-block: 20px;
	}

	.foot code {
		color: var(--text-dim);
	}
</style>
