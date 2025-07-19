import os
import json
from urllib.parse import quote

# Constants
ROOT_FOLDER = "Sample List"
OUTPUT_FILE = "manifest.json"

def build_manifest(root_path):
    manifest = {"folders": [], "images": {}}

    # Ensure root exists
    if not os.path.isdir(root_path):
        raise FileNotFoundError(f"Directory not found: {root_path}")

    # Traverse style folders
    for style_folder in sorted(os.listdir(root_path)):
        style_path = os.path.join(root_path, style_folder)
        if os.path.isdir(style_path):
            manifest["folders"].append(style_folder)
            image_list = []

            for filename in sorted(os.listdir(style_path)):
                full_path = os.path.join(style_path, filename)
                if os.path.isfile(full_path) and filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    # Reconstruct relative path with URL encoding
                    relative_path = os.path.join(root_path, style_folder, filename)
                    encoded_path = quote(relative_path, safe="/:")
                    image_list.append(encoded_path)

            manifest["images"][style_folder] = image_list

    return manifest

# Generate and save manifest
if __name__ == "__main__":
    data = build_manifest(ROOT_FOLDER)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Manifest saved to: {OUTPUT_FILE}")
