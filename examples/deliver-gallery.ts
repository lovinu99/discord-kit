#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import { init, componentsV2 } from '../src/index.js';

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
  console.log('Sending gallery delivery...');

  // Send a Components V2 gallery with multiple images
  const v2Payload = componentsV2.gallery({
    title: 'Discord Kit — Rich Notification Gallery',
    description: 'Showcasing rich embeds, media attachments, and Components V2.',
    accentColor: 0x8b5cf6,
    items: [
      { media: { url: 'attachment://apple.png' }, description: 'Apple pixel art' },
      { media: { url: 'attachment://icon.png' }, description: 'App icon' },
      { media: { url: 'attachment://pixel.png' }, description: 'Pixel art' },
    ],
    footer: 'Discord Kit v2.0 — Rich Notifications & Media Support',
  });

  const result = await notify('main', {
    ...componentsV2.toNotifyPayload(v2Payload),
    files: [
      { name: 'apple.png', path: './examples/assets/apple.png', description: 'Apple pixel art' },
      { name: 'icon.png', path: './examples/assets/icon.png', description: 'App icon' },
      { name: 'pixel.png', path: './examples/assets/pixel.png', description: 'Pixel art' },
    ],
  });

  console.log('Gallery sent:', result);
}

main().catch((error) => {
  console.error(error.name, error.message);
  process.exitCode = 1;
});