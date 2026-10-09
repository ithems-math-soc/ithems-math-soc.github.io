#!/usr/bin/env python3
"""
Shrink the photos of one blog post for the web.

Usage: downsize_images.py images/blog/<slug>

Phone photos are often 4000-6000 px wide and several megabytes; 1600 px on the
long side is plenty for the post page. Images are re-encoded (JPEG quality 85,
PNG optimised), rotated according to their EXIF orientation, and stripped of
metadata. Requires Pillow (pip install pillow); the workflow installs it.
"""

import sys
from pathlib import Path

from PIL import Image, ImageOps

MAX_SIDE = 1600


def downsize(path: Path) -> None:
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        before = im.size
        im.thumbnail((MAX_SIDE, MAX_SIDE))
        if path.suffix.lower() in (".jpg", ".jpeg"):
            im.convert("RGB").save(path, "JPEG", quality=85, optimize=True)
        elif path.suffix.lower() == ".png":
            im.save(path, "PNG", optimize=True)
        elif path.suffix.lower() == ".webp":
            im.save(path, "WEBP", quality=85)
        else:
            return
    print(f"{path}: {before[0]}x{before[1]} -> {im.size[0]}x{im.size[1]}, {path.stat().st_size // 1024} KB")


def main() -> None:
    folder = Path(sys.argv[1])
    if not folder.is_dir():
        return
    for path in sorted(folder.iterdir()):
        if path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
            downsize(path)


if __name__ == "__main__":
    main()
