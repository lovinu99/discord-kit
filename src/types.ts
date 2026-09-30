export interface NotifyEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface NotifyEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: NotifyEmbedField[];
}

export interface NotifyPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  embeds?: NotifyEmbed[];
  allowed_mentions?: {
    parse?: Array<'roles' | 'users' | 'everyone'>;
    roles?: string[];
    users?: string[];
    replied_user?: boolean;
  };
}

export type NotifyMessage = string | NotifyPayload;

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
  thumbnail?: { url: string };
  image?: { url: string };
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
  thumbnail?: { url: string };
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
  duration?: string;
  size?: string;
  action?: NotifyEmbedAction;
  footer?: string;
  timestamp?: string | false;
  status?: Extract<NotifyEmbedStatus, 'success' | 'error' | 'warning' | 'info'>;
  error?: string;
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
  command?: string;
  action?: NotifyEmbedAction;
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
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyDeploymentEmbedOptions {
  title?: string;
  description: string;
  application?: string;
  version?: string;
  environment?: string;
  commit?: string;
  duration?: string;
  action?: NotifyEmbedAction;
  error?: string;
  footer?: string;
  timestamp?: string | false;
}

export interface NotifyPipelineStep {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
}

export interface NotifyPipelineEmbedOptions {
  title?: string;
  description: string;
  steps: NotifyPipelineStep[];
  duration?: string;
  output?: string;
  size?: string;
  warning?: string;
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

export interface NotifyChannelOptions {
  webhook: string;
  enabled?: boolean;
  retries?: number;
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
  attempt: number;
}

export interface NotifyAfterSendContext<C extends string = string> {
  channel: C;
  message: NotifyMessage;
  payload: NotifyPayload;
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