/**
 * Vue3 组合式 API 导出
 */

// New unified API
export {
  useEngine,
  usePlugin,
  useEngineEvent,
  useEngineState,
  useEngineConfig,
  useEngineLogger,
  useEngineStatus,
  ENGINE_INJECTION_KEY
} from './use-engine'

// Legacy exports (if they exist)
export * from './useEngine'
export * from './useEvents'
export * from './useState'
export * from './useCache'
export * from './useComputed'

