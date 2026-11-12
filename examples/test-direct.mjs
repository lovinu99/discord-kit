import fs from 'node:fs';

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

async function main() {
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

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response:', text);
}

main();