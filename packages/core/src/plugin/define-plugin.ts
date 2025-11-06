/**
 * 插件定义辅助函数
 */

import type { Plugin } from '../types'

/**
 * 定义插件
 * 
 * @param plugin - 插件配置
 * @returns 插件实例
 * 
 * @example
 * ```typescript
 * export const myPlugin = definePlugin({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install(context, options) {
 *     const { engine } = context
 *     engine.state.set('myData', options)
 *   }
 * })
 * ```
 */
export function definePlugin<Options = any>(plugin: Plugin<Options>): Plugin<Options> {
  return plugin
}

