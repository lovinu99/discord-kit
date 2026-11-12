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

const payload = embeds.deployment({
  description: 'Production deployment completed successfully.',
  application: 'Discord Kit',
  version: 'v2.0.0',
  environment: 'production',
  branch: 'main',
  build: '1842',
  commit: 'a82f91c',
  duration: '3m 42s',
  action: { label: 'View Deployment', url: 'https://github.com/lovinu99/discord-kit/actions' },
  timestamp: true,
});

console.log('Payload:', JSON.stringify(payload, null, 2));

// Check embed limits
const embed = payload.embeds[0];
console.log('\nEmbed analysis:');
console.log('Title length:', embed.title?.length);
console.log('Description length:', embed.description?.length);
console.log('Fields count:', embed.fields?.length);
embed.fields?.forEach((f, i) => console.log(`  Field ${i}: "${f.name}" (${f.name.length}) = "${f.value}" (${f.value.length})`));
console.log('Footer length:', embed.footer?.text?.length);
console.log('Author length:', embed.author?.name?.length);

let totalChars = (embed.title?.length || 0) + (embed.description?.length || 0) + (embed.footer?.text?.length || 0) + (embed.author?.name?.length || 0);
embed.fields?.forEach(f => totalChars += f.name.length + f.value.length);
console.log('Total chars:', totalChars);