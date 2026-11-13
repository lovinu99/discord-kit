console.log('═══════════════════════════════════════════');
console.log('  MEDIA + COMPONENTS V2 TEST');
console.log('═══════════════════════════════════════════');

const { init, embeds, componentsV2 } = require('../dist/index.cjs');

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

async function send(name, payload) {
  console.log(`\n📤 ${name}...`);
  try {
    const result = await notify('main', payload);
    console.log(`   ✅ Sent: ${result.status} (attempts: ${result.attempts})`);
    return result;
  } catch (e) {
    console.error(`   ❌ Failed: ${e.message}`);
    if (e.status) console.error(`   Status: ${e.status}`);
    throw e;
  }
}

async function main() {
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

  console.log('\n✅ All media + Components V2 tests passed!');
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error.name, error.message);
  process.exitCode = 1;
});