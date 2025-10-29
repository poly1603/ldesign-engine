/**
 * @ldesign/engine/vue - Vue 集成导出
 * 
 * 导出 Vue 3 相关的集成功能，包括组合式 API、指令等。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { createEngineApp, useEngine } from '@ldesign/engine/vue'
 * 
 * // 创建 Vue 应用
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My App',
 *     debug: true
 *   }
 * })
 * 
 * // 在组件中使用
 * const engine = useEngine()
 * ```
 */

// 重新导出 Vue 包的所有功能
export * from '@ldesign/engine-vue'

