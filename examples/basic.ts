import { init } from '../src/index.js';

const notify = init(
  {
    unity: process.env.DISCORD_WEBHOOK_UNITY!,
    ai: process.env.DISCORD_WEBHOOK_AI!,
    urgent: process.env.DISCORD_WEBHOOK_URGENT!,
  },
  {
    beforeSend: ({ channel, attempt }) => {
      console.log(`Sending ${channel}, attempt ${attempt}`);
    },
    onComplete: (result) => {
      console.log(`Completed ${result.channel}`);
    },
  },
);

await notify('unity', '✅ Build completed');
await notify('ai', '🤖 Agent completed');
await notify('urgent', '🚨 Build failed');