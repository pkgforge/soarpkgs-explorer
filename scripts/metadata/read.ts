/** Read and normalize packages from a soarpkgs metadata database. */
import { Database } from 'bun:sqlite';
import type { Arch, ArchBuild, Maintainer, Provide } from '../../src/lib/types.ts';

/** A single package row read for one architecture, before cross-arch merge. */
export interface ArchPackageRow {
	arch: Arch;
	pkg_id: string;
	pkg_name: string;
	pkg_family: string | null;
	pkg_type: string | null;
	app_id: string | null;
	description: string | null;
	homepages: string[];
	source_urls: string[];
	licenses: string[];
	categories: string[];
	tags: string[];
	notes: string[];
	provides: Provide[];
	maintainers: Maintainer[];
	replaces: string[];
	desktop_integration: boolean | null;
	portable: boolean | null;
	build: ArchBuild;
}

interface RawRow {
	pkg_id: string;
	pkg_family: string | null;
	pkg_name: string;
	pkg_type: string | null;
	app_id: string | null;
	pkg_webpage: string | null;
	description: string | null;
	version: string;
	size: number | null;
	download_url: string;
	ghcr_pkg: string | null;
	ghcr_url: string | null;
	ghcr_size: number | null;
	ghcr_blob: string | null;
	bsum: string | null;
	build_id: string | null;
	build_date: string | null;
	build_script: string | null;
	desktop_integration: number | null;
	portable: number | null;
	licenses: string;
	homepages: string;
	notes: string;
	source_urls: string;
	tags: string;
	categories: string;
	provides: string;
	snapshots: string;
	replaces: string;
	maintainers: string | null;
}

const QUERY = `
	SELECT
		p.pkg_id, p.pkg_family, p.pkg_name, p.pkg_type, p.app_id, p.pkg_webpage, p.description,
		p.version, p.size, p.download_url,
		p.ghcr_pkg, p.ghcr_url, p.ghcr_size, p.ghcr_blob, p.bsum,
		p.build_id, p.build_date, p.build_script,
		p.desktop_integration, p.portable,
		json(p.licenses) AS licenses,
		json(p.homepages) AS homepages,
		json(p.notes) AS notes,
		json(p.source_urls) AS source_urls,
		json(p.tags) AS tags,
		json(p.categories) AS categories,
		json(p.provides) AS provides,
		json(p.snapshots) AS snapshots,
		json(p.replaces) AS replaces,
		(
			SELECT json_group_array(json_object('name', m.name, 'contact', m.contact))
			FROM package_maintainers pm
			JOIN maintainers m ON m.id = pm.maintainer_id
			WHERE pm.package_id = p.id
		) AS maintainers
	FROM packages p
	ORDER BY p.pkg_name COLLATE NOCASE, p.pkg_id COLLATE NOCASE
`;

function parseArray<T>(value: string | null): T[] {
	if (!value) return [];
	const parsed = JSON.parse(value) as unknown;
	if (!Array.isArray(parsed)) return [];
	const cleaned = parsed.filter((v) => v != null);
	// Dedupe primitive arrays (tags, categories, urls, ...); leave objects intact.
	if (cleaned.every((v) => typeof v !== 'object')) {
		return [...new Set(cleaned)] as T[];
	}
	return cleaned as T[];
}

function toBool(value: number | null): boolean | null {
	return value == null ? null : value !== 0;
}

/** Substitute known template placeholders (`{{version}}`) in a metadata value. */
function resolvePlaceholders(
	value: string | null,
	version: string,
	warnings: Set<string>
): string | null {
	if (value == null) return null;
	const resolved = value.replaceAll('{{version}}', version);
	const leftover = resolved.match(/\{\{[^}]+\}\}/g);
	if (leftover) for (const token of leftover) warnings.add(token);
	return resolved;
}

/** Read one architecture's database into normalized per-arch rows. */
export function readArch(dbPath: string, arch: Arch, warnings: Set<string>): ArchPackageRow[] {
	const db = new Database(dbPath, { readonly: true });
	try {
		const rows = db.query(QUERY).all() as RawRow[];
		return rows.map((r) => {
			const version = r.version;
			const build: ArchBuild = {
				version,
				size: r.size,
				download_url: resolvePlaceholders(r.download_url, version, warnings) ?? r.download_url,
				download_url_template: r.download_url,
				webpage: r.pkg_webpage,
				ghcr_pkg: resolvePlaceholders(r.ghcr_pkg, version, warnings),
				ghcr_url: r.ghcr_url,
				ghcr_size: r.ghcr_size,
				ghcr_blob: r.ghcr_blob,
				bsum: r.bsum,
				build_id: r.build_id,
				build_date: r.build_date,
				build_script: r.build_script,
				snapshots: parseArray<string>(r.snapshots)
			};
			return {
				arch,
				pkg_id: r.pkg_id,
				pkg_name: r.pkg_name,
				pkg_family: r.pkg_family,
				pkg_type: r.pkg_type,
				app_id: r.app_id,
				description: r.description,
				homepages: parseArray<string>(r.homepages),
				source_urls: parseArray<string>(r.source_urls),
				licenses: parseArray<string>(r.licenses),
				categories: parseArray<string>(r.categories),
				tags: parseArray<string>(r.tags),
				notes: parseArray<string>(r.notes),
				provides: parseArray<Provide>(r.provides),
				maintainers: parseArray<Maintainer>(r.maintainers),
				replaces: parseArray<string>(r.replaces),
				desktop_integration: toBool(r.desktop_integration),
				portable: toBool(r.portable),
				build
			} satisfies ArchPackageRow;
		});
	} finally {
		db.close();
	}
}
