<script lang="ts">
	let { text, label = 'Copy' }: { text: string; label?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1400);
		} catch {
			// Clipboard unavailable.
		}
	}
</script>

<button type="button" class="copy-btn" onclick={copy} aria-label={label} title={label}>
	{#if copied}
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
			<path
				d="m5 12.5 4.5 4.5L19 7"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
			<rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.7" />
			<path
				d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
				stroke="currentColor"
				stroke-width="1.7"
			/>
		</svg>
	{/if}
</button>

<style>
	.copy-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		flex: none;
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 6px;
		transition:
			color var(--transition),
			border-color var(--transition);
	}

	.copy-btn:hover {
		color: var(--accent-strong);
		border-color: var(--border-strong);
	}
</style>
