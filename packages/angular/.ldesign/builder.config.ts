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
      name: 'LDesignEngineAngular',
      fileName: 'index.js',
      input: 'src/index.ts',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: ['@angular/core', '@ldesign/engine-core', 'rxjs', 'rxjs/operators', 'zone.js'],
  globals: {
    '@angular/core': 'ngCore',
    '@ldesign/engine-core': 'LDesignEngineCore',
    'rxjs': 'rxjs',
    'zone.js': 'Zone'
  },
})


