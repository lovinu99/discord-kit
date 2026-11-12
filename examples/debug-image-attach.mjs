import { embeds } from '../src/index.js';

const payload = {
  content: 'Image attachment example',
  embeds: [
    embeds.media({
      status: 'success',
      title: 'Production Preview',
      description: 'Deployment screenshot attached below.',
      image: 'attachment://apple.png',
      fields: [{ name: 'Environment', value: 'Production', inline: true }],
      action: { label: 'Open Deployment', url: 'https://example.com/deploy/1' },
      timestamp: true,
    }),
  ],
  files: [
    { name: 'apple.png', path: './examples/assets/apple.png', description: 'Deployment screenshot' },
  ],
};

console.log('Payload:', JSON.stringify(payload, null, 2));

// Check embed limits
const embed = payload.embeds[0];
console.log('\nEmbed analysis:');
console.log('Title length:', embed.title?.length);
console.log('Description length:', embed.description?.length);
console.log('Fields count:', embed.fields?.length);
embed.fields?.forEach((f, i) => console.log(`  Field ${i}: "${f.name}" (${f.name.length}) = "${f.value}" (${f.value.length})`));
console.log('Footer length:', embed.footer?.text?.length);
console.log('Author length:', embed.author?.name?.length);
console.log('Image:', embed.image);
console.log('Thumbnail:', embed.thumbnail);

let totalChars = (embed.title?.length || 0) + (embed.description?.length || 0) + (embed.footer?.text?.length || 0) + (embed.author?.name?.length || 0);
embed.fields?.forEach(f => totalChars += f.name.length + f.value.length);
console.log('Total chars:', totalChars);