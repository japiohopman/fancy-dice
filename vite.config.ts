import {readFileSync, writeFileSync} from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function pwaPrecachePlugin(): Plugin {
  return {
    name: 'fancy-dice-pwa-precache',
    apply: 'build',
    writeBundle(outputOptions, bundle) {
      const outputDir = outputOptions.dir ?? 'dist';
      const serviceWorkerPath = path.resolve(outputDir, 'sw.js');
      const buildAssetFiles = Object.values(bundle)
        .filter(
          (output) =>
            output.type === 'chunk' ||
            (output.type === 'asset' && /\.css$/i.test(output.fileName)),
        )
        .map((output) => output.fileName)
        .sort();

      const source = readFileSync(serviceWorkerPath, 'utf8');
      const placeholder = 'const BUILD_ASSET_FILES = [];';
      if (!source.includes(placeholder)) {
        throw new Error('Could not find BUILD_ASSET_FILES placeholder in dist/sw.js');
      }

      writeFileSync(
        serviceWorkerPath,
        source.replace(placeholder, `const BUILD_ASSET_FILES = ${JSON.stringify(buildAssetFiles)};`),
        'utf8',
      );
    },
  };
}

export default defineConfig(() => {
  return {
    // GitHub Pages hosts this repository under /fancy-dice/; keep local/dev builds at /.
    base: process.env.GITHUB_ACTIONS === 'true' ? '/fancy-dice/' : '/',
    plugins: [react(), tailwindcss(), pwaPrecachePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
