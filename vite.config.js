import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/*.csv', '**/*.ipynb', '**/*.html', '**/*.pdf', '.venv/**', 'node_modules/**', '**/Interactive_Muni_Map.html', '**/*.pmtiles', '**/*.json', '**/*.geojson']
    }
  },
  optimizeDeps: {
    entries: ['index.html'],
    exclude: ['pmtiles']
  }
});
