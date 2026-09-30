# discord-kit

Tiny, dependency-free TypeScript notifications for Discord webhooks.

## Installation

```bash
npm install discord-kit
```

## Basic usage

```ts
import { init } from 'discord-kit';

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
  unity: { webhook: 'https://discord.com/api/webhooks/id/token', enabled: true, retries: 5 },
  urgent: { webhook: 'https://discord.com/api/webhooks/id/token', enabled: false },
});
```

Disabled channels return `{ channel, success: true, skipped: true }` and do not call `fetch`.

## Messages and embeds

```ts
await notify('unity', {
  content: 'Unity build completed',
  embeds: [{
    title: 'Build Result',
    description: 'Production build completed successfully.',
    color: 0x22c55e,
  }],
});
```

## Discord Embed Design System

The reusable `embeds` builders render notifications as compact developer dashboard cards. Every card follows the same order:

```text
Status → short title → one/two-line description → relevant fields → one action → footer + timestamp
```

```ts
import { embeds } from 'discord-kit';

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
embeds.card({ status, title, description, fields, action, footer });
embeds.build({ description, project, branch, commit, duration });
embeds.agent({ description, task, model, files, changes, tests, status });
embeds.task({ description, project, priority, estimate, status, completed });
embeds.error({ description, project, job, stage, error, command, action });
embeds.deployment({ description, application, version, environment, commit, action });
embeds.pipeline({ description, steps, duration, output, size, warning });
embeds.progress({ title, description, percentage, current, total, eta, elapsed });
embeds.list({ description, items, duration, maxItems });
```

`embeds.code(value)` wraps developer values in backticks. `embeds.progressBar(percent, width)` creates a compact bar such as `████████████████░░░░░░ 72%`.

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

// 4. AI agent working
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

// 7. Pipeline error
await notify('urgent', embeds.error({
  description: 'Video rendering failed.', project: 'VideoPipeline',
  job: 'episode-12', stage: 'Rendering', duration: '8m 41s',
  error: 'FFmpeg exited with code 1', command: 'ffmpeg -i input.mp4 ...',
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
  beforeSend: ({ channel, attempt, payload }) => {
    console.debug('sending', channel, attempt, payload);
  },
  afterSend: ({ channel, attempt, success, status, error }) => {
    console.debug('attempt finished', channel, attempt, success, status, error);
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
- `afterSend` runs after each attempt, including failed attempts.
- `onComplete` runs once after a successful or skipped notification.
- `onError` runs once after the operation fails permanently, including lifecycle hook failures.

## Result and errors

Successful requests return `{ channel, success: true, status, attempts }`. Failures throw `NotifyError` with `channel`, `status`, `attempts`, and `cause`. Webhook URLs are not included in errors or library logs.

```ts
import { NotifyError } from 'discord-kit';

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

Public exports are `init`, `NotifyError`, and the TypeScript types `NotifyConfig`, `NotifyOptions`, `NotifyMessage`, `NotifyResult`, lifecycle context types, and message/embed types. The package supports Node.js 18+, ESM imports, and CommonJS `require()`.

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