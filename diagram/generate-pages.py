#!/usr/bin/env python3

import json
import os

# Read the pages configuration
with open('atavic-pages.json', 'r') as f:
    pages_data = json.load(f)

# Create pages directory if it doesn't exist
pages_dir = 'pages'
if not os.path.exists(pages_dir):
    os.makedirs(pages_dir)

print('Generating HTML pages from template...')

# Generate each page
for page in pages_data['pages']:
    html = pages_data['template']
    
    # Replace template variables
    html = html.replace('{{TITLE}}', page['title'])
    html = html.replace('{{ELEMENT_ID}}', page['elementId'])
    
    # Write the file
    filepath = os.path.join(pages_dir, page['filename'])
    with open(filepath, 'w') as f:
        f.write(html)
    
    print(f"✅ Generated: {filepath}")

print(f"\n🎉 Successfully generated {len(pages_data['pages'])} HTML pages!")
print("📁 All pages are in the ./pages/ directory")
print("🔗 These pages are now clickable in the diagram viewer")
