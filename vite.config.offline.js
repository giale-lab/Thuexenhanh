import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Config riêng để build file offline (single HTML)
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-offline',
    emptyOutDir: true,
  }
})
