<script lang="ts">
	import { SITE_NAME, absoluteUrl } from '$lib/site';

	let {
		title,
		description,
		path,
		image = '/og.png',
		imageAlt
	}: {
		title: string;
		description: string;
		path: string;
		/** Root-relative path to this page's Open Graph card. */
		image?: string;
		/** Alt text for the card; defaults to the site's tagline. */
		imageAlt?: string;
	} = $props();

	const url = $derived(absoluteUrl(path));
	const imageUrl = $derived(absoluteUrl(image));
	const alt = $derived(imageAlt ?? `${SITE_NAME}: package repository for Soar`);
</script>

<!--
	Shared SEO head: title, description, canonical URL, Open Graph, and Twitter
	cards. Package pages pass their own generated card under /og/pkg/, so a
	shared link shows the package; the homepage uses the shared /og.png.
-->
<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={alt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={alt} />
</svelte:head>
