import { describe, expect, it } from 'vitest';
import { embeds } from '../src/index.js';

function embedOf(payload: { embeds?: unknown[] }) {
  return payload.embeds?.[0] as {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
    author?: { name: string; url?: string; icon_url?: string };
    thumbnail?: { url: string };
    timestamp?: string;
    url?: string;
  };
}

describe('Discord embed design system', () => {
  it('creates a status card with compact action and metadata', () => {
    const embed = embedOf(embeds.card({
      status: 'success',
      title: 'Build Completed',
      description: 'Production build completed successfully.',
      action: { label: 'Open Build', url: 'https://example.com/build/1' },
      footer: 'Duckov • Production',
      timestamp: false,
    }));

    expect(embed.title).toBe('✅ Build Completed');
    expect(embed.color).toBe(0x22c55e);
    expect(embed.description).toContain('[Open Build](https://example.com/build/1)');
    expect(embed.footer).toEqual({ text: 'Duckov • Production' });
    expect(embed.timestamp).toBeUndefined();
  });

  it('creates a responsive table layout and normalizes escaped newlines', () => {
    const embed = embedOf(embeds.table({
      status: 'success',
      title: 'Discord Embed System Ready',
      description: 'Notification delivered successfully.',
      author: { name: 'DISCORD-KIT • TEST' },
      columns: [
        { label: 'Project', value: 'discord-kit', code: true },
        { label: 'Channel', value: 'lc-noti', code: true },
        { label: 'Status', value: 'Delivered' },
        { label: 'Features', value: 'Lifecycle hooks\\nEmbed builders\\nRetry + timeout', inline: false },
      ],
      footer: 'Personal Dev Notifications',
      timestamp: false,
    }));

    expect(embed.title).toBe('✅ Discord Embed System Ready');
    expect(embed.author).toEqual({ name: 'DISCORD-KIT • TEST' });
    expect(embed.fields?.slice(0, 3)).toEqual([
      { name: 'Project', value: '`discord-kit`', inline: true },
      { name: 'Channel', value: '`lc-noti`', inline: true },
      { name: 'Status', value: 'Delivered', inline: true },
    ]);
    expect(embed.fields?.[3]).toEqual({
      name: 'Features',
      value: 'Lifecycle hooks\nEmbed builders\nRetry + timeout',
      inline: false,
    });
  });

  it('clamps and formats progress bars', () => {
    expect(embeds.progressBar(72, 20)).toBe('██████████████░░░░░░ 72%');
    expect(embeds.progressBar(-10, 5)).toBe('░░░░░ 0%');
    expect(embeds.progressBar(120, 5)).toBe('█████ 100%');
  });

  it('creates a progress card with scan-friendly fields', () => {
    const embed = embedOf(embeds.progress({
      title: 'Rendering Video',
      description: 'Rendering episode-12.mp4',
      percentage: 72,
      current: 12_842,
      total: 17_836,
      eta: '2m 14s',
      elapsed: '6m 32s',
      timestamp: false,
    }));

    expect(embed.title).toBe('🔄 Rendering Video');
    expect(embed.description).toContain('72%');
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Frame', value: '12842 / 17836', inline: true },
      { name: 'ETA', value: '2m 14s', inline: true },
    ]));
  });

  it('creates build and error cards with developer formatting', () => {
    const buildEmbed = embedOf(embeds.build({
      description: 'Production build completed successfully.',
      project: 'Duckov',
      environment: 'Production',
      branch: 'main',
      commit: 'a82f91c',
      version: 'v1.2.0',
      duration: '4m 21s',
      size: '182 MB',
      timestamp: false,
    }));
    const errorEmbed = embedOf(embeds.error({
      description: 'Video rendering failed.',
      project: 'VideoPipeline',
      job: 'episode-12',
      stage: 'Rendering',
      error: 'FFmpeg exited with code 1',
      command: 'ffmpeg -i input.mp4 ...',
      timestamp: false,
    }));

    expect(buildEmbed.title).toBe('✅ Unity Build');
    expect(buildEmbed.fields).toEqual(expect.arrayContaining([
      { name: 'Commit', value: '`a82f91c`', inline: true },
      { name: 'Version', value: '`v1.2.0`', inline: true },
    ]));
    expect(errorEmbed.title).toBe('❌ Pipeline Failed');
    expect(errorEmbed.fields).toEqual(expect.arrayContaining([
      { name: 'Error', value: 'FFmpeg exited with code 1', inline: false },
      { name: 'Command', value: '`ffmpeg -i input.mp4 ...`', inline: false },
    ]));
  });

  it('creates agent, task, deployment, pipeline, and list cards', () => {
    expect(embedOf(embeds.agent({ description: 'Implementing inventory system...', status: 'progress', timestamp: false })).title)
      .toBe('🔄 AI Agent Working');
    expect(embedOf(embeds.task({ description: 'Implement inventory system', priority: 'High', completed: true, timestamp: false })).title)
      .toBe('✅ Task Completed');
    expect(embedOf(embeds.deployment({ description: 'Production deployment completed successfully.', application: 'API', timestamp: false })).title)
      .toBe('✅ Deployment Completed');
    expect(embedOf(embeds.pipeline({
      description: 'Episode 12 processing completed.',
      steps: [
        { name: 'Transcription', status: 'success' },
        { name: 'Translation', status: 'success' },
        { name: 'Rendering', status: 'warning' },
      ],
      warning: '3 subtitle segments require review.',
      timestamp: false,
    })).title).toBe('⚠️ Video Pipeline');
    expect(embedOf(embeds.list({
      description: '5 assets generated successfully.',
      items: ['player_idle.png', 'player_run.png', 'player_attack.png'],
      maxItems: 2,
      timestamp: false,
    })).description).toContain('+ 1 more');
  });
});