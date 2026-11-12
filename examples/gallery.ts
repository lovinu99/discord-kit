#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import { init, embeds, componentsV2 } from '../src/index.js';

const envFile = 'C:/Users/User/Desktop/jobs/.env';
for (const rawLine of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const equals = line.indexOf('=');
  if (equals === -1) continue;
  const key = line.slice(0, equals).trim();
  let value = line.slice(equals + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = value;
}

const webhook = process.env.DISCORD_WEBHOOK_QUIZ || process.env.DISCORD_WEBHOOK;
if (!webhook) throw new Error('Missing webhook');

const notify = init({
  main: webhook,
});

async function main() {
  console.log('1. Basic text notification...');
  await notify('main', '✅ Basic text notification works');

  console.log('2. Rich deployment notification...');
  await notify('main', {
    ...embeds.deployment({
      description: 'Production deployment completed successfully.',
      application: 'Discord Kit',
      version: 'v2.0.0',
      environment: 'production',
      branch: 'main',
      build: '1842',
      commit: 'a82f91c',
      duration: '3m 42s',
      action: { label: 'View Deployment', url: 'https://github.com/lovinu99/discord-kit/actions' },
      image: 'attachment://apple.png',
    }),
    files: [
      { name: 'apple.png', path: './examples/assets/apple.png', description: 'Deployment preview' },
    ],
  });

  console.log('3. Error notification...');
  await notify('main', embeds.error({
    description: 'Pipeline execution failed.',
    project: 'VideoPipeline',
    job: 'render-episode-42',
    stage: 'Rendering',
    duration: '12m 34s',
    error: 'FFmpeg exited with code 1',
    stack: 'Error: FFmpeg failed\n    at render (pipeline.ts:42:7)\n    at process (worker.ts:18:3)',
    command: 'ffmpeg -i input.mp4 -c:v libx264 output.mp4',
    logs: 'https://example.com/logs/42',
  }));

  console.log('4. Image attachment with attachment://...');
  await notify('main', {
    content: 'Image attachment example',
    ...embeds.media({
      status: 'success',
      title: 'Production Preview',
      description: 'Deployment screenshot attached below.',
      image: 'attachment://apple.png',
      fields: [{ name: 'Environment', value: 'Production', inline: true }],
      action: { label: 'Open Deployment', url: 'https://example.com/deploy/1' },
    }),
    files: [
      { name: 'apple.png', path: './examples/assets/apple.png', description: 'Deployment screenshot' },
    ],
  });

  console.log('5. Multiple-image gallery...');
  await notify('main', {
    ...embeds.gallery({
      status: 'info',
      title: 'Episode Stills',
      description: 'Frames from the final render.',
      items: [
        { url: 'attachment://frame-1.png', description: 'Opening shot', link: 'https://example.com/1' },
        { url: 'attachment://frame-2.png', description: 'Final shot' },
      ],
      footer: 'Video Pipeline',
    }),
    files: [
      { name: 'frame-1.png', path: './examples/assets/apple.png', description: 'Opening shot' },
      { name: 'frame-2.png', path: './examples/assets/icon.png', description: 'Final shot' },
    ],
  });

  console.log('6. Build report with artifact attachment...');
  await notify('main', {
    ...embeds.build({
      description: 'Unity build completed successfully.',
      project: 'Duckov',
      environment: 'Production',
      platform: 'Windows',
      branch: 'release/1.2',
      build: '1842',
      commit: 'a82f91c',
      version: 'v1.2.0',
      duration: '8m 15s',
      size: '245 MB',
      image: 'attachment://build.png',
    }),
    files: [
      { name: 'build.png', path: './examples/assets/pixel.png', description: 'Build artifact preview' },
    ],
  });

  console.log('7. Progress/pipeline notification...');
  await notify('main', embeds.pipeline({
    description: 'Processing completed with warnings.',
    steps: [
      { name: 'Transcription', status: 'success', duration: '2m' },
      { name: 'Translation', status: 'success', duration: '1m' },
      { name: 'Rendering', status: 'warning', duration: '8m' },
      { name: 'Upload', status: 'pending' },
    ],
    warning: '3 subtitle segments require review.',
    duration: '11m',
    output: 'video_final.mp4',
    size: '1.2 GB',
  }));

  console.log('8. Components V2 example...');
  const v2Payload = componentsV2.gallery({
    title: 'Components V2 Gallery',
    description: 'Rich layout with media gallery, separator and link button.',
    accentColor: 0x8b5cf6,
    items: [
      { media: { url: 'attachment://v2-apple.png' }, description: 'Pixel-art apple' },
    ],
    footer: 'Components V2',
  });
  await notify('main', {
    ...componentsV2.toNotifyPayload(v2Payload),
    files: [
      { name: 'v2-apple.png', path: './examples/assets/apple.png', description: 'Pixel-art apple' },
    ],
  });

  console.log('All examples sent!');
}

main().catch((error) => {
  console.error(error.name, error.message);
  process.exitCode = 1;
});