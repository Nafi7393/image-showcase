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
  const colorDisplay = document.getElementById("color-display");

  // 3) Globals
  let currentFolder = "Prompts";
  let originalOrder = [];
  const colorList = [];

  // 4) Initial view
  await loadPrompts();
  await loadColorsCSV();
  initColorCombination();

  // 5) Render folder list
  const sortedFolders = ["Prompts", ...folders.sort((a, b) => a.localeCompare(b))];
  function renderFolders(list) {
    folderList.innerHTML = "";
    list.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      li.onclick = () => selectFolder(li, name);
      if (name === "Prompts") li.classList.add("active");
      folderList.appendChild(li);
    });
  }
  renderFolders(sortedFolders);

  // 6) Folder search filter
  folderSearch.oninput = () => {
    const term = folderSearch.value.toLowerCase();
    renderFolders(sortedFolders.filter((f) => f.toLowerCase().includes(term)));
  };

  // 7) Select folder
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
      gallery.innerHTML = `<div style="font-size:1.2rem;">No images found for this folder.</div>`;
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
          const imgEl = new Image();
          imgEl.crossOrigin = "anonymous";
          imgEl.src = src;
          imgEl.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = imgEl.naturalWidth;
            canvas.height = imgEl.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imgEl, 0, 0);
            canvas.toBlob(async (blob) => {
              if (!blob) return alert("❌ Failed to convert to PNG.");
              try {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                showToast();
              } catch {
                alert("Copy failed. Your browser may block it.");
              }
            }, "image/png");
          };
          imgEl.onerror = () => alert("❌ Image failed to load.");
        } catch {
          alert("Unexpected error during copy.");
        }
      };

      gallery.appendChild(card);
    });
  }

  // 9) Image search filter
  imageSearch.oninput = () => {
    const term = imageSearch.value.toLowerCase();
    document.querySelectorAll(".image-container").forEach((div) => {
      const filename = div.querySelector("img")?.src.split("/").pop().toLowerCase() || "";
      div.style.display = filename.includes(term) ? "" : "none";
    });
  };

  // 🔀 10) Shuffle
  shuffleBtn.onclick = () => {
    if (currentFolder === "Prompts" || !images[currentFolder]) return;
    const shuffled = [...originalOrder].sort(() => Math.random() - 0.5);
    renderImages(shuffled);
  };

  // 11) Load prompts
  async function loadPrompts() {
    const { prompts } = await fetch("prompts.json").then((r) => r.json());
    gallery.innerHTML = "";
    headerTitle.textContent = "Prompts";
    prompts.forEach((prompt) => {
      const card = document.createElement("div");
      card.className = "image-container";

      const title = document.createElement("div");
      title.textContent = prompt.title;
      Object.assign(title.style, {
        padding: "1rem",
        fontWeight: "bold",
        textAlign: "center",
        background: "var(--accent)",
        color: "#fff",
      });
      card.appendChild(title);

      const icon = document.createElement("div");
      icon.className = "copy-icon";
      icon.textContent = "📋";
      card.appendChild(icon);

      card.onclick = async () => {
        try {
          await navigator.clipboard.writeText(prompt.description);
          showToast();
        } catch {
          alert("Failed to copy prompt.");
        }
      };

      gallery.appendChild(card);
    });
  }

  // ——————————————————————————————————————————————
  // —— CSV loader + color‑matching math + visuals
  // ——————————————————————————————————————————————

  async function loadColorsCSV() {
    try {
      const text = await fetch("colors.csv").then((r) => r.text());
      const [header, ...lines] = text.trim().split("\n");
      colorList.length = 0;

      lines.forEach((line) => {
        let [rawName, r, g, b] = line.split(",").map((c) => c.trim());
        const name = rawName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        const rr = parseInt(r, 10),
          gg = parseInt(g, 10),
          bb = parseInt(b, 10);
        const { h, s, l } = rgbToHsl(rr, gg, bb);
        colorList.push({ name, r: rr, g: gg, b: bb, h, s, l });
      });
    } catch (err) {
      console.error("❌ Failed to load colors.csv", err);
    }
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function findNearestByHue(targetHue) {
    return colorList.reduce((best, c) => {
      const bd = Math.min(Math.abs(best.h - targetHue), 360 - Math.abs(best.h - targetHue));
      const cd = Math.min(Math.abs(c.h - targetHue), 360 - Math.abs(c.h - targetHue));
      return cd < bd ? c : best;
    });
  }

  function getComplementaryColors() {
    const base = colorList[Math.floor(Math.random() * colorList.length)];
    const comp = findNearestByHue((base.h + 180) % 360);
    return [base, comp];
  }

  function getTriadicColors() {
    const base = colorList[Math.floor(Math.random() * colorList.length)];
    const c1 = findNearestByHue((base.h + 120) % 360);
    const c2 = findNearestByHue((base.h + 240) % 360);
    return [base, c1, c2];
  }

  // N-color evenly spaced (for N = 2…6)
  function getNColors(n) {
    const base = colorList[Math.floor(Math.random() * colorList.length)];
    return Array.from({ length: n }, (_, i) => {
      const hue = (base.h + (360 / n) * i) % 360;
      return findNearestByHue(hue);
    });
  }

  function formatCombination(list) {
    if (list.length === 2) {
      return `(${list[0]} and ${list[1]})`;
    }
    const items = [...list],
      last = items.pop();
    return `(${items.join(", ")}, and ${last})`;
  }

  function showToast() {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1000);
  }

  function initColorCombination() {
    if (!colorDisplay || colorList.length === 0) return;

    document.querySelectorAll("#color-combination button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        let combo;
        const cnt = btn.dataset.count;
        if (cnt === "2") {
          combo = getComplementaryColors();
        } else if (cnt === "3") {
          combo = getTriadicColors();
        } else {
          // random: pick N between 2 and 6
          const N = Math.floor(Math.random() * 5) + 2;
          combo = getNColors(N);
        }

        // render swatches + text
        colorDisplay.innerHTML = "";
        combo.forEach((c) => {
          const sw = document.createElement("div");
          sw.className = "color-swatch";
          sw.style.background = `rgb(${c.r}, ${c.g}, ${c.b})`;
          sw.title = c.name;
          colorDisplay.appendChild(sw);
        });
        const names = combo.map((c) => c.name);
        const label = document.createElement("span");
        label.className = "color-label";
        label.textContent = formatCombination(names);
        colorDisplay.appendChild(label);

        // copy to clipboard
        try {
          await navigator.clipboard.writeText(label.textContent);
          showToast();
        } catch {
          alert("❌ Failed to copy color combination.");
        }
      });
    });
  }
});
