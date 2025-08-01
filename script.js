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

  // Color UI
  const useMainCB = document.getElementById("use-main-color");
  const colorPicker = document.getElementById("main-color-picker");
  const ignoreCsvCB = document.getElementById("ignore-csv");
  const harmonySelect = document.getElementById("harmony-method");
  const generateBtn = document.getElementById("generate-palette");
  const comboBtns = document.querySelectorAll(".combo-buttons button");
  const colorDisplay = document.getElementById("color-display");

  // 3) Globals
  let currentFolder = "Prompts";
  let originalOrder = [];
  const colorList = [];

  // 4) Initial view
  await loadPrompts();
  await loadColorsCSV();
  initColorCombination();

  // 5) Folder list
  const sortedFolders = ["Prompts", ...folders.sort((a, b) => a.localeCompare(b))];
  renderFolders(sortedFolders);
  folderSearch.oninput = () => {
    const term = folderSearch.value.toLowerCase();
    renderFolders(sortedFolders.filter((f) => f.toLowerCase().includes(term)));
  };

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
      gallery.innerHTML = `<div style="font-size:1.2rem;">No images found.</div>`;
      return;
    }
    originalOrder = [...images[name]].sort((a, b) => a.localeCompare(b));
    renderImages(originalOrder);
  }

  // 6) Images
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
      card.onclick = copyImageToClipboard;
      gallery.appendChild(card);
    });
  }

  function copyImageToClipboard() {
    const src = this.querySelector("img").src;
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
        if (!blob) return alert("❌ Failed to convert image.");
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast();
        } catch {
          alert("❌ Copy blocked by browser.");
        }
      }, "image/png");
    };
    imgEl.onerror = () => alert("❌ Image load error.");
  }

  imageSearch.oninput = () => {
    const term = imageSearch.value.toLowerCase();
    document.querySelectorAll(".image-container").forEach((div) => {
      const fn = div.querySelector("img")?.src.split("/").pop().toLowerCase() || "";
      div.style.display = fn.includes(term) ? "" : "none";
    });
  };

  shuffleBtn.onclick = () => {
    if (currentFolder === "Prompts" || !images[currentFolder]) return;
    renderImages([...originalOrder].sort(() => Math.random() - 0.5));
  };

  // 7) Prompts panel
  async function loadPrompts() {
    const { prompts } = await fetch("prompts.json").then((r) => r.json());
    gallery.innerHTML = "";
    headerTitle.textContent = "Prompts";
    prompts.forEach((p) => {
      const c = document.createElement("div");
      c.className = "image-container";
      const t = document.createElement("div");
      t.textContent = p.title;
      Object.assign(t.style, {
        padding: "1rem",
        fontWeight: "bold",
        textAlign: "center",
        background: "var(--accent)",
        color: "#fff",
      });
      c.appendChild(t);
      const ic = document.createElement("div");
      ic.className = "copy-icon";
      ic.textContent = "📋";
      c.appendChild(ic);
      c.onclick = async () => {
        try {
          await navigator.clipboard.writeText(p.description);
          showToast();
        } catch {
          alert("❌ Copy failed.");
        }
      };
      gallery.appendChild(c);
    });
  }

  // 8) Load colors.csv
  async function loadColorsCSV() {
    try {
      const text = await fetch("colors.csv").then((r) => r.text());
      const [, ...lines] = text.trim().split("\n");
      colorList.length = 0;
      lines.forEach((line) => {
        const [raw, r, g, b] = line.split(",").map((c) => c.trim());
        const name = raw
          .split(" ")
          .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        const rr = +r,
          gg = +g,
          bb = +b;
        const { h, s, l } = rgbToHsl(rr, gg, bb);
        colorList.push({ name, r: rr, g: gg, b: bb, h, s, l });
      });
    } catch {
      console.error("❌ Failed to load colors.csv");
    }
  }

  // 9) Color math
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
  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (h < 60) {
      r1 = c;
      g1 = x;
    } else if (h < 120) {
      r1 = x;
      g1 = c;
    } else if (h < 180) {
      g1 = c;
      b1 = x;
    } else if (h < 240) {
      g1 = x;
      b1 = c;
    } else if (h < 300) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  function findNearestByHue(hue) {
    return colorList.reduce((best, c) => {
      const bd = Math.min(Math.abs(best.h - hue), 360 - Math.abs(best.h - hue));
      const cd = Math.min(Math.abs(c.h - hue), 360 - Math.abs(c.h - hue));
      return cd < bd ? c : best;
    });
  }

  // 10) Helpers for natural modes
  function evenlySpacedHues(baseH, n) {
    return Array.from({ length: n }, (_, i) => (baseH + (360 / n) * i) % 360);
  }
  function warmMode(n) {
    const base = Math.random() * 90; // 0–90°
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 80, l: 50 }));
  }
  function coolMode(n) {
    const base = 180 + Math.random() * 120; //180–300°
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 60, l: 50 }));
  }
  function darkMode(n) {
    const base = Math.random() * 360;
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 50, l: 25 }));
  }
  function lightMode(n) {
    const base = Math.random() * 360;
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 50, l: 85 }));
  }
  function pastelMode(n) {
    const base = Math.random() * 360;
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 30, l: 85 }));
  }
  function mutedMode(n) {
    const base = Math.random() * 360;
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 30, l: 50 }));
  }
  function vibrantMode(n) {
    const base = Math.random() * 360;
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 90, l: 50 }));
  }
  function neutralMode(n) {
    // greys: ignore hue
    return Array.from({ length: n }, (_, i) => ({ h: 0, s: 0, l: ((i + 1) / (n + 1)) * 100 }));
  }
  function earthyMode(n) {
    const starts = [30, 60, 90]; // brownish-yellow
    const base = starts[Math.floor(Math.random() * starts.length)];
    return evenlySpacedHues(base, n).map((h) => ({ h, s: 50, l: 40 }));
  }

  // 11) methodMap
  const methodMap = {
    complementary: {
      name: "Complementary",
      fn: (h) => [h, (h + 180) % 360].map((x) => ({ h: x })),
    },
    analogous: {
      name: "Analogous",
      fn: (h) => [h, (h + 30) % 360, (h + 330) % 360].map((x) => ({ h: x })),
    },
    split: {
      name: "Split Compl.",
      fn: (h) => [h, (h + 150) % 360, (h + 210) % 360].map((x) => ({ h: x })),
    },
    triadic: {
      name: "Triadic",
      fn: (h) => [h, (h + 120) % 360, (h + 240) % 360].map((x) => ({ h: x })),
    },
    side: {
      name: "Side Compl.",
      fn: (h) => {
        const comp = (h + 180) % 360;
        return [{ h }, { h: (comp + 30) % 360 }, { h: comp }];
      },
    },
    doubleComp: {
      name: "Double Compl.",
      fn: (h) => [0, 60, 180, 240].map((o) => ({ h: (h + o) % 360 })),
    },
    square: {
      name: "Square Tetradic",
      fn: (h) => [0, 90, 180, 270].map((o) => ({ h: (h + o) % 360 })),
    },
    "double-split": {
      name: "Double Split",
      fn: (h) => evenlySpacedHues(h, 5).map((x) => ({ h: x })),
    },
    warm: { name: "Warm", fn: (_, n) => warmMode(n) },
    cool: { name: "Cool", fn: (_, n) => coolMode(n) },
    dark: { name: "Dark", fn: (_, n) => darkMode(n) },
    light: { name: "Light", fn: (_, n) => lightMode(n) },
    pastel: { name: "Pastel", fn: (_, n) => pastelMode(n) },
    muted: { name: "Muted", fn: (_, n) => mutedMode(n) },
    vibrant: { name: "Vibrant", fn: (_, n) => vibrantMode(n) },
    neutral: { name: "Neutral", fn: (_, n) => neutralMode(n) },
    earthy: { name: "Earthy", fn: (_, n) => earthyMode(n) },
  };

  // 12) generatePalette + init
  async function generatePalette({ countOverride = null } = {}) {
    const N = countOverride || Math.floor(Math.random() * 5) + 2;
    let baseH,
      baseS = 70,
      baseL = 50;
    if (useMainCB.checked) {
      const hex = colorPicker.value;
      ({
        h: baseH,
        s: baseS,
        l: baseL,
      } = rgbToHsl(
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ));
    } else {
      baseH = Math.random() * 360;
    }
    // pick method
    let key = harmonySelect.value;
    if (!key || !methodMap[key]) {
      const keys = Object.keys(methodMap);
      key = keys[Math.floor(Math.random() * keys.length)];
    }
    const methodObj = methodMap[key];
    // get raw HSL arr
    const raw =
      methodObj.fn.length === 1
        ? methodObj.fn(baseH).slice(0, N) // legacy fn(h)
        : methodObj.fn(baseH, N); // new fn(h,n)
    const hslArr = raw.map((o) => ({
      h: o.h,
      s: o.s != null ? o.s : baseS,
      l: o.l != null ? o.l : baseL,
    }));

    // build final combos
    const combo = hslArr.map(({ h, s, l }) => {
      if (ignoreCsvCB.checked) {
        const { r, g, b } = hslToRgb(h, s, l);
        return { name: rgbToHex(r, g, b), r, g, b };
      }
      return findNearestByHue(h);
    });

    // render
    colorDisplay.innerHTML = "";
    combo.forEach((c) => {
      const sw = document.createElement("div");
      sw.className = "color-swatch";
      sw.style.background = `rgb(${c.r},${c.g},${c.b})`;
      sw.title = c.name;
      colorDisplay.appendChild(sw);
    });
    const names = combo.map((c) => c.name);
    let text =
      N === 2
        ? `(${names[0]} and ${names[1]})`
        : `(${names.slice(0, -1).join(", ")}, and ${names.slice(-1)})`;
    const label = document.createElement("span");
    label.className = "color-label";
    label.textContent = `${methodObj.name}: ${text}`;
    colorDisplay.appendChild(label);

    try {
      await navigator.clipboard.writeText(text);
      showToast();
    } catch {
      alert("❌ Failed to copy.");
    }
  }

  function initColorCombination() {
    generateBtn.onclick = () => generatePalette();
    comboBtns.forEach((btn) => {
      btn.onclick = () => generatePalette({ countOverride: parseInt(btn.dataset.count, 10) });
    });
  }

  function showToast() {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1000);
  }
});
