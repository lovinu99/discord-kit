import { beforeEach, describe, expect, it, vi } from 'vitest';
import { init, NotifyError } from '../src/index.js';

const webhook = 'https://discord.com/api/webhooks/123/token';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('init and lifecycle hooks', () => {
  it('normalizes string messages and invokes lifecycle hooks', async () => {
    const beforeSend = vi.fn();
    const afterSend = vi.fn();
    const onComplete = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const notify = init({ unity: webhook }, { beforeSend, afterSend, onComplete });

    const result = await notify('unity', 'hello');

    expect(result).toEqual({ channel: 'unity', success: true, status: 204, attempts: 1 });
    expect(fetch).toHaveBeenCalledWith(webhook, expect.objectContaining({ body: '{"content":"hello"}' }));
    expect(beforeSend).toHaveBeenCalledWith(expect.objectContaining({ channel: 'unity', attempt: 1 }));
    expect(afterSend).toHaveBeenCalledWith(expect.objectContaining({ channel: 'unity', success: true, status: 204 }));
    expect(onComplete).toHaveBeenCalledWith(result);
  });

  it('runs afterSend for failed attempts and onError once', async () => {
    const afterSend = vi.fn();
    const onError = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 400 })));
    const notify = init({ unity: webhook }, { retries: 2, afterSend, onError });

    await expect(notify('unity', 'hello')).rejects.toMatchObject({
      name: 'NotifyError',
      channel: 'unity',
      status: 400,
      attempts: 1,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(afterSend).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('retries transient responses', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ unity: webhook }, { retries: 1 });

    const promise = notify('unity', 'hello');
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toMatchObject({ attempts: 2, status: 204 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('skips disabled channels and completes without fetch', async () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const notify = init({ unity: { webhook, enabled: false } }, { onComplete });

    await expect(notify('unity', 'hello')).resolves.toEqual({ channel: 'unity', success: true, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('validates Discord webhook URLs synchronously', () => {
    expect(() => init({ unity: 'http://discord.com/api/webhooks/123/token' })).toThrow(/HTTPS Discord webhook/);
    expect(() => init({ unity: 'https://example.com/api/webhooks/123/token' })).toThrow(/HTTPS Discord webhook/);
  });

  it('wraps hook failures without exposing URLs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const notify = init({ unity: webhook }, { beforeSend: () => { throw new Error('secret hook failure'); } });

    try {
      await notify('unity', 'hello');
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(NotifyError);
      expect(error).toMatchObject({ channel: 'unity', attempts: 0 });
      expect(String(error)).not.toContain(webhook);
    }
  });

  it('sanitizes webhook URLs from network causes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(`failed for ${webhook}`)));
    const notify = init({ unity: webhook }, { retries: 0 });

    try {
      await notify('unity', 'hello');
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(NotifyError);
      expect(String(error)).not.toContain(webhook);
      expect(String((error as NotifyError).cause)).not.toContain(webhook);
    }
  });
});