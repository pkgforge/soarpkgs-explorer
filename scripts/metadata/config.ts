/** Configuration for the build-time metadata pipeline. */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Arch } from '../../src/lib/types.ts';

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root, resolved relative to this file. */
export const repoRoot = join(here, '..', '..');

/** Architectures to include, in display order. */
export const ARCHES: Arch[] = ['x86_64-linux', 'aarch64-linux'];

/** GitHub repository publishing the signed metadata releases. */
export const RELEASE_REPO = 'pkgforge/soarpkgs';

/**
 * Release tag to fetch. `SOARPKGS_RELEASE` pins a specific tag for
 * reproducible builds; otherwise the latest release is used.
 */
export const RELEASE_TAG = process.env.SOARPKGS_RELEASE?.trim() || 'latest';

/** Vendored minisign public key used to verify downloaded databases. */
export const PUBLIC_KEY_PATH = join(repoRoot, 'keys', 'soarpkgs.minisign.pub');

/** Where generated data is written for the app to import. */
export const GENERATED_DIR = join(repoRoot, 'src', 'lib', 'generated');

/** Local cache directory for downloaded release assets. */
export const CACHE_DIR = join(repoRoot, '.metadata-cache');

/** SQLite asset file name for a given architecture. */
export function sdbAsset(arch: Arch): string {
	return `metadata-${arch}.sdb`;
}
