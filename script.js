document.addEventListener('DOMContentLoaded', async () => {
  // 1) load the pre-built manifest.json
  const { folders, images } = await fetch('manifest.json').then(r => r.json());

  // 2) grab all the DOM handles
  const folderList   = document.getElementById('folder-list');
  const gallery      = document.getElementById('gallery');
  const folderSearch = document.getElementById('folder-search');
  const imageSearch  = document.getElementById('image-search');
  const headerTitle  = document.getElementById('current-folder');
  const toast        = document.getElementById('toast');

  // 4) render folder list
  function renderFolders(list) {
    folderList.innerHTML = '';
    list.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.onclick     = () => selectFolder(li, name);
      folderList.appendChild(li);
    });
  }
  renderFolders(folders);

  // 5) folder search filter
  folderSearch.oninput = () => {
    const term = folderSearch.value.toLowerCase();
    renderFolders(folders.filter(f => f.toLowerCase().includes(term)));
  };

  // 6) folder selection
  function selectFolder(li, name) {
    folderList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    headerTitle.textContent = name;
    imageSearch.value = '';
    renderImages(images[name] || []);
  }

  // 7) render images for selected folder
  function renderImages(urls) {
    gallery.innerHTML = '';
    urls.forEach(src => {
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
          setTimeout(() => toast.classList.remove('show'), 1000);
        } catch (e) {
          console.error(e);
        }
      };

      gallery.appendChild(card);
    });
  }

  // 8) image filename search
  imageSearch.oninput = () => {
    const term = imageSearch.value.toLowerCase();
    document.querySelectorAll('.image-container').forEach(div => {
      const fn = div.querySelector('img').src.split('/').pop().toLowerCase();
      div.style.display = fn.includes(term) ? '' : 'none';
    });
  };
});
