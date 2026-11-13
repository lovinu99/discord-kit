console.log('═══════════════════════════════════════════');
console.log('  DISCORD-KIT COMPREHENSIVE FORMAT TEST');
console.log('═══════════════════════════════════════════');

const { init, embeds, componentsV2 } = require('../dist/index.cjs');
const fs = require('fs');

const notify = init({ 
  main: { 
    webhook: 'https://discord.com/api/webhooks/1570436583684051040/w-Tp8E3LseoY09lTL2VeHCReSrPdTK3XBU8rcXznRceVnA428ymJlqkyu0dW_Wqf4rH5', 
    logger: console 
  } 
});

const assets = {
  apple: { name: 'apple.png', path: './examples/assets/apple.png', description: 'Apple pixel art' },
  icon: { name: 'icon.png', path: './examples/assets/icon.png', description: 'App icon' },
  pixel: { name: 'pixel.png', path: './examples/assets/pixel.png', description: 'Pixel art' },
  untitled: { name: 'untitled.png', path: './examples/assets/untitled.png', description: 'Untitled' },
  in: { name: 'in.jpg', path: './examples/assets/in.jpg', description: 'Test image' },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function send(name, payload) {
  console.log(`\n📤 ${name}...`);
  try {
    const result = await notify('main', payload);
    console.log(`   ✅ Sent: ${result.status} (attempts: ${result.attempts})`);
    await sleep(1000); // Rate limit protection
    return result;
  } catch (e) {
    console.error(`   ❌ Failed: ${e.message}`);
    if (e.status) console.error(`   Status: ${e.status}`);
    throw e;
  }
}

async function main() {
  // Warm up
  await notify('main', '🔥 Test suite starting...');
  await sleep(2000);

  // 1. Basic text
  await send('1. Basic text', '✅ Basic text notification works');

  // 2. Simple embed
  await send('2. Simple embed', embeds.card({
    status: 'success',
    title: 'Simple Embed',
    description: 'Basic card with status, title, description',
    footer: 'Footer text',
  }));

  // 3. Build embed
  await send('3. Build embed', embeds.build({
    description: 'Production build completed successfully.',
    project: 'Duckov',
    environment: 'Production',
    platform: 'Windows',
    branch: 'main',
    commit: 'a82f91c',
    version: 'v1.2.0',
    build: '1842',
    duration: '4m 21s',
    size: '182 MB',
    action: { label: 'Open Build', url: 'https://github.com/lovinu99/discord-kit/actions' },
  }));

  // 4. Build with error
  await send('4. Build failed', embeds.build({
    description: 'Production build failed during compilation.',
    project: 'Duckov',
    branch: 'main',
    commit: 'a82f91c',
    duration: '31s',
    error: 'CS0246: The type or namespace could not be found',
  }));

  // 5. Agent completed
  await send('5. Agent completed', embeds.agent({
    description: 'Inventory implementation completed.',
    task: 'Implement inventory system',
    model: 'Claude',
    files: '12',
    changes: '+843 / -127',
    duration: '8m 32s',
    tests: 'Passed',
    status: 'success',
  }));

  // 6. Agent progress
  await send('6. Agent in progress', embeds.agent({
    description: 'Implementing inventory system...',
    task: 'Inventory system',
    files: '8 modified',
    elapsed: '4m 12s',
    status: 'progress',
    progress: 65,
  }));

  // 7. Agent waiting
  await send('7. Agent waiting', embeds.agent({
    description: 'The agent requires user input before continuing.',
    task: 'Implement inventory',
    status: 'warning',
  }));

  // 8. Task embed
  await send('8. Task embed', embeds.task({
    description: 'Implement user authentication',
    project: 'DiscordKit',
    priority: 'High',
    estimate: '4h',
    duration: '3h 30m',
    status: 'In Review',
    completed: true,
    footer: 'JIRA: DK-123',
  }));

  // 9. Error embed
  await send('9. Error embed', embeds.error({
    description: 'Video rendering failed.',
    project: 'VideoPipeline',
    job: 'episode-12',
    stage: 'Rendering',
    duration: '8m 41s',
    error: 'FFmpeg exited with code 1',
    command: 'ffmpeg -i input.mp4 -c:v libx264 output.mp4',
    stack: 'Error: FFmpeg failed\n    at render (pipeline.ts:42:7)\n    at process (worker.ts:18:3)',
    logs: 'https://example.com/logs/episode-12',
    action: { label: 'View Logs', url: 'https://example.com/logs/episode-12' },
  }));

  // 10. Deployment embed
  await send('10. Deployment', embeds.deployment({
    description: 'Production deployment completed successfully.',
    application: 'API',
    version: 'v1.8.2',
    environment: 'production',
    branch: 'main',
    commit: 'a82f91c',
    build: '1842',
    duration: '1m 42s',
    action: { label: 'Open Deployment', url: 'https://github.com/lovinu99/discord-kit/actions' },
  }));

  // 11. Pipeline embed
  await send('11. Pipeline', embeds.pipeline({
    description: 'Processing completed with warnings.',
    steps: [
      { name: 'Transcription', status: 'success', duration: '2m' },
      { name: 'Translation', status: 'success', duration: '1m' },
      { name: 'TTS', status: 'success', duration: '3m' },
      { name: 'Rendering', status: 'warning', duration: '8m' },
      { name: 'Upload', status: 'pending' },
    ],
    duration: '14m 32s',
    warning: '3 subtitle segments require review.',
    output: 'video_final.mp4',
    size: '1.2 GB',
  }));

  // 12. Progress embed
  await send('12. Progress', embeds.progress({
    title: 'Rendering Video',
    description: 'Rendering episode-12.mp4',
    percentage: 72,
    current: 12842,
    total: 17836,
    eta: '2m 14s',
    elapsed: '6m 32s',
    stage: 'Encoding frames',
    width: 20,
  }));

  // 13. List embed
  await send('13. List', embeds.list({
    description: '5 assets generated successfully.',
    items: [
      'player_idle.png',
      'player_run.png',
      'player_attack.png',
      'enemy_idle.png',
      'enemy_attack.png',
    ],
    duration: '2m 14s',
    maxItems: 3,
    footer: 'Generated by Asset Pipeline',
  }));

  // 14. Table embed
  await send('14. Table', embeds.table({
    status: 'success',
    title: 'Discord Embed System Ready',
    description: 'Notification delivered successfully.',
    author: { name: 'DISCORD-KIT • TEST' },
    columns: [
      { label: 'Project', value: 'discord-kit', code: true },
      { label: 'Channel', value: 'lc-noti', code: true },
      { label: 'Status', value: 'Delivered' },
      {
        label: 'Features',
        value: 'Lifecycle hooks\nEmbed builders\nRetry + timeout',
        inline: false,
      },
    ],
    footer: 'Personal Dev Notifications',
  }));

  // 15. Media embed (single image)
  await send('15. Media embed', {
    ...embeds.media({
      status: 'success',
      title: 'Production Preview',
      description: 'Deployment screenshot attached below.',
      image: 'attachment://apple.png',
      fields: [{ name: 'Environment', value: 'Production', inline: true }],
      action: { label: 'Open Deployment', url: 'https://github.com/lovinu99/discord-kit/actions' },
      footer: 'Deploy Bot',
    }),
    files: [assets.apple],
  });

  // 16. Gallery embed (multiple images)
  await send('16. Gallery embed', {
    ...embeds.gallery({
      status: 'info',
      title: 'Episode Stills',
      description: 'Frames from the final render.',
      items: [
        { url: 'attachment://apple.png', description: 'Opening shot', link: 'https://example.com/1' },
        { url: 'attachment://icon.png', description: 'Final shot' },
        { url: 'attachment://pixel.png', description: 'Pixel art detail' },
      ],
      footer: 'Video Pipeline',
    }),
    files: [assets.apple, assets.icon, assets.pixel],
  });

  // 17. Components V2 Dashboard
  await send('17. Components V2 Dashboard', {
    ...componentsV2.toNotifyPayload(componentsV2.dashboard({
      title: 'Deployment Dashboard',
      description: 'Production deployment overview',
      accentColor: 0x8b5cf6,
      sections: [
        {
          title: 'Status',
          description: 'All systems operational',
          accessory: { type: 'button', label: 'View Details', url: 'https://github.com/lovinu99/discord-kit' },
        },
        {
          title: 'Metrics',
          fields: [
            { name: 'Latency', value: '42ms', inline: true },
            { name: 'Throughput', value: '1.2k req/s', inline: true },
            { name: 'Errors', value: '0', inline: true },
          ],
        },
        {
          title: 'Recent Deploy',
          description: 'v1.8.2 deployed to production',
          accessory: { type: 'thumbnail', image: 'attachment://apple.png', description: 'Deploy preview' },
        },
      ],
      footer: 'Deploy Bot • Updated now',
    })),
    files: [assets.apple],
  });

  // 18. Components V2 Gallery
  await send('18. Components V2 Gallery', {
    ...componentsV2.toNotifyPayload(componentsV2.gallery({
      title: 'Asset Gallery',
      description: 'Generated assets for the project',
      accentColor: 0x22c55e,
      items: [
        { media: { url: 'attachment://apple.png' }, description: 'Apple pixel art' },
        { media: { url: 'attachment://icon.png' }, description: 'App icon' },
        { media: { url: 'attachment://pixel.png' }, description: 'Pixel art' },
        { media: { url: 'attachment://untitled.png' }, description: 'Untitled asset' },
      ],
      footer: 'Discord Kit v0.2.2 — Rich Notifications',
    })),
    files: [assets.apple, assets.icon, assets.pixel, assets.untitled],
  });

  // 19. Components V2 Custom Message
  await send('19. Components V2 Custom', {
    ...componentsV2.toNotifyPayload(componentsV2.message({
      title: 'Custom Layout',
      description: 'Flexible Components V2 layout',
      accentColor: 0xf59e0b,
      content: [
        componentsV2.textDisplay('# Header\n**Bold** and *italic* text with [link](https://example.com)'),
        componentsV2.separator(),
        componentsV2.mediaGallery([
          { media: { url: 'attachment://in.jpg' }, description: 'Test image with caption' },
        ]),
        componentsV2.separator(true, 2),
        componentsV2.actionRow(
          componentsV2.linkButton('Primary Action', 'https://github.com/lovinu99/discord-kit'),
          componentsV2.linkButton('Secondary', 'https://discord.com')
        ),
      ],
      footer: 'Custom Components V2 Layout',
    })),
    files: [assets.in],
  });

  // 20. Rich embed with image attachment
  await send('20. Embed with image', {
    content: 'Image attachment example with rich embed',
    ...embeds.media({
      status: 'success',
      title: 'Production Preview',
      description: 'Deployment screenshot attached below.\n\n[Open Deployment](https://github.com/lovinu99/discord-kit/actions)',
      image: 'attachment://apple.png',
      fields: [
        { name: 'Environment', value: 'Production', inline: true },
        { name: 'Version', value: 'v1.8.2', inline: true },
        { name: 'Status', value: '✅ Healthy', inline: true },
      ],
      footer: 'Deploy Bot',
    }),
    files: [assets.apple],
  });

  // 21. Error embed with stack + logs
  await send('21. Error with stack', {
    ...embeds.error({
      description: 'Pipeline execution failed with detailed diagnostics.',
      project: 'VideoPipeline',
      job: 'render-episode-42',
      stage: 'Rendering',
      duration: '12m 34s',
      error: 'FFmpeg exited with code 1: Invalid encoder',
      command: 'ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 23 output.mp4',
      stack: 'Error: FFmpeg failed\n    at render (pipeline.ts:42:7)\n    at process (worker.ts:18:3)\n    at async main (index.ts:5:1)',
      logs: 'https://example.com/logs/42',
      action: { label: 'View Full Logs', url: 'https://example.com/logs/42' },
      image: 'attachment://icon.png',
    }),
    files: [assets.icon],
  });

  // 22. Progress with visual bar
  await send('22. Progress with bar', embeds.progress({
    title: 'Training Model',
    description: 'Epoch 15/100 - Loss decreasing',
    percentage: 15,
    current: 1500,
    total: 10000,
    eta: '45m 30s',
    elapsed: '8m 12s',
    stage: 'Backpropagation',
    width: 25,
  }));

  // 23. Table with long content
  await send('23. Table with long fields', embeds.table({
    status: 'info',
    title: 'System Status',
    description: 'Current system health overview',
    columns: [
      { label: 'Service', value: 'API Gateway', code: true },
      { label: 'Status', value: '✅ Healthy' },
      { label: 'Latency', value: '12ms p99', code: true },
      { label: 'Uptime', value: '99.99%', code: true },
      {
        label: 'Recent Errors',
        value: 'Connection timeout (2x)\nRate limit exceeded (1x)\nValidation error (5x)',
        inline: false,
      },
    ],
    footer: 'Monitoring • Updated 30s ago',
  }));

  // 24. List with many items (capped)
  await send('24. Long list (capped)', embeds.list({
    description: 'Generated 15 assets for character sprites.',
    items: [
      'idle_1.png', 'idle_2.png', 'idle_3.png', 'idle_4.png',
      'run_1.png', 'run_2.png', 'run_3.png', 'run_4.png', 'run_5.png', 'run_6.png',
      'jump_1.png', 'jump_2.png', 'jump_3.png',
      'attack_1.png', 'attack_2.png',
    ],
    duration: '5m 30s',
    maxItems: 8,
    footer: 'Sprite Generator v2.1',
  }));

  // 25. Media with thumbnail + image (different)
  await send('25. Media with thumb + image', {
    ...embeds.media({
      status: 'info',
      title: 'Dual Media Test',
      description: 'Testing image and thumbnail with different sources',
      image: 'attachment://apple.png',
      thumbnail: 'attachment://icon.png',
      fields: [
        { name: 'Image', value: 'attachment://apple.png', inline: true },
        { name: 'Thumbnail', value: 'attachment://icon.png', inline: true },
      ],
      action: { label: 'Compare', url: 'https://example.com' },
      footer: 'Media Test',
    }),
    files: [assets.apple, assets.icon],
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('  ALL TESTS SENT SUCCESSFULLY ✅');
  console.log('═══════════════════════════════════════════');
  console.log('\nCheck Discord channel for render verification.');
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error.name, error.message);
  process.exitCode = 1;
});