/**
 * Qwik Engine 示例 - Launcher 配置
 */
import { defineConfig } from '@ldesign/launcher'
import { qwikVite } from '@builder.io/qwik/optimizer'

export default defineConfig({
  plugins: [
    qwikVite({
      client: {
        devInput: './src/entry.dev.tsx',
      },
    }),
  ],

  server: {
    port: 3000,
    host: 'localhost',
    open: true,
  },

  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
  },

  resolve: {
    alias: [
      { find: '@', replacement: './src' },
    ],
  },

  launcher: {
    logLevel: 'info',
  },
})

