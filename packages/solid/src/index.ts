/**
 * @ldesign/engine-solid
 * 
 * Solid.js adapter for LDesign Engine
 * 
 * @packageDocumentation
 */

// 导出适配�?export { SolidAdapter, createSolidAdapter } from './adapters/solid-adapter'

// 导出应用创建工具
export { createEngineApp, createEngineAppSync } from './core/engine-app'
export type { SolidEngineAppConfig } from './core/engine-app'

// 导出 Solid signals 集成
export {
  EngineContext,
  useEngine,
  useEngineState,
  useEngineStateReadonly,
  useComputedState,
  useEvent,
  useLifecycle,
  usePlugin,
  emitEngineEvent,
  emitEngineEventAsync,
  executeMiddleware,
} from './signals'

// 重新导出核心类型
export type {
  CoreEngine,
  EngineConfig,
  Plugin,
  PluginContext,
  Middleware,
  MiddlewareContext,
  FrameworkAdapter,
  FrameworkInfo,
  StateAdapter,
  EventAdapter,
  Unsubscribe,
} from '@ldesign/engine-core'

