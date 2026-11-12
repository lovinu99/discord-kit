export interface NotifyEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface NotifyMedia {
  url: string;
  description?: string;
  spoiler?: boolean;
}

/** A URL string is accepted anywhere an embed media object is accepted. */
export type NotifyMediaSource = string | NotifyMedia;

export interface NotifyAttachment {
  id: number;
  filename: string;
  description?: string;
  is_spoiler?: boolean;
}

export interface NotifyEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  image?: NotifyMedia;
  thumbnail?: NotifyMedia;
  author?: { name: string; url?: string; icon_url?: string };
  fields?: NotifyEmbedField[];
}

export interface NotifyFile {
  /** Filename shown in Discord and used by attachment:// references. */
  name: string;
  /** Local filesystem path. Mutually exclusive with data. */
  path?: string;
  /** In-memory bytes. Mutually exclusive with path. */
  data?: Uint8Array | Blob;
  /** MIME type. Inferred from the filename or Blob when omitted. */
  contentType?: string;
  /** Alt text / attachment description shown by Discord. */
  description?: string;
  /** Mark the attachment as a spoiler. */
  spoiler?: boolean;
}

export interface NotifyFileInfo {
  name: string;
  size: number;
  contentType: string;
  description?: string;
  spoiler?: boolean;
}

export interface NotifyPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  embeds?: NotifyEmbed[];
  attachments?: NotifyAttachment[];
  components?: unknown[];
  flags?: number;
  allowed_mentions?: {
    parse?: Array<'roles' | 'users' | 'everyone'>;
    roles?: string[];
    users?: string[];
    replied_user?: boolean;
  };
}

export interface NotifyMessageObject extends NotifyPayload {
  files?: NotifyFile[];
}

export type NotifyMessage = string | NotifyMessageObject;

export type NotifyEmbedStatus = 'success' | 'error' | 'warning' | 'info' | 'progress';

export interface NotifyEmbedAction {
  label: string;
  url: string;
}

export interface NotifyEmbedCardOptions {
  status: NotifyEmbedStatus;
  title: string;
  description?: string;
  fields?: NotifyEmbedField[];
  action?: NotifyEmbedAction;
  footer?: string;
  timestamp?: string | false;
  url?: string;
  thumbnail?: NotifyMediaSource;
  image?: NotifyMediaSource;
  author?: { name: string; url?: string; icon_url?: string };
}

export interface NotifyTableColumn {
  label: string;
  value: string | number;
  inline?: boolean;
  code?: boolean;
}

export interface NotifyTableEmbedOptions {
  status: NotifyEmbedStatus;
  title: string;
  description?: string;
  columns: NotifyTableColumn[];
  action?: NotifyEmbedAction;
  footer?: string;
  timestamp?: string | false;
  author?: { name: string; url?: string; icon_url?: string };
  thumbnail?: NotifyMediaSource;
}

export interface NotifyBuildEmbedOptions {
  title?: string;
  description: string;
  project?: string;
  environment?: string;
  platform?: string;
  branch?: string;
  commit?: string;
  version?: string;
  build?: string;
  duration?: string;
  size?: string;
  action?: NotifyEmbedAction;
  footer?: string;
  timestamp?: string | false;
  status?: Extract<NotifyEmbedStatus, 'success' | 'error' | 'warning' | 'info'>;
  error?: string;
  image?: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
}

export interface NotifyAgentEmbedOptions {
  title?: string;
  description: string;
  task?: string;
  model?: string;
  files?: string;
  changes?: string;
  duration?: string;
  elapsed?: string;
  tests?: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'progress';
  progress?: number;
  image?: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyTaskEmbedOptions {
  title?: string;
  description: string;
  project?: string;
  priority?: string;
  estimate?: string;
  duration?: string;
  status?: string;
  completed?: boolean;
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyErrorEmbedOptions {
  title?: string;
  description: string;
  project?: string;
  job?: string;
  stage?: string;
  duration?: string;
  error: string;
  stack?: string;
  command?: string;
  logs?: string;
  action?: NotifyEmbedAction;
  image?: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyProgressEmbedOptions {
  title: string;
  description: string;
  percentage: number;
  current?: string | number;
  total?: string | number;
  eta?: string;
  elapsed?: string;
  stage?: string;
  width?: number;
  image?: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyDeploymentEmbedOptions {
  title?: string;
  description: string;
  application?: string;
  version?: string;
  environment?: string;
  branch?: string;
  commit?: string;
  build?: string;
  duration?: string;
  action?: NotifyEmbedAction;
  error?: string;
  image?: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
  footer?: string;
  timestamp?: string | false;
  status?: Extract<NotifyEmbedStatus, 'success' | 'error' | 'warning' | 'info'>;
}

export interface NotifyPipelineStep {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  duration?: string;
}

export interface NotifyPipelineEmbedOptions {
  title?: string;
  description: string;
  steps: NotifyPipelineStep[];
  duration?: string;
  output?: string;
  size?: string;
  warning?: string;
  image?: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyListEmbedOptions {
  title?: string;
  description: string;
  items: string[];
  duration?: string;
  footer?: string;
  timestamp?: string | false;
  maxItems?: number;
}

export interface NotifyMediaEmbedOptions {
  status?: NotifyEmbedStatus;
  title: string;
  description?: string;
  image: NotifyMediaSource;
  thumbnail?: NotifyMediaSource;
  fields?: NotifyEmbedField[];
  action?: NotifyEmbedAction;
  footer?: string;
  timestamp?: string | false;
  author?: { name: string; url?: string; icon_url?: string };
}

export interface NotifyGalleryItem {
  url: string;
  description?: string;
  link?: string;
}

export interface NotifyGalleryEmbedOptions {
  status?: NotifyEmbedStatus;
  title?: string;
  description?: string;
  items: NotifyGalleryItem[];
  footer?: string;
  timestamp?: string | false;
  author?: { name: string; url?: string; icon_url?: string };
}

export interface ComponentsV2MediaItem {
  media: { url: string };
  description?: string;
  spoiler?: boolean;
}

export interface ComponentsV2SectionAccessory {
  type: 'button' | 'thumbnail';
  label?: string;
  url?: string;
  image?: NotifyMediaSource;
  description?: string;
}

export interface ComponentsV2Field {
  name: string;
  value: string;
  inline?: boolean;
}

export interface ComponentsV2SectionOptions {
  title?: string;
  description?: string;
  fields?: ComponentsV2Field[];
  accessory?: ComponentsV2SectionAccessory;
}

export interface ComponentsV2DashboardOptions {
  title?: string;
  description?: string;
  accentColor?: number;
  sections: ComponentsV2SectionOptions[];
  footer?: string;
  timestamp?: boolean;
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
  content: unknown[];
  footer?: string;
  timestamp?: boolean;
}

export interface ComponentsV2Payload {
  flags: number;
  components: unknown[];
  attachments?: Array<{ id: number; filename: string; description?: string; is_spoiler?: boolean }>;
}

export interface NotifyChannelOptions {
  webhook: string;
  enabled?: boolean;
  retries?: number;
  /** Whether this webhook belongs to your application (allows interactive buttons in V2). */
  owned?: boolean;
}

export type NotifyConfig = Record<string, string | NotifyChannelOptions>;

export interface NotifyResult<C extends string = string> {
  channel: C;
  success: true;
  status?: number;
  attempts?: number;
  skipped?: boolean;
}

export interface NotifyBeforeSendContext<C extends string = string> {
  channel: C;
  message: NotifyMessage;
  payload: NotifyPayload;
  files: NotifyFileInfo[];
  attempt: number;
}

export interface NotifyAfterSendContext<C extends string = string> {
  channel: C;
  message: NotifyMessage;
  payload: NotifyPayload;
  files: NotifyFileInfo[];
  attempt: number;
  success: boolean;
  status?: number;
  error?: unknown;
}

export interface NotifyLogger {
  debug?: (...arguments_: unknown[]) => void;
  warn?: (...arguments_: unknown[]) => void;
  error?: (...arguments_: unknown[]) => void;
}

export interface NotifyOptions<C extends string = string> {
  timeout?: number;
  retries?: number;
  logger?: NotifyLogger;
  beforeSend?: (context: NotifyBeforeSendContext<C>) => void | Promise<void>;
  afterSend?: (context: NotifyAfterSendContext<C>) => void | Promise<void>;
  onComplete?: (result: NotifyResult<C>) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface NotifyFunction<C extends string> {
  (channel: C, message: NotifyMessage): Promise<NotifyResult<C>>;
  success(channel: C, message: string): Promise<NotifyResult<C>>;
  error(channel: C, message: string): Promise<NotifyResult<C>>;
  warning(channel: C, message: string): Promise<NotifyResult<C>>;
  info(channel: C, message: string): Promise<NotifyResult<C>>;
  channels(): C[];
  has(channel: string): channel is C;
  enable(channel: C): void;
  disable(channel: C): void;
}