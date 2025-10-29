/**
 * @ldesign/engine/react - React 集成导出
 * 
 * 导出 React 18 相关的集成功能，包括 Hooks、高阶组件等。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { createEngineApp, useEngine } from '@ldesign/engine/react'
 * 
 * // 创建 React 应用
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My React App',
 *     debug: true
 *   }
 * })
 * 
 * // 在组件中使用
 * function MyComponent() {
 *   const engine = useEngine()
 *   // ...
 * }
 * ```
 */

// 重新导出 React 包的所有功能
export * from '@ldesign/engine-react'

