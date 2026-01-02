#!/usr/bin/env python3
"""
Aggressively compress images for web - target 500KB-800KB per image.
"""

import os
from PIL import Image
import sys

def compress_image(input_path, output_path, target_size_mb=0.8, quality=75):
    """
    Aggressively compress an image for web use.
    Target size: ~500-800KB per image.
    """
    try:
        # Get file size in MB
        file_size_mb = os.path.getsize(input_path) / (1024 * 1024)
        
        print(f"  Processing {os.path.basename(input_path)}: {file_size_mb:.2f}MB -> ", end="", flush=True)
        
        # Open image
        img = Image.open(input_path)
        original_size = img.size
        
        # Convert RGBA to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (0, 0, 0))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Aggressively resize - max 2000px on longest side for web
        max_dimension = 2000
        width, height = img.size
        
        if width > max_dimension or height > max_dimension:
            ratio = min(max_dimension / width, max_dimension / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"resized to {new_width}x{new_height}, ", end="", flush=True)
        
        # For PNG, convert to JPEG
        if output_path.lower().endswith('.png'):
            output_path = output_path.rsplit('.', 1)[0] + '.jpg'
        
        # Save with initial quality
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
        new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        # If still over target, reduce quality iteratively
        iterations = 0
        while new_size_mb > target_size_mb and quality > 50 and iterations < 8:
            quality -= 5
            iterations += 1
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
            new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        # If STILL over target, resize more aggressively
        if new_size_mb > target_size_mb:
            print(f"resizing to 1500px, ", end="", flush=True)
            width, height = img.size
            max_dim = 1500
            if width > max_dim or height > max_dim:
                ratio = min(max_dim / width, max_dim / height)
                new_width = int(width * ratio)
                new_height = int(height * ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                img.save(output_path, 'JPEG', quality=75, optimize=True)
                new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"{new_size_mb:.2f}MB (quality: {quality})")
        return True
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
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
    print("Aggressively compressing images for web (target: ~500-800KB)...\n")
    
    compressed_count = 0
    error_count = 0
    
    for filename in image_files:
        input_path = os.path.join(portfolio_dir, filename)
        if compress_image(input_path, input_path, target_size_mb=0.8):
            compressed_count += 1
    
    print(f"\n✓ Completed! Compressed {compressed_count} images")

if __name__ == "__main__":
    main()

