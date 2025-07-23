document.addEventListener("DOMContentLoaded", async () => {
  // 1) Load manifest.json
  const { folders, images } = await fetch("manifest.json").then((r) => r.json());

  // 2) DOM elements
  const folderList = document.getElementById("folder-list");
  const gallery = document.getElementById("gallery");
  const folderSearch = document.getElementById("folder-search");
  const imageSearch = document.getElementById("image-search");
  const headerTitle = document.getElementById("current-folder");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const toast = document.getElementById("toast");

  // 3) Globals
  let currentFolder = "Prompts";
  let originalOrder = [];

  // 4) Initial view: Prompts
  await loadPrompts();
  initColorCombination();

  // 5) Render folder list alphabetically
  const sortedFolders = ["Prompts", ...folders.sort((a, b) => a.localeCompare(b))];
  function renderFolders(list) {
    folderList.innerHTML = "";
    list.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      li.onclick = () => selectFolder(li, name);
      if (name === "Prompts") {
        li.classList.add("active");
      }
      folderList.appendChild(li);
    });
  }

  renderFolders(sortedFolders);

  // 6) Folder search filter
  folderSearch.oninput = () => {
    const term = folderSearch.value.toLowerCase();
    renderFolders(sortedFolders.filter((f) => f.toLowerCase().includes(term)));
  };

  // 7) Select a folder
  async function selectFolder(li, name) {
    folderList.querySelectorAll("li").forEach((x) => x.classList.remove("active"));
    li.classList.add("active");
    currentFolder = name;
    headerTitle.textContent = name;
    imageSearch.value = "";

    if (name === "Prompts") {
      await loadPrompts();
      initColorCombination();
      return;
    }

    if (!images[name]) {
      gallery.innerHTML = `<div style="font-size: 1.2rem;">No images found for this folder.</div>`;
      return;
    }

    originalOrder = [...images[name]].sort((a, b) => a.localeCompare(b));
    renderImages(originalOrder);
  }

  // 8) Render images
  function renderImages(urls) {
    gallery.innerHTML = "";
    urls.forEach((src) => {
      const card = document.createElement("div");
      card.className = "image-container";

      const img = document.createElement("img");
      img.src = src;
      card.appendChild(img);

      const icon = document.createElement("div");
      icon.className = "copy-icon";
      icon.textContent = "📋";
      card.appendChild(icon);

      card.onclick = async () => {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;

          img.onload = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // force to PNG
            canvas.toBlob(async (blob) => {
              if (!blob) {
                alert("❌ Failed to convert image to PNG blob.");
                return;
              }

              try {
                const clipboardItem = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([clipboardItem]);

                toast.classList.add("show");
                setTimeout(() => toast.classList.remove("show"), 1000);
              } catch (err) {
                console.error("❌ Failed to copy PNG:", err);
                alert("Copy failed. Your browser may still block clipboard image access.");
              }
            }, "image/png");
          };

          img.onerror = () => {
            alert("❌ Image failed to load.");
          };
        } catch (error) {
          console.error("❌ Unexpected error during copy:", error);
          alert("Unexpected error occurred during copy.");
        }
      };

      gallery.appendChild(card);
    });
  }

  // 9) Image search
  imageSearch.oninput = () => {
    const term = imageSearch.value.toLowerCase();
    document.querySelectorAll(".image-container").forEach((div) => {
      const img = div.querySelector("img");
      const text = img?.src.split("/").pop().toLowerCase() || div.innerText.toLowerCase();
      div.style.display = text.includes(term) ? "" : "none";
    });
  };

  // 🔀 10) Shuffle button
  shuffleBtn.onclick = () => {
    if (currentFolder === "Prompts") return;
    if (!images[currentFolder]) return;
    const shuffled = [...originalOrder].sort(() => Math.random() - 0.5);
    renderImages(shuffled);
  };

  // 11) Load prompts from prompts.json
  async function loadPrompts() {
    const { prompts } = await fetch("prompts.json").then((r) => r.json());
    gallery.innerHTML = "";
    headerTitle.textContent = "Prompts";

    prompts.forEach((prompt) => {
      const card = document.createElement("div");
      card.className = "image-container";

      const title = document.createElement("div");
      title.textContent = prompt.title;
      title.style.padding = "1rem";
      title.style.fontWeight = "bold";
      title.style.textAlign = "center";
      title.style.background = "var(--accent)";
      title.style.color = "#fff";
      card.appendChild(title);

      const icon = document.createElement("div");
      icon.className = "copy-icon";
      icon.textContent = "📋";
      card.appendChild(icon);

      card.onclick = async () => {
        try {
          await navigator.clipboard.writeText(prompt.description);
          toast.classList.add("show");
          setTimeout(() => toast.classList.remove("show"), 1000);
        } catch (err) {
          console.error("❌ Failed to copy prompt:", err);
          alert("Failed to copy prompt text to clipboard.");
        }
      };

      gallery.appendChild(card);
    });
  }
});

// ----- Color Combination Feature -----
// 1) Load color list from external JSON
let colorNames = [];
(async function loadColors() {
  try {
    const data = await fetch("colors.json").then((res) => res.json());
    colorNames = data.colors;
  } catch (e) {
    console.error("❌ Failed to load colors.json", e);
    // Fallback palette
    colorNames = ["Red", "Green", "Blue", "Yellow", "Purple"];
  }
})();

// 2) Utility functions
function getRandomColors(count) {
  if (count === "random") {
    count = Math.floor(Math.random() * 4) + 2; // between 2 and 5
  }
  const arr = [...colorNames];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function formatCombination(list) {
  if (list.length === 2) {
    return `${list[0]} and ${list[1]}`;
  }
  const last = list.pop();
  return `${list.join(", ")}, and ${last}`;
}

// 3) Initialize color-combo buttons
function initColorCombination() {
  const section = document.getElementById("color-combination");
  if (!section) return;
  section.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cnt = btn.dataset.count === "random" ? "random" : Number(btn.dataset.count);
      const combo = getRandomColors(cnt);
      const text = formatCombination(combo);
      try {
        await navigator.clipboard.writeText(text);
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1000);
      } catch {
        alert("❌ Failed to copy color combination.");
      }
    });
  });
}
