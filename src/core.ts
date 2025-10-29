/**
 * @ldesign/engine/core - 核心功能导出
 * 
 * 仅导出框架无关的核心功能，不包含 Vue、React 等框架集成。
 * 适用于需要轻量级引擎或非特定框架环境的场景。
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { createCoreEngine } from '@ldesign/engine/core'
 * 
 * const engine = createCoreEngine({
 *   name: 'My App',
 *   debug: true
 * })
 * 
 * await engine.init()
 * ```
 */

// 重新导出核心包的所有功能
export * from '@ldesign/engine-core'

