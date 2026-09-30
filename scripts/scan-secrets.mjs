import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const allowedPlaceholderPatterns = [
  /discord\.com\/api\/webhooks\/id\/token/i,
  /discord\.com\/api\/webhooks\/123\/token/i,
];
const rules = [
  { name: 'Discord webhook secret', pattern: /https?:\/\/discord(?:app)?\.com\/api\/webhooks\/\d{8,}\/[A-Za-z0-9_-]{20,}/i },
  { name: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: 'npm token', pattern: /\bnpm_[A-Za-z0-9]{20,}\b/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
];

const textExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.md', '.yml', '.yaml', '.txt', '.env']);
const findings = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!textExtensions.has(path.slice(path.lastIndexOf('.')).toLowerCase())) continue;
    const content = await readFile(path, 'utf8');
    for (const rule of rules) {
      const match = content.match(rule.pattern);
      if (!match) continue;
      const matchedText = match[0];
      if (allowedPlaceholderPatterns.some((allowed) => allowed.test(matchedText))) continue;
      findings.push(`${relative(root, path).split(sep).join('/')} :: ${rule.name}`);
    }
  }
}

await walk(root);
if (findings.length > 0) {
  console.error('Potential secrets detected:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log('Secret scan passed: no high-confidence credentials found.');
}