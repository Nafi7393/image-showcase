// server.js
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SAMPLE_DIR = path.join(__dirname, 'Sample List');

// 1) Serve everything in your project root as static assets:
app.use(express.static(path.join(__dirname)));

// 2) Explicitly send index.html on “/”
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 3) API: list sub-folders
app.get('/api/folders', (req, res) => {
  fs.readdir(SAMPLE_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: 'Cannot read folders' });
    const folders = entries.filter(e => e.isDirectory()).map(e => e.name);
    res.json(folders);
  });
});

// 4) API: list images in a folder
app.get('/api/images', (req, res) => {
  const folder = req.query.folder || '';
  const dir = path.join(SAMPLE_DIR, folder);
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read images' });
    const imgs = files
      .filter(f => /\.(jpe?g|png|gif|webp|bmp)$/i.test(f))
      .map(f => `/images/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`);
    res.json(imgs);
  });
});

// 5) Serve the actual image files under /images/…
app.use('/images', express.static(SAMPLE_DIR));

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
