# Implementation Plan: Rich Notifications & Media Support

## Overview

Upgrade `@lovinu264/discord-kit` from a text-oriented webhook notifier into a rich notification toolkit. Add first-class file attachments via multipart/form-data, improve every existing embed builder, add media/gallery builders, and support Components V2 as a separate presentation mode. Preserve the existing `init()` / `notify()` API, hooks, channels, retries, CJS/ESM exports and JSON behavior.

## Architecture Decisions

- Keep `notify(channel, message)` as the single public send seam. Media rides on the message object as `files: NotifyFile[]`; no separate upload API.
- Split the implementation into focused modules:
  - `src/media.ts` — file-source resolution, MIME inference, filename/metadata validation.
  - `src/transport.ts` — JSON vs multipart request construction, `attachments` metadata, `with_components` URL handling. Rebuilds the request body on every retry.
  - `src/validate.ts` — Discord embed/component limits and `attachment://` reference validation.
  - `src/components.ts` — Components V2 types and high-level builders.
  - `src/embeds.ts` — improved rich embed builders plus `media()` / `gallery()`.
- Treat Rich Embeds and Components V2 as distinct presentation modes. V2 is opt-in through `componentsV2.*` builders; `notify()` detects `IS_COMPONENTS_V2` and adds `with_components=true` automatically.
- Builders clamp user-visible text to Discord limits (graceful); arbitrary custom payloads are validated and rejected with actionable `TypeError`s.
- Local attachment-backed images use `attachment://filename`. Embed `image`/`thumbnail` accept both strings and `{ url }` objects; existing object usage stays valid.
- No new runtime dependencies. Use Node's native `FormData`, `Blob`, `fetch` and `node:fs/promises`.

## Task List

### Phase 1: Media and transport foundation
- [ ] Task 1: Add media/message types and `files` support with single-file multipart.
- [ ] Task 2: Support path, Buffer, Uint8Array, Blob and multiple files.
- [ ] Task 3: Validate filenames, duplicates, missing files, max 10 files and `attachment://` references.
- [ ] Task 4: Preserve retry/timeout behavior by rebuilding multipart bodies per attempt.

### Checkpoint: Media
- [ ] Existing JSON tests still pass
- [ ] Multipart tests pass, including retry and hooks
- [ ] Typecheck passes

### Phase 2: Rich embed presentation
- [ ] Task 5: Add embed limit validation and media-source normalization.
- [ ] Task 6: Improve `card`, `table`, `progress`, `build`, `agent`, `task`, `error`, `deployment`, `pipeline`, `list`.
- [ ] Task 7: Add `embeds.media()` and `embeds.gallery()`.

### Checkpoint: Rich embeds
- [ ] Builder tests pass
- [ ] Media/gallery payloads validate
- [ ] Live rich-embed delivery inspected

### Phase 3: Components V2
- [ ] Task 8: Add typed V2 component builders and `componentsV2.dashboard()/gallery()/message()`.
- [ ] Task 9: Add V2 validation, `IS_COMPONENTS_V2` handling and `with_components=true`.
- [ ] Task 10: Verify V2 + multipart attachments and link buttons live.

### Checkpoint: V2
- [ ] V2 tests pass
- [ ] Mixing embeds/content is rejected client-side
- [ ] Live V2 gallery inspected

### Phase 4: Examples, docs and delivery
- [ ] Task 11: Add example assets and practical examples.
- [ ] Task 12: Add gallery delivery script.
- [ ] Task 13: Update README and CHANGELOG.
- [ ] Task 14: Run full verification (tests, typecheck, build, CJS/ESM smoke, live delivery).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Discord docs conflict on V2 + `files[n]` | High | Already verified live: multipart upload works and the media gallery resolves `attachment://`; document observed behavior. |
| Retrying a consumed FormData body | High | Resolve files to reusable Blobs once; construct a fresh FormData for every attempt. |
| Embed text limits cause 400s | Medium | Validate custom payloads; clamp builder output. |
| Breaking existing builder output | Medium | Keep builder inputs/options; add visuals without removing fields. Update tests only for intentional presentation changes. |
| Existing retry logic regressions | High | Keep retry loop unchanged; only replace request construction. Cover multipart retry with tests. |

## Open Questions

- None blocking. Components V2 and media upload behavior were verified live against the configured webhook.
