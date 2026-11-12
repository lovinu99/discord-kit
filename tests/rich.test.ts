import { beforeEach, describe, expect, it, vi } from 'vitest';
import { embeds, init } from '../src/index.js';

const webhook = 'https://discord.com/api/webhooks/123/token';

function first(payload: { embeds?: Array<{ title?: string; description?: string; color?: number; image?: { url: string }; thumbnail?: { url: string }; fields?: Array<{ name: string; value: string; inline?: boolean }>; footer?: { text: string }; author?: { name: string; url?: string; icon_url?: string }; timestamp?: string; url?: string }> }) {
  return payload.embeds![0];
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('rich embed presentation', () => {
  it('creates a media card with a large image and avoids duplicate thumbnails', () => {
    const payload = embeds.media({
      status: 'success',
      title: 'Production preview',
      description: 'Deployment screenshot',
      image: 'attachment://screenshot.png',
      thumbnail: 'attachment://screenshot.png',
      fields: [{ name: 'Environment', value: 'Production', inline: true }],
      action: { label: 'Open deployment', url: 'https://example.com/deploy/1' },
      author: { name: 'Deploy Bot', icon_url: 'https://example.com/icon.png' },
      timestamp: false,
    });
    const embed = first(payload);
    expect(embed.title).toBe('✅ Production preview');
    expect(embed.image).toEqual({ url: 'attachment://screenshot.png' });
    expect(embed.thumbnail).toBeUndefined();
    expect(embed.description).toContain('[Open deployment](https://example.com/deploy/1)');
    expect(embed.author).toEqual({ name: 'Deploy Bot', icon_url: 'https://example.com/icon.png' });
  });

  it('builds a multi-image gallery with captions and overflow information', () => {
    const payload = embeds.gallery({
      status: 'info',
      title: 'Episode stills',
      description: 'Frames from the final render.',
      items: [
        { url: 'attachment://frame-1.png', description: 'Opening shot', link: 'https://example.com/1' },
        { url: 'attachment://frame-2.png', description: 'Final shot' },
      ],
      footer: 'Video Pipeline',
      timestamp: false,
    });
    expect(payload.embeds).toHaveLength(2);
    expect(payload.embeds?.[0].title).toBe('ℹ️ Episode stills · 1/2');
    expect(payload.embeds?.[0].description).toContain('Frames from the final render.');
    expect(payload.embeds?.[0].description).toContain('Opening shot');
    expect(payload.embeds?.[0].url).toBe('https://example.com/1');
    expect(payload.embeds?.[0].footer).toEqual({ text: 'Video Pipeline' });
    expect(payload.embeds?.[1].title).toBe('ℹ️ Episode stills · 2/2');
    expect(payload.embeds?.[1].timestamp).toBeUndefined();

    const overflow = embeds.gallery({
      items: Array.from({ length: 12 }, (_, index) => ({ url: `attachment://${index}.png` })),
      timestamp: false,
    });
    expect(overflow.embeds).toHaveLength(10);
    expect(overflow.embeds?.[0].description).toContain('+ 2 more');
  });

  it('adds branch, build number and preview image to build cards', () => {
    const embed = first(embeds.build({
      description: 'Build completed.',
      project: 'Duckov',
      environment: 'Production',
      platform: 'Windows',
      branch: 'release/1.2',
      build: '1842',
      commit: 'a82f91c',
      version: 'v1.2.0',
      image: 'attachment://build.png',
      timestamp: false,
    }));
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Branch', value: 'release/1.2', inline: true },
      { name: 'Build', value: '`1842`', inline: true },
    ]));
    expect(embed.image).toEqual({ url: 'attachment://build.png' });
  });

  it('adds branch, build number and preview image to deployment cards', () => {
    const embed = first(embeds.deployment({
      description: 'Deployment completed.',
      application: 'API',
      environment: 'production',
      branch: 'main',
      build: '1842',
      version: 'v1.8.2',
      image: 'attachment://deploy.png',
      timestamp: false,
    }));
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Branch', value: 'main', inline: true },
      { name: 'Build', value: '`1842`', inline: true },
    ]));
    expect(embed.image).toEqual({ url: 'attachment://deploy.png' });
  });

  it('renders stack traces and log links on error cards', () => {
    const embed = first(embeds.error({
      description: 'Rendering failed.',
      project: 'VideoPipeline',
      error: 'FFmpeg exited with code 1',
      stack: 'Error: FFmpeg failed\n    at render (pipeline.ts:42:7)',
      logs: 'https://example.com/logs/42',
      timestamp: false,
    }));
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Stack', value: '```\nError: FFmpeg failed\n    at render (pipeline.ts:42:7)\n```', inline: false },
      { name: 'Logs', value: '[Open logs](https://example.com/logs/42)', inline: false },
    ]));
  });

  it('renders pipeline stages as compact status fields', () => {
    const embed = first(embeds.pipeline({
      description: 'Processing completed with warnings.',
      steps: [
        { name: 'Transcription', status: 'success', duration: '2m' },
        { name: 'Translation', status: 'success', duration: '1m' },
        { name: 'Rendering', status: 'warning', duration: '8m' },
        { name: 'Upload', status: 'pending' },
      ],
      warning: '3 subtitle segments require review.',
      timestamp: false,
    }));
    expect(embed.title).toBe('⚠️ Video Pipeline');
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: '✓ Transcription', value: '2m', inline: true },
      { name: '⚠ Rendering', value: '8m', inline: true },
      { name: '· Upload', value: 'Pending', inline: true },
    ]));
    expect(embed.fields?.some((field) => field.name === 'Failed stage')).toBe(false);
  });

  it('highlights failed pipeline stages', () => {
    const embed = first(embeds.pipeline({
      description: 'Pipeline failed.',
      steps: [
        { name: 'Transcribe', status: 'success' },
        { name: 'Render', status: 'error', duration: '12m' },
      ],
      timestamp: false,
    }));
    expect(embed.title).toBe('❌ Video Pipeline');
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: '✕ Render', value: '12m', inline: true },
      { name: 'Failed stage', value: 'Render', inline: false },
    ]));
  });

  it('renders list items as a numbered grid', () => {
    const embed = first(embeds.list({
      description: 'Assets generated.',
      items: ['a.png', 'b.png', 'c.png'],
      maxItems: 2,
      duration: '2m',
      timestamp: false,
    }));
    expect(embed.description).toContain('+ 1 more');
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: '01', value: '✓ a.png', inline: true },
      { name: '02', value: '✓ b.png', inline: true },
      { name: 'Duration', value: '2m', inline: true },
    ]));
  });

  it('shows agent progress and status labels', () => {
    const embed = first(embeds.agent({
      description: 'Implementing inventory.',
      status: 'progress',
      progress: 50,
      model: 'DeepSeek',
      timestamp: false,
    }));
    expect(embed.description).toContain('████████████░░░░░░░░░░░░ 50%');
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Status', value: 'Working', inline: true },
    ]));
  });

  it('clamps oversized builder text to Discord limits', () => {
    const embed = first(embeds.card({
      status: 'info',
      title: 'T'.repeat(300),
      description: 'D'.repeat(3_000),
      fields: [{ name: 'N'.repeat(300), value: 'V'.repeat(2_000) }],
      footer: 'F'.repeat(3_000),
      timestamp: false,
    }));
    expect(embed.title!.length).toBe(256);
    expect(embed.title!.endsWith('…')).toBe(true);
    expect(embed.description!.length).toBe(2_048);
    expect(embed.fields![0].name.length).toBe(256);
    expect(embed.fields![0].value.length).toBe(1_024);
    expect(embed.footer!.text.length).toBe(2_048);
  });
});

describe('payload validation', () => {
  it('rejects too many embeds before fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ test: webhook });
    await expect(notify('test', {
      embeds: Array.from({ length: 11 }, () => ({ title: 'x' })),
    })).rejects.toThrow(/at most 10 embeds/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects too many fields and oversized text before fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ test: webhook });

    await expect(notify('test', {
      embeds: [{ title: 'x', fields: Array.from({ length: 26 }, () => ({ name: 'n', value: 'v' })) }],
    })).rejects.toThrow(/at most 25 fields/);

    await expect(notify('test', {
      embeds: [{ title: 'T'.repeat(257) }],
    })).rejects.toThrow(/title must be 256 characters or fewer/);

    await expect(notify('test', {
      content: 'C'.repeat(2_001),
    })).rejects.toThrow(/content must be 2000 characters or fewer/);

    await expect(notify('test', {
      embeds: [{
        title: 'T'.repeat(256),
        description: 'D'.repeat(2_048),
        fields: Array.from({ length: 25 }, () => ({ name: 'N'.repeat(100), value: 'V'.repeat(100) })),
      }],
    })).rejects.toThrow(/embeds must contain 6000 characters or fewer in total/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
