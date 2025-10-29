/**
 * @ldesign/engine-solid
 * 
 * Solid.js adapter for @ldesign/engine-core
 */

// 核心导出
export { SolidEngineImpl, createEngineApp } from './engine-app'

// 适配器导出
export * from './adapter'

// Hooks 导出
export * from './hooks'

// 组件导出
export * from './components'

// 类型导出
export type * from './types'

// 版本
export const version = '0.2.0'

