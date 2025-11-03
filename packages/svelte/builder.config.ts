import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'dts'],
    dir: {
      esm: 'es',
      cjs: 'lib',
    },
  },
  external: [
    '@ldesign/engine-core',
    'svelte',
    'svelte/internal',
    'svelte/store',
    /^svelte\//,
  ],
  dts: {
    enabled: true,
  },
  sourcemap: true,
  minify: false,
})

