import os
import gc
import sys
from PIL import Image, ImageOps, ImageFile

# Setup PIL to handle large files and suppress warnings
ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

# Folder names to ignore
ignore_dirs = {'________MOOD BOARD', '___DONE'}

def convert_to_resized_jpg(file_path, counter):
    """Converts and resizes any image to .jpg (1200px height), deletes original file after success."""
    try:
        with Image.open(file_path) as img:
            img = ImageOps.exif_transpose(img)

            if img.mode != 'RGB':
                img = img.convert('RGB')

            width, height = img.size
            aspect_ratio = width / height
            target_height = 1200
            target_width = int(aspect_ratio * target_height)
            img = img.resize((target_width, target_height), Image.LANCZOS)

            dir_name, file_name = os.path.split(file_path)
            folder_name = os.path.basename(dir_name)
            name, ext = os.path.splitext(file_name)

            if folder_name.lower() in name.lower():
                new_file_name = f"{name}.jpg"
            else:
                new_file_name = f"{name} - {folder_name}.jpg"

            new_file_path = os.path.join(dir_name, new_file_name)

            if os.path.exists(new_file_path):
                print(f"[{counter}] Already exists: {new_file_path}")
                return

            img.save(new_file_path, 'JPEG', quality=95, optimize=True)

        # 🚮 Delete the original image file after successful save
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
        gc.collect()



def process_directory(root_dir):
    """Recursively process all image files in the directory, skipping ignored folders."""
    counter = 0
    valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'}

    for root, dirs, files in os.walk(root_dir, topdown=True):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]

        for file in files:
            _, ext = os.path.splitext(file)
            if ext.lower() in valid_exts:
                counter += 1
                file_path = os.path.join(root, file)
                convert_to_resized_jpg(file_path, counter)

    print(f"\n✅ Done! Total files processed: {counter}")


if __name__ == "__main__":
    # Allow folder path as argument, default to current directory
    target_dir = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    print(f"📂 Processing folder: {target_dir}")
    process_directory(target_dir)
