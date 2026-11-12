import fs from 'node:fs';
import { init } from '../src/index.js';

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
  console.log('Testing notify with payload...');
  const payload = {
    "embeds": [
      {
        "title": "✅ Deployment Completed",
        "description": "Production deployment completed successfully.\n\n[View Deployment](https://github.com/lovinu99/discord-kit/actions)",
        "fields": [
          { "name": "Application", "value": "Discord Kit", "inline": true },
          { "name": "Version", "value": "`v2.0.0`", "inline": true },
          { "name": "Environment", "value": "production", "inline": true },
          { "name": "Branch", "value": "main", "inline": true },
          { "name": "Commit", "value": "`a82f91c`", "inline": true },
          { "name": "Build", "value": "`1842`", "inline": true },
          { "name": "Duration", "value": "3m 42s", "inline": true }
        ],
        "color": 2278750,
        "url": "https://github.com/lovinu99/discord-kit/actions",
        "footer": { "text": "production • Discord Kit" },
        "timestamp": new Date().toISOString()
      }
    ]
  };

  try {
    await notify('main', payload);
    console.log('Sent!');
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Status:', e.status);
  }
}

main();