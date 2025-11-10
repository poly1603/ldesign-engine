/**
 * @ldesign/engine-react
 * 
 * React 适配器包 - �?React 应用提供核心引擎集成
 * 
 * @example
 * ```typescript
 * import { createEngineApp, useEngine, useEngineState } from '@ldesign/engine-react'
 * import App from './App'
 * 
 * // 创建引擎应用
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: { name: 'My App', debug: true }
 * })
 * 
 * // 在组件中使用
 * function MyComponent() {
 *   const engine = useEngine()
 *   const count = useEngineState('count', 0)
 *   
 *   return <div>Count: {count}</div>
 * }
 * ```
 * 
 * @module @ldesign/engine-react
 */

// 导出适配�?export * from './adapters/react-adapter'

// 导出引擎应用创建函数
export * from './core/engine-app'

// 导出 React hooks
export * from './hooks'

// 重新导出核心功能
export * from '@ldesign/engine-core'

