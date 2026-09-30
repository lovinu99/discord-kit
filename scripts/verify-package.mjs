import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const required = ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'README.md', 'LICENSE'];
const missing = [];

for (const file of required) {
  try {
    await readFile(join(root, file));
  } catch {
    missing.push(file);
  }
}

if (packageJson.publishConfig?.access !== 'public') missing.push('publishConfig.access=public');
if (packageJson.files?.includes('dist') !== true) missing.push('package.files includes dist');

const distFiles = await readdir(join(root, 'dist'));
const unexpected = distFiles.filter((file) => !/^index\.(js|cjs|d\.ts|d\.cts)$/.test(file));
if (unexpected.length > 0) missing.push(`unexpected dist files: ${unexpected.join(', ')}`);

if (missing.length > 0) {
  console.error('Package verification failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exitCode = 1;
} else {
  console.log('Package verification passed.');
}