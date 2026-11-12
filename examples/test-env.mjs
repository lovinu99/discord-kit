import fs from 'node:fs';

const content = fs.readFileSync('C:/Users/User/Desktop/jobs/.env', 'utf8');
for (const rawLine of content.split(/\r?\n/)) {
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
console.log('DISCORD_WEBHOOK_QUIZ:', process.env.DISCORD_WEBHOOK_QUIZ);