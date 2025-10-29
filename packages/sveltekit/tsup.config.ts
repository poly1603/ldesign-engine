import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['@sveltejs/kit', 'svelte', '@ldesign/engine-core'],
  treeshake: true,
})

