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
      name: 'LDesignEngineLit',
      fileName: 'index.js',
      input: 'src/index.ts',
    }
  },
  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
  external: ['lit', 'lit-html', '@ldesign/engine-core'],
  globals: {
    'lit': 'Lit',
    'lit-html': 'litHtml',
    '@ldesign/engine-core': 'LDesignEngineCore'
  },
})
