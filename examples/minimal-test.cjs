console.log('═══════════════════════════════════════════');
console.log('  MINIMAL TEST');
console.log('═══════════════════════════════════════════');

const { init, embeds } = require('../dist/index.cjs');

const notify = init({ 
  main: { 
    webhook: 'https://discord.com/api/webhooks/1570436583684051040/w-Tp8E3LseoY09lTL2VeHCReSrPdTK3XBU8rcXznRceVnA428ymJlqkyu0dW_Wqf4rH5', 
    logger: console 
  } 
});

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
  await send('1. Basic text', '✅ Basic text notification works');
  await send('2. Simple embed', embeds.card({
    status: 'success',
    title: 'Simple Embed',
    description: 'Basic card with status, title, description',
    footer: 'Footer text',
  }));
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
  console.log('\n✅ All minimal tests passed!');
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error.name, error.message);
  process.exitCode = 1;
});