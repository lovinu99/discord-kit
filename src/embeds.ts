import type {
  NotifyAgentEmbedOptions,
  NotifyBuildEmbedOptions,
  NotifyEmbed,
  NotifyEmbedCardOptions,
  NotifyEmbedField,
  NotifyEmbedStatus,
  NotifyErrorEmbedOptions,
  NotifyListEmbedOptions,
  NotifyPayload,
  NotifyPipelineEmbedOptions,
  NotifyProgressEmbedOptions,
  NotifyTaskEmbedOptions,
  NotifyDeploymentEmbedOptions,
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
  const title = options.title.startsWith(status.icon)
    ? options.title
    : `${status.icon} ${options.title}`;
  const description = options.action
    ? `${options.description ?? ''}${options.description ? '\n\n' : ''}[${options.action.label}](${options.action.url})`
    : options.description;
  const embed: NotifyEmbed = {
    title,
    description,
    fields: options.fields?.length ? options.fields : undefined,
    color: status.color,
    url: options.url ?? options.action?.url,
    author: options.author,
    thumbnail: options.thumbnail,
    image: options.image,
    footer: options.footer ? { text: options.footer } : undefined,
    timestamp: options.timestamp === false ? undefined : options.timestamp ?? new Date().toISOString(),
  };
  return { embeds: [embed] };
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
    description: `${options.description}\n\n${progressBar(options.percentage, options.width)}`,
    fields,
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
    ['Status', options.status === 'progress' ? 'Working' : undefined, true],
  ]);
  return card({
    status,
    title: options.title ?? defaultTitle,
    description: options.description,
    fields,
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
    ['Command', options.command ? code(options.command) : undefined, false],
  ]);
  return card({
    status: 'error',
    title: options.title ?? 'Pipeline Failed',
    description: options.description,
    fields,
    action: options.action,
    footer: options.footer ?? footer(options.project),
    timestamp: options.timestamp,
  });
}

export function deployment(options: NotifyDeploymentEmbedOptions): NotifyPayload {
  return card({
    status: options.error ? 'error' : 'success',
    title: options.title ?? (options.error ? 'Deployment Failed' : 'Deployment Completed'),
    description: options.description,
    fields: compactFields([
      ['Application', options.application, true],
      ['Version', options.version ? code(options.version) : undefined, true],
      ['Environment', options.environment, true],
      ['Commit', options.commit ? code(options.commit) : undefined, true],
      ['Duration', options.duration, true],
      ['Error', options.error, false],
    ]),
    action: options.action,
    footer: options.footer ?? footer(options.environment, options.application),
    timestamp: options.timestamp,
  });
}

export function pipeline(options: NotifyPipelineEmbedOptions): NotifyPayload {
  const steps = options.steps.map((step) => `${PIPELINE_STATUS[step.status]} ${step.name}`).join('\n');
  return card({
    status: options.warning ? 'warning' : options.steps.some((step) => step.status === 'error') ? 'error' : 'success',
    title: options.title ?? 'Video Pipeline',
    description: `${options.description}\n\n${steps}`,
    fields: compactFields([
      ['Duration', options.duration, true],
      ['Output', options.output ? code(options.output) : undefined, true],
      ['Size', options.size, true],
      ['Warning', options.warning, false],
    ]),
    footer: options.footer ?? 'Video Pipeline',
    timestamp: options.timestamp,
  });
}

export function list(options: NotifyListEmbedOptions): NotifyPayload {
  const maxItems = Math.max(1, options.maxItems ?? 8);
  const visibleItems = options.items.slice(0, maxItems).map((item) => `✓ ${item}`);
  const remaining = options.items.length - visibleItems.length;
  if (remaining > 0) visibleItems.push(`+ ${remaining} more`);
  return card({
    status: 'success',
    title: options.title ?? 'Generated Assets',
    description: `${options.description}\n\n${visibleItems.join('\n')}`,
    fields: compactFields([['Duration', options.duration, true]]),
    footer: options.footer,
    timestamp: options.timestamp,
  });
}

function compactFields(values: Array<[string, string | undefined, boolean]>): NotifyEmbedField[] {
  return values
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([name, value, inline]) => ({ name, value: value as string, inline }));
}

function footer(...parts: Array<string | undefined>): string | undefined {
  const value = parts.filter(Boolean).join(' • ');
  return value || undefined;
}

export const embeds = {
  card,
  progress,
  build,
  agent,
  task,
  error,
  deployment,
  pipeline,
  list,
  code,
  progressBar,
} as const;