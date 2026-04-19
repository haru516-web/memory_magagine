import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from './docs/references/pretext-magazine-editor/node_modules/@vitejs/plugin-react/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dependencyRoot = path.resolve(__dirname, 'docs/references/pretext-magazine-editor/node_modules');

export default {
  base: './',
  plugins: [react()],
  publicDir: 'public',
  resolve: {
    alias: {
      react: path.resolve(dependencyRoot, 'react'),
      'react-dom': path.resolve(dependencyRoot, 'react-dom'),
      'lucide-react': path.resolve(dependencyRoot, 'lucide-react'),
      '@chenglou/pretext': path.resolve(dependencyRoot, '@chenglou/pretext'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'docs',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        pretext: path.resolve(__dirname, 'pretext-editor.html'),
      },
    },
  },
};
