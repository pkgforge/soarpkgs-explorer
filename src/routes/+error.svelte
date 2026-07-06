<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · soarpkgs explorer</title>
</svelte:head>

<section class="error">
	<p class="code">{page.status}</p>
	<h1>{page.status === 404 ? 'Package not found' : 'Something went wrong'}</h1>
	<p class="msg">{page.error?.message ?? 'An unexpected error occurred.'}</p>
	<a class="home" href="{base}/">← Back to all packages</a>
</section>

<style>
	.error {
		max-width: 480px;
		margin: 8vh auto;
		text-align: center;
	}

	.code {
		font-family: var(--font-mono);
		font-size: 3.5rem;
		font-weight: 700;
		color: var(--accent-strong);
		margin: 0;
	}

	h1 {
		margin: 8px 0 12px;
		font-size: 1.4rem;
	}

	.msg {
		color: var(--text-dim);
		margin-bottom: 24px;
	}

	.home {
		font-size: 0.9rem;
	}
</style>
