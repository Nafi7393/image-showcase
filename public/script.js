(() => {
  const folderList    = document.getElementById('folder-list');
  const gallery       = document.getElementById('gallery');
  const folderSearch  = document.getElementById('folder-search');
  const imageSearch   = document.getElementById('image-search');
  const headerTitle   = document.getElementById('current-folder');
  const toast         = document.getElementById('toast');
  const themeToggle   = document.getElementById('theme-toggle');
  let folders = [], darkMode = false;

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.setAttribute('data-theme', darkMode ? 'dark' : '');
  });

  // Load folders
  fetch('/api/folders')
    .then(r => r.json())
    .then(data => {
      folders = data;
      renderFolders(folders);
    });

  // Folder search
  folderSearch.addEventListener('input', () => {
    const term = folderSearch.value.toLowerCase();
    renderFolders(folders.filter(f => f.toLowerCase().includes(term)));
  });

  function renderFolders(list) {
    folderList.innerHTML = '';
    list.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.addEventListener('click', () => selectFolder(li, name));
      folderList.appendChild(li);
    });
  }

  function selectFolder(li, name) {
    // Highlight
    folderList.querySelectorAll('li').forEach(el=>el.classList.remove('active'));
    li.classList.add('active');
    // Update header & clear image search
    headerTitle.textContent = name;
    imageSearch.value = '';
    // Load images
    loadImages(name);
  }

  // Image search
  imageSearch.addEventListener('input', () => {
    const term = imageSearch.value.toLowerCase();
    document.querySelectorAll('.image-container').forEach(div => {
      const filename = div.querySelector('img').src.split('/').pop().toLowerCase();
      div.style.display = filename.includes(term) ? '' : 'none';
    });
  });

  function loadImages(folder) {
    gallery.innerHTML = '';
    fetch(`/api/images?folder=${encodeURIComponent(folder)}`)
      .then(r => r.json())
      .then(imgs => {
        imgs.forEach(src => {
          const card = document.createElement('div');
          card.className = 'image-container';

          const img = document.createElement('img');
          img.src = src;
          card.appendChild(img);

          const icon = document.createElement('i');
          icon.className = 'fas fa-copy copy-icon';
          card.appendChild(icon);

          card.addEventListener('click', async () => {
            try {
              const blob = await (await fetch(src)).blob();
              await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
              toast.classList.add('show');
              setTimeout(() => toast.classList.remove('show'), 1200);
            } catch (err) {
              console.error(err);
            }
          });

          gallery.appendChild(card);
        });
      });
  }
})();
