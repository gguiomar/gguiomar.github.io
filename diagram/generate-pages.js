#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the pages configuration
const pagesData = JSON.parse(fs.readFileSync('atavic-pages.json', 'utf8'));

// Create pages directory if it doesn't exist
const pagesDir = 'pages';
if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

console.log('Generating HTML pages from template...');

// Generate each page
pagesData.pages.forEach(page => {
    let html = pagesData.template;
    
    // Replace template variables
    html = html.replace(/\{\{TITLE\}\}/g, page.title);
    html = html.replace(/\{\{ELEMENT_ID\}\}/g, page.elementId);
    
    // Write the file
    const filepath = path.join(pagesDir, page.filename);
    fs.writeFileSync(filepath, html, 'utf8');
    
    console.log(`✅ Generated: ${filepath}`);
});

console.log(`\n🎉 Successfully generated ${pagesData.pages.length} HTML pages!`);
console.log('📁 All pages are in the ./pages/ directory');
console.log('🔗 These pages are now clickable in the diagram viewer');
