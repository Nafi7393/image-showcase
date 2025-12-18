import os
import gc
import sys
from PIL import Image, ImageOps, ImageFile

# Setup PIL to handle large files and suppress warnings
ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

# Folder names to ignore
ignore_dirs = {'________MOOD BOARD', '___DONE'}

def check_and_rename_jpg(file_path, counter):
    """Checks if a .jpg/.jpeg image has the correct name, renames if necessary."""
    dir_name, file_name = os.path.split(file_path)
    folder_name = os.path.basename(dir_name)
    name, ext = os.path.splitext(file_name)

    # Expected correct naming
    if folder_name.lower() in name.lower():
        expected_name = f"{name}{ext.lower()}"
    else:
        expected_name = f"{name} - {folder_name}{ext.lower()}"

    expected_path = os.path.join(dir_name, expected_name)

    # If not already correct, rename and print
    if file_path != expected_path:
        if not os.path.exists(expected_path):
            os.rename(file_path, expected_path)
            print(f"[{counter}] Renamed {file_path} → {expected_path}")
        else:
            print(f"[{counter}] Skipped rename (exists): {expected_path}")


def convert_webp_to_jpg(file_path, counter):
    """Converts a .webp or .png image to .jpg with a height of 3600px and proportional width."""
    try:
        with Image.open(file_path) as img:
            img = ImageOps.exif_transpose(img)

            if img.mode != 'RGB':
                img = img.convert('RGB')

            width, height = img.size

            aspect_ratio = width / height
            target_height = 3600
            target_width = int(aspect_ratio * target_height)
            img = img.resize((target_width, target_height), Image.LANCZOS)

            dir_name, file_name = os.path.split(file_path)
            folder_name = os.path.basename(dir_name)
            name, _ = os.path.splitext(file_name)

            if folder_name.lower() in name.lower():
                new_file_name = f"{name}.jpg"
            else:
                new_file_name = f"{name} - {folder_name}.jpg"

            new_file_path = os.path.join(dir_name, new_file_name)

            if os.path.exists(new_file_path):
                print(f"[{counter}] Already exists: {new_file_path}")
                return

            img.save(new_file_path, 'JPEG', quality=95, optimize=True)

        os.remove(file_path)
        print(f"[{counter}] Converted {file_path} → {new_file_path} ({target_width}x{target_height})")

    except Exception as e:
        print(f"[{counter}] Skipping {file_path}: {e}")

    finally:
        try:
            img.close()
            del img
        except:
            pass
        gc.collect()  # Clean up after each file to prevent memory buildup


def process_directory(root_dir):
    """Recursively walks through the directory and processes all images."""
    counter = 0

    for root, dirs, files in os.walk(root_dir, topdown=True):
        # Skip unwanted folders
        dirs[:] = [d for d in dirs if d not in ignore_dirs]

        for file in files:
            _, ext = os.path.splitext(file)
            ext = ext.lower()

            file_path = os.path.join(root, file)

            if ext in {'.webp', '.png'}:
                counter += 1
                convert_webp_to_jpg(file_path, counter)
            elif ext in {'.jpg', '.jpeg'}:
                counter += 1
                check_and_rename_jpg(file_path, counter)

    print(f"\n✅ Done! Total files processed: {counter}")


if __name__ == "__main__":
    # Allow folder path as argument, default to current directory
    target_dir = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    print(f"📂 Processing folder: {target_dir}")
    process_directory(target_dir)
