import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapter/qwik-adapter': 'src/adapter/qwik-adapter.ts',
    'hooks/use-engine': 'src/hooks/use-engine.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['@builder.io/qwik', '@ldesign/engine-core'],
  treeshake: true,
  splitting: false,
})

