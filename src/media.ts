import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { NotifyFile, NotifyFileInfo } from './types.js';

export interface ResolvedFile {
  name: string;
  blob: Blob;
  contentType: string;
  description?: string;
  spoiler?: boolean;
  size: number;
}

const MAX_FILES = 10;
const MAX_FILENAME_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 1_024;

const MIME_BY_EXTENSION: Record<string, string> = {
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.m4a': 'audio/mp4',
  '.md': 'text/markdown',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

export async function resolveFiles(files?: NotifyFile[]): Promise<ResolvedFile[]> {
  if (files === undefined) return [];
  if (!Array.isArray(files)) throw new TypeError('Notification files must be an array');
  if (files.length > MAX_FILES) {
    throw new TypeError(`Discord supports at most ${MAX_FILES} files per message`);
  }

  const names = new Set<string>();
  for (const file of files) validateFileDescriptor(file, names);

  const resolved: ResolvedFile[] = [];
  for (const file of files) {
    const name = file.name.trim();
    let bytes: Uint8Array;
    if (file.path !== undefined) {
      try {
        bytes = await readFile(file.path);
      } catch (cause) {
        throw new TypeError(`Unable to read attachment "${name}" from ${file.path}`, { cause });
      }
    } else if (file.data instanceof Blob) {
      bytes = new Uint8Array(await file.data.arrayBuffer());
    } else if (file.data instanceof Uint8Array) {
      bytes = file.data;
    } else {
      throw new TypeError(`Attachment "${name}" must provide a filesystem path or binary data`);
    }

    if (bytes.byteLength === 0) throw new TypeError(`Attachment "${name}" is empty`);
    const contentType = normalizeContentType(file.contentType)
      ?? (file.data instanceof Blob ? normalizeContentType(file.data.type) : undefined)
      ?? inferContentType(name);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);

    resolved.push({
      name,
      blob: new Blob([copy.buffer], { type: contentType }),
      contentType,
      description: file.description,
      spoiler: file.spoiler,
      size: bytes.byteLength,
    });
  }
  return resolved;
}

export function fileInfo(files: ResolvedFile[]): NotifyFileInfo[] {
  return files.map((file) => ({
    name: file.name,
    size: file.size,
    contentType: file.contentType,
    description: file.description,
    spoiler: file.spoiler,
  }));
}

export function inferContentType(filename: string): string {
  return MIME_BY_EXTENSION[extname(filename).toLowerCase()] ?? 'application/octet-stream';
}

export function isImageFilename(filename: string): boolean {
  const extension = extname(filename).toLowerCase();
  return extension === '.jpg'
    || extension === '.jpeg'
    || extension === '.png'
    || extension === '.webp'
    || extension === '.gif';
}

function validateFileDescriptor(file: NotifyFile, names: Set<string>): void {
  if (!file || typeof file !== 'object') throw new TypeError('Each notification file must be an object');
  if (typeof file.name !== 'string' || file.name.trim() === '') {
    throw new TypeError('Each notification file must have a non-empty name');
  }
  const name = file.name.trim();
  if (name.length > MAX_FILENAME_LENGTH) {
    throw new TypeError(`Attachment filename must be ${MAX_FILENAME_LENGTH} characters or fewer`);
  }
  if (name.includes('/') || name.includes('\\') || name === '.' || name === '..') {
    throw new TypeError(`Attachment filename "${name}" must not contain path separators`);
  }
  if (names.has(name)) throw new TypeError(`Duplicate attachment filename: ${name}`);
  names.add(name);

  if (file.path !== undefined && typeof file.path !== 'string') {
    throw new TypeError(`Attachment "${name}" path must be a string`);
  }
  if (file.path !== undefined && file.data !== undefined) {
    throw new TypeError(`Attachment "${name}" must use either path or data, not both`);
  }
  if (file.path === undefined && file.data === undefined) {
    throw new TypeError(`Attachment "${name}" must provide path or data`);
  }
  if (file.path === '' || (file.path !== undefined && file.path.trim() === '')) {
    throw new TypeError(`Attachment "${name}" path must not be empty`);
  }
  if (file.description !== undefined) {
    if (typeof file.description !== 'string') {
      throw new TypeError(`Attachment "${name}" description must be a string`);
    }
    if (file.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new TypeError(`Attachment "${name}" description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
    }
  }
  if (file.spoiler !== undefined && typeof file.spoiler !== 'boolean') {
    throw new TypeError(`Attachment "${name}" spoiler must be a boolean`);
  }
  if (file.contentType !== undefined && normalizeContentType(file.contentType) === undefined) {
    throw new TypeError(`Attachment "${name}" contentType must be a non-empty string`);
  }
}

function normalizeContentType(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}
