import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {        
        assetFileNames: '[name][extname]', // Keep original name for assets (CSS, images, fonts)
      },
    },
  },  
});
