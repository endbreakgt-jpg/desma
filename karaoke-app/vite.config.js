import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // LAN内の他のデバイス（タブレットなど）からアクセス可能にする
    port: 5173,
  }
})
