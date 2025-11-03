import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM and CJS builds
  {
    entry: {
      index: 'src/index.ts',
      'adapter/qwik-adapter': 'src/adapter/qwik-adapter.ts',
      'hooks/use-engine': 'src/hooks/use-engine.ts',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: false,
    sourcemap: true,
    clean: true,
    external: ['@builder.io/qwik', '@ldesign/engine-core'],
    treeshake: true,
    splitting: false,
  },
  // UMD build (single entry only)
  {
    entry: {
      'index.umd': 'src/index.ts',
    },
    format: ['iife'],
    outDir: 'dist',
    globalName: 'LDesignEngineQwik',
    dts: false,
    sourcemap: true,
    clean: false,
    external: ['@builder.io/qwik', '@ldesign/engine-core'],
    treeshake: true,
    splitting: false,
  },
])

