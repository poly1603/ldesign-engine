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
      name: 'LDesignEnginePreact',
      fileName: 'index.js',
      input: 'src/index.ts',
    }
  },
  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
  external: ['preact', 'preact/hooks', '@ldesign/engine-core'],
  globals: {
    'preact': 'Preact',
    'preact/hooks': 'preactHooks',
    '@ldesign/engine-core': 'LDesignEngineCore'
  },
})
