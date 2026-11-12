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

const notify = init({ main: { webhook, logger: console } });

async function main() {
  console.log('Sending Components V2 layout test...');

  const v2Payload = componentsV2.message({
    title: '🎯 Header Title',
    description: 'Mô tả bên dưới header — this is the description text',
    accentColor: 0x8b5cf6,
    content: [
      componentsV2.mediaGallery([
        { media: { url: 'attachment://in.jpg' }, description: 'Mô tả ảnh bên dưới header' },
      ]),
      componentsV2.separator(),
      componentsV2.actionRow(
        componentsV2.linkButton('Mở Link', 'https://github.com/lovinu99/discord-kit')
      ),
    ],
    footer: 'Footer text • Test Components V2',
  });

  const result = await notify('main', {
    ...componentsV2.toNotifyPayload(v2Payload),
    files: [
      { name: 'in.jpg', path: './examples/assets/in.jpg', description: 'Test image' },
    ],
  });

  console.log('Sent:', result);
}

main().catch((error) => {
  console.error('Error:', error.name, error.message);
  process.exitCode = 1;
});