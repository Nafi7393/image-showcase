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

    # 1) natural‑sort your style folders
    for style_folder in natsorted([p for p in root.iterdir() if p.is_dir()]):
        manifest["folders"].append(style_folder.name)
        image_list = []

        # 2) natural‑sort the image files in each style folder
        files = [p for p in style_folder.iterdir()
                 if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        for img in natsorted(files):
            # make the path relative to root, then prepend ROOT_FOLDER
            rel = img.relative_to(root)
            # result: "Sample List/Abstract Style/1 - Abstract Style.jpg"
            full_path = f"{root.name}/{rel.as_posix()}"
            image_list.append(full_path)

        manifest["images"][style_folder.name] = image_list

    return manifest

if __name__ == "__main__":
    data = build_manifest(ROOT_FOLDER)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Manifest saved to: {OUTPUT_FILE}")
