# discord-kit

Tiny, dependency-free TypeScript notifications for Discord webhooks — with native media uploads, rich embeds, and Components V2 support.

## Installation

```bash
npm install @lovinu264/discord-kit
```

## Basic usage

```ts
import { init } from '@lovinu264/discord-kit';

const notify = init({
  unity: process.env.DISCORD_WEBHOOK_UNITY!,
  ai: process.env.DISCORD_WEBHOOK_AI!,
  urgent: process.env.DISCORD_WEBHOOK_URGENT!,
});

await notify('unity', '✅ Build completed');
await notify('ai', '🤖 Agent completed');
await notify('urgent', '🚨 Build failed');
```

`init()` is synchronous and validates webhook URLs without making a network request. The returned function is strongly typed from the channel keys.

## Configuration

```ts
const notify = init(
  { unity: 'https://discord.com/api/webhooks/id/token' },
  { timeout: 5_000, retries: 3, logger: console },
);
```

Defaults are a 10-second timeout and 3 retries. `retries` means retries after the initial request. Retryable failures are HTTP 429, 500, 502, 503, 504, network errors, and timeouts. Exponential backoff starts at 500ms, and Discord's `Retry-After` header is respected.

Advanced per-channel configuration overrides global retries:

```ts
const notify = init({
  unity: { webhook: 'https://discord.com/api/webhooks/id/token', enabled: true, retries: 5, owned: true },
  urgent: { webhook: 'https://discord.com/api/webhooks/id/token', enabled: false },
});
```

Set `owned: true` for application-owned webhooks to enable interactive buttons in Components V2 (non-owned webhooks can only use link buttons).

Disabled channels return `{ channel, success: true, skipped: true }` and do not call `fetch`.

## Media uploads (multipart/form-data)

Upload local files directly — no separate upload step, no CDN needed. Files are sent as `multipart/form-data` with correct `attachments` metadata and `attachment://filename` references.

```ts
await notify('deploy', {
  content: 'Production deployment completed',
  embeds: [
    embeds.media({
      status: 'success',
      title: 'Production Preview',
      description: 'Deployment screenshot attached below.',
      image: 'attachment://screenshot.png',
      action: { label: 'Open Deployment', url: 'https://example.com/deploy/1' },
    }),
  ],
  files: [
    { name: 'screenshot.png', path: './artifacts/screenshot.png', description: 'Deployment screenshot' },
  ],
});
```

**Supported sources:**
- `path` — filesystem path (read on send, re-read on every retry)
- `data` — `Buffer`, `Uint8Array`, or `Blob` (in-memory)

**Features:**
- Automatic multipart construction with `payload_json` + `files[n]`
- Correct `attachments` metadata with IDs matching file indices
- `attachment://filename` references in embed `image` / `thumbnail` and Components V2 media
- Client-side validation: duplicate filenames, missing files, max 10 files, invalid `attachment://` refs
- MIME type inferred from filename or Blob; override with `contentType`
- `description` for alt text, `spoiler` flag
- Files are re-read on every retry attempt (streams recreated)

## Rich Embed Design System

The reusable `embeds` builders render notifications as compact developer dashboard cards. Every card follows the same order:

```text
Status → short title → one/two-line description → relevant fields → one action → footer + timestamp
```

```ts
import { embeds } from '@lovinu264/discord-kit';

await notify('unity', embeds.build({
  description: 'Production build completed successfully.',
  project: 'Duckov',
  environment: 'Production',
  platform: 'Windows',
  branch: 'main',
  commit: 'a82f91c',
  version: 'v1.2.0',
  duration: '4m 21s',
  size: '182 MB',
  action: { label: 'Open Build', url: 'https://example.com/build/1' },
}));
```

### Visual rules

- Keep titles short: two to five words, with one status icon.
- Keep descriptions to one or two short sentences answering what happened.
- Use two to six relevant fields; prefer two or three inline fields on mobile.
- Put long errors, commands, and logs in full-width fields.
- Use Markdown code formatting for commits, versions, files, commands, and error codes.
- Use one primary action link only when it is useful.
- Keep low-priority metadata in the footer; the timestamp is automatic by default.
- Avoid repeating the same value in title, description, fields, and footer.
- **Avoid duplicating the same image in both `image` and `thumbnail` — the builder deduplicates automatically.**

### Status conventions

| Status | Icon | Color | Use for |
| --- | --- | --- | --- |
| `success` | ✅ | green | completed, passed, deployed, generated |
| `error` | ❌ | red | failed, crashed, rejected, exception |
| `warning` | ⚠️ | amber | degraded, partial failure, attention required |
| `info` | ℹ️ | blue | started, informational update |
| `progress` | 🔄 | violet | long-running operation |

### Builders

All builders return a `NotifyPayload` and can be passed directly to `notify()`:

```ts
embeds.card({ status, title, description, fields, action, footer, image, thumbnail });
embeds.table({ status, title, description, columns, action, footer, image, thumbnail });
embeds.build({ description, project, environment, platform, branch, commit, version, build, duration, size, action, error, image, thumbnail });
embeds.agent({ description, task, model, files, changes, duration, elapsed, tests, status, progress, image, thumbnail });
embeds.task({ description, project, priority, estimate, duration, status, completed, footer });
embeds.error({ description, project, job, stage, duration, error, stack, command, logs, action, image, thumbnail });
embeds.deployment({ description, application, version, environment, branch, commit, build, duration, action, error, image, thumbnail });
embeds.pipeline({ description, steps, duration, output, size, warning, image, thumbnail });
embeds.progress({ title, description, percentage, current, total, eta, elapsed, stage, width, image, thumbnail });
embeds.list({ description, items, duration, footer, maxItems });
embeds.media({ status, title, description, image, thumbnail, fields, action, footer, author });        // single media card
embeds.gallery({ status, title, description, items, footer, author });                                 // multi-image gallery
```

`embeds.code(value)` wraps developer values in backticks. `embeds.progressBar(percent, width)` creates a compact bar such as `████████████████░░░░░░ 72%`.

### Table-style dashboard card

Discord does not expose HTML or CSS tables. The native equivalent is a responsive grid of inline embed fields. `embeds.table()` keeps short values in columns and lets long values span the full width:

```ts
await notify('lc-noti', embeds.table({
  status: 'success',
  title: 'Discord Embed System Ready',
  description: 'Notification delivered successfully.',
  author: { name: 'DISCORD-KIT • TEST' },
  columns: [
    { label: 'Project', value: 'discord-kit', code: true },
    { label: 'Channel', value: 'lc-noti', code: true },
    { label: 'Status', value: 'Delivered' },
    {
      label: 'Features',
      value: 'Lifecycle hooks\nEmbed builders\nRetry + timeout',
      inline: false,
    },
  ],
  footer: 'Personal Dev Notifications',
}));
```

The `inline` layout is intentionally responsive: Discord may show three columns on desktop and fewer on narrow/mobile clients. Embed fields are capped by Discord at 25 fields, with a 256-character field name and 1024-character field value; the full embed is capped at 6000 characters.

### New: Media-oriented builders

**`embeds.media()`** — Single media card with image, caption, metadata, and action link. Use for screenshots, previews, or any single-image notification.

```ts
await notify('deploy', embeds.media({
  status: 'success',
  title: 'Production Preview',
  description: 'Deployment screenshot attached below.',
  image: 'attachment://screenshot.png',
  fields: [{ name: 'Environment', value: 'Production', inline: true }],
  action: { label: 'Open Deployment', url: 'https://example.com/deploy/1' },
}), {
  files: [{ name: 'screenshot.png', path: './artifacts/screenshot.png' }],
});
```

**`embeds.gallery()`** — Multiple images as separate embeds with captions, links, and overflow handling. Up to 10 images (Discord limit).

```ts
await notify('assets', embeds.gallery({
  status: 'info',
  title: 'Episode Stills',
  description: 'Frames from the final render.',
  items: [
    { url: 'attachment://frame-1.png', description: 'Opening shot', link: 'https://example.com/1' },
    { url: 'attachment://frame-2.png', description: 'Final shot' },
  ],
  footer: 'Video Pipeline',
}), {
  files: [
    { name: 'frame-1.png', path: './artifacts/frame-1.png' },
    { name: 'frame-2.png', path: './artifacts/frame-2.png' },
  ],
});
```

### Ten realistic examples

```ts
// 1. Unity build success
await notify('unity', embeds.build({
  description: 'Production build completed successfully.',
  project: 'Duckov', environment: 'Production', platform: 'Windows',
  branch: 'main', commit: 'a82f91c', version: 'v1.2.0',
  duration: '4m 21s', size: '182 MB',
  action: { label: 'Open Build', url: 'https://example.com/build/1' },
}));

// 2. Unity build failure
await notify('urgent', embeds.build({
  description: 'Production build failed during compilation.',
  project: 'Duckov', branch: 'main', commit: 'a82f91c', duration: '31s',
  error: 'CS0246: The type or namespace could not be found',
}));

// 3. AI agent completed
await notify('ai', embeds.agent({
  description: 'Inventory implementation completed.',
  task: 'Implement inventory system', model: 'Claude', files: '12',
  changes: '+843 / -127', duration: '8m 32s', tests: 'Passed',
}));

// 4. AI agent working (progress)
await notify('ai', embeds.agent({
  description: 'Implementing inventory system...',
  task: 'Inventory system', files: '8 modified', elapsed: '4m 12s',
  status: 'progress',
}));

// 5. Task waiting for input
await notify('ai', embeds.agent({
  description: 'The agent requires user input before continuing.',
  task: 'Implement inventory', status: 'warning',
}));

// 6. Video rendering progress
await notify('video', embeds.progress({
  title: 'Rendering Video', description: 'Rendering episode-12.mp4',
  percentage: 72, current: 12842, total: 17836,
  eta: '2m 14s', elapsed: '6m 32s',
}));

// 7. Pipeline error with stack trace
await notify('urgent', embeds.error({
  description: 'Video rendering failed.', project: 'VideoPipeline',
  job: 'episode-12', stage: 'Rendering', duration: '8m 41s',
  error: 'FFmpeg exited with code 1', command: 'ffmpeg -i input.mp4 ...',
  stack: 'Error: FFmpeg failed\n    at render (pipeline.ts:42:7)',
  action: { label: 'View Logs', url: 'https://example.com/logs/episode-12' },
}));

// 8. Deployment success
await notify('deploy', embeds.deployment({
  description: 'Production deployment completed successfully.',
  application: 'API', version: 'v1.8.2', environment: 'production',
  commit: 'a82f91c', duration: '1m 42s',
  action: { label: 'Open Deployment', url: 'https://example.com/deploy/1' },
}));

// 9. Multi-stage pipeline with warning
await notify('pipeline', embeds.pipeline({
  description: 'Processing completed with warnings.',
  steps: [
    { name: 'Transcription', status: 'success' },
    { name: 'Translation', status: 'success' },
    { name: 'TTS', status: 'success' },
    { name: 'Rendering', status: 'warning' },
  ],
  duration: '14m 32s', warning: '3 subtitle segments require review.',
}));

// 10. Generated asset list
await notify('assets', embeds.list({
  description: '5 assets generated successfully.',
  items: [
    'player_idle.png', 'player_run.png', 'player_attack.png',
    'enemy_idle.png', 'enemy_attack.png',
  ],
  duration: '2m 14s',
}));
```

### Mobile-first behavior

Builders use inline fields only for short values such as project, branch, duration, and status. Error messages, commands, warnings, and other long values are full width. Lists are capped with `maxItems` and summarize the remainder instead of creating a tall notification.

### Client-side embed validation

Payloads are validated before sending — clear `TypeError` instead of HTTP 400:
- Content ≤ 2000 chars
- ≤ 10 embeds per message
- ≤ 25 fields per embed
- ≤ 6000 combined embed characters
- Title ≤ 256, Description ≤ 2048, Field name ≤ 256, Field value ≤ 1024, Footer ≤ 2048, Author name ≤ 256
- `attachment://` references must match an uploaded filename

## Components V2 (Dashboard & Gallery layouts)

Components V2 provides a modern, flexible layout system: Containers, Sections, Text Displays, Media Galleries, Separators, Files, and Link Buttons. Use it for dashboards, image galleries, and complex layouts that rich embeds can't express.

```ts
import { componentsV2 } from '@lovinu264/discord-kit';

await notify('dashboard', componentsV2.dashboard({
  title: 'Deployment Dashboard',
  description: 'Production deployment overview',
  accentColor: 0x8b5cf6,
  sections: [
    {
      title: 'Status',
      description: 'All systems operational',
      accessory: { type: 'button', label: 'View Details', url: 'https://example.com/deploy/1' },
    },
    {
      title: 'Metrics',
      fields: [
        { name: 'Latency', value: '42ms', inline: true },
        { name: 'Throughput', value: '1.2k req/s', inline: true },
      ],
    },
  ],
  footer: 'Deploy Bot',
}), {
  files: [
    { name: 'preview.png', path: './artifacts/preview.png' },
  ],
});
```

**Rich Embeds vs Components V2:**

| Feature | Rich Embeds | Components V2 |
| --- | --- | --- |
| Layout flexibility | Fixed embed structure | Composable Container/Section/Text/Media/File |
| Media gallery | Single image per embed | Up to 10 images in one Media Gallery |
| Text formatting | Markdown in description/fields | Text Display (full Markdown) |
| Links | Action URL + field links | Link Buttons (style 5) |
| Separators | ❌ | ✅ Separator component |
| File display | Attachment list only | File component (inline) |
| Interactive buttons | Non-owned webhooks: ❌ | Non-owned webhooks: link buttons only |
| Owner webhook required | No | For interactive buttons (style 1-4, 6) |

**Components V2 builders:**
```ts
componentsV2.dashboard({ title, description, accentColor, sections, footer });
componentsV2.gallery({ title, description, accentColor, items, footer });
componentsV2.message({ title, description, accentColor, content, footer });
// Low-level: container, section, textDisplay, thumbnail, mediaGallery, galleryItem, file, separator, actionRow, linkButton
```

**Low-level components** (for custom layouts):
```ts
componentsV2.container(children, accentColor?)
componentsV2.section([textDisplay('## Title'), textDisplay('Content')], accessory)
componentsV2.textDisplay('# Header\n**Bold** and *italic*')
componentsV2.thumbnail('attachment://thumb.png', 'Description')
componentsV2.mediaGallery([{ media: { url: 'attachment://img.png' }, description: 'Caption' }])
componentsV2.galleryItem('attachment://img.png', 'Caption')
componentsV2.file('attachment://doc.pdf')
componentsV2.separator(true, 2) // divider, large spacing
componentsV2.actionRow(linkButton('Open', 'https://example.com'))
componentsV2.linkButton('Label', 'https://example.com')
```

**Important:**
- Components V2 requires the `IS_COMPONENTS_V2` flag (set automatically by builders)
- Must use `with_components=true` query param (added automatically)
- Rich embeds (`embeds`), `content`, and `poll` cannot be mixed with Components V2
- Non-owned webhooks: interactive buttons (style 1-4, 6) are rejected client-side; link buttons (style 5) work
- Attachments are exposed through Media Gallery, File, or Thumbnail components — they don't appear automatically

## Convenience helpers

```ts
await notify.success('unity', 'Build completed');
await notify.error('unity', 'Build failed');
await notify.warning('unity', 'Build is slow');
await notify.info('unity', 'Build started');
```

## Lifecycle hooks

Hooks are awaited and never receive the webhook URL:

```ts
const notify = init({ unity: process.env.DISCORD_WEBHOOK_UNITY! }, {
  beforeSend: ({ channel, attempt, payload, files }) => {
    console.debug('sending', channel, attempt, payload, files);
  },
  afterSend: ({ channel, attempt, success, status, error, files }) => {
    console.debug('attempt finished', channel, attempt, success, status, error, files);
  },
  onComplete: (result) => {
    console.debug('notification complete', result);
  },
  onError: (error) => {
    console.error(error.channel, error.status, error.attempts);
  },
});
```

- `beforeSend` runs before each request attempt.
- `afterSend` runs after each attempt, including failed attempts. `files` contains resolved file metadata.
- `onComplete` runs once after a successful or skipped notification.
- `onError` runs once after the operation fails permanently, including lifecycle hook failures.

## Result and errors

Successful requests return `{ channel, success: true, status, attempts }`. Failures throw `NotifyError` with `channel`, `status`, `attempts`, and `cause`. Webhook URLs are not included in errors or library logs.

```ts
import { NotifyError } from '@lovinu264/discord-kit';

try {
  await notify('unity', 'Build completed');
} catch (error) {
  if (error instanceof NotifyError) {
    console.error(error.channel, error.status, error.attempts);
  }
}
```

## Runtime channel management

```ts
notify.channels(); // ['unity', 'ai']
notify.has('unity');
notify.disable('unity');
notify.enable('unity');
```

## API reference

Public exports are `init`, `NotifyError`, `embeds`, `componentsV2`, and the TypeScript types `NotifyConfig`, `NotifyOptions`, `NotifyMessage`, `NotifyResult`, lifecycle context types, message/embed types, and Components V2 types. The package supports Node.js 18+, ESM imports, and CommonJS `require()`.

## Security

Webhook URLs are credentials. Load them from environment variables or a secret manager; never commit them to Git, issues, pull requests, screenshots, logs, or examples. This package does not read `.env` files, does not log webhook URLs, and redacts URLs found in network error messages.

If a webhook is exposed, revoke or regenerate it immediately in Discord. The repository includes `npm run check:secrets`, which runs in CI and before packaging.

## Release checklist

```bash
npm run check:secrets
npm run typecheck
npm test
npm run build
npm run check:package
npm publish
```

The package publishes only `dist/`, `README.md`, `LICENSE`, and `package.json`. GitHub Actions runs the same checks on Node.js 18, 20, and 22. Publishing a `v*.*.*` tag uses the `NPM_TOKEN` repository secret.