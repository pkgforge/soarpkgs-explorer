import { error } from '@sveltejs/kit';
import { allPackages, packageBySlug } from '$lib/data.server';
import type { EntryGenerator, PageServerLoad } from './$types';

/** Prerender a page for every package slug. */
export const entries: EntryGenerator = () => allPackages().map((pkg) => ({ slug: pkg.slug }));

export const load: PageServerLoad = ({ params }) => {
	const pkg = packageBySlug(params.slug);
	if (!pkg) error(404, `Unknown package: ${params.slug}`);
	return { pkg };
};
