<script lang="ts">
	import { datasetMeta, facets } from '$lib/catalog';
</script>

<section class="intro">
	<h1>Explore <span class="accent">soarpkgs</span></h1>
	<p>
		{datasetMeta.packageCount} packages across {facets.types.length} formats, built for
		{facets.arches.length} architectures. Search and browse coming next.
	</p>
</section>

<style>
	.intro {
		max-width: 640px;
	}

	.intro h1 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
	}

	.intro .accent {
		color: var(--accent-strong);
	}

	.intro p {
		margin-top: 12px;
		color: var(--text-dim);
	}
</style>
