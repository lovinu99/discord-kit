import type { ResolvedFile } from './media.js';
import type { NotifyEmbed, NotifyPayload } from './types.js';

export const EMBED_LIMITS = {
  content: 2_000,
  embeds: 10,
  fields: 25,
  totalCharacters: 6_000,
  title: 256,
  description: 2_048,
  fieldName: 256,
  fieldValue: 1_024,
  footer: 2_048,
  authorName: 256,
} as const;

export const COMPONENTS_V2_LIMITS = {
  maxComponents: 40,
  maxContainerChildren: 40,
  maxSectionTextDisplays: 3,
  maxMediaGalleryItems: 10,
  maxActionRowButtons: 5,
} as const;

/** Reject payloads Discord would reject instead of waiting for a 400 response. */
export function validatePayload(payload: NotifyPayload): void {
  if (payload.content !== undefined && payload.content.length > EMBED_LIMITS.content) {
    throw new TypeError(`Message content must be ${EMBED_LIMITS.content} characters or fewer`);
  }
  if (!payload.embeds?.length) return;
  if (payload.embeds.length > EMBED_LIMITS.embeds) {
    throw new TypeError(`Discord supports at most ${EMBED_LIMITS.embeds} embeds per message`);
  }

  let totalCharacters = 0;
  for (const [index, embed] of payload.embeds.entries()) {
    assertLength(embed.title, EMBED_LIMITS.title, `Embed ${index + 1} title`);
    assertLength(embed.description, EMBED_LIMITS.description, `Embed ${index + 1} description`);
    assertLength(embed.footer?.text, EMBED_LIMITS.footer, `Embed ${index + 1} footer`);
    assertLength(embed.author?.name, EMBED_LIMITS.authorName, `Embed ${index + 1} author name`);
    if ((embed.fields?.length ?? 0) > EMBED_LIMITS.fields) {
      throw new TypeError(`Embed ${index + 1} supports at most ${EMBED_LIMITS.fields} fields`);
    }
    for (const [fieldIndex, field] of (embed.fields ?? []).entries()) {
      assertLength(field.name, EMBED_LIMITS.fieldName, `Embed ${index + 1} field ${fieldIndex + 1} name`);
      assertLength(field.value, EMBED_LIMITS.fieldValue, `Embed ${index + 1} field ${fieldIndex + 1} value`);
      totalCharacters += field.name.length + field.value.length;
    }
    totalCharacters += (embed.title?.length ?? 0)
      + (embed.description?.length ?? 0)
      + (embed.footer?.text.length ?? 0)
      + (embed.author?.name.length ?? 0);
  }
  if (totalCharacters > EMBED_LIMITS.totalCharacters) {
    throw new TypeError(`Embeds must contain ${EMBED_LIMITS.totalCharacters} characters or fewer in total`);
  }
}

/** Validate Components V2 payload */
export function validateComponentsV2(payload: NotifyPayload): void {
  const isV2 = (payload.flags ?? 0) & (1 << 15);
  if (!isV2) return;

  if (payload.embeds?.length) {
    throw new TypeError('Components V2 messages cannot contain embeds');
  }
  if (payload.content?.length) {
    throw new TypeError('Components V2 messages cannot contain content - use Text Display components instead');
  }

  const components = payload.components ?? [];
  if (!components.length) {
    throw new TypeError('Components V2 messages require at least one component');
  }
  if (components.length > COMPONENTS_V2_LIMITS.maxComponents) {
    throw new TypeError(`Components V2 messages support at most ${COMPONENTS_V2_LIMITS.maxComponents} top-level components`);
  }

  validateComponentsTree(components, 0);
}

/** Recursively validate component tree */
function validateComponentsTree(components: unknown[], depth: number): void {
  if (depth > 5) {
    throw new TypeError('Component nesting exceeds maximum depth of 5');
  }

  for (const component of components) {
    if (!component || typeof component !== 'object') continue;
    const comp = component as Record<string, unknown>;
    const type = comp.type as number;

    switch (type) {
      case 17: // Container
        if (!Array.isArray(comp.components)) {
          throw new TypeError('Container must have a components array');
        }
        if (comp.components.length > COMPONENTS_V2_LIMITS.maxContainerChildren) {
          throw new TypeError(`Container supports at most ${COMPONENTS_V2_LIMITS.maxContainerChildren} children`);
        }
        validateComponentsTree(comp.components as unknown[], depth + 1);
        break;

      case 9: // Section
        if (!Array.isArray(comp.components)) {
          throw new TypeError('Section must have a components array');
        }
        if (comp.components.length > COMPONENTS_V2_LIMITS.maxSectionTextDisplays) {
          throw new TypeError(`Section supports at most ${COMPONENTS_V2_LIMITS.maxSectionTextDisplays} text displays`);
        }
        for (const child of comp.components as unknown[]) {
          if (child && typeof child === 'object' && (child as Record<string, unknown>).type !== 10) {
            throw new TypeError('Section children must be Text Display components');
          }
        }
        if (comp.accessory) {
          const accessory = comp.accessory as Record<string, unknown>;
          if (accessory.type === 2 && accessory.style !== 5) {
            throw new TypeError('Section accessory buttons must be link buttons (style 5)');
          }
        }
        break;

      case 12: // Media Gallery
        if (!Array.isArray(comp.items)) {
          throw new TypeError('Media Gallery must have an items array');
        }
        if (comp.items.length > COMPONENTS_V2_LIMITS.maxMediaGalleryItems) {
          throw new TypeError(`Media Gallery supports at most ${COMPONENTS_V2_LIMITS.maxMediaGalleryItems} items`);
        }
        break;

      case 1: // Action Row
        if (!Array.isArray(comp.components)) {
          throw new TypeError('Action Row must have a components array');
        }
        if (comp.components.length > COMPONENTS_V2_LIMITS.maxActionRowButtons) {
          throw new TypeError(`Action Row supports at most ${COMPONENTS_V2_LIMITS.maxActionRowButtons} buttons`);
        }
        for (const child of comp.components as unknown[]) {
          if (child && typeof child === 'object' && (child as Record<string, unknown>).type !== 2) {
            throw new TypeError('Action Row children must be buttons');
          }
        }
        validateComponentsTree(comp.components as unknown[], depth + 1);
        break;

      case 2: // Button
        if (comp.style === 5 && !comp.url) {
          throw new TypeError('Link buttons (style 5) must have a url');
        }
        if (comp.style !== 5 && !comp.custom_id) {
          throw new TypeError('Interactive buttons (style 1-4, 6) must have a custom_id');
        }
        break;
    }
  }
}

/** Reject V2 with interactive buttons for non-owned webhooks */
export function validateWebhookComponentsV2(
  payload: NotifyPayload,
  isOwnedWebhook: boolean
): void {
  const isV2 = (payload.flags ?? 0) & (1 << 15);
  if (!isV2) return;

  if (!isOwnedWebhook) {
    const hasInteractiveButton = findInteractiveButton(payload.components ?? []);
    if (hasInteractiveButton) {
      throw new TypeError('Non-owned webhooks cannot send interactive buttons in Components V2');
    }
  }
}

function findInteractiveButton(components: unknown[]): boolean {
  for (const component of components) {
    if (!component || typeof component !== 'object') continue;
    const comp = component as Record<string, unknown>;
    if (comp.type === 2) {
      const style = comp.style as number;
      if (style !== 5) return true; // Not a link button
    }
    if (Array.isArray(comp.components)) {
      if (findInteractiveButton(comp.components as unknown[])) return true;
    }
  }
  return false;
}

/** Discord only resolves attachment:// URLs inside media fields. Validate those references before the request. */
export function validateAttachmentReferences(payload: NotifyPayload, files: ResolvedFile[]): void {
  const names = new Set(files.map((file) => file.name));
  const references = new Set<string>();

  for (const embed of payload.embeds ?? []) {
    collectEmbedMedia(embed, references);
  }
  collectComponentMedia(payload.components, references);

  for (const reference of references) {
    if (!names.has(reference)) {
      throw new TypeError(
        `Attachment reference "attachment://${reference}" does not match any uploaded file`,
      );
    }
  }
}

function collectEmbedMedia(embed: NotifyEmbed, references: Set<string>): void {
  collectAttachmentUrl(embed.image?.url, references);
  collectAttachmentUrl(embed.thumbnail?.url, references);
}

function collectComponentMedia(value: unknown, references: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectComponentMedia(item, references);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'url' && typeof nested === 'string') {
      collectAttachmentUrl(nested, references);
    } else {
      collectComponentMedia(nested, references);
    }
  }
}

function collectAttachmentUrl(value: string | undefined, references: Set<string>): void {
  if (!value || !value.startsWith('attachment://')) return;
  references.add(value.slice('attachment://'.length));
}

function assertLength(value: string | undefined, limit: number, label: string): void {
  if (value !== undefined && value.length > limit) {
    throw new TypeError(`${label} must be ${limit} characters or fewer`);
  }
}