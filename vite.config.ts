import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isProd = command === 'build'
  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    base: isProd ? '/novel-spider/' : '/',
  }
})