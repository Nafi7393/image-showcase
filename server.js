const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// adjust if your folder is elsewhere
const SAMPLE_DIR = path.join(__dirname, 'Sample List');

app.use(express.static(path.join(__dirname, 'public')));

// list all sub-folders in "Sample List"
app.get('/api/folders', (req, res) => {
  fs.readdir(SAMPLE_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: 'Cannot read folders' });
    const folders = entries
      .filter(e => e.isDirectory())
      .map(e => e.name);
    res.json(folders);
  });
});

// list all image files in a given folder
app.get('/api/images', (req, res) => {
  const folder = req.query.folder;
  if (!folder) return res.status(400).json({ error: 'folder query required' });
  const dir = path.join(SAMPLE_DIR, folder);
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read images' });
    const images = files
      .filter(f => /\.(jpe?g|png|gif|webp|bmp)$/i.test(f))
      .map(f => `/images/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`);
    res.json(images);
  });
});

// serve images directly from disk
app.use('/images', express.static(SAMPLE_DIR));

app.listen(PORT, ()=> console.log(`▶ http://localhost:${PORT}`));
