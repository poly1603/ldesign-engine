/**
 * Preact 框架适配器导�? */

export { PreactAdapter, createPreactAdapter } from './adapters/preact-adapter'
export { createEngineApp, createPreactEngineApp, unmountPreactEngineApp } from './core/engine-app'
export type { PreactEngineApp, PreactEngineAppOptions } from './core/engine-app'
export { useEngine } from './utils/helpers'

// 重新导出核心功能
export * from '@ldesign/engine-core'

