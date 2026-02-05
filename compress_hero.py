#!/usr/bin/env python3
"""
Compress hero images (bghero, subjecthero) for web: max 1920px, JPG quality 82.
Outputs .jpg so the app can use smaller files; keep originals as .png.
"""

import os
from PIL import Image
import sys

HERO_DIR = "src/images"
HERO_FILES = ["bghero.png", "subjecthero.png"]
MAX_DIMENSION = 1920
QUALITY = 82

def compress_hero(input_path, output_path_jpg):
    try:
        size_mb = os.path.getsize(input_path) / (1024 * 1024)
        print(f"  {os.path.basename(input_path)}: {size_mb:.2f}MB -> ", end="", flush=True)
        img = Image.open(input_path)
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (0, 0, 0))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        w, h = img.size
        if w > MAX_DIMENSION or h > MAX_DIMENSION:
            ratio = min(MAX_DIMENSION / w, MAX_DIMENSION / h)
            new_w, new_h = int(w * ratio), int(h * ratio)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            print(f"resized {w}x{h} to {new_w}x{new_h}, ", end="", flush=True)
        img.save(output_path_jpg, "JPEG", quality=QUALITY, optimize=True)
        new_mb = os.path.getsize(output_path_jpg) / (1024 * 1024)
        print(f"{new_mb:.2f}MB")
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def main():
    if not os.path.exists(HERO_DIR):
        print(f"Error: {HERO_DIR} not found")
        sys.exit(1)
    print("Compressing hero images (max 1920px, JPG 82%)...\n")
    for name in HERO_FILES:
        path = os.path.join(HERO_DIR, name)
        if not os.path.exists(path):
            print(f"  Skip {name} (not found)")
            continue
        out = os.path.join(HERO_DIR, name.replace(".png", ".jpg"))
        compress_hero(path, out)
    print("\nDone. Use bghero.jpg and subjecthero.jpg in the app.")

if __name__ == "__main__":
    main()
