import { IS_COMPONENTS_V2 } from './constants.js';
import type { NotifyAttachment, NotifyEmbedAction, NotifyMediaSource } from './types.js';

/** Button styles */
export const ButtonStyle = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5,
  PREMIUM: 6,
} as const;

/** Component types */
export const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  TEXT_INPUT: 4,
  USER_SELECT: 5,
  ROLE_SELECT: 6,
  MENTIONABLE_SELECT: 7,
  CHANNEL_SELECT: 8,
  CONTAINER: 17,
  SECTION: 9,
  TEXT_DISPLAY: 10,
  THUMBNAIL: 11,
  MEDIA_GALLERY: 12,
  FILE: 13,
  SEPARATOR: 14,
} as const;

/** Separator spacing */
export const SeparatorSpacing = {
  SMALL: 1,
  LARGE: 2,
} as const;

/** Media gallery item */
export interface ComponentsV2MediaItem {
  media: { url: string };
  description?: string;
  spoiler?: boolean;
}

/** Section accessory (button or thumbnail) */
export interface ComponentsV2SectionAccessory {
  type: typeof ComponentType.BUTTON | typeof ComponentType.THUMBNAIL;
  media?: { url: string };
  description?: string;
  label?: string;
  style?: number;
  url?: string;
}

/** Components V2 payload structure */
export interface ComponentsV2Payload {
  flags: number;
  components: ComponentsV2Component[];
  attachments?: Array<{ id: number; filename: string; description?: string; is_spoiler?: boolean }>;
}

/** Base component interface */
export interface ComponentsV2Component {
  type: number;
  id?: number;
}

/** Container component - top-level wrapper */
export interface ComponentsV2Container extends ComponentsV2Component {
  type: typeof ComponentType.CONTAINER;
  accent_color?: number;
  spoiler?: boolean;
  components: ComponentsV2Component[];
}

/** Section component - associates text with an accessory */
export interface ComponentsV2Section extends ComponentsV2Component {
  type: typeof ComponentType.SECTION;
  components: ComponentsV2Component[];
  accessory?: ComponentsV2SectionAccessory;
}

/** Text display component - markdown content */
export interface ComponentsV2TextDisplay extends ComponentsV2Component {
  type: typeof ComponentType.TEXT_DISPLAY;
  content: string;
}

/** Thumbnail component */
export interface ComponentsV2Thumbnail extends ComponentsV2Component {
  type: typeof ComponentType.THUMBNAIL;
  media: { url: string };
  description?: string;
  spoiler?: boolean;
}

/** Media gallery component */
export interface ComponentsV2MediaGallery extends ComponentsV2Component {
  type: typeof ComponentType.MEDIA_GALLERY;
  items: ComponentsV2MediaItem[];
}

/** File component - displays an attachment */
export interface ComponentsV2File extends ComponentsV2Component {
  type: typeof ComponentType.FILE;
  file: { url: string };
  spoiler?: boolean;
}

/** Separator component */
export interface ComponentsV2Separator extends ComponentsV2Component {
  type: typeof ComponentType.SEPARATOR;
  divider?: boolean;
  spacing?: number;
}

/** Action row component - contains buttons or selects */
export interface ComponentsV2ActionRow extends ComponentsV2Component {
  type: typeof ComponentType.ACTION_ROW;
  components: ComponentsV2Button[];
}

/** Button component */
export interface ComponentsV2Button extends ComponentsV2Component {
  type: typeof ComponentType.BUTTON;
  style: number;
  label?: string;
  emoji?: { name: string; id?: string; animated?: boolean };
  url?: string;
  disabled?: boolean;
  custom_id?: string;
}

/** Union of all V2 component types */
export type ComponentsV2AnyComponent =
  | ComponentsV2Container
  | ComponentsV2Section
  | ComponentsV2TextDisplay
  | ComponentsV2Thumbnail
  | ComponentsV2MediaGallery
  | ComponentsV2File
  | ComponentsV2Separator
  | ComponentsV2ActionRow
  | ComponentsV2Button;

/** High-level builder options */
export interface ComponentsV2DashboardOptions {
  title?: string;
  description?: string;
  accentColor?: number;
  sections: ComponentsV2SectionOptions[];
  footer?: string;
  timestamp?: boolean;
}

export interface ComponentsV2SectionOptions {
  title?: string;
  description?: string;
  fields?: ComponentsV2Field[];
  accessory?: {
    type: 'button' | 'thumbnail';
    label?: string;
    url?: string;
    image?: NotifyMediaSource;
    description?: string;
  };
}

export interface ComponentsV2Field {
  name: string;
  value: string;
  inline?: boolean;
}

export interface ComponentsV2GalleryOptions {
  title?: string;
  description?: string;
  accentColor?: number;
  items: ComponentsV2MediaItem[];
  footer?: string;
  timestamp?: boolean;
}

export interface ComponentsV2MessageOptions {
  title?: string;
  description?: string;
  accentColor?: number;
  content: ComponentsV2AnyComponent[];
  footer?: string;
  timestamp?: boolean;
}

/** Create a link button (style 5) */
export function linkButton(label: string, url: string): ComponentsV2Button {
  return {
    type: ComponentType.BUTTON,
    style: ButtonStyle.LINK,
    label,
    url,
  };
}

/** Create a text display component */
export function textDisplay(content: string): ComponentsV2TextDisplay {
  return {
    type: ComponentType.TEXT_DISPLAY,
    content,
  };
}

/** Create a thumbnail component */
export function thumbnail(media: NotifyMediaSource, description?: string, spoiler?: boolean): ComponentsV2Thumbnail {
  const url = typeof media === 'string' ? media : media.url;
  return {
    type: ComponentType.THUMBNAIL,
    media: { url },
    description,
    spoiler,
  };
}

/** Create a media gallery item */
export function galleryItem(url: string, description?: string, spoiler?: boolean): ComponentsV2MediaItem {
  return {
    media: { url },
    description,
    spoiler,
  };
}

/** Create a media gallery component */
export function mediaGallery(items: ComponentsV2MediaItem[]): ComponentsV2MediaGallery {
  return {
    type: ComponentType.MEDIA_GALLERY,
    items,
  };
}

/** Create a separator */
export function separator(divider = true, spacing: 1 | 2 = SeparatorSpacing.SMALL): ComponentsV2Separator {
  return {
    type: ComponentType.SEPARATOR,
    divider,
    spacing,
  };
}

/** Create a file display component */
export function fileComponent(url: string, spoiler?: boolean): ComponentsV2File {
  return {
    type: ComponentType.FILE,
    file: { url },
    spoiler,
  };
}

/** Create an action row with buttons */
export function actionRow(...buttons: ComponentsV2Button[]): ComponentsV2ActionRow {
  return {
    type: ComponentType.ACTION_ROW,
    components: buttons,
  };
}

/** Create a section with text content and optional accessory */
export function section(
  textComponents: ComponentsV2TextDisplay[],
  accessory?: ComponentsV2SectionAccessory
): ComponentsV2Section {
  return {
    type: ComponentType.SECTION,
    components: textComponents,
    accessory,
  };
}

/** Create a container */
export function container(
  components: ComponentsV2AnyComponent[],
  accentColor?: number,
  spoiler?: boolean
): ComponentsV2Container {
  return {
    type: ComponentType.CONTAINER,
    accent_color: accentColor,
    spoiler,
    components,
  };
}

/** Build a dashboard-style Components V2 message */
export function dashboard(options: ComponentsV2DashboardOptions): ComponentsV2Payload {
  const components: ComponentsV2AnyComponent[] = [];

  if (options.title || options.description) {
    const parts: string[] = [];
    if (options.title) parts.push(`# ${options.title}`);
    if (options.description) parts.push(options.description);
    components.push(textDisplay(parts.join('\n\n')));
  }

  for (const sectionOpt of options.sections) {
    const textParts: string[] = [];
    if (sectionOpt.title) textParts.push(`## ${sectionOpt.title}`);
    if (sectionOpt.description) textParts.push(sectionOpt.description);
    if (sectionOpt.fields?.length) {
      for (const field of sectionOpt.fields) {
        textParts.push(`**${field.name}**\n${field.value}`);
      }
    }

    // Combine all parts into at most 3 text displays (Discord limit)
    const combinedParts: string[] = [];
    let currentPart = '';
    for (const part of textParts) {
      if (currentPart.length + part.length + 2 > 1000 && combinedParts.length < 3) {
        combinedParts.push(currentPart.trim());
        currentPart = part + '\n\n';
      } else {
        currentPart += part + '\n\n';
      }
    }
    if (currentPart.trim() && combinedParts.length < 3) {
      combinedParts.push(currentPart.trim());
    }

    const textComponents = combinedParts.map((content) => textDisplay(content));
    let accessory: ComponentsV2SectionAccessory | undefined;

    if (sectionOpt.accessory) {
      if (sectionOpt.accessory.type === 'button' && sectionOpt.accessory.url) {
        accessory = {
          type: ComponentType.BUTTON,
          style: ButtonStyle.LINK,
          label: sectionOpt.accessory.label ?? 'Open',
          url: sectionOpt.accessory.url,
        };
      } else if (sectionOpt.accessory.type === 'thumbnail' && sectionOpt.accessory.image) {
        const url = typeof sectionOpt.accessory.image === 'string'
          ? sectionOpt.accessory.image
          : sectionOpt.accessory.image.url;
        accessory = {
          type: ComponentType.THUMBNAIL,
          media: { url },
          description: sectionOpt.accessory.description,
        };
      }
    }

    // Discord requires Section to have an accessory; use Text Display directly if no accessory
    if (accessory) {
      components.push(section(textComponents, accessory));
    } else {
      components.push(...textComponents);
    }
  }

  if (options.footer) {
    components.push(separator());
    components.push(textDisplay(`*${options.footer}*`));
  }

  const containerComp = container(components, options.accentColor);

  return {
    flags: IS_COMPONENTS_V2,
    components: [containerComp],
  };
}

/** Build a media gallery Components V2 message */
export function gallery(options: ComponentsV2GalleryOptions): ComponentsV2Payload {
  const components: ComponentsV2AnyComponent[] = [];

  if (options.title || options.description) {
    const parts: string[] = [];
    if (options.title) parts.push(`# ${options.title}`);
    if (options.description) parts.push(options.description);
    components.push(textDisplay(parts.join('\n\n')));
  }

  components.push(mediaGallery(options.items));

  if (options.footer) {
    components.push(separator());
    components.push(textDisplay(`*${options.footer}*`));
  }

  const containerComp = container(components, options.accentColor);

  return {
    flags: IS_COMPONENTS_V2,
    components: [containerComp],
  };
}

/** Build a custom Components V2 message */
export function message(options: ComponentsV2MessageOptions): ComponentsV2Payload {
  const components: ComponentsV2AnyComponent[] = [];

  if (options.title || options.description) {
    const parts: string[] = [];
    if (options.title) parts.push(`# ${options.title}`);
    if (options.description) parts.push(options.description);
    components.push(textDisplay(parts.join('\n\n')));
  }

  components.push(...options.content);

  if (options.footer) {
    components.push(separator());
    components.push(textDisplay(`*${options.footer}*`));
  }

  const containerComp = container(components, options.accentColor);

  return {
    flags: IS_COMPONENTS_V2,
    components: [containerComp],
  };
}

/** Helper to convert V2 payload to standard notify payload format */
export function toNotifyPayload(v2: ComponentsV2Payload): {
  flags: number;
  components: unknown[];
  attachments?: NotifyAttachment[];
} {
  return {
    flags: v2.flags,
    components: v2.components as unknown[],
    attachments: v2.attachments as NotifyAttachment[] | undefined,
  };
}

export const componentsV2 = {
  dashboard,
  gallery,
  message,
  container,
  section,
  textDisplay,
  thumbnail,
  mediaGallery,
  galleryItem,
  file: fileComponent,
  separator,
  actionRow,
  linkButton,
  toNotifyPayload,
} as const;