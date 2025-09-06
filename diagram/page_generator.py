#!/usr/bin/env python3
"""
ATAVIC Page Generator
Takes the JSON output from the Element Identifier and creates actual HTML pages
"""

import json
import os
from pathlib import Path

class ATAVICPageGenerator:
    def __init__(self):
        self.template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #00bd00;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        
        h1 {
            border-bottom: 2px solid #00bd00;
            padding-bottom: 10px;
            text-align: center;
            margin-bottom: 30px;
            text-transform: uppercase;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
            padding: 15px 0;
            border-top: 1px dashed #00bd00;
            border-bottom: 1px dashed #00bd00;
        }
        
        .back-link, .diagram-link {
            display: inline-block;
            padding: 8px 16px;
            background: rgba(0, 189, 0, 0.1);
            border: 1px solid #00bd00;
            color: #00bd00;
            text-decoration: none;
            border-radius: 3px;
            transition: background 0.2s ease;
        }
        
        .back-link:hover, .diagram-link:hover {
            background: rgba(0, 189, 0, 0.2);
        }
        
        .content {
            min-height: 400px;
            border: 1px dashed #00bd00;
            padding: 30px;
            margin: 20px 0;
            border-radius: 5px;
            background: rgba(0, 189, 0, 0.02);
        }
        
        .element-info {
            background: rgba(0, 189, 0, 0.1);
            border: 1px solid #00bd00;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        
        .element-id {
            font-family: monospace;
            font-size: 0.9em;
            opacity: 0.7;
        }
        
        .placeholder-content {
            font-style: italic;
            opacity: 0.8;
            border-left: 3px solid #00bd00;
            padding-left: 15px;
            margin: 20px 0;
        }
        
        .edit-instructions {
            background: rgba(0, 189, 0, 0.05);
            border: 1px dashed #00bd00;
            padding: 15px;
            margin-top: 20px;
            border-radius: 5px;
            font-size: 0.9em;
        }
        
        .edit-instructions h3 {
            margin-top: 0;
            color: #00bd00;
        }
        
        .edit-instructions ul {
            margin: 10px 0;
        }
        
        .edit-instructions li {
            margin: 5px 0;
        }
        
        code {
            background: rgba(0, 189, 0, 0.1);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px dashed #00bd00;
            text-align: center;
            opacity: 0.7;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{TITLE}}</h1>
        
        <div class="navigation">
            <a href="../viewer.html" class="back-link">← Back to ATAVIC Diagram</a>
            <a href="../element-identifier.html" class="diagram-link">🔗 Element Identifier</a>
        </div>
        
        <div class="element-info">
            <strong>Element:</strong> {{TITLE}}<br>
            <strong>ID:</strong> <span class="element-id">{{ELEMENT_ID}}</span><br>
            <strong>Generated:</strong> {{TIMESTAMP}}
        </div>
        
        <div class="content">
            <div class="placeholder-content">
                <h3>About {{TITLE}}</h3>
                <p>This page is dedicated to the concept of <strong>{{TITLE}}</strong> as it relates to the ATAVIC framework.</p>
                <p>This element represents one of the key textual components identified in the ATAVIC diagram.</p>
                <p><em>Replace this placeholder content with your own material about {{TITLE}}.</em></p>
            </div>
            
            <!-- Add your content below this line -->
            
            <!-- Content sections you might want to add:
            
            <h2>Overview</h2>
            <p>Describe what this element represents in the ATAVIC context...</p>
            
            <h2>Key Concepts</h2>
            <ul>
                <li>Concept 1</li>
                <li>Concept 2</li>
                <li>Concept 3</li>
            </ul>
            
            <h2>Relationships</h2>
            <p>Describe how this element relates to other parts of the ATAVIC diagram...</p>
            
            <h2>References</h2>
            <p>Add any references or sources relevant to this topic...</p>
            
            -->
        </div>
        
        <div class="edit-instructions">
            <h3>💡 How to customize this page:</h3>
            <ul>
                <li>Replace the placeholder content above with your own material</li>
                <li>Add sections like <code>&lt;h2&gt;Overview&lt;/h2&gt;</code> for structure</li>
                <li>Include images: <code>&lt;img src="images/diagram.png" alt="Description"&gt;</code></li>
                <li>Link to other pages: <code>&lt;a href="ontology.html"&gt;Related Topic&lt;/a&gt;</code></li>
                <li>Use <code>&lt;em&gt;</code> for emphasis and <code>&lt;strong&gt;</code> for importance</li>
                <li>Create lists with <code>&lt;ul&gt;</code> or <code>&lt;ol&gt;</code> tags</li>
                <li>Remove or modify these instructions when you're done editing</li>
            </ul>
        </div>
        
        <div class="footer">
            Part of the ATAVIC Interactive Diagram Project<br>
            <a href="../viewer.html" style="color: #00bd00;">Return to Main Diagram</a>
        </div>
    </div>
</body>
</html>'''

    def load_from_json_file(self, json_file_path):
        """Load page generation data from JSON file"""
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
            return data
        except FileNotFoundError:
            print(f"❌ Error: File not found: {json_file_path}")
            return None
        except json.JSONDecodeError:
            print(f"❌ Error: Invalid JSON in file: {json_file_path}")
            return None

    def create_pages_directory(self, base_path="."):
        """Create pages directory if it doesn't exist"""
        pages_dir = Path(base_path) / "pages"
        pages_dir.mkdir(exist_ok=True)
        return pages_dir

    def generate_page_content(self, page_data):
        """Generate HTML content for a single page"""
        from datetime import datetime
        
        content = self.template
        content = content.replace('{{TITLE}}', page_data['title'])
        content = content.replace('{{ELEMENT_ID}}', page_data['elementId'])
        content = content.replace('{{TIMESTAMP}}', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        return content

    def generate_pages(self, data, output_dir=None):
        """Generate all HTML pages from the data"""
        if output_dir is None:
            output_dir = self.create_pages_directory()
        else:
            output_dir = Path(output_dir)
            output_dir.mkdir(exist_ok=True)

        created_pages = []
        
        for page_data in data['pages']:
            # Generate content
            content = self.generate_page_content(page_data)
            
            # Write to file
            file_path = output_dir / page_data['filename']
            
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                created_pages.append({
                    'title': page_data['title'],
                    'filename': page_data['filename'],
                    'path': str(file_path),
                    'element_id': page_data['elementId']
                })
                
                print(f"✅ Created: {page_data['filename']} ({page_data['title']})")
                
            except Exception as e:
                print(f"❌ Error creating {page_data['filename']}: {e}")

        return created_pages

    def create_index_page(self, created_pages, output_dir):
        """Create an index page linking to all generated pages"""
        index_content = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATAVIC Pages Index</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #00bd00;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        
        h1 {
            border-bottom: 2px solid #00bd00;
            padding-bottom: 10px;
            text-align: center;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .page-list {
            list-style: none;
            padding: 0;
        }
        
        .page-item {
            background: rgba(0, 189, 0, 0.1);
            border: 1px solid #00bd00;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
        }
        
        .page-link {
            color: #00bd00;
            text-decoration: none;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .page-link:hover {
            text-decoration: underline;
        }
        
        .page-id {
            font-size: 0.9em;
            opacity: 0.7;
            font-family: monospace;
        }
        
        .back-link {
            display: inline-block;
            margin: 20px 0;
            padding: 8px 16px;
            background: rgba(0, 189, 0, 0.1);
            border: 1px solid #00bd00;
            color: #00bd00;
            text-decoration: none;
            border-radius: 3px;
        }
        
        .back-link:hover {
            background: rgba(0, 189, 0, 0.2);
        }
        
        .stats {
            text-align: center;
            margin: 20px 0;
            font-style: italic;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ATAVIC Pages Index</h1>
        
        <a href="../viewer.html" class="back-link">← Back to ATAVIC Diagram</a>
        
        <div class="stats">
            {page_count} pages generated from identified elements
        </div>
        
        <ul class="page-list">
{page_items}
        </ul>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #00bd00;">
            <a href="../viewer.html" class="back-link">Return to Main Diagram</a>
        </div>
    </div>
</body>
</html>'''

        # Generate page list items
        page_items = []
        for page in created_pages:
            item = f'''            <li class="page-item">
                <a href="{page['filename']}" class="page-link">{page['title']}</a><br>
                <div class="page-id">{page['element_id']}</div>
            </li>'''
            page_items.append(item)

        # Replace placeholders
        index_content = index_content.replace('{page_count}', str(len(created_pages)))
        index_content = index_content.replace('{page_items}', '\n'.join(page_items))

        # Write index file
        index_path = output_dir / "index.html"
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(index_content)
        
        print(f"✅ Created index page: {index_path}")

def main():
    generator = ATAVICPageGenerator()
    
    print("🔄 ATAVIC Page Generator")
    print("=" * 40)
    
    # Check for default JSON file
    default_json = "atavic-pages.json"
    
    if os.path.exists(default_json):
        print(f"📁 Found {default_json}")
        json_file = default_json
    else:
        json_file = input("Enter path to JSON file (or press Enter to use 'atavic-pages.json'): ").strip()
        if not json_file:
            json_file = default_json
    
    # Load data
    print(f"📖 Loading data from {json_file}...")
    data = generator.load_from_json_file(json_file)
    
    if not data:
        print("❌ Failed to load data. Exiting.")
        return
    
    if not data.get('pages'):
        print("❌ No pages found in the data. Make sure you've identified elements first.")
        return
    
    # Ask for output directory
    output_dir = input("Enter output directory (or press Enter to use './pages'): ").strip()
    if not output_dir:
        output_dir = None  # Will use default
    
    # Generate pages
    print(f"\n🔨 Generating {len(data['pages'])} pages...")
    created_pages = generator.generate_pages(data, output_dir)
    
    if created_pages:
        # Create index page
        pages_dir = Path(output_dir) if output_dir else generator.create_pages_directory()
        generator.create_index_page(created_pages, pages_dir)
        
        print(f"\n🎉 Successfully created {len(created_pages)} pages!")
        print(f"📂 Output directory: {pages_dir}")
        print("\n📋 Created pages:")
        for page in created_pages:
            print(f"   • {page['filename']} - {page['title']}")
        
        print(f"\n🌐 View the index at: {pages_dir}/index.html")
        print("💡 Now you can edit each HTML file to add your own content!")
    else:
        print("❌ No pages were created. Check the error messages above.")

if __name__ == "__main__":
    main()
