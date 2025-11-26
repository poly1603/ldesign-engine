/**
 * 复杂中间件链集成测试
 * 
 * 测试场景：
 * 1. 中间件执行顺序
 * 2. 异步中间件处理
 * 3. 中间件错误处理和传播
 * 4. 中间件上下文传递
 * 5. 中间件优先级管理
 * 6. 条件中间件执行
 * 7. 中间件性能测试
 * 8. 中间件组合和嵌套
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Middleware, MiddlewareContext } from '../../src/types'
import { CoreMiddlewareManager } from '../../src/middleware/middleware-manager'

describe('复杂中间件链集成测试', () => {
  let middlewareManager: CoreMiddlewareManager
  let mockContext: MiddlewareContext

  beforeEach(() => {
    mockContext = {
      data: {},
      metadata: {},
      cancelled: false,
    }
    middlewareManager = new CoreMiddlewareManager()
  })

  describe('中间件执行顺序', () => {
    it('应该按照注册顺序执行中间件', async () => {
      const executionOrder: string[] = []

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('middleware-1-before')
          await next()
          executionOrder.push('middleware-1-after')
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('middleware-2-before')
          await next()
          executionOrder.push('middleware-2-after')
        },
      }

      const middleware3: Middleware = {
        name: 'middleware-3',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('middleware-3-before')
          await next()
          executionOrder.push('middleware-3-after')
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)
      middlewareManager.use(middleware3)

      await middlewareManager.execute(mockContext)

      expect(executionOrder).toEqual([
        'middleware-1-before',
        'middleware-2-before',
        'middleware-3-before',
        'middleware-3-after',
        'middleware-2-after',
        'middleware-1-after',
      ])
    })

    it('应该按照优先级执行中间件（高优先级先执行）', async () => {
      const executionOrder: string[] = []

      const lowPriority: Middleware = {
        name: 'low-priority',
        priority: 50,
        async execute(ctx, next) {
          executionOrder.push('low')
          await next()
        },
      }

      const highPriority: Middleware = {
        name: 'high-priority',
        priority: 200,
        async execute(ctx, next) {
          executionOrder.push('high')
          await next()
        },
      }

      const mediumPriority: Middleware = {
        name: 'medium-priority',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('medium')
          await next()
        },
      }

      middlewareManager.use(lowPriority)
      middlewareManager.use(highPriority)
      middlewareManager.use(mediumPriority)

      await middlewareManager.execute(mockContext)

      expect(executionOrder).toEqual(['high', 'medium', 'low'])
    })

    it('应该支持中间件的洋葱模型执行', async () => {
      const events: string[] = []

      const authMiddleware: Middleware<Record<string, unknown>> = {
        name: 'auth',
        priority: 300,
        async execute(ctx, next) {
          events.push('auth-start')
          ctx.data = { ...(ctx.data as Record<string, unknown>), user: 'alice' }
          await next()
          events.push('auth-end')
        },
      }

      const loggerMiddleware: Middleware = {
        name: 'logger',
        priority: 200,
        async execute(ctx, next) {
          events.push('logger-start')
          const startTime = Date.now()
          await next()
          const duration = Date.now() - startTime
          events.push(`logger-end-${duration >= 0 ? 'ok' : 'error'}`)
        },
      }

      const handlerMiddleware: Middleware<Record<string, unknown>> = {
        name: 'handler',
        priority: 100,
        async execute(ctx, next) {
          events.push('handler-execute')
          ctx.data = { ...(ctx.data as Record<string, unknown>), status: 200, body: 'OK' }
          await next()
        },
      }

      middlewareManager.use(authMiddleware)
      middlewareManager.use(loggerMiddleware)
      middlewareManager.use(handlerMiddleware)

      await middlewareManager.execute(mockContext)

      expect(events[0]).toBe('auth-start')
      expect(events[1]).toBe('logger-start')
      expect(events[2]).toBe('handler-execute')
      expect(events[3]).toContain('logger-end')
      expect(events[4]).toBe('auth-end')
    })
  })

  describe('异步中间件处理', () => {
    it('应该正确处理异步中间件', async () => {
      const results: string[] = []

      const asyncMiddleware1: Middleware = {
        name: 'async-1',
        priority: 100,
        async execute(ctx, next) {
          results.push('async-1-start')
          await new Promise(resolve => setTimeout(resolve, 50))
          results.push('async-1-delayed')
          await next()
          results.push('async-1-end')
        },
      }

      const asyncMiddleware2: Middleware = {
        name: 'async-2',
        priority: 100,
        async execute(ctx, next) {
          results.push('async-2-start')
          await new Promise(resolve => setTimeout(resolve, 30))
          results.push('async-2-delayed')
          await next()
          results.push('async-2-end')
        },
      }

      middlewareManager.use(asyncMiddleware1)
      middlewareManager.use(asyncMiddleware2)

      await middlewareManager.execute(mockContext)

      expect(results).toEqual([
        'async-1-start',
        'async-1-delayed',
        'async-2-start',
        'async-2-delayed',
        'async-2-end',
        'async-1-end',
      ])
    })

    it('应该支持并行异步操作', async () => {
      const results: string[] = []

      const parallelMiddleware: Middleware = {
        name: 'parallel',
        priority: 100,
        async execute(ctx, next) {
          results.push('parallel-start')

          await Promise.all([
            (async () => {
              await new Promise(resolve => setTimeout(resolve, 30))
              results.push('task-1')
            })(),
            (async () => {
              await new Promise(resolve => setTimeout(resolve, 20))
              results.push('task-2')
            })(),
            (async () => {
              await new Promise(resolve => setTimeout(resolve, 10))
              results.push('task-3')
            })(),
          ])

          await next()
          results.push('parallel-end')
        },
      }

      middlewareManager.use(parallelMiddleware)

      await middlewareManager.execute(mockContext)

      expect(results[0]).toBe('parallel-start')
      expect(results.slice(1, 4)).toContain('task-1')
      expect(results.slice(1, 4)).toContain('task-2')
      expect(results.slice(1, 4)).toContain('task-3')
      expect(results[4]).toBe('parallel-end')
    })

    it('应该处理异步中间件中的超时', async () => {
      const timeout = 100
      let timeoutOccurred = false

      const timeoutMiddleware: Middleware = {
        name: 'timeout',
        priority: 100,
        async execute(ctx, next) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              timeoutOccurred = true
              reject(new Error('Middleware timeout'))
            }, timeout)
          })

          const executePromise = next()

          try {
            await Promise.race([executePromise, timeoutPromise])
          } catch (error) {
            if (error instanceof Error && error.message === 'Middleware timeout') {
              throw error
            }
          }
        },
      }

      const slowMiddleware: Middleware = {
        name: 'slow',
        priority: 100,
        async execute(ctx, next) {
          await new Promise(resolve => setTimeout(resolve, 200))
          await next()
        },
      }

      middlewareManager.use(timeoutMiddleware)
      middlewareManager.use(slowMiddleware)

      await expect(middlewareManager.execute(mockContext)).rejects.toThrow('Middleware timeout')
      expect(timeoutOccurred).toBe(true)
    })
  })

  describe('中间件错误处理和传播', () => {
    it('应该捕获中间件中的同步错误', async () => {
      const errorMiddleware: Middleware = {
        name: 'error',
        priority: 100,
        async execute(ctx, next) {
          throw new Error('Middleware error')
        },
      }

      middlewareManager.use(errorMiddleware)

      await expect(middlewareManager.execute(mockContext)).rejects.toThrow('Middleware error')
    })

    it('应该捕获中间件中的异步错误', async () => {
      const asyncErrorMiddleware: Middleware = {
        name: 'async-error',
        priority: 100,
        async execute(ctx, next) {
          await new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Async error')), 50)
          })
          await next()
        },
      }

      middlewareManager.use(asyncErrorMiddleware)

      await expect(middlewareManager.execute(mockContext)).rejects.toThrow('Async error')
    })

    it('应该支持错误恢复中间件', async () => {
      const events: string[] = []

      const errorRecoveryMiddleware: Middleware = {
        name: 'error-recovery',
        priority: 300,
        async execute(ctx, next) {
          try {
            await next()
            events.push('success')
          } catch (error) {
            events.push('error-caught')
            ctx.data = { status: 500, body: 'Error handled' }
          }
        },
      }

      const errorMiddleware: Middleware = {
        name: 'error',
        priority: 100,
        async execute(ctx, next) {
          throw new Error('Test error')
        },
      }

      middlewareManager.use(errorRecoveryMiddleware)
      middlewareManager.use(errorMiddleware)

      await middlewareManager.execute(mockContext)

      expect(events).toContain('error-caught')
      expect(mockContext.data).toEqual({ status: 500, body: 'Error handled' })
    })

    it('应该传播错误到外层中间件', async () => {
      const events: string[] = []

      const outerMiddleware: Middleware = {
        name: 'outer',
        priority: 300,
        async execute(ctx, next) {
          events.push('outer-start')
          try {
            await next()
            events.push('outer-success')
          } catch (error) {
            events.push('outer-catch')
            throw error
          }
        },
      }

      const middleMiddleware: Middleware = {
        name: 'middle',
        priority: 200,
        async execute(ctx, next) {
          events.push('middle-start')
          await next()
          events.push('middle-end')
        },
      }

      const errorMiddleware: Middleware = {
        name: 'error',
        priority: 100,
        async execute(ctx, next) {
          events.push('error-throw')
          throw new Error('Inner error')
        },
      }

      middlewareManager.use(outerMiddleware)
      middlewareManager.use(middleMiddleware)
      middlewareManager.use(errorMiddleware)

      await expect(middlewareManager.execute(mockContext)).rejects.toThrow('Inner error')

      expect(events).toEqual([
        'outer-start',
        'middle-start',
        'error-throw',
        'outer-catch',
      ])
    })
  })

  describe('中间件上下文传递', () => {
    it('应该在中间件之间传递上下文', async () => {
      const middleware1: Middleware<Record<string, unknown>> = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          ctx.data = { ...(ctx.data as Record<string, unknown>), step1: 'completed' }
          await next()
        },
      }

      const middleware2: Middleware<Record<string, unknown>> = {
        name: 'middleware-2',
        priority: 100,
        async execute(ctx, next) {
          expect(ctx.data).toHaveProperty('step1', 'completed')
          ctx.data = { ...(ctx.data as Record<string, unknown>), step2: 'completed' }
          await next()
        },
      }

      const middleware3: Middleware<Record<string, unknown>> = {
        name: 'middleware-3',
        priority: 100,
        async execute(ctx, next) {
          expect(ctx.data).toHaveProperty('step1', 'completed')
          expect(ctx.data).toHaveProperty('step2', 'completed')
          ctx.data = { ...(ctx.data as Record<string, unknown>), step3: 'completed' }
          await next()
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)
      middlewareManager.use(middleware3)

      await middlewareManager.execute(mockContext)

      expect(mockContext.data).toEqual({
        step1: 'completed',
        step2: 'completed',
        step3: 'completed',
      })
    })

    it('应该支持在中间件中修改元数据', async () => {
      const metadataMiddleware: Middleware = {
        name: 'metadata',
        priority: 200,
        async execute(ctx, next) {
          ctx.metadata = {
            ...ctx.metadata,
            timestamp: Date.now(),
            user: 'alice',
          }
          await next()
        },
      }

      const handlerMiddleware: Middleware = {
        name: 'handler',
        priority: 100,
        async execute(ctx, next) {
          expect(ctx.metadata).toHaveProperty('timestamp')
          expect(ctx.metadata).toHaveProperty('user', 'alice')
          ctx.data = { message: 'Success', user: ctx.metadata?.user }
          await next()
        },
      }

      middlewareManager.use(metadataMiddleware)
      middlewareManager.use(handlerMiddleware)

      await middlewareManager.execute(mockContext)

      expect(mockContext.data).toEqual({
        message: 'Success',
        user: 'alice',
      })
      expect(mockContext.metadata).toHaveProperty('user', 'alice')
    })
  })

  describe('中间件优先级管理', () => {
    it('应该正确处理不同优先级的中间件', async () => {
      const executionOrder: number[] = []

      const priorities = [300, 100, 500, 200, 400]

      priorities.forEach((priority) => {
        const middleware: Middleware = {
          name: `middleware-${priority}`,
          priority,
          async execute(ctx, next) {
            executionOrder.push(priority)
            await next()
          },
        }
        middlewareManager.use(middleware)
      })

      await middlewareManager.execute(mockContext)

      expect(executionOrder).toEqual([500, 400, 300, 200, 100])
    })

    it('应该处理相同优先级的中间件（按注册顺序）', async () => {
      const executionOrder: string[] = []

      const middleware1: Middleware = {
        name: 'middleware-1',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('middleware-1')
          await next()
        },
      }

      const middleware2: Middleware = {
        name: 'middleware-2',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('middleware-2')
          await next()
        },
      }

      const middleware3: Middleware = {
        name: 'middleware-3',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('middleware-3')
          await next()
        },
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)
      middlewareManager.use(middleware3)

      await middlewareManager.execute(mockContext)

      expect(executionOrder).toEqual(['middleware-1', 'middleware-2', 'middleware-3'])
    })
  })

  describe('条件中间件执行', () => {
    it('应该支持中间件取消后续执行', async () => {
      const executionOrder: string[] = []

      const cancelMiddleware: Middleware = {
        name: 'cancel',
        priority: 200,
        async execute(ctx, next) {
          executionOrder.push('cancel-middleware')
          ctx.cancelled = true
          await next()
        },
      }

      const shouldNotExecute: Middleware = {
        name: 'should-not-execute',
        priority: 100,
        async execute(ctx, next) {
          executionOrder.push('should-not-execute')
          await next()
        },
      }

      middlewareManager.use(cancelMiddleware)
      middlewareManager.use(shouldNotExecute)

      await middlewareManager.execute(mockContext)

      expect(executionOrder).toEqual(['cancel-middleware'])
      expect(mockContext.cancelled).toBe(true)
    })
  })

  describe('中间件性能测试', () => {
    it('应该高效处理大量中间件', async () => {
      let executedCount = 0

      for (let i = 0; i < 100; i++) {
        const middleware: Middleware = {
          name: `middleware-${i}`,
          priority: 100,
          async execute(ctx, next) {
            executedCount++
            await next()
          },
        }
        middlewareManager.use(middleware)
      }

      const startTime = Date.now()
      await middlewareManager.execute(mockContext)
      const duration = Date.now() - startTime

      expect(executedCount).toBe(100)
      expect(duration).toBeLessThan(1000)
    })
  })
})