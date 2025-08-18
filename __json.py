import json
from pathlib import Path
from natsort import natsorted

ROOT_FOLDER = "Sample List"
OUTPUT_FILE = "manifest.json"

def build_manifest(root_path):
    manifest = {"folders": [], "images": {}}
    root = Path(root_path)
    if not root.is_dir():
        raise FileNotFoundError(f"Directory not found: {root_path}")

    # natural-sort style folders
    for style_folder in natsorted([p for p in root.iterdir() if p.is_dir()]):
        manifest["folders"].append(style_folder.name)

        # Prepare substructure
        image_dict = {"main": [], "backgrounds": []}

        # --- MAIN images (everything except Background folder) ---
        files = [p for p in style_folder.iterdir()
                 if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        for img in natsorted(files):
            rel = img.relative_to(root)
            full_path = f"{root.name}/{rel.as_posix()}"
            image_dict["main"].append(full_path)

        # --- BACKGROUND images (inside "Background" subfolder if exists) ---
        bg_folder = style_folder / "Background"
        if bg_folder.is_dir():
            bg_files = [p for p in bg_folder.iterdir()
                        if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
            for img in natsorted(bg_files):
                rel = img.relative_to(root)
                full_path = f"{root.name}/{rel.as_posix()}"
                image_dict["backgrounds"].append(full_path)

        manifest["images"][style_folder.name] = image_dict

    return manifest

if __name__ == "__main__":
    data = build_manifest(ROOT_FOLDER)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Manifest saved to: {OUTPUT_FILE}")
