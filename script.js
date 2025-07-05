(() => {
  // ← Set these to your GitHub info:
  const GITHUB_USER = 'Nafi7393';
  const GITHUB_REPO = 'image-showcase';
  const ROOT_PATH   = 'Sample%20List'; // URL-encoded

  const folderList   = document.getElementById('folder-list');
  const gallery      = document.getElementById('gallery');
  const folderSearch = document.getElementById('folder-search');
  const imageSearch  = document.getElementById('image-search');
  const headerTitle  = document.getElementById('current-folder');
  const toast        = document.getElementById('toast');
  let folders = [];


  // Fetch top-level folders
  async function loadFolders() {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ROOT_PATH}`
    );
    const data = await res.json();
    folders = data
      .filter(f => f.type === 'dir')
      .map(d => decodeURIComponent(d.name));
    renderFolders(folders);
  }

  // Render folder list
  function renderFolders(list) {
    folderList.innerHTML = '';
    list.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.onclick = () => selectFolder(li, name);
      folderList.appendChild(li);
    });
  }

  // Search folders
  folderSearch.oninput = () => {
    const term = folderSearch.value.toLowerCase();
    renderFolders(folders.filter(f => f.toLowerCase().includes(term)));
  };

  // When a folder is clicked
  async function selectFolder(li, name) {
    folderList.querySelectorAll('li').forEach(x=>x.classList.remove('active'));
    li.classList.add('active');
    headerTitle.textContent = name;
    imageSearch.value = '';
    await loadImages(name);
  }

  // Fetch images in a folder, then render
  async function loadImages(folderName) {
    gallery.innerHTML = '';
    const path = `${ROOT_PATH}/${encodeURIComponent(folderName)}`;
    const res  = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`
    );
    const data = await res.json();
    const images = data
      .filter(f => f.type === 'file' && /\.(jpe?g|png|gif)$/i.test(f.name))
      .map(f => f.download_url);

    images.forEach(src => {
      const card = document.createElement('div');
      card.className = 'image-container';

      const img = document.createElement('img');
      img.src = src;
      card.appendChild(img);

      const icon = document.createElement('div');
      icon.className = 'copy-icon';
      icon.textContent = '📋';
      card.appendChild(icon);

      card.onclick = async () => {
        try {
          const blob = await (await fetch(src)).blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 1200);
        } catch (e) {
          console.error(e);
        }
      };

      gallery.appendChild(card);
    });
  }

  // Search inside images
  imageSearch.oninput = () => {
    const term = imageSearch.value.toLowerCase();
    document.querySelectorAll('.image-container').forEach(div => {
      const fn = div.querySelector('img').src.split('/').pop().toLowerCase();
      div.style.display = fn.includes(term) ? '' : 'none';
    });
  };

  // Kick it off
  loadFolders();
})();
