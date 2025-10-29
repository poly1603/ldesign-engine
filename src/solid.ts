/**
 * @ldesign/engine/solid - Solid.js 集成导出
 * 
 * 导出 Solid.js 相关的集成功能，包括 Hooks、组件等。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { createEngineApp, useEngine } from '@ldesign/engine/solid'
 * 
 * // 创建 Solid 应用
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My Solid App',
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

// 重新导出 Solid 包的所有功能
export * from '@ldesign/engine-solid'

