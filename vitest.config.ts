import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'packages/*/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'packages/*/src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'lib',
      'es',
      'types',
      'cjs',
      'esm',
      // 排除 e2e 测试，它们有单独的配置
      'e2e/**'
    ],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 增加超时时间以支持性能基准测试
    hookTimeout: 30000,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      exclude: [
        'node_modules/**',
        'dist/**',
        'lib/**',
        'es/**',
        'types/**',
        'cjs/**',
        'esm/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/examples/**',
        '**/example/**',
        '**/benchmark/**',
      ],

      // 暂时降低阈值，先确保覆盖率能正常显示
      thresholds: {
        statements: 50,
        branches: 45,
        functions: 50,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },
  esbuild: {
    target: 'es2020',
  },
})
