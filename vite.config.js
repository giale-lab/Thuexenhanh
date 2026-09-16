import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // Inline small assets (<4KB) directly to avoid extra HTTP requests
    assetsInlineLimit: 4096,
    // Enable source maps for debugging (disable in production if desired)
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    rollupOptions: {
      output: {
        // Smart chunk splitting for optimal caching
        manualChunks: (id) => {
          // React + ReactDOM: rarely changes, cache forever
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // Firebase: large, rarely changes
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          // Lucide icons: medium, rarely changes
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Image compression lib
          if (id.includes('node_modules/browser-image-compression')) {
            return 'vendor-utils';
          }
        },
        // Consistent chunk file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    // Report chunk sizes
    reportCompressedSize: true,
    // Chunk size warning at 500KB
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
  }
})
