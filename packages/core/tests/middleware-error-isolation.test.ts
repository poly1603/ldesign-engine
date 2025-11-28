/**
 * 中间件错误隔离修复测试
 * 
 * 测试错误处理器失败不中断链
 * 测试错误上下文标记
 * 测试后续中间件继续执行
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMiddlewareManager } from '../src/middleware/middleware-manager'
import type { Middleware, MiddlewareManager, MiddlewareContext } from '../src/types'

describe('中间件错误隔离修复测试', () => {
  let middlewareManager: MiddlewareManager

  beforeEach(() => {
    middlewareManager = createMiddlewareManager()
  })

  describe('错误处理器失败不中断链', () => {
    it('错误处理器抛出异常不应该中断中间件链', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const middleware1Executed = vi.fn()
      const middleware2Executed = vi.fn()
      const middleware3Executed = vi.fn()

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          middleware1Executed()
          throw new Error('Middleware 1 failed')
        },
        async onError(error, ctx) {
          throw new Error('Error handler also failed')
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 50,
        async execute(ctx, next) {
          middleware2Executed()
          await next()
        },
      }

      const middleware3: Middleware = {
        name: 'middleware-3',
        priority: 0,
        async execute(ctx, next) {
          middleware3Executed()
          await next()
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)
      middlewareManager.use(middleware3)

      const context: MiddlewareContext = {
        data: {},
        cancelled: false,
      }

      await middlewareManager.execute(context)

      // 所有中间件都应该被执行
      expect(middleware1Executed).toHaveBeenCalled()
      expect(middleware2Executed).toHaveBeenCalled()
      expect(middleware3Executed).toHaveBeenCalled()

      consoleError.mockRestore()
    })

    it('没有错误处理器时中间件失败不应中断链', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const middleware1Executed = vi.fn()
      const middleware2Executed = vi.fn()

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          middleware1Executed()
          throw new Error('Middleware 1 failed')
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 50,
        async execute(ctx, next) {
          middleware2Executed()
          await next()
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)

      const context: MiddlewareContext = {
        data: {},
        cancelled: false,
      }

      await middlewareManager.execute(context)

      expect(middleware1Executed).toHaveBeenCalled()
      expect(middleware2Executed).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('错误上下文标记', () => {
    it('错误应该被标记到上下文中', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const middleware: Middleware = {
        name: 'failing-middleware',
        async execute(ctx, next) {
          throw new Error('Test error')
        },
      }

      middlewareManager.use(middleware)

      const context: MiddlewareContext<any> = {
        data: {},
        cancelled: false,
      }

      await middlewareManager.execute(context)

      // 错误应该被标记到上下文
      expect((context as any).error).toBeDefined()
      expect((context as any).error.message).toBe('Test error')

      consoleError.mockRestore()
    })

    it('多个中间件失败时应该保留第一个错误', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          throw new Error('Error 1')
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 50,
        async execute(ctx, next) {
          throw new Error('Error 2')
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)

      const context: MiddlewareContext<any> = {
        data: {},
        cancelled: false,
      }

      await middlewareManager.execute(context)

      // 应该保留第一个错误
      expect((context as any).error.message).toBe('Error 1')

      consoleError.mockRestore()
    })

    it('错误处理器失败时也应该标记错误', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const middleware: Middleware = {
        name: 'middleware',
        async execute(ctx, next) {
          throw new Error('Original error')
        },
        async onError(error, ctx) {
          throw new Error('Handler error')
        },
      }

      middlewareManager.use(middleware)

      const context: MiddlewareContext<any> = {
        data: {},
        cancelled: false,
      }

      await middlewareManager.execute(context)

      // 应该标记错误处理器的错误
      expect((context as any).error).toBeDefined()
      expect((context as any).error.message).toBe('Handler error')

      consoleError.mockRestore()
    })
  })

  describe('后续中间件继续执行', () => {
    it('前面的中间件失败不应阻止后续中间件执行', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const executionOrder: string[] = []

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('m1-before')
          throw new Error('Middleware 1 failed')
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 50,
        async execute(ctx, next) {
          executionOrder.push('m2-before')
          await next()
          executionOrder.push('m2-after')
        },
      }

      const middleware3: Middleware = {
        name: 'middleware-3',
        priority: 0,
        async execute(ctx, next) {
          executionOrder.push('m3-before')
          await next()
          executionOrder.push('m3-after')
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)
      middlewareManager.use(middleware3)

      await middlewareManager.execute({
        data: {},
        cancelled: false,
      })

      // 所有中间件都应该执行
      expect(executionOrder).toEqual([
        'm1-before',
        'm2-before',
        'm3-before',
        'm3-after',
        'm2-after',
      ])

      consoleError.mockRestore()
    })

    it('错误处理成功后应该继续执行', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const executionOrder: string[] = []

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('m1-error')
          throw new Error('Recoverable error')
        },
        async onError(error, ctx) {
          executionOrder.push('m1-handled')
          // 错误已处理，不再抛出
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 50,
        async execute(ctx, next) {
          executionOrder.push('m2-execute')
          await next()
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)

      await middlewareManager.execute({
        data: {},
        cancelled: false,
      })

      expect(executionOrder).toContain('m1-error')
      expect(executionOrder).toContain('m1-handled')
      expect(executionOrder).toContain('m2-execute')

      consoleError.mockRestore()
    })
  })

  describe('边界情况', () => {
    it('所有中间件都失败时应该正常完成', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const middleware1: Middleware = {
        name: 'middleware-1',
        async execute(ctx, next) {
          throw new Error('Error 1')
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        async execute(ctx, next) {
          throw new Error('Error 2')
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)

      await expect(
        middlewareManager.execute({
          data: {},
          cancelled: false,
        })
      ).resolves.toBeUndefined()

      consoleError.mockRestore()
    })

    it('同步错误应该被正确捕获', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const middleware: Middleware = {
        name: 'sync-error',
        execute(ctx, next) {
          throw new Error('Sync error')
        },
      }

      middlewareManager.use(middleware)

      await expect(
        middlewareManager.execute({
          data: {},
          cancelled: false,
        })
      ).resolves.toBeUndefined()

      consoleError.mockRestore()
    })
  })

  describe('性能测试', () => {
    it('错误处理不应显著影响性能', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      for (let i = 0; i < 10; i++) {
        const middleware: Middleware = {
          name: `middleware-${i}`,
          async execute(ctx, next) {
            if (i % 2 === 0) {
              throw new Error(`Error ${i}`)
            }
            await next()
          },
        }
        middlewareManager.use(middleware)
      }

      const startTime = Date.now()

      await middlewareManager.execute({
        data: {},
        cancelled: false,
      })

      const duration = Date.now() - startTime

      // 应该在50ms内完成
      expect(duration).toBeLessThan(50)

      consoleError.mockRestore()
    })
  })
})