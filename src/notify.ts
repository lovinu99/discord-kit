import { NotifyError } from './error.js';
import type {
  NotifyAfterSendContext,
  NotifyBeforeSendContext,
  NotifyChannelOptions,
  NotifyConfig,
  NotifyFunction,
  NotifyLogger,
  NotifyMessage,
  NotifyOptions,
  NotifyPayload,
  NotifyResult,
} from './types.js';

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

interface NormalizedChannel {
  webhook: string;
  enabled: boolean;
  retries?: number;
}

interface SendFailure {
  status?: number;
  cause: unknown;
  retryAfter?: number;
}

export function createNotify<const T extends NotifyConfig>(
  config: T,
  options: NotifyOptions<Extract<keyof T, string>> = {},
): NotifyFunction<Extract<keyof T, string>> {
  const channels = new Map<string, NormalizedChannel>();
  for (const [channel, value] of Object.entries(config)) {
    const normalized = typeof value === 'string' ? { webhook: value } : value;
    channels.set(channel, {
      webhook: normalized.webhook,
      enabled: normalized.enabled ?? true,
      retries: normalized.retries,
    });
  }

  const timeout = validateNonNegativeNumber(options.timeout ?? DEFAULT_TIMEOUT, 'timeout', false);
  const retries = validateNonNegativeNumber(options.retries ?? DEFAULT_RETRIES, 'retries', true);
  const typedChannels = () => [...channels.keys()] as Extract<keyof T, string>[];

  const send = async (
    channel: Extract<keyof T, string>,
    message: NotifyMessage,
  ): Promise<NotifyResult<Extract<keyof T, string>>> => {
    const channelName = channel as string;
    const channelConfig = channels.get(channelName);
    if (!channelConfig) {
      throw new NotifyError(`Unknown notification channel: ${channelName}`, {
        channel: channelName,
        attempts: 0,
      });
    }

    if (!channelConfig.enabled) {
      const result: NotifyResult<Extract<keyof T, string>> = {
        channel,
        success: true,
        skipped: true,
      };
      try {
        await invokeComplete(options, result, channelName);
      } catch (cause) {
        const error = cause instanceof NotifyError
          ? cause
          : toNotifyError('onComplete hook failed', channelName, 0, cause);
        await invokeError(options, error);
        throw error;
      }
      return result;
    }

    const payload = normalizeMessage(message);
    const maxRetries = channelConfig.retries ?? retries;
    let lastFailure: SendFailure | undefined;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
      const beforeContext: NotifyBeforeSendContext<Extract<keyof T, string>> = {
        channel,
        message,
        payload,
        attempt,
      };

      try {
        await options.beforeSend?.(beforeContext);
      } catch (cause) {
        const error = toNotifyError('beforeSend hook failed', channelName, attempt - 1, cause);
        await invokeError(options, error);
        throw error;
      }

      let response: Response | undefined;
      let failure: SendFailure | undefined;
      try {
        response = await sendRequest(channelConfig.webhook, payload, timeout);
        if (!response.ok) {
          failure = {
            status: response.status,
            retryAfter: response.status === 429 ? getRetryAfter(response) : undefined,
            cause: new Error(`Discord webhook returned HTTP ${response.status}`),
          };
        }
      } catch (cause) {
        failure = { cause };
      }

      const afterContext: NotifyAfterSendContext<Extract<keyof T, string>> = {
        channel,
        message,
        payload,
        attempt,
        success: !failure,
        status: response?.status,
        error: failure ? sanitizeCause(failure.cause) : undefined,
      };

      try {
        await options.afterSend?.(afterContext);
      } catch (cause) {
        const error = toNotifyError('afterSend hook failed', channelName, attempt, cause);
        await invokeError(options, error);
        throw error;
      }

      if (!failure) {
        const result: NotifyResult<Extract<keyof T, string>> = {
          channel,
          success: true,
          status: response?.status,
          attempts: attempt,
        };
        try {
          await invokeComplete(options, result, channelName);
        } catch (cause) {
          const error = toNotifyError('onComplete hook failed', channelName, attempt, cause);
          await invokeError(options, error);
          throw error;
        }
        return result;
      }

      lastFailure = failure;
      const shouldRetry = isRetryable(failure) && attempt <= maxRetries;
      if (!shouldRetry) break;

      const delay = failure.retryAfter ?? 500 * 2 ** (attempt - 1);
      options.logger?.debug?.(`Notification retry scheduled for ${channelName} in ${delay}ms`);
      await sleep(delay);
    }

    const attempts = maxRetries > 0 && lastFailure?.status !== undefined && !isRetryable(lastFailure)
      ? 1
      : maxRetries + 1;
    const error = toNotifyError(
      `Failed to send notification to channel "${channelName}"`,
      channelName,
      attempts,
      lastFailure?.cause,
      lastFailure?.status,
    );
    options.logger?.error?.(error.message, { channel: channelName, status: error.status, attempts: error.attempts });
    await invokeError(options, error);
    throw error;
  };

  const notify = Object.assign(send, {
    success: (channel: Extract<keyof T, string>, message: string) =>
      send(channel, { content: `✅ ${message}` }),
    error: (channel: Extract<keyof T, string>, message: string) =>
      send(channel, { content: `❌ ${message}` }),
    warning: (channel: Extract<keyof T, string>, message: string) =>
      send(channel, { content: `⚠️ ${message}` }),
    info: (channel: Extract<keyof T, string>, message: string) =>
      send(channel, { content: `ℹ️ ${message}` }),
    channels: typedChannels,
    has: (channel: string): channel is Extract<keyof T, string> => channels.has(channel),
    enable: (channel: Extract<keyof T, string>) => setEnabled(channel, true),
    disable: (channel: Extract<keyof T, string>) => setEnabled(channel, false),
  }) as NotifyFunction<Extract<keyof T, string>>;

  return notify;

  function setEnabled(channel: Extract<keyof T, string>, enabled: boolean): void {
    const channelConfig = channels.get(channel as string);
    if (!channelConfig) {
      throw new NotifyError(`Unknown notification channel: ${String(channel)}`, {
        channel: String(channel),
        attempts: 0,
      });
    }
    channelConfig.enabled = enabled;
  }
}

export function normalizeMessage(message: NotifyMessage): NotifyPayload {
  if (typeof message === 'string') return { content: message };
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new TypeError('Notification message must be a string or message object');
  }
  return { ...message };
}

export function validateWebhook(value: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('Webhook URL must be a non-empty string');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('Webhook URL must be a valid HTTPS Discord webhook URL');
  }
  const hostname = url.hostname.toLowerCase();
  const validHost = hostname === 'discord.com' || hostname === 'discordapp.com' || hostname.endsWith('.discord.com');
  if (url.protocol !== 'https:' || !validHost || !/^\/api\/webhooks\/[^/]+\/[^/]+/.test(url.pathname)) {
    throw new TypeError('Webhook URL must be a valid HTTPS Discord webhook URL');
  }
}

function validateNonNegativeNumber(value: number, name: string, integer: boolean): number {
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value)) || (!integer && value === 0)) {
    throw new TypeError(`${name} must be a ${integer ? 'non-negative integer' : 'positive number'}`);
  }
  return value;
}

async function sendRequest(url: string, payload: NotifyPayload, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isRetryable(failure: SendFailure): boolean {
  if (failure.status !== undefined) return RETRYABLE_STATUSES.has(failure.status);
  return true;
}

function getRetryAfter(response: Response): number | undefined {
  const value = response.headers.get('retry-after');
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : Math.max(0, timestamp - Date.now());
}

function toNotifyError(message: string, channel: string, attempts: number, cause?: unknown, status?: number): NotifyError {
  return new NotifyError(message, { channel, status, attempts, cause: sanitizeCause(cause) });
}

function sanitizeCause(cause: unknown): Error | undefined {
  if (cause === undefined) return undefined;
  const message = cause instanceof Error ? cause.message : String(cause);
  const safeMessage = message.replace(/https?:\/\/[^\s"'<>]+/gi, '[redacted-url]');
  const safeCause = new Error(safeMessage);
  if (cause instanceof Error) safeCause.name = cause.name;
  return safeCause;
}

async function invokeComplete<C extends string>(options: NotifyOptions<C>, result: NotifyResult<C>, channel: string): Promise<void> {
  try {
    await options.onComplete?.(result);
  } catch (cause) {
    throw toNotifyError('onComplete hook failed', channel, result.attempts ?? 0, cause, result.status);
  }
}

async function invokeError<C extends string>(options: NotifyOptions<C>, error: NotifyError): Promise<void> {
  try {
    await options.onError?.(error);
  } catch (cause) {
    options.logger?.error?.('onError hook failed', { channel: error.channel, cause });
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}