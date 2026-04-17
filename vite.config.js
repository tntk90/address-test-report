import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/kleber-api': {
        target: 'https://lightyeardocs-devuat.datatoolscloud.net.au',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kleber-api/, '/KleberWebService/DtKleberService.svc/ProcessQueryJsonRequest'),
      },
      '/addressify-api': {
        target: 'https://api.addressify.com.au',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/addressify-api/, ''),
      },
    },
  },
})
