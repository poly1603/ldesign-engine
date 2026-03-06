/**
 * 中间件注册组合式 API
 *
 * 提供在组件中注册中间件并自动清理的能力
 *
 * @module composables/use-middleware
 */

import { onUnmounted } from 'vue'
import type { Middleware, MiddlewareContext } from '@ldesign/engine-core'
import { useEngine } from './use-engine'

/**
 * 中间件注册返回值
 */
export interface UseMiddlewareRegisterReturn {
  /** 注册中间件（组件卸载时自动移除） */
  register: (middleware: Middleware) => void
  /** 手动移除中间件 */
  remove: (name: string) => boolean
  /** 执行中间件链 */
  execute: <T = unknown>(context: MiddlewareContext<T>) => Promise<void>
  /** 获取所有中间件 */
  getAll: () => Middleware[]
  /** 获取中间件数量 */
  size: () => number
}

/**
 * 使用中间件注册
 *
 * 在组件中注册的中间件会在组件卸载时自动移除，防止内存泄漏
 *
 * @returns 中间件注册和执行方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMiddlewareRegister } from '@ldesign/engine-vue3'
 *
 * const { register, execute } = useMiddlewareRegister()
 *
 * // 注册中间件（组件卸载时自动移除）
 * register({
 *   name: 'auth-check',
 *   priority: 100,
 *   async execute(ctx, next) {
 *     if (!ctx.data.token) {
 *       ctx.cancelled = true
 *       return
 *     }
 *     await next()
 *   }
 * })
 *
 * // 执行中间件链
 * await execute({ data: { token: '...' } })
 * </script>
 * ```
 */
export function useMiddlewareRegister(): UseMiddlewareRegisterReturn {
  const engine = useEngine()

  // 追踪本组件注册的中间件名称
  const registeredNames: string[] = []

  const register = (middleware: Middleware): void => {
    engine.middleware.use(middleware)
    registeredNames.push(middleware.name)
  }

  const remove = (name: string): boolean => {
    const idx = registeredNames.indexOf(name)
    if (idx !== -1) {
      registeredNames.splice(idx, 1)
    }
    return engine.middleware.remove(name)
  }

  const execute = <T = unknown>(context: MiddlewareContext<T>): Promise<void> => {
    return engine.middleware.execute(context)
  }

  // 组件卸载时自动移除所有本组件注册的中间件
  onUnmounted(() => {
    for (const name of registeredNames) {
      engine.middleware.remove(name)
    }
  })

  return {
    register,
    remove,
    execute,
    getAll: () => engine.middleware.getAll(),
    size: () => engine.middleware.size(),
  }
}
