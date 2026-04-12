import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');

const distDir = 'dist';
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

// Copy static files
copyFileSync('manifest.json', join(distDir, 'manifest.json'));
copyFileSync('src/popup/popup.html', join(distDir, 'popup.html'));
copyFileSync('src/popup/popup.css', join(distDir, 'popup.css'));
copyFileSync('src/content/overlay.css', join(distDir, 'overlay.css'));

// Copy WASM files
const wasmPkgDir = join('wasm-scorer', 'pkg');
if (existsSync(wasmPkgDir)) {
  const wasmFile = join(wasmPkgDir, 'rewoven_wasm_scorer_bg.wasm');
  if (existsSync(wasmFile)) {
    copyFileSync(wasmFile, join(distDir, 'rewoven_wasm_scorer_bg.wasm'));
    console.log('Copied WASM binary to dist/');
  }
}

// Copy icons
if (existsSync('src/assets/icons')) {
  const iconsDir = join(distDir, 'icons');
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
  cpSync('src/assets/icons', iconsDir, { recursive: true });
}

// Service worker supports ES modules (declared in manifest.json)
const serviceWorkerOptions = {
  entryPoints: ['src/background/service-worker.ts'],
  bundle: true,
  outdir: distDir,
  format: 'esm',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
  outbase: 'src',
};

// Content scripts & popup CANNOT use ES modules in Chrome extensions
// They must be bundled as IIFE to avoid "import.meta outside a module" errors
const contentOptions = {
  entryPoints: [
    'src/content/index.ts',
    'src/popup/popup.ts',
  ],
  bundle: true,
  outdir: distDir,
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
  outbase: 'src',
};

if (isWatch) {
  const ctx1 = await esbuild.context(serviceWorkerOptions);
  const ctx2 = await esbuild.context(contentOptions);
  await ctx1.watch();
  await ctx2.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(serviceWorkerOptions);
  await esbuild.build(contentOptions);
  console.log('Build complete!');
}
