/**
 * Client-safe catalog data for browsing and search.
 *
 * The trimmed search index and facet lists are small enough to ship to the
 * client, powering instant in-browser search and filtering with no network
 * requests after load.
 */
import facetsData from '$lib/generated/facets.json';
import searchData from '$lib/generated/search-index.json';
import metaData from '$lib/generated/meta.json';
import type { DatasetMeta, Facets, SearchEntry } from '$lib/types';

/** Trimmed entries for every package. */
export const searchEntries: SearchEntry[] = searchData;

/** Available filter facets. */
export const facets: Facets = facetsData;

/** Metadata about the current dataset build. */
export const datasetMeta: DatasetMeta = metaData;
