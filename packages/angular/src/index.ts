/**
 * @ldesign/engine-angular
 * 
 * Angular adapter for LDesign Engine
 * 
 * @packageDocumentation
 */

// 导出适配器
export { AngularAdapter, createAngularAdapter } from './adapter'

// 导出引擎应用创建函数
export { createEngineApp } from './engine-app'
export type { AngularEngineApp, AngularEngineAppOptions } from './engine-app'

// 导出辅助函数
export { useEngine } from './helpers'

// 导出服务
export { EngineService, ENGINE_TOKEN } from './services/engine.service'

// 重新导出核心功能
export * from '@ldesign/engine-core'

