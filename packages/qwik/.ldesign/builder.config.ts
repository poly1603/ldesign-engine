import { defineConfig, LibraryType } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

  // Explicitly set to TypeScript to avoid Qwik auto-detection
  libraryType: LibraryType.TYPESCRIPT,

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
      name: 'LDesignEngineQwik',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    '@builder.io/qwik',
    '@builder.io/qwik/jsx-runtime',
    '@ldesign/engine-core',
  ],

  globals: {
    '@builder.io/qwik': 'Qwik',
    '@ldesign/engine-core': 'LDesignEngineCore',
  },
})
