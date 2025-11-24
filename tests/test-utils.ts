/**
 * 测试工具函数
 * 
 * 提供通用的测试辅助函数、mock 工厂和断言工具
 */

import type { Plugin, PluginContext } from '../packages/core/src/types'
import type { Middleware, MiddlewareContext } from '../packages/core/src/types'

/**
 * 创建测试插件
 * 
 * @param name - 插件名称
 * @param options - 插件选项
 * @returns 测试插件
 * 
 * @example
 * ```ts
 * const plugin = createTestPlugin('test-plugin', {
 *   onInstall: (context) => {
 *     context.engine.state.set('installed', true)
 *   }
 * })
 * ```
 */
export function createTestPlugin(
  name: string,
  options: {
    version?: string
    dependencies?: string[]
    onInstall?: (context: PluginContext) => void | Promise<void>
    onUninstall?: (context: PluginContext) => void | Promise<void>
  } = {},
): Plugin {
  return {
    name,
    version: options.version || '1.0.0',
    dependencies: options.dependencies,
    install(context) {
      if (options.onInstall) {
        return options.onInstall(context)
      }
    },
    uninstall(context) {
      if (options.onUninstall) {
        return options.onUninstall(context)
      }
    },
  }
}

/**
 * 创建测试中间件
 * 
 * @param name - 中间件名称
 * @param options - 中间件选项
 * @returns 测试中间件
 * 
 * @example
 * ```ts
 * const middleware = createTestMiddleware('test-middleware', {
 *   priority: 10,
 *   onExecute: async (context, next) => {
 *     context.data.processed = true
 *     await next()
 *   }
 * })
 * ```
 */
export function createTestMiddleware(
  name: string,
  options: {
    priority?: number
    onExecute?: (context: MiddlewareContext, next: () => Promise<void>) => Promise<void>
    onError?: (error: Error, context: MiddlewareContext) => void | Promise<void>
  } = {},
): Middleware {
  return {
    name,
    priority: options.priority,
    execute: options.onExecute || (async (context, next) => next()),
    onError: options.onError,
  }
}

/**
 * 等待指定时间
 * 
 * @param ms - 等待时间(毫秒)
 * 
 * @example
 * ```ts
 * await delay(100) // 等待 100ms
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建 spy 函数
 * 
 * @returns spy 函数和调用记录
 * 
 * @example
 * ```ts
 * const { spy, calls } = createSpy()
 * spy('arg1', 'arg2')
 * expect(calls).toHaveLength(1)
 * expect(calls[0]).toEqual(['arg1', 'arg2'])
 * ```
 */
export function createSpy<T extends any[] = any[]>() {
  const calls: T[] = []
  
  const spy = (...args: T) => {
    calls.push(args)
  }
  
  return { spy, calls }
}

/**
 * 创建异步 spy 函数
 * 
 * @returns async spy 函数和调用记录
 * 
 * @example
 * ```ts
 * const { spy, calls } = createAsyncSpy()
 * await spy('arg1', 'arg2')
 * expect(calls).toHaveLength(1)
 * ```
 */
export function createAsyncSpy<T extends any[] = any[]>() {
  const calls: T[] = []
  
  const spy = async (...args: T) => {
    calls.push(args)
  }
  
  return { spy, calls }
}

/**
 * 断言函数被调用
 * 
 * @param calls - 调用记录
 * @param times - 期望调用次数
 * 
 * @example
 * ```ts
 * const { spy, calls } = createSpy()
 * spy()
 * spy()
 * expectCalled(calls, 2)
 * ```
 */
export function expectCalled(calls: any[][], times: number) {
  if (calls.length !== times) {
    throw new Error(`Expected to be called ${times} times, but was called ${calls.length} times`)
  }
}

