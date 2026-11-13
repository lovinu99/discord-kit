console.log('Starting...');
const { init } = require('../dist/index.cjs');
console.log('Init imported');

const notify = init({ 
  main: { 
    webhook: 'https://discord.com/api/webhooks/1570436583684051040/w-Tp8E3LseoY09lTL2VeHCReSrPdTK3XBU8rcXznRceVnA428ymJlqkyu0dW_Wqf4rH5', 
    logger: console 
  } 
});
console.log('Notify created');

(async () => {
  try {
    const result = await notify('main', 'Test basic text');
    console.log('Success:', result);
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Status:', e.status);
  }
})();