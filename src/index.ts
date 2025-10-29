/**
 * @ldesign/engine - 现代化前端应用引擎
 * 
 * 这是主包的统一导出入口，聚合了所有子包的功能。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * // 导入核心引擎
 * import { createCoreEngine } from '@ldesign/engine'
 * 
 * // 导入 Vue 集成
 * import { createEngineApp } from '@ldesign/engine'
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
 * ```
 */

// ==================== 核心包导出 ====================
// 重新导出所有核心功能
export * from '@ldesign/engine-core'

// ==================== Vue 包导出 ====================
// 重新导出所有 Vue 集成功能
export * from '@ldesign/engine-vue'

// ==================== React 包导出（可选） ====================
// 如果需要 React 集成，取消注释以下行
// export * from '@ldesign/engine-react'

// ==================== Angular 包导出（可选） ====================
// 如果需要 Angular 集成，取消注释以下行
// export * from '@ldesign/engine-angular'

// ==================== 版本信息 ====================
export const version = '0.3.0'

