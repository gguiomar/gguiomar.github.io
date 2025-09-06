#!/usr/bin/env python3
"""
ATAVIC Text Element Mapper
A Python script to programmatically create mappings between text elements and navigation URLs
"""

import json
import os
from typing import Dict, Any

class ATAVICElementMapper:
    def __init__(self):
        self.text_elements = [
            'text-machine-encoding',
            'text-encoding', 
            'text-territory',
            'text-relational',
            'text-contact',
            'text-atavic',
            'text-ontology',
            'text-point',
            'text-synthesis',
            'text-precognitive',
            'text-ontogeny',
            'text-selected',
            'text-decoder',
            'text-lateral',
            'text-poetics',
            'text-manifestation',
            'text-object',
            'text-prompt',
            'text-observer'
        ]
        
        self.navigation_map = {}

    def format_label(self, cluster_name: str) -> str:
        """Convert cluster names to readable labels"""
        return (cluster_name
                .replace('text-', '')
                .replace('-', ' ')
                .upper()
                .replace('MACHINE ENCODING', 'MACHINE ENCODING')
                .replace('PRECOGNITIVE', 'PRECOGNITIVE STRUCTURES'))

    def interactive_mapping(self):
        """Interactive terminal-based mapping"""
        print("🔗 ATAVIC Text Element Mapper")
        print("=" * 50)
        print("Create clickable navigation mappings for text elements\n")
        
        for element in self.text_elements:
            label = self.format_label(element)
            print(f"\n📍 Element: {label}")
            print(f"   ID: {element}")
            
            name = input(f"   Display Name [{label}]: ").strip()
            if not name:
                name = label
            
            url = input("   URL (relative or absolute): ").strip()
            
            if url:
                self.navigation_map[element] = {
                    'name': name,
                    'url': url,
                    'original': label
                }
                print(f"   ✅ Mapped: {name} -> {url}")
            else:
                print(f"   ⏭️  Skipped (no URL provided)")

    def batch_mapping(self, mappings: Dict[str, Dict[str, str]]):
        """Batch mapping from a dictionary"""
        for element, data in mappings.items():
            if element in self.text_elements:
                self.navigation_map[element] = {
                    'name': data.get('name', self.format_label(element)),
                    'url': data['url'],
                    'original': self.format_label(element)
                }

    def generate_dictionary(self) -> str:
        """Generate JSON dictionary"""
        return json.dumps(self.navigation_map, indent=2)

    def generate_javascript(self) -> str:
        """Generate JavaScript code for integration"""
        js_template = '''
// Text Element Navigation Dictionary
const textElementNavigation = {navigation_data};

// Add to your ATAVICViewer class
addClickableNavigation() {{
    if (!this.svg) return;
    
    Object.keys(textElementNavigation).forEach(clusterId => {{
        const elements = this.svg.querySelectorAll(`[data-cluster="${{clusterId}}"]`);
        const navData = textElementNavigation[clusterId];
        
        elements.forEach(element => {{
            element.style.cursor = 'pointer';
            element.title = `Click to visit: ${{navData.name}}`;
            
            element.addEventListener('click', (e) => {{
                e.preventDefault();
                
                // Option 1: Open in same window
                window.location.href = navData.url;
                
                // Option 2: Open in new tab (uncomment to use)
                // window.open(navData.url, '_blank');
                
                console.log(`Navigating to: ${{navData.name}} (${{navData.url}})`);
            }});
            
            // Add hover effect
            element.addEventListener('mouseenter', () => {{
                element.style.opacity = '0.8';
                element.style.transform = 'scale(1.05)';
                element.style.transition = 'all 0.2s ease';
            }});
            
            element.addEventListener('mouseleave', () => {{
                element.style.opacity = '1';
                element.style.transform = 'scale(1)';
            }});
        }});
    }});
}}

// Call this method after loading SVG in your constructor
// this.addClickableNavigation();
'''
        return js_template.format(navigation_data=json.dumps(self.navigation_map, indent=2))

    def save_to_file(self, filename: str, content: str):
        """Save content to file"""
        with open(filename, 'w') as f:
            f.write(content)
        print(f"💾 Saved to: {filename}")

    def example_mapping(self):
        """Create an example mapping"""
        example_mappings = {
            'text-atavic': {
                'name': 'ATAVIC Theory',
                'url': 'pages/atavic-theory.html'
            },
            'text-machine-encoding': {
                'name': 'Machine Learning & Encoding',
                'url': 'pages/machine-learning.html'
            },
            'text-ontology': {
                'name': 'Ontological Framework',
                'url': 'pages/ontology.html'
            },
            'text-territory': {
                'name': 'Territorial Analysis',
                'url': 'pages/territory.html'
            },
            'text-observer': {
                'name': 'Observer Theory',
                'url': 'pages/observer.html'
            }
        }
        
        self.batch_mapping(example_mappings)
        return example_mappings

def main():
    mapper = ATAVICElementMapper()
    
    print("Choose an option:")
    print("1. Interactive mapping")
    print("2. Create example mapping")
    print("3. Load from existing file")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '1':
        mapper.interactive_mapping()
    elif choice == '2':
        example = mapper.example_mapping()
        print(f"\n📋 Created example mapping with {len(example)} elements")
    elif choice == '3':
        filename = input("Enter JSON file path: ").strip()
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
            mapper.batch_mapping(data)
            print(f"📁 Loaded {len(data)} mappings from {filename}")
        except FileNotFoundError:
            print(f"❌ File not found: {filename}")
            return
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in file: {filename}")
            return
    else:
        print("❌ Invalid choice")
        return
    
    if mapper.navigation_map:
        print(f"\n🎉 Created mappings for {len(mapper.navigation_map)} elements")
        
        # Generate outputs
        dictionary = mapper.generate_dictionary()
        javascript = mapper.generate_javascript()
        
        # Save files
        mapper.save_to_file('navigation_dictionary.json', dictionary)
        mapper.save_to_file('navigation_code.js', javascript)
        
        print("\n📋 Summary of mapped elements:")
        for element_id, data in mapper.navigation_map.items():
            print(f"   • {data['name']} → {data['url']}")
        
        print("\n🚀 Next steps:")
        print("1. Copy the JavaScript code to your viewer.html file")
        print("2. Call addClickableNavigation() in your ATAVICViewer constructor")
        print("3. Create the HTML pages for each URL")
        print("4. Test the clickable functionality")
    else:
        print("\n⚠️  No mappings created")

if __name__ == "__main__":
    main()
