# Changelog

Package renamed to `discord-kit` before the first public release.

## 0.2.0 - 2026-11-12

### Added
- **Native media uploads** — Send local files via `multipart/form-data` with `files` array supporting `path`, `Buffer`, `Uint8Array`, `Blob`. Automatic MIME inference, `attachment://filename` references in embeds and Components V2, client-side validation (max 10 files, duplicate filenames, missing files, invalid refs).
- **Components V2 support** — Dashboard, gallery, and custom message builders using Container, Section, Text Display, Media Gallery, Thumbnail, File, Separator, Action Row, and Link Button components. Automatic `IS_COMPONENTS_V2` flag and `with_components=true` query param.
- **New embed builders** — `embeds.media()` for single media cards, `embeds.gallery()` for multi-image galleries (up to 10 images).
- **Enhanced existing builders** — All 11 builders improved: deployment/branch/build fields, error stack/log fields, pipeline stage fields with status icons, agent progress bar and status labels, list as numbered grid, build/deployment branch/build metadata, duplicate thumbnail avoidance.
- **Client-side payload validation** — Clear `TypeError` for Discord limits (content 2000, embeds 10, fields 25, combined 6000 chars, field/title/description/footer/author limits) and `attachment://` reference validation before send.
- **Type-safe Components V2 types** — Full TypeScript definitions for all component types with validation.

### Changed
- **Timestamp handling** — `timestamp: true` now correctly generates ISO timestamp (previously passed boolean to Discord).
- **Hook contexts** — `beforeSend`/`afterSend` now include resolved `files` metadata.

### Fixed
- **Duplicate thumbnail avoidance** — Builder deduplicates when `image` and `thumbnail` reference the same URL.
- **Retry with multipart** — File streams are re-read on every retry attempt.

## 0.1.0 - 2026-09-30

- Initial TypeScript Discord webhook notification library.
- ESM and CommonJS builds for Node.js 18+.
- Typed channels, retries, timeout, lifecycle hooks, and embed builders.