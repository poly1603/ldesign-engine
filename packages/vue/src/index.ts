/**
 * @ldesign/engine-vue3
 *
 * Vue3 adapter for @ldesign/engine-core
 */

// 核心导出
export { Vue3EngineImpl, createEngineApp } from './engine-app'

// 适配器导出 (新增)
export * from './adapter'

// 类型导出
export type * from './types'

// 组合式 API
export * from './composables'

// 指令系统
export * from './directives'

// 版本
export const version = '0.2.0'

