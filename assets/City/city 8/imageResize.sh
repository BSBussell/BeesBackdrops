#!/bin/bash

# Usage: ./scale_image.sh input.png

input="$1"
output="scaled_${input}"

if [ -z "$input" ]; then
  echo "Usage: $0 <image_file>"
  exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
  echo "ImageMagick not found. Install it with 'brew install imagemagick' or equivalent."
  exit 1
fi

# Scale by 3.33x using nearest-neighbor (point) interpolation
convert "$input" -filter point -resize 333% "$output"

echo "Saved nearest-neighbor scaled image as $output"