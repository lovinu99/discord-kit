import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { embeds, init } from '../src/index.js';

const webhook = 'https://discord.com/api/webhooks/123/token';
const tempDirectories: string[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function tempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'discord-kit-'));
  tempDirectories.push(directory);
  return directory;
}

function payloadOf(form: FormData) {
  return JSON.parse(String(form.get('payload_json')));
}

describe('media uploads', () => {
  it('sends one file as multipart with attachment metadata and attachment:// embeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ media: webhook });

    const result = await notify('media', {
      content: 'Preview',
      embeds: [
        embeds.card({
          status: 'info',
          title: 'Preview',
          image: 'attachment://apple.png',
          timestamp: false,
        }).embeds![0],
      ],
      files: [
        {
          name: 'apple.png',
          data: Buffer.from('fake-png'),
          contentType: 'image/png',
          description: 'Pixel apple',
        },
      ],
    });

    expect(result).toMatchObject({ success: true, status: 200, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(webhook);
    expect(new Headers(request.headers).get('content-type')).toBeNull();

    const form = request.body as FormData;
    const payload = payloadOf(form);
    expect(payload.files).toBeUndefined();
    expect(payload.attachments).toEqual([
      { id: 0, filename: 'apple.png', description: 'Pixel apple' },
    ]);
    expect(payload.embeds[0].image).toEqual({ url: 'attachment://apple.png' });

    const file = form.get('files[0]') as File;
    expect(file.name).toBe('apple.png');
    expect(file.type).toBe('image/png');
    expect(await file.text()).toBe('fake-png');
  });

  it('supports paths, Buffer, Uint8Array and Blob in one message', async () => {
    const directory = await tempDirectory();
    const imagePath = join(directory, 'path.png');
    const bytes = Buffer.from([137, 80, 78, 71]);
    await writeFile(imagePath, bytes);

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ media: webhook });

    await notify('media', {
      files: [
        { name: 'path.png', path: imagePath, description: 'From disk' },
        { name: 'buffer.bin', data: Buffer.from([1, 2, 3]) },
        { name: 'bytes.txt', data: new Uint8Array([65, 66]) },
        { name: 'blob.png', data: new Blob([bytes], { type: 'image/png' }) },
      ],
    });

    const form = fetchMock.mock.calls[0][1].body as FormData;
    const payload = payloadOf(form);
    expect(payload.attachments.map((attachment: { id: number; filename: string }) => attachment)).toEqual([
      { id: 0, filename: 'path.png', description: 'From disk' },
      { id: 1, filename: 'buffer.bin' },
      { id: 2, filename: 'bytes.txt' },
      { id: 3, filename: 'blob.png' },
    ]);
    expect((form.get('files[0]') as File).type).toBe('image/png');
    expect((form.get('files[1]') as File).type).toBe('application/octet-stream');
    expect((form.get('files[2]') as File).type).toBe('text/plain');
    expect((form.get('files[3]') as File).type).toBe('image/png');
    expect(await (form.get('files[1]') as File).arrayBuffer()).toEqual(new Uint8Array([1, 2, 3]).buffer);
  });

  it('supports file-only messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ media: webhook });

    await notify('media', {
      files: [{ name: 'notes.txt', data: Buffer.from('hello') }],
    });

    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(payloadOf(form)).toEqual({
      attachments: [{ id: 0, filename: 'notes.txt' }],
    });
  });

  it('rejects duplicate filenames before fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ media: webhook });

    await expect(notify('media', {
      files: [
        { name: 'same.png', data: Buffer.from('a') },
        { name: 'same.png', data: Buffer.from('b') },
      ],
    })).rejects.toThrow(/Duplicate attachment filename/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects missing files, path separators, empty data and too many files', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ media: webhook });

    await expect(notify('media', {
      files: [{ name: 'missing.png', path: join(tmpdir(), 'discord-kit-does-not-exist.png') }],
    })).rejects.toThrow(/Unable to read attachment "missing\.png"/);

    await expect(notify('media', {
      files: [{ name: '../escape.png', data: Buffer.from('x') }],
    })).rejects.toThrow(/must not contain path separators/);

    await expect(notify('media', {
      files: [{ name: 'empty.txt', data: Buffer.alloc(0) }],
    })).rejects.toThrow(/is empty/);

    await expect(notify('media', {
      files: Array.from({ length: 11 }, (_, index) => ({ name: `${index}.txt`, data: Buffer.from('x') })),
    })).rejects.toThrow(/at most 10 files/);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects attachment references that do not match an uploaded filename', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ media: webhook });

    await expect(notify('media', {
      embeds: [
        embeds.card({
          status: 'info',
          title: 'Preview',
          image: 'attachment://missing.png',
          timestamp: false,
        }).embeds![0],
      ],
      files: [{ name: 'other.png', data: Buffer.from('x') }],
    })).rejects.toThrow(/attachment:\/\/missing\.png/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('recreates multipart bodies on retry and exposes file info to hooks', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    let hookFiles: unknown;
    const notify = init({ media: webhook }, {
      retries: 1,
      beforeSend: (context) => { hookFiles = context.files; },
    });

    const result = await notify('media', {
      content: 'Retry upload',
      files: [{ name: 'retry.txt', data: Buffer.from('retry') }],
    });

    expect(result).toMatchObject({ success: true, status: 200, attempts: 2 });
    expect(hookFiles).toEqual([
      { name: 'retry.txt', size: 5, contentType: 'text/plain', description: undefined, spoiler: undefined },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = fetchMock.mock.calls[0][1].body as FormData;
    const second = fetchMock.mock.calls[1][1].body as FormData;
    expect(first).not.toBe(second);
    expect((first.get('files[0]') as File).name).toBe('retry.txt');
    expect((second.get('files[0]') as File).name).toBe('retry.txt');
    expect(await (second.get('files[0]') as File).text()).toBe('retry');
  });
});
