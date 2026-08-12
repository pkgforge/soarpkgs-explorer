/** Read and normalize packages from a soarpkgs metadata database. */
import { Database } from 'bun:sqlite';
import type { Arch, ArchBuild, Maintainer, Provide } from '../../src/lib/types.ts';

/** One published version of a package, for one architecture. */
export interface ArchPackageRow {
	arch: Arch;
	pkg_name: string;
	pkg_type: string | null;
	description: string | null;
	homepages: string[];
	source_urls: string[];
	licenses: string[];
	categories: string[];
	notes: string[];
	provides: Provide[];
	maintainers: Maintainer[];
	replaces: string[];
	build: ArchBuild;
}

interface RawRow {
	pkg_name: string;
	pkg_type: string | null;
	description: string | null;
	version: string;
	size: number | null;
	download_url: string;
	bsum: string | null;
	licenses: string;
	homepages: string;
	notes: string;
	source_urls: string;
	categories: string;
	provides: string;
	replaces: string;
	maintainers: string | null;
}

/**
 * Only the columns soarpkgs still fills.
 *
 * The schema keeps room for the old build pipeline (`pkg_id`, `pkg_family`,
 * `app_id`, `ghcr_*`, `build_*`, `desktop_integration`, `portable`), but every
 * one of them is empty in every row, so asking for them would only invite the
 * UI to render blanks.
 */
const QUERY = `
	SELECT
		p.pkg_name, p.pkg_type, p.description,
		p.version, p.size, p.download_url, p.bsum,
		json(p.licenses) AS licenses,
		json(p.homepages) AS homepages,
		json(p.notes) AS notes,
		json(p.source_urls) AS source_urls,
		json(p.categories) AS categories,
		json(p.provides) AS provides,
		json(p.replaces) AS replaces,
		(
			SELECT json_group_array(json_object('name', m.name, 'contact', m.contact))
			FROM package_maintainers pm
			JOIN maintainers m ON m.id = pm.maintainer_id
			WHERE pm.package_id = p.id
		) AS maintainers
	FROM packages p
	ORDER BY p.pkg_name COLLATE NOCASE, p.version COLLATE NOCASE
`;

function parseArray<T>(value: string | null): T[] {
	if (!value) return [];
	const parsed = JSON.parse(value) as unknown;
	if (!Array.isArray(parsed)) return [];
	const cleaned = parsed.filter((v) => v != null);
	// Dedupe primitive arrays (categories, urls, ...); leave objects intact.
	if (cleaned.every((v) => typeof v !== 'object')) {
		return [...new Set(cleaned)] as T[];
	}
	return cleaned as T[];
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
				bsum: r.bsum
			};
			return {
				arch,
				pkg_name: r.pkg_name,
				pkg_type: r.pkg_type,
				description: r.description,
				homepages: parseArray<string>(r.homepages),
				source_urls: parseArray<string>(r.source_urls),
				licenses: parseArray<string>(r.licenses),
				categories: parseArray<string>(r.categories),
				notes: parseArray<string>(r.notes),
				provides: parseArray<Provide>(r.provides),
				maintainers: parseArray<Maintainer>(r.maintainers),
				replaces: parseArray<string>(r.replaces),
				build
			} satisfies ArchPackageRow;
		});
	} finally {
		db.close();
	}
}
