import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// "base" doit correspondre au nom de votre dépôt GitHub pour que les assets
// se chargent correctement sur https://<user>.github.io/<repo>/
// Ex: si le repo s'appelle "elma-platform", base doit rester "/elma-platform/".
// Si vous utilisez un domaine personnalisé ou un repo <user>.github.io, mettez base: '/'.
export default defineConfig({
  plugins: [react()],
  base: '/elma-platform/',
  build: {
    outDir: 'dist',
  },
});
