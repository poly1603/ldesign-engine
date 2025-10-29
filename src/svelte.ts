/**
 * @ldesign/engine/svelte - Svelte 集成导出
 * 
 * 导出 Svelte 相关的集成功能，包括 Stores、组件等。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { createEngineApp, engineStore } from '@ldesign/engine/svelte'
 * 
 * // 创建 Svelte 应用
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My Svelte App',
 *     debug: true
 *   }
 * })
 * 
 * // 在组件中使用
 * <script>
 *   import { engineStore } from '@ldesign/engine/svelte'
 *   const engine = $engineStore
 * </script>
 * ```
 */

// 重新导出 Svelte 包的所有功能
export * from '@ldesign/engine-svelte'

