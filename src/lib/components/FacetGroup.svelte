<script lang="ts">
	interface Props {
		title: string;
		options: string[];
		selected: string[];
		labelOf?: (value: string) => string;
		onToggle: (value: string) => void;
		limit?: number;
	}

	let { title, options, selected, labelOf, onToggle, limit = 8 }: Props = $props();

	let expanded = $state(false);

	const selectedSet = $derived(new Set(selected));
	// Keep options in their given (alphabetical) order to avoid distracting
	// movement when toggling; active filters stay visible as chips in results.
	const visible = $derived(expanded ? options : options.slice(0, limit));
	const hidden = $derived(options.length - visible.length);
</script>

<section class="facet">
	<h3 class="facet-title">{title}</h3>
	<ul class="options">
		{#each visible as option (option)}
			<li>
				<label class="option" class:active={selectedSet.has(option)}>
					<input
						type="checkbox"
						checked={selectedSet.has(option)}
						onchange={() => onToggle(option)}
					/>
					<span class="label">{labelOf ? labelOf(option) : option}</span>
				</label>
			</li>
		{/each}
	</ul>
	{#if hidden > 0 || expanded}
		<button type="button" class="more" onclick={() => (expanded = !expanded)}>
			{expanded ? 'Show less' : `Show ${hidden} more`}
		</button>
	{/if}
</section>

<style>
	.facet {
		padding-block: 14px;
		border-bottom: 1px solid var(--border);
	}

	.facet-title {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 10px;
	}

	.options {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 6px;
		border-radius: var(--radius-sm);
		font-size: 0.86rem;
		color: var(--text-dim);
		cursor: pointer;
		transition:
			background var(--transition),
			color var(--transition);
	}

	.option:hover {
		background: var(--surface-2);
		color: var(--text);
	}

	.option.active {
		color: var(--text);
	}

	.option input {
		flex: none;
		accent-color: var(--accent);
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.more {
		margin-top: 8px;
		padding: 2px 4px;
		font-size: 0.78rem;
		color: var(--accent-strong);
		background: none;
		border: none;
	}

	.more:hover {
		text-decoration: underline;
	}
</style>
