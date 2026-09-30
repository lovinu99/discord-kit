import { createNotify, validateWebhook } from './notify.js';
import type { NotifyConfig, NotifyOptions, NotifyFunction } from './types.js';

export function init<const T extends NotifyConfig>(
  config: T,
  options: NotifyOptions<Extract<keyof T, string>> = {},
): NotifyFunction<Extract<keyof T, string>> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Notification config must be an object');
  }
  const entries = Object.entries(config);
  if (entries.length === 0) throw new TypeError('Notification config must contain at least one channel');

  for (const [channel, value] of entries) {
    if (!channel.trim()) throw new TypeError('Notification channel names must not be empty');
    const webhook = typeof value === 'string' ? value : value?.webhook;
    validateWebhook(webhook);
    if (typeof value === 'object' && value !== null && value.retries !== undefined) {
      if (!Number.isInteger(value.retries) || value.retries < 0) {
        throw new TypeError(`retries for channel "${channel}" must be a non-negative integer`);
      }
    }
  }

  return createNotify(config, options);
}