/**
 * @ldesign/engine-nuxtjs
 *
 * NuxtJS adapter for @ldesign/engine-core
 */

// 引擎应用导出
export * from './engine-app'

// 适配器导出
export * from './adapter/nuxtjs-adapter'

// Composables 导出
export * from './composables/use-engine'

// 服务端导出
export * from './server'

// 类型导出
export * from './types'

// 版本
export const version = '0.2.0'

