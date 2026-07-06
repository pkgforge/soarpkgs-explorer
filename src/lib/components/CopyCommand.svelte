<script lang="ts">
	let { command }: { command: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(command);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch {
			// Clipboard unavailable; the command remains selectable as text.
		}
	}
</script>

<div class="cmd">
	<span class="prompt">$</span>
	<code>{command}</code>
	<button type="button" onclick={copy} aria-label="Copy install command">
		{#if copied}
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
				<path
					d="m5 12.5 4.5 4.5L19 7"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Copied
		{:else}
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
				<rect
					x="9"
					y="9"
					width="11"
					height="11"
					rx="2.5"
					stroke="currentColor"
					stroke-width="1.7"
				/>
				<path
					d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
					stroke="currentColor"
					stroke-width="1.7"
				/>
			</svg>
			Copy
		{/if}
	</button>
</div>

<style>
	.cmd {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 12px 12px 14px;
		font-family: var(--font-mono);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.prompt {
		color: var(--accent);
		font-weight: 700;
	}

	code {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		white-space: nowrap;
		color: var(--text);
		font-size: 0.9rem;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: none;
		padding: 6px 10px;
		font-size: 0.8rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		transition:
			color var(--transition),
			border-color var(--transition);
	}

	button:hover {
		color: var(--accent-strong);
		border-color: var(--border-strong);
	}
</style>
