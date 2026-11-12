import type {
  NotifyAgentEmbedOptions,
  NotifyBuildEmbedOptions,
  NotifyDeploymentEmbedOptions,
  NotifyEmbed,
  NotifyEmbedCardOptions,
  NotifyEmbedField,
  NotifyEmbedStatus,
  NotifyErrorEmbedOptions,
  NotifyGalleryEmbedOptions,
  NotifyListEmbedOptions,
  NotifyMedia,
  NotifyMediaEmbedOptions,
  NotifyMediaSource,
  NotifyPayload,
  NotifyPipelineEmbedOptions,
  NotifyProgressEmbedOptions,
  NotifyTaskEmbedOptions,
  NotifyTableEmbedOptions,
} from './types.js';

const STATUS = {
  success: { icon: '✅', color: 0x22c55e },
  error: { icon: '❌', color: 0xef4444 },
  warning: { icon: '⚠️', color: 0xf59e0b },
  info: { icon: 'ℹ️', color: 0x3b82f6 },
  progress: { icon: '🔄', color: 0x8b5cf6 },
} as const satisfies Record<NotifyEmbedStatus, { icon: string; color: number }>;

const PIPELINE_STATUS = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  pending: '·',
} as const;

const PIPELINE_LABEL = {
  success: 'Completed',
  warning: 'Warning',
  error: 'Failed',
  pending: 'Pending',
} as const;

const AGENT_STATUS = {
  success: 'Completed',
  error: 'Failed',
  warning: 'Waiting',
  info: 'Ready',
  progress: 'Working',
} as const;

const LIMITS = {
  title: 256,
  description: 2_048,
  fieldName: 256,
  fieldValue: 1_024,
  footer: 2_048,
  authorName: 256,
} as const;

export function code(value: string | number): string {
  return `\`${String(value)}\``;
}

export function progressBar(percentage: number, width = 24): string {
  const safeWidth = Math.max(1, Math.floor(width));
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const filled = Math.round((safePercentage / 100) * safeWidth);
  return `${'█'.repeat(filled)}${'░'.repeat(safeWidth - filled)} ${Math.round(safePercentage)}%`;
}

export function card(options: NotifyEmbedCardOptions): NotifyPayload {
  const status = STATUS[options.status];
  const title = clampText(
    options.title.startsWith(status.icon) ? options.title : `${status.icon} ${options.title}`,
    LIMITS.title,
  ) ?? options.title;
  const description = clampText(buildDescription(options), LIMITS.description);
  const media = mediaPair(options.image, options.thumbnail);
  const embed: NotifyEmbed = {
    title,
    description,
    fields: options.fields?.length ? normalizeFields(options.fields) : undefined,
    color: status.color,
    url: options.url ?? options.action?.url,
    author: normalizeAuthor(options.author),
    image: media.image,
    thumbnail: media.thumbnail,
    footer: options.footer ? { text: clampText(options.footer, LIMITS.footer) ?? '' } : undefined,
    timestamp: normalizeTimestamp(options.timestamp),
  };
  return { embeds: [embed] };
}

/**
 * Responsive table-style embed. Discord renders inline fields in columns and
 * chooses the final column count per client, so this remains readable on mobile.
 */
export function table(options: NotifyTableEmbedOptions): NotifyPayload {
  return card({
    status: options.status,
    title: options.title,
    description: options.description,
    fields: options.columns.map((column) => ({
      name: column.label,
      value: column.code ? code(column.value) : String(column.value),
      inline: column.inline ?? true,
    })),
    action: options.action,
    footer: options.footer,
    timestamp: options.timestamp,
    author: options.author,
    thumbnail: options.thumbnail,
  });
}

export function progress(options: NotifyProgressEmbedOptions): NotifyPayload {
  const fields: NotifyEmbedField[] = [];
  if (options.current !== undefined && options.total !== undefined) {
    fields.push({ name: 'Frame', value: `${options.current} / ${options.total}`, inline: true });
  }
  if (options.eta) fields.push({ name: 'ETA', value: options.eta, inline: true });
  if (options.elapsed) fields.push({ name: 'Elapsed', value: options.elapsed, inline: true });
  if (options.stage) fields.push({ name: 'Stage', value: options.stage, inline: true });
  return card({
    status: 'progress',
    title: options.title,
    description: `${normalizeText(options.description)}\n\n${progressBar(options.percentage, options.width)}`,
    fields,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer,
    timestamp: options.timestamp,
  });
}

export function build(options: NotifyBuildEmbedOptions): NotifyPayload {
  const status = options.status ?? (options.error ? 'error' : 'success');
  const fields = compactFields([
    ['Project', options.project, true],
    ['Environment', options.environment, true],
    ['Platform', options.platform, true],
    ['Branch', options.branch, true],
    ['Commit', options.commit ? code(options.commit) : undefined, true],
    ['Version', options.version ? code(options.version) : undefined, true],
    ['Build', options.build ? code(options.build) : undefined, true],
    ['Duration', options.duration, true],
    ['Size', options.size, true],
    ['Error', options.error, false],
  ]);
  return card({
    status,
    title: options.title ?? (status === 'error' ? 'Unity Build Failed' : 'Unity Build'),
    description: options.description,
    fields,
    action: options.action,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer ?? footer(options.project, options.environment),
    timestamp: options.timestamp,
  });
}

export function agent(options: NotifyAgentEmbedOptions): NotifyPayload {
  const status = options.status ?? 'success';
  const defaultTitle = status === 'progress'
    ? 'AI Agent Working'
    : status === 'warning'
      ? 'AI Agent Waiting'
      : status === 'error'
        ? 'AI Agent Failed'
        : 'AI Agent Completed';
  const fields = compactFields([
    ['Task', options.task, false],
    ['Model', options.model, true],
    ['Files', options.files, true],
    ['Changes', options.changes, true],
    ['Duration', options.duration, true],
    ['Elapsed', options.elapsed, true],
    ['Tests', options.tests, true],
    ['Status', AGENT_STATUS[status], true],
  ]);
  const description = options.progress === undefined
    ? options.description
    : `${normalizeText(options.description)}\n\n${progressBar(options.progress)}`;
  return card({
    status,
    title: options.title ?? defaultTitle,
    description,
    fields,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer ?? 'AI Agent',
    timestamp: options.timestamp,
  });
}

export function task(options: NotifyTaskEmbedOptions): NotifyPayload {
  const completed = options.completed ?? options.status?.toLowerCase() === 'completed';
  return card({
    status: completed ? 'success' : 'info',
    title: options.title ?? (completed ? 'Task Completed' : 'Task'),
    description: options.description,
    fields: compactFields([
      ['Project', options.project, true],
      ['Priority', options.priority, true],
      ['Estimate', options.estimate, true],
      ['Duration', options.duration, true],
      ['Status', options.status ?? (completed ? 'Completed' : 'Todo'), true],
    ]),
    footer: options.footer ?? footer(options.project),
    timestamp: options.timestamp,
  });
}

export function error(options: NotifyErrorEmbedOptions): NotifyPayload {
  const fields = compactFields([
    ['Project', options.project, true],
    ['Job', options.job, true],
    ['Stage', options.stage, true],
    ['Duration', options.duration, true],
    ['Error', options.error, false],
    ['Stack', options.stack ? codeBlock(options.stack) : undefined, false],
    ['Command', options.command ? code(options.command) : undefined, false],
    ['Logs', options.logs ? `[Open logs](${options.logs})` : undefined, false],
  ]);
  return card({
    status: 'error',
    title: options.title ?? 'Pipeline Failed',
    description: options.description,
    fields,
    action: options.action,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer ?? footer(options.project),
    timestamp: options.timestamp,
  });
}

export function deployment(options: NotifyDeploymentEmbedOptions): NotifyPayload {
  const status = options.status ?? (options.error ? 'error' : 'success');
  const defaultTitle = status === 'error'
    ? 'Deployment Failed'
    : status === 'success'
      ? 'Deployment Completed'
      : 'Deployment';
  return card({
    status,
    title: options.title ?? defaultTitle,
    description: options.description,
    fields: compactFields([
      ['Application', options.application, true],
      ['Version', options.version ? code(options.version) : undefined, true],
      ['Environment', options.environment, true],
      ['Branch', options.branch, true],
      ['Commit', options.commit ? code(options.commit) : undefined, true],
      ['Build', options.build ? code(options.build) : undefined, true],
      ['Duration', options.duration, true],
      ['Error', options.error, false],
    ]),
    action: options.action,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer ?? footer(options.environment, options.application),
    timestamp: options.timestamp,
  });
}

export function pipeline(options: NotifyPipelineEmbedOptions): NotifyPayload {
  const status = options.warning
    ? 'warning'
    : options.steps.some((step) => step.status === 'error')
      ? 'error'
      : 'success';
  const failedSteps = options.steps
    .filter((step) => step.status === 'error')
    .map((step) => step.name);
  const visibleSteps = options.steps.slice(0, 18);
  const hiddenSteps = options.steps.length - visibleSteps.length;
  const stepFields: NotifyEmbedField[] = visibleSteps.map((step) => ({
    name: `${PIPELINE_STATUS[step.status]} ${step.name}`,
    value: step.duration ?? PIPELINE_LABEL[step.status],
    inline: true,
  }));
  if (hiddenSteps > 0) {
    stepFields.push({ name: 'More stages', value: `+${hiddenSteps} more`, inline: true });
  }
  const fields: NotifyEmbedField[] = [
    ...stepFields,
    ...compactFields([
      ['Duration', options.duration, true],
      ['Output', options.output ? code(options.output) : undefined, true],
      ['Size', options.size, true],
      ['Warning', options.warning, false],
      ['Failed stage', failedSteps.length ? failedSteps.join(', ') : undefined, false],
    ]),
  ];
  return card({
    status,
    title: options.title ?? 'Video Pipeline',
    description: options.description,
    fields,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer ?? 'Video Pipeline',
    timestamp: options.timestamp,
  });
}

export function list(options: NotifyListEmbedOptions): NotifyPayload {
  const maxItems = Math.min(25, Math.max(1, options.maxItems ?? 8));
  const visibleItems = options.items.slice(0, maxItems);
  const remaining = options.items.length - visibleItems.length;
  const itemFields: NotifyEmbedField[] = visibleItems.map((item, index) => ({
    name: String(index + 1).padStart(2, '0'),
    value: `✓ ${item}`,
    inline: true,
  }));
  const description = `${normalizeText(options.description)}${remaining > 0 ? `\n\n+ ${remaining} more` : ''}`;
  return card({
    status: 'success',
    title: options.title ?? 'Generated Assets',
    description,
    fields: [
      ...itemFields,
      ...compactFields([['Duration', options.duration, true]]),
    ],
    footer: options.footer,
    timestamp: options.timestamp,
  });
}

export function media(options: NotifyMediaEmbedOptions): NotifyPayload {
  return card({
    status: options.status ?? 'info',
    title: options.title,
    description: options.description,
    fields: options.fields,
    action: options.action,
    image: options.image,
    thumbnail: options.thumbnail,
    footer: options.footer,
    timestamp: options.timestamp,
    author: options.author,
  });
}

export function gallery(options: NotifyGalleryEmbedOptions): NotifyPayload {
  if (!options.items.length) throw new TypeError('Gallery requires at least one item');
  const items = options.items.slice(0, 10);
  const overflow = options.items.length - items.length;
  const status = options.status ?? 'info';
  const title = options.title ?? 'Gallery';

  const embeds = items.map((item, index) => {
    const description = [
      index === 0 ? normalizeText(options.description) : undefined,
      normalizeText(item.description),
      index === 0 && overflow > 0 ? `+ ${overflow} more` : undefined,
    ].filter(Boolean).join('\n\n');
    return card({
      status,
      title: items.length === 1 ? title : `${title} · ${index + 1}/${items.length}`,
      description,
      image: item.url,
      url: item.link,
      footer: index === 0 ? options.footer : undefined,
      timestamp: index === 0 ? options.timestamp : false,
      author: index === 0 ? options.author : undefined,
    }).embeds![0];
  });
  return { embeds };
}

function normalizeTimestamp(value: string | boolean | undefined): string | undefined {
  if (value === false) return undefined;
  if (value === true || value === undefined) return new Date().toISOString();
  return value;
}

function buildDescription(options: NotifyEmbedCardOptions): string | undefined {
  const description = normalizeText(options.description) ?? '';
  if (!options.action) return description || undefined;
  const action = `[${options.action.label}](${options.action.url})`;
  return description ? `${description}\n\n${action}` : action;
}

function mediaPair(
  image: NotifyMediaSource | undefined,
  thumbnail: NotifyMediaSource | undefined,
): { image?: NotifyMedia; thumbnail?: NotifyMedia } {
  const primary = mediaSource(image);
  const secondary = mediaSource(thumbnail);
  if (primary && secondary && primary.url === secondary.url) {
    return { image: primary, thumbnail: undefined };
  }
  return { image: primary, thumbnail: secondary };
}

function mediaSource(value: NotifyMediaSource | undefined): NotifyMedia | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? { url: value } : value;
}

function normalizeAuthor(
  author: NotifyEmbedCardOptions['author'],
): NotifyEmbedCardOptions['author'] {
  if (!author) return undefined;
  return { ...author, name: clampText(author.name, LIMITS.authorName) ?? '' };
}

function compactFields(values: Array<[string, string | undefined, boolean]>): NotifyEmbedField[] {
  return values
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([name, value, inline]) => ({ name, value: value as string, inline }));
}

function normalizeText(value: string | undefined): string | undefined {
  return value?.replace(/\\n/g, '\n');
}

function normalizeFields(fields: NotifyEmbedField[]): NotifyEmbedField[] {
  return fields.map((field) => ({
    ...field,
    name: clampText(field.name, LIMITS.fieldName) ?? '',
    value: clampText(field.value, LIMITS.fieldValue) ?? '',
  }));
}

function clampText(value: string | undefined, limit: number): string | undefined {
  const normalized = normalizeText(value);
  if (normalized === undefined || normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1))}…`;
}

function codeBlock(value: string): string {
  return `\`\`\`\n${clampText(value, LIMITS.fieldValue - 10) ?? ''}\n\`\`\``;
}

function footer(...parts: Array<string | undefined>): string | undefined {
  const value = parts.filter(Boolean).join(' • ');
  return value || undefined;
}

export const embeds = {
  card,
  table,
  progress,
  build,
  agent,
  task,
  error,
  deployment,
  pipeline,
  list,
  media,
  gallery,
  code,
  progressBar,
} as const;
