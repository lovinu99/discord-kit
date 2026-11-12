import { beforeEach, describe, expect, it, vi } from 'vitest';
import { componentsV2, init } from '../src/index.js';
import { validateComponentsV2 } from '../src/validate.js';

const webhook = 'https://discord.com/api/webhooks/123/token';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('validateComponentsV2 direct', () => {
  it('throws for link button without url', () => {
    expect(() => validateComponentsV2({
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: [{ type: 2, style: 5, label: 'No URL' }],
        }],
      }],
    })).toThrow(/Link buttons.*must have a url/);
  });

  it('throws for interactive button without custom_id', () => {
    expect(() => validateComponentsV2({
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: [{ type: 2, style: 1, label: 'Primary' }],
        }],
      }],
    })).toThrow(/Interactive buttons.*must have a custom_id/);
  });
});

describe('Components V2 builders', () => {
  it('creates a dashboard with sections and accessories', () => {
    const payload = componentsV2.dashboard({
      title: 'Deployment Dashboard',
      description: 'Production deployment overview',
      accentColor: 0x8b5cf6,
      sections: [
        {
          title: 'Status',
          description: 'All systems operational',
          accessory: { type: 'button', label: 'View Details', url: 'https://example.com/deploy/1' },
        },
        {
          title: 'Metrics',
          fields: [
            { name: 'Latency', value: '42ms', inline: true },
            { name: 'Throughput', value: '1.2k req/s', inline: true },
          ],
        },
      ],
      footer: 'Deploy Bot',
      timestamp: true,
    });

    expect(payload.flags).toBe(1 << 15);
    expect(payload.components).toHaveLength(1);
    expect(payload.components[0].type).toBe(17); // Container
    const container = payload.components[0] as unknown as { components: unknown[] };
    expect(container.components.length).toBeGreaterThan(0);
  });

  it('creates a media gallery with multiple images', () => {
    const payload = componentsV2.gallery({
      title: 'Episode Stills',
      description: 'Frames from the final render',
      items: [
        { media: { url: 'attachment://frame-1.png' }, description: 'Opening shot' },
        { media: { url: 'attachment://frame-2.png' }, description: 'Final shot' },
      ],
      footer: 'Video Pipeline',
      timestamp: false,
    });

    expect(payload.flags).toBe(1 << 15);
    const container = payload.components[0] as unknown as { components: unknown[] };
    const gallery = container.components.find((c) => (c as Record<string, unknown>).type === 12);
    expect(gallery).toBeDefined();
    expect((gallery as unknown as { items: unknown[] }).items).toHaveLength(2);
  });

  it('creates a custom message with arbitrary components', () => {
    const payload = componentsV2.message({
      title: 'Custom Layout',
      content: [
        componentsV2.textDisplay('## Hello'),
        componentsV2.separator(),
        componentsV2.mediaGallery([
          { media: { url: 'attachment://image.png' } },
        ]),
        componentsV2.actionRow(
          componentsV2.linkButton('Open', 'https://example.com'),
        ),
      ],
      footer: 'Footer',
      timestamp: true,
    });

    expect(payload.flags).toBe(1 << 15);
    const container = payload.components[0] as unknown as { components: unknown[] };
    expect(container.components.some((c) => (c as Record<string, unknown>).type === 10)).toBe(true); // Text Display
    expect(container.components.some((c) => (c as Record<string, unknown>).type === 14)).toBe(true); // Separator
    expect(container.components.some((c) => (c as Record<string, unknown>).type === 12)).toBe(true); // Media Gallery
    expect(container.components.some((c) => (c as Record<string, unknown>).type === 1)).toBe(true); // Action Row
  });

  it('builds link buttons correctly', () => {
    const button = componentsV2.linkButton('Open Repository', 'https://github.com/example');
    expect(button.type).toBe(2);
    expect(button.style).toBe(5);
    expect(button.label).toBe('Open Repository');
    expect(button.url).toBe('https://github.com/example');
    expect(button.custom_id).toBeUndefined();
  });

  it('builds text display with markdown', () => {
    const text = componentsV2.textDisplay('# Header\n**Bold** and *italic*');
    expect(text.type).toBe(10);
    expect(text.content).toBe('# Header\n**Bold** and *italic*');
  });

  it('builds thumbnail with attachment URL', () => {
    const thumb = componentsV2.thumbnail('attachment://thumb.png', 'Preview image');
    expect(thumb.type).toBe(11);
    expect(thumb.media.url).toBe('attachment://thumb.png');
    expect(thumb.description).toBe('Preview image');
  });

  it('builds file display component', () => {
    const file = componentsV2.file('attachment://document.pdf', true);
    expect(file.type).toBe(13);
    expect(file.file.url).toBe('attachment://document.pdf');
    expect(file.spoiler).toBe(true);
  });

  it('builds separators with different spacing', () => {
    const small = componentsV2.separator(true, 1);
    expect(small.type).toBe(14);
    expect(small.divider).toBe(true);
    expect(small.spacing).toBe(1);

    const large = componentsV2.separator(false, 2 as 1 | 2);
    expect(large.divider).toBe(false);
    expect(large.spacing).toBe(2);
  });

  it('toNotifyPayload converts V2 payload to notify format', () => {
    const v2 = componentsV2.gallery({
      items: [{ media: { url: 'attachment://a.png' } }],
    });
    const notifyPayload = componentsV2.toNotifyPayload(v2);
    expect(notifyPayload.flags).toBe(1 << 15);
    expect(Array.isArray(notifyPayload.components)).toBe(true);
  });
});

describe('Components V2 validation', () => {
  it('rejects V2 payload with embeds', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{ type: 17, components: [] }],
      embeds: [{ title: 'Test' }],
    })).rejects.toThrow(/cannot contain embeds/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects V2 payload with content', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{ type: 17, components: [] }],
      content: 'Hello',
    })).rejects.toThrow(/cannot contain content/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects V2 payload without components', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
    })).rejects.toThrow(/require at least one component/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects section with non-text-display children', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 9,
          components: [{ type: 12, items: [] }], // Media Gallery instead of Text Display
        }],
      }],
    })).rejects.toThrow(/Section children must be Text Display/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects section accessory with interactive button', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 9,
          components: [{ type: 10, content: 'Test' }],
          accessory: { type: 2, style: 1, custom_id: 'btn' }, // Interactive button
        }],
      }],
    })).rejects.toThrow(/must be link buttons/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects media gallery with too many items', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 12,
          items: Array.from({ length: 11 }, (_, i) => ({ media: { url: `attachment://${i}.png` } })),
        }],
      }],
    })).rejects.toThrow(/at most 10 items/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects action row with too many buttons', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: Array.from({ length: 6 }, (_, i) => ({ type: 2, style: 5, label: `Btn${i}`, url: 'https://example.com' })),
        }],
      }],
    })).rejects.toThrow(/at most 5 buttons/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects link button without url', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: { webhook, owned: true } });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: [{ type: 2, style: 5, label: 'No URL' }],
        }],
      }],
    })).rejects.toThrow(/Link buttons.*must have a url/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects interactive button without custom_id', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: { webhook, owned: true } });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: [{ type: 2, style: 1, label: 'Primary' }],
        }],
      }],
    })).rejects.toThrow(/Interactive buttons.*must have a custom_id/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects interactive buttons for non-owned webhooks', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: { webhook, owned: false } });

    await expect(notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: [{ type: 2, style: 1, label: 'Click', custom_id: 'btn' }],
        }],
      }],
    })).rejects.toThrow(/Non-owned webhooks cannot send interactive buttons/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows link buttons for non-owned webhooks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: { webhook, owned: false } });

    await notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [{
          type: 1,
          components: [{ type: 2, style: 5, label: 'Link', url: 'https://example.com' }],
        }],
      }],
    });

    expect(fetchMock).toHaveBeenCalled();
  });

  it('sends V2 gallery with multipart attachment', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ v2: webhook });

    await notify('v2', {
      flags: 1 << 15,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '# Gallery' },
          {
            type: 12,
            items: [{ media: { url: 'attachment://image.png' } }],
          },
        ],
      }],
      files: [{ name: 'image.png', data: Buffer.from('fake-png'), contentType: 'image/png' }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const form = fetchMock.mock.calls[0][1].body as FormData;
    const payload = JSON.parse(String(form.get('payload_json')));
    expect(payload.flags).toBe(1 << 15);
    expect(payload.attachments).toEqual([{ id: 0, filename: 'image.png' }]);
    expect((form.get('files[0]') as File).type).toBe('image/png');
  });
});