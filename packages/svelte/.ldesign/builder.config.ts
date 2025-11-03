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
      name: 'LDesignEngineSvelte',
      fileName: 'index.js',
      input: 'src/index.ts',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  typescript: {
    tsconfig: 'tsconfig.build.json',
  },

  external: ['svelte', 'svelte/store', '@ldesign/engine-core'],
  globals: {
    'svelte': 'Svelte',
    '@ldesign/engine-core': 'LDesignEngineCore'
  },
})


