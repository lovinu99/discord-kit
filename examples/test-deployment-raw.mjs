import fs from 'node:fs';
import { init, embeds } from '../src/index.js';

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
  main: { webhook, logger: console },
});

async function main() {
  console.log('Testing deployment notification...');
  try {
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
        timestamp: true,
      }),
      files: [
        { name: 'apple.png', path: './examples/assets/apple.png', description: 'Deployment preview' },
      ],
    });
    console.log('Sent!');
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Status:', e.status);
    console.error('Cause:', e.cause);
  }
}

main();