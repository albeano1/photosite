#!/usr/bin/env python3
"""
Compress images in the portfolio folder to under 10MB.
Uses PIL/Pillow to resize and compress JPEG/PNG images.
"""

import os
from PIL import Image
import sys

def compress_image(input_path, output_path, max_size_mb=10, quality=85):
    """
    Compress an image to be under max_size_mb.
    Returns True if compression was needed/applied, False otherwise.
    """
    try:
        # Get file size in MB
        file_size_mb = os.path.getsize(input_path) / (1024 * 1024)
        
        # If already under limit, skip (but still copy to ensure consistency)
        if file_size_mb <= max_size_mb:
            print(f"  ✓ {os.path.basename(input_path)}: {file_size_mb:.2f}MB (already under limit)")
            return False
        
        print(f"  Compressing {os.path.basename(input_path)}: {file_size_mb:.2f}MB -> ", end="", flush=True)
        
        # Open image
        img = Image.open(input_path)
        
        # Convert RGBA to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (0, 0, 0))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Determine target dimensions (reduce if too large)
        max_dimension = 4000  # Max width or height
        width, height = img.size
        
        if width > max_dimension or height > max_dimension:
            ratio = min(max_dimension / width, max_dimension / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"resized to {new_width}x{new_height}, ", end="", flush=True)
        
        # Save with compression
        # For PNG, convert to JPEG for better compression
        if output_path.lower().endswith('.png'):
            # Convert PNG to JPEG for better compression
            output_path_jpg = output_path.rsplit('.', 1)[0] + '.jpg'
            img.save(output_path_jpg, 'JPEG', quality=quality, optimize=True)
            # Remove original PNG and use JPEG
            if os.path.exists(output_path) and output_path != output_path_jpg:
                os.remove(output_path)
            output_path = output_path_jpg
        # For JPEG
        elif output_path.lower().endswith(('.jpg', '.jpeg')):
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
        else:
            # Default to JPEG
            output_path = output_path.rsplit('.', 1)[0] + '.jpg'
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
        
        # Check if we're under the limit
        new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"{new_size_mb:.2f}MB")
        
        # If still over limit, reduce quality and try again
        iterations = 0
        while new_size_mb > max_size_mb and quality > 40 and iterations < 6:
            quality -= 10
            iterations += 1
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
            new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"    Reduced quality to {quality}, new size: {new_size_mb:.2f}MB")
        
        # If STILL over limit, resize more aggressively
        if new_size_mb > max_size_mb:
            print(f"    Resizing more aggressively...", end="", flush=True)
            width, height = img.size
            # Reduce to 3000px max dimension
            max_dim = 3000
            if width > max_dim or height > max_dim:
                ratio = min(max_dim / width, max_dim / height)
                new_width = int(width * ratio)
                new_height = int(height * ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                img.save(output_path, 'JPEG', quality=75, optimize=True)
                new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
                print(f" {new_size_mb:.2f}MB")
        
        if new_size_mb > max_size_mb:
            print(f"    ⚠ Warning: Still {new_size_mb:.2f}MB after compression")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Error processing {input_path}: {e}")
        return False

def main():
    portfolio_dir = "src/images/portfolio"
    
    if not os.path.exists(portfolio_dir):
        print(f"Error: Directory '{portfolio_dir}' not found!")
        sys.exit(1)
    
    # Find all image files
    image_extensions = ('.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG')
    image_files = [f for f in os.listdir(portfolio_dir) 
                   if f.lower().endswith(image_extensions)]
    
    if not image_files:
        print(f"No image files found in {portfolio_dir}")
        sys.exit(0)
    
    print(f"Found {len(image_files)} images in {portfolio_dir}")
    print("Compressing images to under 10MB...\n")
    
    compressed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filename in image_files:
        input_path = os.path.join(portfolio_dir, filename)
        
        # Create backup (optional - comment out if you don't want backups)
        # backup_path = input_path + ".backup"
        # if not os.path.exists(backup_path):
        #     os.rename(input_path, backup_path)
        #     input_path = backup_path
        
        # Compress (will overwrite original)
        if compress_image(input_path, input_path, max_size_mb=10):
            compressed_count += 1
        else:
            skipped_count += 1
    
    print(f"\n✓ Completed!")
    print(f"  Compressed: {compressed_count}")
    print(f"  Already under limit: {skipped_count}")
    print(f"  Errors: {error_count}")

if __name__ == "__main__":
    main()

