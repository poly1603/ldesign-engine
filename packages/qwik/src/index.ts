/**
 * Qwik 框架适配器导�? */

export { QwikAdapter, createQwikAdapter } from './adapters/qwik-adapter'
export { createEngineApp, createQwikEngineApp, unmountQwikEngineApp } from './core/engine-app'
export type { QwikEngineApp, QwikEngineAppOptions } from './core/engine-app'

// 导出辅助函数
export { getEngine } from './utils/helpers'

// 重新导出核心功能
export * from '@ldesign/engine-core'

