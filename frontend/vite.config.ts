import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// 代理目标地址:
//   - 本地开发: VITE_PROXY_TARGET 不设置 → http://localhost:3000
//   - Docker 内: 在 compose.yml 中设为 http://app:3000
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    host: true, // 允许 Docker 容器外访问 (0.0.0.0)
    port: 5173,
    watch: {
      usePolling: true, // Docker 卷挂载需要轮询检测文件变更
    },
    proxy: {
      '/graphql': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
});
