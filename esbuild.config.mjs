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

// Copy icons
if (existsSync('src/assets/icons')) {
  const iconsDir = join(distDir, 'icons');
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
  cpSync('src/assets/icons', iconsDir, { recursive: true });
}

const buildOptions = {
  entryPoints: [
    'src/background/service-worker.ts',
    'src/content/index.ts',
    'src/popup/popup.ts',
  ],
  bundle: true,
  outdir: distDir,
  format: 'esm',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
  entryNames: '[dir]/[name]',
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('Build complete!');
}
