/**
 * Preact 框架适配器导出
 */

export { PreactAdapter, createPreactAdapter } from './adapter'
export { createEngineApp, createPreactEngineApp, unmountPreactEngineApp } from './engine-app'
export type { PreactEngineApp, PreactEngineAppOptions } from './engine-app'
export { useEngine } from './helpers'

// 重新导出核心功能
export * from '@ldesign/engine-core'

