import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
    umd: {
      dir: 'dist',
      name: 'LDesignEngineVue',
      fileName: 'index.js',
      input: 'src/index.ts',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: ['vue', '@ldesign/engine-core'],
  globals: {
    'vue': 'Vue',
    '@ldesign/engine-core': 'LDesignEngineCore'
  },
})


