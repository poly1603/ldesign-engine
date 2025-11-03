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
      name: 'LDesignEngineSolid',
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

  external: ['solid-js', 'solid-js/web', '@ldesign/engine-core'],
  globals: {
    'solid-js': 'Solid',
    'solid-js/web': 'SolidWeb',
    '@ldesign/engine-core': 'LDesignEngineCore'
  },
})


