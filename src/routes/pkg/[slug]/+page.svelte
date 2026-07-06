<script lang="ts">
	import { base } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import CopyCommand from '$lib/components/CopyCommand.svelte';
	import {
		archLabel,
		formatDate,
		formatSize,
		hostLabel,
		installCommand,
		resolveVersion,
		runCommand
	} from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pkg = $derived(data.pkg);
	const primaryBuild = $derived(pkg.builds[pkg.arches[0]]);
	const hasChecksums = $derived(pkg.arches.some((a) => pkg.builds[a]?.bsum));

	// Deterministic hue so each package gets a stable identicon colour.
	const hue = $derived.by(() => {
		let h = 0;
		for (const ch of pkg.pkg_name) h = (h * 31 + ch.charCodeAt(0)) % 360;
		return h;
	});
	const initial = $derived(
		pkg.pkg_name
			.replace(/[^a-z0-9]/i, '')
			.charAt(0)
			.toUpperCase() || '?'
	);

	const links = $derived(
		[
			...pkg.homepages.map((url) => ({ url, label: hostLabel(url) })),
			...pkg.source_urls.map((url) => ({ url, label: `Source · ${hostLabel(url)}` })),
			primaryBuild?.webpage ? { url: primaryBuild.webpage, label: 'Package page' } : null,
			primaryBuild?.ghcr_url ? { url: primaryBuild.ghcr_url, label: 'Container (GHCR)' } : null,
			primaryBuild?.build_script ? { url: primaryBuild.build_script, label: 'Build recipe' } : null
		].filter((l): l is { url: string; label: string } => l !== null)
	);

	// Older versions still installable, unified across architectures.
	const snapshotRows = $derived.by(() => {
		const current = new Set(pkg.arches.map((a) => pkg.builds[a]?.version));
		const seen = new Set<string>();
		const versions: string[] = [];
		for (const arch of pkg.arches) {
			for (const v of pkg.builds[arch]?.snapshots ?? []) {
				if (!current.has(v) && !seen.has(v)) {
					seen.add(v);
					versions.push(v);
				}
			}
		}
		return versions.map((version) => ({
			version,
			downloads: pkg.arches.map((arch) => {
				const build = pkg.builds[arch];
				const available = !!build && build.snapshots.includes(version);
				return {
					arch,
					url: available ? resolveVersion(build.download_url_template, version) : null
				};
			})
		}));
	});

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

	<header class="hero">
		<div class="icon" style="--hue: {hue}" aria-hidden="true">{initial}</div>
		<div class="hero-body">
			<div class="title">
				<h1>{pkg.pkg_name}</h1>
				{#if pkg.pkg_type}
					<a class="badge accent" href={browseLink('type', pkg.pkg_type)}>{pkg.pkg_type}</a>
				{/if}
				{#if pkg.portable}<span class="badge">portable</span>{/if}
				{#if pkg.desktop_integration}<span class="badge">desktop</span>{/if}
			</div>
			{#if pkg.description}
				<p class="desc">{pkg.description}</p>
			{/if}
			<p class="ids">
				<span class="k">pkg_id</span> <code>{pkg.pkg_id}</code>
				{#if pkg.pkg_family && pkg.pkg_family !== pkg.pkg_name}
					<span class="sep">·</span> <span class="k">family</span> <code>{pkg.pkg_family}</code>
				{/if}
			</p>
		</div>
	</header>

	<div class="stats">
		<div class="stat">
			<span class="stat-k">Version</span>
			<span class="stat-v">{primaryBuild?.version ?? '—'}</span>
		</div>
		<div class="stat">
			<span class="stat-k">Size</span>
			<span class="stat-v">{formatSize(primaryBuild?.size ?? null)}</span>
		</div>
		<div class="stat">
			<span class="stat-k">Arch</span>
			<span class="stat-v">{pkg.arches.map(archLabel).join(' · ')}</span>
		</div>
		{#if pkg.licenses.length > 0}
			<div class="stat">
				<span class="stat-k">License</span>
				<span class="stat-v">{pkg.licenses.join(', ')}</span>
			</div>
		{/if}
		{#if primaryBuild?.build_date}
			<div class="stat">
				<span class="stat-k">Built</span>
				<span class="stat-v">{formatDate(primaryBuild.build_date)}</span>
			</div>
		{/if}
	</div>

	<section class="install">
		<h2>Install</h2>
		<CopyCommand command={installCommand(pkg)} />
		<p class="run-hint">Or run it once without installing:</p>
		<CopyCommand command={runCommand(pkg)} />
	</section>

	<div class="columns">
		<div class="main">
			<section>
				<h2>Downloads</h2>
				<div class="builds">
					{#each pkg.arches as arch (arch)}
						{@const build = pkg.builds[arch]}
						<div class="build">
							<div class="build-top">
								<code class="b-arch">{archLabel(arch)}</code>
								{#if build}<span class="b-ver">{build.version}</span>{/if}
								{#if build?.download_url}
									<a class="b-dl" href={build.download_url} rel="noreferrer nofollow">Download</a>
								{/if}
							</div>
							<div class="build-meta">
								<span>{formatSize(build?.size ?? null)}</span>
								<span class="dot">·</span>
								<span>built {formatDate(build?.build_date ?? null)}</span>
							</div>
							{#if build?.bsum}
								<div class="bsum">
									<span class="bsum-k">b3sum</span>
									<code class="bsum-v" title={build.bsum}>{build.bsum}</code>
									<CopyButton text={build.bsum} label="Copy checksum" />
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>

			{#if snapshotRows.length > 0}
				<section>
					<h2>Previous versions</h2>
					<div class="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Version</th>
									{#each pkg.arches as arch (arch)}
										<th>{archLabel(arch)}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each snapshotRows as row (row.version)}
									<tr>
										<td><code>{row.version}</code></td>
										{#each row.downloads as dl (dl.arch)}
											<td>
												{#if dl.url}
													<a href={dl.url} rel="noreferrer nofollow">Download</a>
												{:else}
													<span class="na">—</span>
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

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

		<aside class="side">
			<section class="panel">
				<h2>Details</h2>
				<dl class="facts">
					{#if pkg.maintainers.length > 0}
						<dt>Maintainers</dt>
						<dd class="chips">
							{#each pkg.maintainers as m (m.contact)}
								<a class="chip" href={browseLink('maint', m.name)}>{m.name}</a>
							{/each}
						</dd>
					{/if}
					{#if pkg.categories.length > 0}
						<dt>Categories</dt>
						<dd class="chips">
							{#each pkg.categories as c (c)}
								<a class="chip" href={browseLink('cat', c)}>{c}</a>
							{/each}
						</dd>
					{/if}
					{#if pkg.tags.length > 0}
						<dt>Tags</dt>
						<dd class="chips">
							{#each pkg.tags as t (t)}
								<a class="chip" href={browseLink('tag', t)}>{t}</a>
							{/each}
						</dd>
					{/if}
					{#if pkg.provides.length > 0}
						<dt>Provides</dt>
						<dd class="mono">{pkg.provides.map((p) => p.name).join(', ')}</dd>
					{/if}
					{#if pkg.replaces.length > 0}
						<dt>Replaces</dt>
						<dd class="mono">{pkg.replaces.join(', ')}</dd>
					{/if}
				</dl>
			</section>

			{#if links.length > 0}
				<section class="panel">
					<h2>Links</h2>
					<div class="links">
						{#each links as link (link.url)}
							<a class="link" href={link.url} rel="noreferrer">
								<span>{link.label}</span>
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
									<path
										d="M7 17 17 7M9 7h8v8"
										stroke="currentColor"
										stroke-width="1.7"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>
						{/each}
					</div>
				</section>
			{/if}
		</aside>
	</div>

	{#if hasChecksums}
		<p class="verify-note">
			Checksums are b3sum (BLAKE3). Soar verifies them automatically on install.
		</p>
	{/if}
</article>

<style>
	.detail {
		max-width: 960px;
	}

	.back {
		display: inline-block;
		margin-bottom: 20px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.back:hover {
		color: var(--accent-strong);
		text-decoration: none;
	}

	.hero {
		display: flex;
		gap: 18px;
		align-items: flex-start;
	}

	.icon {
		flex: none;
		width: 60px;
		height: 60px;
		display: grid;
		place-items: center;
		font-family: var(--font-mono);
		font-size: 1.7rem;
		font-weight: 700;
		color: #fff;
		background: linear-gradient(
			145deg,
			hsl(var(--hue) 52% 52%),
			hsl(calc(var(--hue) + 28) 54% 44%)
		);
		border-radius: 14px;
		box-shadow: var(--shadow);
	}

	.title {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.title h1 {
		font-size: clamp(1.6rem, 3.5vw, 2.15rem);
	}

	.badge {
		padding: 2px 10px;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	.badge.accent {
		color: var(--accent-strong);
		background: var(--accent-soft);
		border-color: transparent;
	}

	.badge:hover {
		text-decoration: none;
	}

	.desc {
		margin: 10px 0 0;
		font-size: 1.02rem;
		color: var(--text-dim);
	}

	.ids {
		margin: 10px 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.ids .k {
		font-family: var(--font-mono);
	}

	.ids code {
		color: var(--text-dim);
	}

	.ids .sep {
		margin: 0 6px;
		opacity: 0.5;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 9px 14px;
		min-width: 92px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.stat-k {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-muted);
	}

	.stat-v {
		font-size: 0.9rem;
		color: var(--text);
	}

	.install {
		margin-top: 28px;
	}

	.run-hint {
		margin: 12px 0 8px;
		font-size: 0.84rem;
		color: var(--text-muted);
	}

	h2 {
		font-size: 0.76rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 12px;
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 272px;
		gap: 30px;
		margin-top: 30px;
		align-items: start;
	}

	.main section + section {
		margin-top: 28px;
	}

	.builds {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 12px;
	}

	.build {
		padding: 14px 16px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.build-top {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.b-arch {
		font-family: var(--font-mono);
		font-size: 0.86rem;
		font-weight: 600;
		color: var(--text);
	}

	.b-ver {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.b-dl {
		margin-left: auto;
		padding: 4px 12px;
		font-size: 0.8rem;
		color: var(--accent-contrast);
		background: var(--accent);
		border-radius: var(--radius-sm);
	}

	.b-dl:hover {
		background: var(--accent-strong);
		text-decoration: none;
	}

	.build-meta {
		display: flex;
		gap: 7px;
		margin-top: 8px;
		font-family: var(--font-mono);
		font-size: 0.76rem;
		color: var(--text-muted);
	}

	.build-meta .dot {
		opacity: 0.5;
	}

	.bsum {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}

	.bsum-k {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.bsum-v {
		flex: 1;
		min-width: 0;
		font-size: 0.74rem;
		color: var(--text-dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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

	.na {
		color: var(--text-muted);
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

	.side {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.panel {
		padding: 18px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.facts {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
	}

	.facts dt {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-top: 12px;
	}

	.facts dt:first-child {
		margin-top: 0;
	}

	.facts dd {
		margin: 0;
		font-size: 0.88rem;
		color: var(--text-dim);
	}

	.facts dd.mono {
		font-family: var(--font-mono);
		font-size: 0.82rem;
		overflow-wrap: anywhere;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 6px;
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
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 10px;
		margin: 0 -10px;
		font-size: 0.88rem;
		color: var(--text-dim);
		border-radius: var(--radius-sm);
	}

	.link svg {
		flex: none;
		color: var(--text-muted);
	}

	.link:hover {
		color: var(--accent-strong);
		background: var(--surface-2);
		text-decoration: none;
	}

	.verify-note {
		margin-top: 26px;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	@media (max-width: 760px) {
		.columns {
			grid-template-columns: 1fr;
			gap: 24px;
		}
	}
</style>
