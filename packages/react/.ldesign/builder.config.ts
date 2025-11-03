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
      name: 'LDesignEngineReact',
      fileName: 'index.js',
      input: 'src/index.ts',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: ['react', 'react-dom', '@ldesign/engine-core'],
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    '@ldesign/engine-core': 'LDesignEngineCore'
  },
})


