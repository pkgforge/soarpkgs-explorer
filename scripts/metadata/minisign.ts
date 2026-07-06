/**
 * Minimal minisign signature verification.
 *
 * Supports both legacy (`Ed`) and prehashed (`ED`, BLAKE2b-512) signatures,
 * using audited pure-JS primitives so the build needs no external CLI.
 *
 * @see https://jedisct1.github.io/minisign/
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { blake2b } from '@noble/hashes/blake2.js';

const LEGACY = 0x4564; // "Ed"
const PREHASHED = 0x4544; // "ED"

interface PublicKey {
	keyId: Uint8Array;
	key: Uint8Array;
}

interface Signature {
	algorithm: number;
	keyId: Uint8Array;
	signature: Uint8Array;
	trustedComment: string;
	globalSignature: Uint8Array;
}

function decodeBase64(value: string): Uint8Array {
	return Uint8Array.from(atob(value.trim()), (c) => c.charCodeAt(0));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

/** Parse a minisign public key (the base64 key line, comments ignored). */
export function parsePublicKey(contents: string): PublicKey {
	const line = contents
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0 && !l.startsWith('untrusted comment:'))
		.at(-1);
	if (!line) throw new Error('minisign: empty public key');
	const raw = decodeBase64(line);
	if (raw.length !== 42) throw new Error('minisign: malformed public key');
	return { keyId: raw.slice(2, 10), key: raw.slice(10, 42) };
}

/** Parse a minisign `.sig` file. */
export function parseSignature(contents: string): Signature {
	const lines = contents.split('\n');
	const sigLine = lines[1]?.trim();
	const trustedComment = (lines[2] ?? '').replace(/^trusted comment:\s?/, '');
	const globalLine = lines[3]?.trim();
	if (!sigLine || !globalLine) throw new Error('minisign: malformed signature file');

	const raw = decodeBase64(sigLine);
	if (raw.length !== 74) throw new Error('minisign: malformed signature line');
	return {
		algorithm: (raw[0] << 8) | raw[1],
		keyId: raw.slice(2, 10),
		signature: raw.slice(10, 74),
		trustedComment,
		globalSignature: decodeBase64(globalLine)
	};
}

/**
 * Verify `data` against a minisign signature and public key.
 * Throws if verification fails for any reason.
 */
export function verify(data: Uint8Array, signatureFile: string, publicKeyFile: string): void {
	const pub = parsePublicKey(publicKeyFile);
	const sig = parseSignature(signatureFile);

	if (!equalBytes(pub.keyId, sig.keyId)) {
		throw new Error('minisign: signature key id does not match public key');
	}

	let message: Uint8Array;
	if (sig.algorithm === PREHASHED) {
		message = blake2b(data, { dkLen: 64 });
	} else if (sig.algorithm === LEGACY) {
		message = data;
	} else {
		throw new Error('minisign: unsupported signature algorithm');
	}

	if (!ed25519.verify(sig.signature, message, pub.key)) {
		throw new Error('minisign: file signature verification failed');
	}

	// The global signature covers the file signature plus the trusted comment,
	// binding the two together so the trusted comment cannot be swapped.
	const commentBytes = new TextEncoder().encode(sig.trustedComment);
	const global = new Uint8Array(sig.signature.length + commentBytes.length);
	global.set(sig.signature, 0);
	global.set(commentBytes, sig.signature.length);
	if (!ed25519.verify(sig.globalSignature, global, pub.key)) {
		throw new Error('minisign: trusted comment signature verification failed');
	}
}
