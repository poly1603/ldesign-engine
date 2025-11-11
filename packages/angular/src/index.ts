/**
 * @ldesign/engine-angular
 * 
 * Angular adapter for LDesign Engine
 * 
 * @packageDocumentation
 */

// 导出适配器
export { AngularAdapter, createAngularAdapter } from './adapters/angular-adapter'

// 导出引擎应用创建函数
export { createEngineApp } from './core/engine-app'
export type { AngularEngineApp, AngularEngineAppOptions } from './core/engine-app'

// 导出辅助函数
export { useEngine } from './utils/helpers'

// 导出服务
export { EngineService, ENGINE_TOKEN } from './services/engine.service'

// 为避免打包产物重写内部依赖路径，这里不再转发导出 engine-core 的运行时代码
// 如需使用核心能力，请直接从 '@ldesign/engine-core' 导入；此处仅保留 Angular 适配层导出

