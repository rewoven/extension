# Rewoven Shopping Lens

A Chrome extension that analyzes the environmental impact and sustainability of clothing while you shop online. When you visit a product page on supported retailers, Rewoven automatically detects the garment's material composition and displays a sustainability score, environmental footprint estimates, and actionable recommendations.

## Features

- Automatic material composition detection on product pages
- Sustainability scoring (A-F grade, 0-100 scale)
- Environmental footprint estimates (CO2, water usage)
- Cost-per-wear analysis
- Brand sustainability ratings
- Sustainable alternative suggestions
- WASM-powered material scoring engine (Rust compiled to WebAssembly)

## WASM Sustainability Scorer

The extension includes a Rust-based sustainability scoring module compiled to WebAssembly. It parses fabric composition strings (e.g. "60% polyester, 40% cotton"), normalizes fiber names, and computes detailed environmental impact metrics including water usage ratings, carbon footprint ratings, biodegradability assessments, and microplastic risk levels. The WASM module runs directly in the browser for fast, consistent scoring across 25+ fiber types.

## Supported Retailers

Zara, H&M, ASOS, Nike, SHEIN, Uniqlo, Gap, Forever 21, Urban Outfitters, Nordstrom, Boohoo, PrettyLittleThing, Fashion Nova, Mango, and any site with a generic product page scraper fallback.

## Installation from Source

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (install via rustup)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (install with `cargo install wasm-pack`)

### Build Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/rewoven/extension.git
   cd extension
   ```

2. Install Rust and wasm-pack (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   cargo install wasm-pack
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Build the extension (compiles Rust to WASM, then bundles the TypeScript):
   ```bash
   npm run build
   ```

5. Open Chrome and navigate to `chrome://extensions`

6. Enable **Developer mode** (toggle in the top-right corner)

7. Click **Load unpacked**

8. Select the `dist/` folder from the project directory

The extension is now installed. Visit any supported retailer's product page to see the sustainability overlay.

## Development

- `npm run build` - Full build (WASM + extension)
- `npm run build:wasm` - Build only the Rust WASM module
- `npm run build:ext` - Build only the TypeScript extension
- `npm run watch` - Watch mode for TypeScript changes (run `build:wasm` separately first)
- `npm run clean` - Remove build artifacts

## Project Structure

```
rewoven-extension/
  src/
    content/         # Content scripts (overlay, scraping, WASM integration)
    background/      # Service worker (scoring, settings)
    popup/           # Extension popup UI
    scoring/         # TypeScript sustainability scoring engine
    scrapers/        # Retailer-specific product page scrapers
    shared/          # Shared types and constants
  wasm-scorer/       # Rust WASM crate
    src/lib.rs       # Material parsing + sustainability scoring in Rust
    Cargo.toml       # Rust dependencies
    pkg/             # wasm-pack build output (generated)
  dist/              # Extension build output (generated)
```
