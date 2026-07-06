<script lang="ts">
	import { base } from '$app/paths';
	import CopyCommand from '$lib/components/CopyCommand.svelte';
	import { archLabel, formatDate, formatSize, hostLabel, installCommand } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pkg = $derived(data.pkg);
	const command = $derived(installCommand(pkg));
	const primaryBuild = $derived(pkg.builds[pkg.arches[0]]);

	function browseLink(param: string, value: string): string {
		return `${base}/?${param}=${encodeURIComponent(value)}`;
	}
</script>

<svelte:head>
	<title>{pkg.pkg_name} · soarpkgs explorer</title>
	<meta
		name="description"
		content={pkg.description ?? `The ${pkg.pkg_name} package on soarpkgs.`}
	/>
</svelte:head>

<article class="detail">
	<a class="back" href="{base}/">← All packages</a>

	<header class="head">
		<div class="title">
			<h1>{pkg.pkg_name}</h1>
			{#if pkg.pkg_type}
				<a class="badge" href={browseLink('type', pkg.pkg_type)}>{pkg.pkg_type}</a>
			{/if}
			{#if pkg.portable}<span class="tagline">portable</span>{/if}
		</div>
		{#if pkg.description}
			<p class="desc">{pkg.description}</p>
		{/if}
		<p class="pkgid"><span>pkg_id</span> <code>{pkg.pkg_id}</code></p>
	</header>

	<section class="install">
		<h2>Install</h2>
		<CopyCommand {command} />
	</section>

	<div class="columns">
		<div class="main">
			<section>
				<h2>Availability</h2>
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Arch</th>
								<th>Version</th>
								<th>Size</th>
								<th>Built</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each pkg.arches as arch (arch)}
								{@const build = pkg.builds[arch]}
								<tr>
									<td><code>{archLabel(arch)}</code></td>
									<td>{build?.version ?? '—'}</td>
									<td>{formatSize(build?.size ?? null)}</td>
									<td>{formatDate(build?.build_date ?? null)}</td>
									<td>
										{#if build?.download_url}
											<a href={build.download_url} rel="noreferrer nofollow">Download</a>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>

			{#if pkg.notes.length > 0}
				<section>
					<h2>Notes</h2>
					<ul class="notes">
						{#each pkg.notes as note (note)}
							<li>{note}</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<aside class="facts">
			{#if pkg.licenses.length > 0}
				<div class="fact">
					<span class="key">License</span>
					<span class="val">{pkg.licenses.join(', ')}</span>
				</div>
			{/if}

			{#if pkg.maintainers.length > 0}
				<div class="fact">
					<span class="key">Maintainers</span>
					<span class="val chips">
						{#each pkg.maintainers as m (m.contact)}
							<a class="chip" href={browseLink('maint', m.name)}>{m.name}</a>
						{/each}
					</span>
				</div>
			{/if}

			{#if pkg.categories.length > 0}
				<div class="fact">
					<span class="key">Categories</span>
					<span class="val chips">
						{#each pkg.categories as c (c)}
							<a class="chip" href={browseLink('cat', c)}>{c}</a>
						{/each}
					</span>
				</div>
			{/if}

			{#if pkg.tags.length > 0}
				<div class="fact">
					<span class="key">Tags</span>
					<span class="val chips">
						{#each pkg.tags as t (t)}
							<a class="chip" href={browseLink('tag', t)}>{t}</a>
						{/each}
					</span>
				</div>
			{/if}

			{#if pkg.provides.length > 0}
				<div class="fact">
					<span class="key">Provides</span>
					<span class="val mono">{pkg.provides.map((p) => p.name).join(', ')}</span>
				</div>
			{/if}

			<div class="fact">
				<span class="key">Links</span>
				<span class="val links">
					{#each pkg.homepages as url (url)}
						<a href={url} rel="noreferrer">{hostLabel(url)}</a>
					{/each}
					{#each pkg.source_urls as url (url)}
						<a href={url} rel="noreferrer">Source · {hostLabel(url)}</a>
					{/each}
					{#if primaryBuild?.ghcr_url}
						<a href={primaryBuild.ghcr_url} rel="noreferrer">GHCR</a>
					{/if}
					{#if primaryBuild?.build_script}
						<a href={primaryBuild.build_script} rel="noreferrer">Recipe</a>
					{/if}
				</span>
			</div>
		</aside>
	</div>
</article>

<style>
	.detail {
		max-width: 900px;
	}

	.back {
		display: inline-block;
		margin-bottom: 18px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.back:hover {
		color: var(--accent-strong);
		text-decoration: none;
	}

	.title {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.title h1 {
		font-size: clamp(1.6rem, 3.5vw, 2.2rem);
	}

	.badge {
		padding: 2px 10px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--accent-strong);
		background: var(--accent-soft);
		border-radius: 999px;
	}

	.badge:hover {
		text-decoration: none;
	}

	.tagline {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.desc {
		margin: 10px 0 0;
		font-size: 1.02rem;
		color: var(--text-dim);
	}

	.pkgid {
		margin: 10px 0 0;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.pkgid span {
		font-family: var(--font-mono);
	}

	.pkgid code {
		color: var(--text-dim);
	}

	.install {
		margin-top: 26px;
	}

	h2 {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 12px;
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 260px;
		gap: 32px;
		margin-top: 28px;
		align-items: start;
	}

	.main section + section {
		margin-top: 28px;
	}

	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}

	th {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		text-align: left;
		font-weight: 500;
	}

	th,
	td {
		padding: 10px 14px;
		border-bottom: 1px solid var(--border);
		white-space: nowrap;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.notes {
		margin: 0;
		padding-left: 18px;
		color: var(--text-dim);
		font-size: 0.9rem;
	}

	.notes li {
		margin-bottom: 6px;
	}

	.facts {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 18px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.fact {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.key {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.val {
		font-size: 0.88rem;
		color: var(--text-dim);
	}

	.val.mono {
		font-family: var(--font-mono);
		font-size: 0.82rem;
	}

	.chips,
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		padding: 2px 9px;
		font-size: 0.78rem;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	.chip:hover {
		color: var(--text);
		border-color: var(--border-strong);
		text-decoration: none;
	}

	.links {
		flex-direction: column;
		gap: 4px;
	}

	@media (max-width: 720px) {
		.columns {
			grid-template-columns: 1fr;
			gap: 24px;
		}
	}
</style>
