/** Download and verify soarpkgs metadata release assets. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Arch } from '../../src/lib/types.ts';
import { CACHE_DIR, PUBLIC_KEY_PATH, RELEASE_REPO, RELEASE_TAG, sdbAsset } from './config.ts';
import { verify } from './minisign.ts';

interface ReleaseAsset {
	name: string;
	browser_download_url: string;
}

interface ResolvedRelease {
	tag: string;
	assets: Map<string, string>;
}

function githubHeaders(): HeadersInit {
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'soarpkgs-explorer-build'
	};
	const token = process.env.GITHUB_TOKEN?.trim();
	if (token) headers.Authorization = `Bearer ${token}`;
	return headers;
}

/** Resolve the release tag to concrete asset download URLs. */
export async function resolveRelease(): Promise<ResolvedRelease> {
	const path = RELEASE_TAG === 'latest' ? 'releases/latest' : `releases/tags/${RELEASE_TAG}`;
	const url = `https://api.github.com/repos/${RELEASE_REPO}/${path}`;
	const res = await fetch(url, { headers: githubHeaders() });
	if (!res.ok) {
		throw new Error(`failed to resolve release ${RELEASE_TAG}: ${res.status} ${res.statusText}`);
	}
	const body = (await res.json()) as { tag_name: string; assets: ReleaseAsset[] };
	const assets = new Map(body.assets.map((a) => [a.name, a.browser_download_url]));
	return { tag: body.tag_name, assets };
}

async function download(url: string): Promise<Uint8Array> {
	const res = await fetch(url, { headers: { 'User-Agent': 'soarpkgs-explorer-build' } });
	if (!res.ok) throw new Error(`download failed: ${url} -> ${res.status} ${res.statusText}`);
	return new Uint8Array(await res.arrayBuffer());
}

/**
 * Download the SQLite database and signature for `arch`, verify the signature,
 * cache the verified database locally, and return its path.
 */
export async function fetchVerifiedDatabase(release: ResolvedRelease, arch: Arch): Promise<string> {
	const sdbName = sdbAsset(arch);
	const sigName = `${sdbName}.sig`;
	const sdbUrl = release.assets.get(sdbName);
	const sigUrl = release.assets.get(sigName);
	if (!sdbUrl) throw new Error(`release ${release.tag} is missing asset ${sdbName}`);
	if (!sigUrl) throw new Error(`release ${release.tag} is missing asset ${sigName}`);

	const [data, signatureFile, publicKeyFile] = await Promise.all([
		download(sdbUrl),
		download(sigUrl).then((b) => new TextDecoder().decode(b)),
		readFile(PUBLIC_KEY_PATH, 'utf8')
	]);

	verify(data, signatureFile, publicKeyFile);

	await mkdir(CACHE_DIR, { recursive: true });
	const cached = join(CACHE_DIR, `${release.tag}-${sdbName}`);
	await writeFile(cached, data);
	return cached;
}
