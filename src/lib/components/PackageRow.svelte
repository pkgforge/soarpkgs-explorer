<script lang="ts">
	import { base } from '$app/paths';
	import { archLabel, formatSize } from '$lib/format';
	import type { SearchEntry } from '$lib/types';

	let { entry, index }: { entry: SearchEntry; index: number } = $props();

	const href = $derived(`${base}/pkg/${entry.slug}/`);
</script>

<a class="row" {href} data-result={index} tabindex={index === 0 ? 0 : -1}>
	<span class="cell name-cell">
		<span class="name">{entry.name}</span>
		{#if entry.type}
			<span class="badge type-{entry.type}">{entry.type}</span>
		{/if}
	</span>
	<span class="cell desc">{entry.description ?? ''}</span>
	<span class="cell version">{entry.version}</span>
	<span class="cell size">{formatSize(entry.size)}</span>
	<span class="cell arches">
		{#each entry.arches as arch (arch)}
			<span class="arch">{archLabel(arch)}</span>
		{/each}
	</span>
</a>

<style>
	/* Column template is shared with the list header in +page.svelte. */
	.row {
		display: grid;
		grid-template-columns: minmax(195px, 1.2fr) minmax(0, 2.4fr) 96px 76px 120px;
		align-items: center;
		gap: 18px;
		padding: 13px 18px;
		color: var(--text);
		border-bottom: 1px solid var(--border);
	}

	.row:hover {
		text-decoration: none;
		background: var(--surface-2);
	}

	.cell {
		min-width: 0;
	}

	.name-cell {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.name {
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: 0.92rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		flex: none;
		padding: 1px 7px;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	.type-appimage {
		color: var(--accent-strong);
		background: var(--accent-soft);
		border-color: transparent;
	}

	.type-static {
		color: #b3852a;
		background: color-mix(in srgb, #b3852a 14%, transparent);
		border-color: transparent;
	}

	.desc {
		font-size: 0.86rem;
		color: var(--text-dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.version,
	.size {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--text-muted);
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.arches {
		display: inline-flex;
		gap: 4px;
	}

	.arch {
		padding: 0 6px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border-radius: 5px;
	}

	@media (max-width: 720px) {
		.row {
			grid-template-columns: 1fr auto;
			gap: 6px 12px;
			padding: 12px 14px;
		}

		.desc,
		.version {
			display: none;
		}

		.size {
			text-align: left;
		}
	}
</style>
