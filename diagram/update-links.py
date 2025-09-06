#!/usr/bin/env python3

import os
import glob

pages_dir = 'pages'
html_files = glob.glob(os.path.join(pages_dir, '*.html'))

print(f"Updating links in {len(html_files)} HTML files to point to diagram.html...")

for filepath in html_files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Update the back link to point to diagram.html
    content = content.replace(
        'href="../diagram/index.html"',
        'href="../diagram/diagram.html"'
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ Updated: {filepath}")

print("\n🎉 All links updated to point to diagram.html!")
