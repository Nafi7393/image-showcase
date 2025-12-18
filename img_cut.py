import os
import glob
from PIL import Image
from natsort import natsorted

def is_close_aspect_ratio(w, h, target_ratio, tolerance=0.01):
    return abs((w / h) - target_ratio) < tolerance

def process_image(image_path, desired_width, desired_height, top_crop_percent):
    image = Image.open(image_path)
    original_width, original_height = image.size

    # Check if aspect ratio is already 3:4 (portrait) or 4:3 (landscape)
    if is_close_aspect_ratio(original_width, original_height, 3/4) or \
       is_close_aspect_ratio(original_width, original_height, 4/3):
        print(f"Skipping (already 3:4 or 4:3): {image_path}")
        return

    if original_height >= original_width:
        # Portrait: Match 3:4 aspect
        target_width = desired_width
        target_height = desired_height
        scale_factor = target_width / original_width
        new_width = int(original_width * scale_factor)
        new_height = int(original_height * scale_factor)
        image_resized = image.resize((new_width, new_height), Image.LANCZOS)

        # Crop vertically
        total_cut = new_height - target_height
        top_cut = int((top_crop_percent / 100.0) * total_cut)
        crop_box = (0, top_cut, target_width, top_cut + target_height)
    else:
        # Landscape: Match 4:3 aspect
        target_width = desired_height  # width = 3600
        target_height = desired_width  # height = 2700
        scale_factor = target_height / original_height
        new_width = int(original_width * scale_factor)
        new_height = int(original_height * scale_factor)
        image_resized = image.resize((new_width, new_height), Image.LANCZOS)

        # Crop horizontally
        total_cut = new_width - target_width
        left_cut = int((top_crop_percent / 100.0) * total_cut)
        crop_box = (left_cut, 0, left_cut + target_width, target_height)

    cropped_image = image_resized.crop(crop_box)

    image_format = image.format or 'JPEG'
    cropped_image.save(image_path, format=image_format)
    print(f"Processed: {image_path}")

def main():
    try:
        top_crop_percent = float(input("Enter crop percentage from top or left (0–100): ").strip())
        if not (0 <= top_crop_percent <= 100):
            raise ValueError("Crop percentage must be between 0 and 100.")
    except ValueError as e:
        print(f"Invalid input: {e}")
        return

    portrait_width = 2700
    portrait_height = 3600

    image_extensions = ('*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif')
    image_files = []

    for ext in image_extensions:
        image_files.extend(glob.glob(ext))

    if not image_files:
        print("No images found in the current directory.")
        return

    image_files = natsorted(image_files)

    for image_file in image_files:
        try:
            process_image(image_file, portrait_width, portrait_height, top_crop_percent)
        except Exception as e:
            print(f"Error processing {image_file}: {e}")

if __name__ == '__main__':
    main()
