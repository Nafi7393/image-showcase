// generate-manifest.js
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'Sample List');
const out  = { folders: [], images: {} };

fs.readdirSync(ROOT).forEach(folder => {
  const folderPath = path.join(ROOT, folder);
  if (!fs.statSync(folderPath).isDirectory()) return;
  out.folders.push(folder);
  out.images[folder] = fs
    .readdirSync(folderPath)
    .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f))
    .map(f => `Sample List/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`);
});

fs.writeFileSync(
  path.join(__dirname, 'manifest.json'),
  JSON.stringify(out, null, 2)
);
console.log('✅ manifest.json generated');
