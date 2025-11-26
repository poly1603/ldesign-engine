import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // 明确指定测试文件位置
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    // 排除源代码目录中的测试文件
    exclude: [
      'node_modules',
      'dist',
      'lib',
      'es',
      'src/**/__tests__/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // 只收集 src 目录的覆盖率
      include: ['src/**/*.{js,ts}'],
      // 排除测试文件、类型定义和配置文件
      exclude: [
        'node_modules/**',
        'dist/**',
        'lib/**',
        'es/**',
        'tests/**',
        'src/**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
})

