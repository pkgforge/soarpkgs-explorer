# soarpkgs explorer

A fast, statically generated web explorer for [soarpkgs](https://github.com/pkgforge/soarpkgs).

The build downloads the signed SQLite metadata published on soarpkgs releases,
verifies its minisign signature, and prerenders the site with SvelteKit. There
is no server and no database at runtime.

## Requirements

- [Bun](https://bun.sh) (pinned in `mise.toml`)

Signature verification and SQLite reading use Bun's built-ins and pure-JS
libraries, so no additional command-line tooling is required.

## Scripts

```sh
bun install       # install dependencies
bun run data      # download + verify metadata, generate the dataset
bun run dev       # start the dev server
bun run build     # regenerate data, then build the static site to build/
bun run preview   # preview the production build
bun run check     # type-check
bun run format    # format with prettier
```

`bun run data` writes the generated dataset to `src/lib/generated/`
(git-ignored). Set `SOARPKGS_RELEASE` to a release tag to pin a specific
metadata snapshot; otherwise the latest release is used.

## Tech

- SvelteKit + `@sveltejs/adapter-static`, fully prerendered
- Bun toolchain (`bun:sqlite` for build-time reads)
- Deploys to Cloudflare Pages
