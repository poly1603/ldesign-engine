/**
 * 中间件定义辅助函数
 */

import type { Middleware } from '../types'

/**
 * 定义中间件
 * 
 * @param middleware - 中间件配置
 * @returns 中间件实例
 * 
 * @example
 * ```typescript
 * export const authMiddleware = defineMiddleware({
 *   name: 'auth',
 *   priority: 100,
 *   async execute(context, next) {
 *     console.log('Before:', context)
 *     await next()
 *     console.log('After:', context)
 *   }
 * })
 * ```
 */
export function defineMiddleware<T = any>(middleware: Middleware<T>): Middleware<T> {
  return middleware
}

