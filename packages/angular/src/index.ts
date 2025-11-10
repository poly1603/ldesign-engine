/**
 * @ldesign/engine-angular
 * 
 * Angular adapter for LDesign Engine
 * 
 * @packageDocumentation
 */

// 导出适配�?export { AngularAdapter, createAngularAdapter } from './adapters/angular-adapter'

// 导出引擎应用创建函数
export { createEngineApp } from './core/engine-app'
export type { AngularEngineApp, AngularEngineAppOptions } from './core/engine-app'

// 导出辅助函数
export { useEngine } from './utils/helpers'

// 导出服务
export { EngineService, ENGINE_TOKEN } from './services/engine.service'

// 重新导出核心功能
export * from '@ldesign/engine-core'

