import { IS_COMPONENTS_V2 } from './constants.js';
import type { ResolvedFile } from './media.js';
import type { NotifyAttachment, NotifyPayload } from './types.js';

/**
 * Build and send one webhook request. A fresh body is created on every call so
 * the retry loop can safely reuse the same resolved files.
 */
export async function sendRequest(
  webhook: string,
  payload: NotifyPayload,
  timeout: number,
  files: ResolvedFile[] = [],
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const url = webhookUrl(webhook, payload);
    if (files.length === 0) {
      return await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    const form = new FormData();
    form.append('payload_json', JSON.stringify(withAttachments(payload, files)));
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      form.append(`files[${index}]`, file.blob, file.name);
    }
    return await fetch(url, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function withAttachments(payload: NotifyPayload, files: ResolvedFile[]): NotifyPayload {
  const attachments: NotifyAttachment[] = files.map((file, index) => {
    const attachment: NotifyAttachment = { id: index, filename: file.name };
    if (file.description !== undefined) attachment.description = file.description;
    if (file.spoiler !== undefined) attachment.is_spoiler = file.spoiler;
    return attachment;
  });
  return { ...payload, attachments };
}

export function webhookUrl(webhook: string, payload: NotifyPayload): string {
  const needsComponents = (payload.flags ?? 0) & IS_COMPONENTS_V2
    || (payload.components?.length ?? 0) > 0;
  if (!needsComponents) return webhook;

  const url = new URL(webhook);
  url.searchParams.set('with_components', 'true');
  return url.toString();
}
