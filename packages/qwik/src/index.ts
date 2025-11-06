/**
 * Qwik 框架适配器导出
 */

export { QwikAdapter, createQwikAdapter } from './adapter'
export { createEngineApp, createQwikEngineApp, unmountQwikEngineApp } from './engine-app'
export type { QwikEngineApp, QwikEngineAppOptions } from './engine-app'

// 导出辅助函数
export { getEngine } from './helpers'

// 重新导出核心功能
export * from '@ldesign/engine-core'

