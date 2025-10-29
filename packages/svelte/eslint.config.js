import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  react: false,
  svelte: true,
  jsonc: true,
  yaml: false,
  ignores: [
    'dist',
    'es',
    'lib',
    'node_modules',
    '*.md',
    'examples',
  ],
})

