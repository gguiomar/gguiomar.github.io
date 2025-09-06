#!/usr/bin/env python3

import os
import glob

pages_dir = 'pages'
html_files = glob.glob(os.path.join(pages_dir, '*.html'))

print(f"Fixing back links in {len(html_files)} HTML files...")

for filepath in html_files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix the back link to point to the diagram correctly
    content = content.replace(
        'href="../index.html"',
        'href="../diagram/index.html"'
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ Fixed: {filepath}")

print("\n🎉 All back links fixed!")
