import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://98.94.139.172:8080',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://98.94.139.172:8080',
        changeOrigin: true,
      }
    }
  }
})
