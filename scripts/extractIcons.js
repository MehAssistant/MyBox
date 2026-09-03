import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const match = svgContent.match(/href="data:image\/png;base64,([^"]+)"/);

if (match && match[1]) {
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');

  fs.writeFileSync(path.resolve('public/icon.png'), buffer);
  fs.writeFileSync(path.resolve('public/icon-192.png'), buffer);
  fs.writeFileSync(path.resolve('public/icon-512.png'), buffer);
  fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), buffer);

  console.log('✅ Successfully extracted PNG icons from icon.svg:');
  console.log('- public/icon.png');
  console.log('- public/icon-192.png');
  console.log('- public/icon-512.png');
  console.log('- public/apple-touch-icon.png');
} else {
  console.error('❌ Could not find base64 PNG in icon.svg');
}
