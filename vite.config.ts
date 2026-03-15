import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isProd = command === 'build'
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    // GitHub Pages 需要 /novel-spider/ 前缀，Vercel 部署在根路径
    base: process.env.GITHUB_PAGES ? '/novel-spider/' : '/',
  }
})