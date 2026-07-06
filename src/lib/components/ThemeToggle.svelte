<script lang="ts">
	import { getTheme, toggleTheme } from '$lib/theme.svelte';

	const theme = $derived(getTheme());
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={toggleTheme}
	aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} theme"
	title="Toggle theme"
>
	{#if theme === 'dark'}
		<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7" />
			<path
				d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
			<path
				d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		color: var(--text-dim);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		transition:
			color var(--transition),
			border-color var(--transition),
			background var(--transition);
	}

	.theme-toggle:hover {
		color: var(--accent-strong);
		border-color: var(--border-strong);
		background: var(--surface-2);
	}
</style>
