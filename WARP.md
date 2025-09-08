# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This is Gonçalo Guiomar's personal academic website repository, hosted on GitHub Pages. The site combines a traditional academic portfolio with an interactive research framework called ATAVIC (Algorithmic Theoretical Analysis of Visual Interactive Concepts). The website features a black theme with research publications, artistic collaborations, and an interactive diagram system for exploring conceptual relationships.

## Architecture

### Core Website Structure
- **`index.html`**: Main landing page with personal information, research overview, publications, and artistic works
- **`writings.html`**: Template for academic writing with MathJax support for mathematical expressions
- **`docs/`**: Static assets (CSS, JS libraries, images) including Bootstrap, MDB, jQuery, and custom styling
- **`images/`**: Social media icons and profile images

### ATAVIC Framework System
The repository includes a sophisticated interactive diagram system located in the `diagram/` directory:

- **`diagram.html`**: Interactive SVG viewer with pan/zoom functionality and clickable navigation
- **`ATAVIC.svg`**: The main conceptual diagram SVG file
- **`atavic-pages.json`**: Configuration file mapping diagram elements to HTML pages
- **`viewer.html`**: Alternative diagram viewer interface
- **`element-identifier.html`**: Tool for identifying and mapping SVG elements to pages

### Python Tools for Content Generation
The system includes several Python utilities for managing the ATAVIC framework:

- **`page_generator.py`**: Main class-based tool for generating themed HTML pages from identified diagram elements
- **`generate-pages.py`**: Simple script for batch HTML generation from JSON configuration
- **`element_mapper.py`**: Utility for mapping SVG elements to navigable content
- **Link management utilities**: `fix-links.py`, `update-links.py` for maintaining diagram navigation

## Development Commands

### Static Site Development
Since this is a static GitHub Pages site, development is straightforward:

```bash
# Serve locally for development (requires Python)
python3 -m http.server 8000

# Or using Node.js if available
npx http-server -p 8000
```

### ATAVIC Framework Development

#### Generate HTML Pages from Diagram Elements
```bash
# Generate pages using the main page generator
cd diagram
python3 page_generator.py

# Or use the simpler script
python3 generate-pages.py
```

#### Element Identification and Mapping
```bash
# Map SVG elements to pages (interactive browser tool)
# Open diagram/element-identifier.html in browser
# Results are saved to atavic-pages.json
```

#### Link Management
```bash
cd diagram
python3 fix-links.py      # Fix broken diagram navigation links
python3 update-links.py   # Update link references
```

### Content Management

#### Add New Mathematical Writing
1. Copy `writings.html` as template
2. Update title, date, and content
3. MathJax is pre-configured for inline `$...$` and display `$$...$$` equations

#### Extend ATAVIC Framework
1. Modify `ATAVIC.svg` to add new elements
2. Use `element-identifier.html` to map new elements
3. Run page generator to create corresponding HTML pages
4. Customize generated pages with specific content

## Key Technical Features

### Interactive Diagram System
- **SVG Navigation**: Clickable elements in diagrams that navigate to dedicated pages
- **Dynamic Page Generation**: Python tools automatically create themed HTML pages from diagram element mappings
- **Consistent Theming**: Generated pages inherit the main site's black theme with terminal-style aesthetics

### MathJax Integration
- Configured for both inline and display mathematics
- Supports LaTeX syntax with proper escaping
- Optimized for academic writing with equation numbering support

### Modular Python Architecture
- `ATAVICPageGenerator` class provides extensible page generation
- JSON-driven configuration for easy maintenance
- Separation of concerns between element identification and page generation

## File Organization Logic

The repository follows a clear separation between:
- **Static content** (`index.html`, `writings.html`, `docs/`, `images/`)
- **Interactive framework** (`diagram/` with tools and generated content)
- **Generated content** (pages created dynamically from diagram elements)

This architecture allows for independent development of the personal website and the research framework while maintaining integration through shared styling and navigation.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the main branch. The ATAVIC framework's generated pages integrate seamlessly with the static site structure.
