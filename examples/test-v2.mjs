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
  console.log('Testing V2 gallery with attachment...');
  
  const v2Payload = componentsV2.gallery({
    title: 'Test V2 Gallery',
    description: 'Testing attachment reference',
    accentColor: 0x8b5cf6,
    items: [
      { media: { url: 'attachment://test-apple.png' }, description: 'Test apple' },
    ],
    footer: 'Test',
    timestamp: true,
  });
  
  const result = await notify('main', {
    ...componentsV2.toNotifyPayload(v2Payload),
    files: [
      { name: 'test-apple.png', path: './examples/assets/apple.png', description: 'Test apple' },
    ],
  });

  console.log('Sent:', result);
}

main().catch((error) => {
  console.error(error.name, error.message);
  process.exitCode = 1;
});