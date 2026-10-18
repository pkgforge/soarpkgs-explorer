/**
 * Build-time metadata pipeline entry point.
 *
 * Downloads and verifies the soarpkgs metadata databases, normalizes and
 * merges them across architectures, and writes the generated dataset the app
 * imports when prerendering.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Arch, DatasetMeta, Facets, Package, SearchEntry } from '../../src/lib/types.ts';
import { ARCHES, GENERATED_DIR, sdbAsset } from './config.ts';
import { fetchVerifiedDatabase, resolveRelease } from './fetch.ts';
import { readArch, type ArchPackageRow } from './read.ts';

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Compare two version strings so the newest sorts first.
 *
 * soarpkgs publishes several versions of a package and records no date for
 * any of them, so the strings themselves are all there is to order by. Digits
 * are compared as numbers, which is what keeps 3.63.0 above 3.9.0.
 */
function compareVersions(a: string, b: string): number {
	const chunks = (v: string) => v.match(/\d+|\D+/g) ?? [];
	const left = chunks(a);
	const right = chunks(b);
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const x = left[i];
		const y = right[i];
		if (x === undefined) return 1;
		if (y === undefined) return -1;
		const bothNumeric = /^\d+$/.test(x) && /^\d+$/.test(y);
		const cmp = bothNumeric ? Number(y) - Number(x) : y.localeCompare(x);
		if (cmp !== 0) return cmp;
	}
	return 0;
}

/**
 * Merge per-architecture rows into canonical, arch-aware packages.
 *
 * A package is its name: soarpkgs no longer fills `pkg_id` or `pkg_family`.
 * Several versions of one package arrive as separate rows, and only the newest
 * is shown, with the rest kept beside it.
 */
function mergePackages(rows: ArchPackageRow[]): Package[] {
	const byName = new Map<string, Package>();
	const versionsByNameArch = new Map<string, ArchPackageRow[]>();

	for (const row of rows) {
		let pkg = byName.get(row.pkg_name);
		if (!pkg) {
			pkg = {
				slug: '',
				pkg_name: row.pkg_name,
				pkg_type: row.pkg_type,
				description: row.description,
				homepages: row.homepages,
				source_urls: row.source_urls,
				licenses: row.licenses,
				categories: row.categories,
				notes: row.notes,
				provides: row.provides,
				maintainers: row.maintainers,
				replaces: row.replaces,
				arches: [],
				builds: {}
			};
			byName.set(row.pkg_name, pkg);
		}

		const key = `${row.pkg_name}\u0000${row.arch}`;
		const seen = versionsByNameArch.get(key);
		if (seen) seen.push(row);
		else versionsByNameArch.set(key, [row]);
	}

	for (const [key, candidates] of versionsByNameArch) {
		const [name, arch] = key.split('\u0000') as [string, Arch];
		const pkg = byName.get(name);
		if (!pkg) continue;

		candidates.sort((a, b) => compareVersions(a.build.version, b.build.version));
		const [newest, ...older] = candidates;
		pkg.arches.push(arch);
		pkg.builds[arch] = {
			...newest.build,
			other_versions: older.map((row) => row.build)
		};
	}

	const packages = [...byName.values()];
	packages.sort((a, b) => a.pkg_name.localeCompare(b.pkg_name));
	for (const pkg of packages) {
		pkg.arches.sort((a, b) => ARCHES.indexOf(a) - ARCHES.indexOf(b));
	}
	assignSlugs(packages);
	return packages;
}

/** Assign a unique, stable, URL-safe slug to every package. */
function assignSlugs(packages: Package[]): void {
	const used = new Set<string>();
	for (const pkg of packages) {
		const base = slugify(pkg.pkg_name);
		let slug = base;
		let n = 2;
		while (used.has(slug)) slug = `${base}-${n++}`;
		used.add(slug);
		pkg.slug = slug;
	}
}

function representativeArch(pkg: Package): Arch {
	return pkg.arches[0];
}

function toSearchEntry(pkg: Package): SearchEntry {
	const build = pkg.builds[representativeArch(pkg)];
	return {
		slug: pkg.slug,
		name: pkg.pkg_name,
		type: pkg.pkg_type,
		description: pkg.description,
		categories: pkg.categories,
		maintainers: pkg.maintainers.map((m) => m.name),
		arches: pkg.arches,
		version: build?.version ?? '',
		size: build?.size ?? null
	};
}

function buildFacets(packages: Package[]): Facets {
	const types = new Set<string>();
	const categories = new Set<string>();
	const maintainers = new Set<string>();
	const arches = new Set<Arch>();
	for (const pkg of packages) {
		if (pkg.pkg_type) types.add(pkg.pkg_type);
		for (const c of pkg.categories) categories.add(c);
		for (const m of pkg.maintainers) maintainers.add(m.name);
		for (const a of pkg.arches) arches.add(a);
	}
	const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
	return {
		types: sorted(types),
		categories: sorted(categories),
		maintainers: sorted(maintainers),
		arches: ARCHES.filter((a) => arches.has(a))
	};
}

async function writeJson(name: string, data: unknown): Promise<void> {
	await writeFile(join(GENERATED_DIR, name), JSON.stringify(data));
}

async function main(): Promise<void> {
	const release = await resolveRelease();
	console.log(`soarpkgs metadata release: ${release.tag}`);

	const warnings = new Set<string>();
	const rows: ArchPackageRow[] = [];
	const presentArches: Arch[] = [];
	for (const arch of ARCHES) {
		if (!release.assets.has(sdbAsset(arch))) {
			console.warn(`no metadata asset for ${arch}, skipping`);
			continue;
		}
		const dbPath = await fetchVerifiedDatabase(release, arch);
		const archRows = readArch(dbPath, arch, warnings);
		rows.push(...archRows);
		presentArches.push(arch);
		console.log(`  ${arch}: ${archRows.length} packages (verified)`);
	}
	if (presentArches.length === 0) throw new Error('no metadata databases were available');

	const packages = mergePackages(rows);
	const searchIndex = packages.map(toSearchEntry);
	const facets = buildFacets(packages);
	const meta: DatasetMeta = {
		release: release.tag,
		builtAt: new Date().toISOString(),
		arches: presentArches,
		packageCount: packages.length
	};

	await rm(GENERATED_DIR, { recursive: true, force: true });
	await mkdir(GENERATED_DIR, { recursive: true });
	await Promise.all([
		writeJson('packages.json', packages),
		writeJson('search-index.json', searchIndex),
		writeJson('facets.json', facets),
		writeJson('meta.json', meta)
	]);

	if (warnings.size > 0) {
		console.warn(`unresolved placeholders: ${[...warnings].join(', ')}`);
	}
	console.log(`wrote ${packages.length} packages to ${GENERATED_DIR}`);
}

await main();
