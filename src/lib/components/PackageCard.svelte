<script lang="ts">
	import { base } from '$app/paths';
	import { archLabel, formatSize } from '$lib/format';
	import type { SearchEntry } from '$lib/types';

	let { entry, index }: { entry: SearchEntry; index: number } = $props();

	const href = $derived(`${base}/pkg/${entry.slug}/`);
</script>

<a class="card" {href} data-result={index} tabindex={index === 0 ? 0 : -1}>
	<div class="head">
		<span class="name">{entry.name}</span>
		{#if entry.type}
			<span class="badge type-{entry.type}">{entry.type}</span>
		{/if}
	</div>

	{#if entry.description}
		<p class="desc">{entry.description}</p>
	{/if}

	<div class="meta">
		<span class="version" title="version">{entry.version}</span>
		<span class="dot">·</span>
		<span class="size">{formatSize(entry.size)}</span>
		<span class="arches">
			{#each entry.arches as arch (arch)}
				<span class="arch">{archLabel(arch)}</span>
			{/each}
		</span>
	</div>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px 16px;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition:
			border-color var(--transition),
			box-shadow var(--transition),
			transform var(--transition);
	}

	.card:hover {
		text-decoration: none;
		border-color: var(--border-strong);
		box-shadow: var(--shadow);
		transform: translateY(-1px);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.name {
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: 1.02rem;
		letter-spacing: -0.01em;
	}

	.badge {
		margin-left: auto;
		padding: 1px 8px;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
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
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-dim);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px 8px;
		margin-top: auto;
		font-family: var(--font-mono);
		font-size: 0.76rem;
		color: var(--text-muted);
	}

	.version {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 58%;
	}

	.dot {
		opacity: 0.6;
	}

	.arches {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-left: auto;
	}

	.arch {
		padding: 0 6px;
		color: var(--text-dim);
		background: var(--surface-2);
		border-radius: 5px;
	}
</style>
