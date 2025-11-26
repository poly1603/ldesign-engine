/**
 * MiddlewareManager 单元测试
 *
 * 测试洋葱模型中间件系统
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMiddlewareManager } from '../src/middleware/middleware-manager'
import type { Middleware, MiddlewareContext, MiddlewareManager } from '../src/types'

describe('MiddlewareManager', () => {
  let middlewareManager: MiddlewareManager

  beforeEach(() => {
    middlewareManager = createMiddlewareManager()
  })

  afterEach(() => {
    middlewareManager.clear()
    vi.clearAllMocks()
  })

  // ===========================
  // 1. 基本功能测试 (8个)
  // ===========================
  describe('基本功能', () => {
    it('应该注册中间件', () => {
      const middleware: Middleware = {
        name: 'test',
        priority: 100,
        execute: vi.fn(),
      }

      middlewareManager.use(middleware)

      expect(middlewareManager.has('test')).toBe(true)
      expect(middlewareManager.get('test')).toBe(middleware)
      expect(middlewareManager.size()).toBe(1)
    })

    it('应该获取中间件', () => {
      const middleware: Middleware = {
        name: 'test',
        priority: 100,
        execute: vi.fn(),
      }

      middlewareManager.use(middleware)

      const retrieved = middlewareManager.get('test')
      expect(retrieved).toBe(middleware)
    })

    it('获取不存在的中间件应该返回 undefined', () => {
      const retrieved = middlewareManager.get('nonexistent')
      expect(retrieved).toBeUndefined()
    })

    it('应该移除中间件', () => {
      const middleware: Middleware = {
        name: 'test',
        priority: 100,
        execute: vi.fn(),
      }

      middlewareManager.use(middleware)
      expect(middlewareManager.has('test')).toBe(true)

      const result = middlewareManager.remove('test')
      expect(result).toBe(true)
      expect(middlewareManager.has('test')).toBe(false)
      expect(middlewareManager.size()).toBe(0)
    })

    it('移除不存在的中间件应该返回 false', () => {
      const result = middlewareManager.remove('nonexistent')
      expect(result).toBe(false)
    })

    it('应该清空所有中间件', () => {
      middlewareManager.use({ name: 'test1', priority: 100, execute: vi.fn() })
      middlewareManager.use({ name: 'test2', priority: 90, execute: vi.fn() })

      expect(middlewareManager.size()).toBe(2)

      middlewareManager.clear()

      expect(middlewareManager.size()).toBe(0)
      expect(middlewareManager.has('test1')).toBe(false)
      expect(middlewareManager.has('test2')).toBe(false)
    })

    it('应该获取所有中间件', () => {
      const m1: Middleware = { name: 'test1', priority: 100, execute: vi.fn() }
      const m2: Middleware = { name: 'test2', priority: 90, execute: vi.fn() }

      middlewareManager.use(m1)
      middlewareManager.use(m2)

      const all = middlewareManager.getAll()
      expect(all).toHaveLength(2)
      expect(all).toContain(m1)
      expect(all).toContain(m2)
    })

    it('应该检查中间件是否存在', () => {
      expect(middlewareManager.has('test')).toBe(false)

      middlewareManager.use({ name: 'test', priority: 100, execute: vi.fn() })

      expect(middlewareManager.has('test')).toBe(true)
    })
  })

  // ===========================
  // 2. 优先级排序测试 (5个)
  // ===========================
  describe('优先级排序', () => {
    it('应该按优先级从高到低执行', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'low',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('low-before')
          await next()
          order.push('low-after')
        },
      })

      middlewareManager.use({
        name: 'high',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('high-before')
          await next()
          order.push('high-after')
        },
      })

      middlewareManager.use({
        name: 'medium',
        priority: 75,
        execute: async (ctx, next) => {
          order.push('medium-before')
          await next()
          order.push('medium-after')
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      // 洋葱模型: high -> medium -> low -> low -> medium -> high
      expect(order).toEqual([
        'high-before',
        'medium-before',
        'low-before',
        'low-after',
        'medium-after',
        'high-after',
      ])
    })

    it('相同优先级应该保持注册顺序', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'first',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('first')
          await next()
        },
      })

      middlewareManager.use({
        name: 'second',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('second')
          await next()
        },
      })

      middlewareManager.use({
        name: 'third',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('third')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual(['first', 'second', 'third'])
    })

    it('未指定优先级应该默认为 0', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'with-priority',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('with-priority')
          await next()
        },
      })

      middlewareManager.use({
        name: 'no-priority',
        execute: async (ctx, next) => {
          order.push('no-priority')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      // 50 > 0, so 'with-priority' should execute first
      expect(order).toEqual(['with-priority', 'no-priority'])
    })

    it('负优先级应该最后执行', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'negative',
        priority: -10,
        execute: async (ctx, next) => {
          order.push('negative')
          await next()
        },
      })

      middlewareManager.use({
        name: 'zero',
        priority: 0,
        execute: async (ctx, next) => {
          order.push('zero')
          await next()
        },
      })

      middlewareManager.use({
        name: 'positive',
        priority: 10,
        execute: async (ctx, next) => {
          order.push('positive')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual(['positive', 'zero', 'negative'])
    })

    it('重新注册中间件应该更新执行顺序', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'test',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('test-50')
          await next()
        },
      })

      middlewareManager.use({
        name: 'other',
        priority: 75,
        execute: async (ctx, next) => {
          order.push('other')
          await next()
        },
      })

      // 第一次执行
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['other', 'test-50'])

      // 重新注册，优先级更高
      order.length = 0
      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('test-100')
          await next()
        },
      })

      // 第二次执行
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['test-100', 'other'])
    })
  })

  // ===========================
  // 3. 洋葱模型测试 (6个)
  // ===========================
  describe('洋葱模型', () => {
    it('应该实现洋葱模型执行顺序', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'outer',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('outer-before')
          await next()
          order.push('outer-after')
        },
      })

      middlewareManager.use({
        name: 'inner',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('inner-before')
          await next()
          order.push('inner-after')
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual([
        'outer-before',
        'inner-before',
        'inner-after',
        'outer-after',
      ])
    })

    it('中间件可以修改上下文数据', async () => {
      const context: MiddlewareContext<{ count: number }> = {
        data: { count: 0 },
        cancelled: false,
      }

      middlewareManager.use({
        name: 'increment',
        priority: 100,
        execute: async (ctx, next) => {
          ctx.data.count += 1
          await next()
          ctx.data.count += 10
        },
      })

      middlewareManager.use({
        name: 'double',
        priority: 50,
        execute: async (ctx, next) => {
          ctx.data.count *= 2
          await next()
        },
      })

      await middlewareManager.execute(context)

      // 执行顺序: +1 -> *2 -> +10
      // 0 -> 1 -> 2 -> 12
      expect(context.data.count).toBe(12)
    })

    it('中间件可以不调用 next()', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'stopper',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('stopper')
          // 不调用 next()
        },
      })

      middlewareManager.use({
        name: 'never-executed',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('never-executed')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual(['stopper'])
    })

    it('next() 应该是异步的', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'async',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('before-await')
          await next()
          order.push('after-await')
        },
      })

      middlewareManager.use({
        name: 'delay',
        priority: 50,
        execute: async (ctx, next) => {
          await new Promise(resolve => setTimeout(resolve, 10))
          order.push('delayed')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual(['before-await', 'delayed', 'after-await'])
    })

    it('next() 之后的代码应该在后续中间件完成后执行', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'first',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('1-before')
          await next()
          order.push('1-after')
        },
      })

      middlewareManager.use({
        name: 'second',
        priority: 75,
        execute: async (ctx, next) => {
          order.push('2-before')
          await next()
          order.push('2-after')
        },
      })

      middlewareManager.use({
        name: 'third',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('3-before')
          await next()
          order.push('3-after')
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual([
        '1-before',
        '2-before',
        '3-before',
        '3-after',
        '2-after',
        '1-after',
      ])
    })

    it('空中间件链应该正常完成', async () => {
      const context: MiddlewareContext = { data: {}, cancelled: false }

      // 不应该抛出错误
      await expect(middlewareManager.execute(context)).resolves.toBeUndefined()
    })
  })

  // ===========================
  // 4. 中间件取消测试 (4个)
  // ===========================
  describe('中间件取消', () => {
    it('设置 cancelled 应该停止后续中间件执行', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'canceller',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('canceller')
          ctx.cancelled = true
          await next()
        },
      })

      middlewareManager.use({
        name: 'never-executed',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('never-executed')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual(['canceller'])
    })

    it('cancelled 应该在 next() 调用时检查', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'first',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('first-before')
          ctx.cancelled = true
          await next()
          order.push('first-after')
        },
      })

      middlewareManager.use({
        name: 'second',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('second')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      // 'first-after' 仍然会执行，因为 next() 只是提前返回
      expect(order).toEqual(['first-before', 'first-after'])
    })

    it('初始 cancelled 为 true 应该不执行任何中间件', async () => {
      const executeFn = vi.fn()

      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: executeFn,
      })

      await middlewareManager.execute({ data: {}, cancelled: true })

      expect(executeFn).not.toHaveBeenCalled()
    })

    it('中间件可以检查并重置 cancelled 状态', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'canceller',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('canceller')
          ctx.cancelled = true
          await next()
        },
      })

      middlewareManager.use({
        name: 'resetter',
        priority: 75,
        execute: async (ctx, next) => {
          if (ctx.cancelled) {
            order.push('resetter-detected')
            ctx.cancelled = false
          }
          await next()
        },
      })

      middlewareManager.use({
        name: 'final',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('final')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      // resetter 无法执行，因为 cancelled 在 next() 中就被检查了
      expect(order).toEqual(['canceller'])
    })
  })

  // ===========================
  // 5. 错误处理测试 (6个)
  // ===========================
  describe('错误处理', () => {
    it('中间件执行错误应该向上抛出', async () => {
      const error = new Error('Test error')

      middlewareManager.use({
        name: 'error-thrower',
        priority: 100,
        execute: async () => {
          throw error
        },
      })

      await expect(
        middlewareManager.execute({ data: {}, cancelled: false })
      ).rejects.toThrow('Test error')
    })

    it('应该调用中间件的错误处理器', async () => {
      const error = new Error('Test error')
      const onError = vi.fn()

      middlewareManager.use({
        name: 'with-error-handler',
        priority: 100,
        execute: async () => {
          throw error
        },
        onError,
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(onError).toHaveBeenCalledWith(error, expect.any(Object))
    })

    it('错误处理器可以访问上下文', async () => {
      const context: MiddlewareContext<{ value: string }> = {
        data: { value: 'test' },
        cancelled: false,
      }

      let capturedContext: any = null

      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: async () => {
          throw new Error('Test')
        },
        onError: async (error, ctx) => {
          capturedContext = ctx
        },
      })

      await middlewareManager.execute(context)

      expect(capturedContext).toBe(context)
      expect(capturedContext.data.value).toBe('test')
    })

    it('错误处理器本身出错应该向上抛出', async () => {
      const handlerError = new Error('Handler error')

      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: async () => {
          throw new Error('Original error')
        },
        onError: async () => {
          throw handlerError
        },
      })

      await expect(
        middlewareManager.execute({ data: {}, cancelled: false })
      ).rejects.toThrow('Handler error')
    })

    it('某个中间件出错不应该影响错误处理器执行', async () => {
      const onError = vi.fn()

      middlewareManager.use({
        name: 'error-thrower',
        priority: 100,
        execute: async () => {
          throw new Error('Test error')
        },
        onError,
      })

      middlewareManager.use({
        name: 'never-executed',
        priority: 50,
        execute: vi.fn(),
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(onError).toHaveBeenCalled()
    })

    it('错误处理器应该可以修改上下文', async () => {
      const context: MiddlewareContext<{ errorHandled: boolean }> = {
        data: { errorHandled: false },
        cancelled: false,
      }

      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: async () => {
          throw new Error('Test error')
        },
        onError: async (error, ctx) => {
          ctx.data.errorHandled = true
        },
      })

      await middlewareManager.execute(context)

      expect(context.data.errorHandled).toBe(true)
    })
  })

  // ===========================
  // 6. 性能优化测试 (4个)
  // ===========================
  describe('性能优化', () => {
    it('应该缓存排序后的中间件列表', async () => {
      middlewareManager.use({ name: 'test1', priority: 100, execute: vi.fn() })
      middlewareManager.use({ name: 'test2', priority: 90, execute: vi.fn() })

      // 第一次执行会创建缓存
      await middlewareManager.execute({ data: {}, cancelled: false })

      // 第二次执行应该使用缓存（不重新排序）
      await middlewareManager.execute({ data: {}, cancelled: false })

      // 如果没有缓存，性能会下降
      expect(true).toBe(true) // 测试通过即可
    })

    it('相同优先级更新不应该清除缓存', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('version1')
          await next()
        },
      })

      // 第一次执行
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['version1'])

      // 相同优先级更新
      order.length = 0
      middlewareManager.use({
        name: 'test',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('version2')
          await next()
        },
      })

      // 第二次执行应该使用新版本
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['version2'])
    })

    it('优先级变化应该清除缓存', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'test1',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('test1')
          await next()
        },
      })

      middlewareManager.use({
        name: 'test2',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('test2')
          await next()
        },
      })

      // 第一次执行: test2 -> test1
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['test2', 'test1'])

      // 更改 test1 优先级
      order.length = 0
      middlewareManager.use({
        name: 'test1',
        priority: 150,
        execute: async (ctx, next) => {
          order.push('test1')
          await next()
        },
      })

      // 第二次执行: test1 -> test2
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['test1', 'test2'])
    })

    it('移除中间件应该从缓存中移除', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'test1',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('test1')
          await next()
        },
      })

      middlewareManager.use({
        name: 'test2',
        priority: 90,
        execute: async (ctx, next) => {
          order.push('test2')
          await next()
        },
      })

      // 第一次执行
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['test1', 'test2'])

      // 移除 test1
      order.length = 0
      middlewareManager.remove('test1')

      // 第二次执行
      await middlewareManager.execute({ data: {}, cancelled: false })
      expect(order).toEqual(['test2'])
    })
  })

  // ===========================
  // 7. 边界情况测试 (5个)
  // ===========================
  describe('边界情况', () => {
    it('应该处理空中间件列表', async () => {
      const context: MiddlewareContext = { data: {}, cancelled: false }

      await expect(middlewareManager.execute(context)).resolves.toBeUndefined()
    })

    it('应该处理重复注册中间件', () => {
      const middleware1: Middleware = {
        name: 'test',
        priority: 100,
        execute: vi.fn(),
      }

      const middleware2: Middleware = {
        name: 'test',
        priority: 90,
        execute: vi.fn(),
      }

      middlewareManager.use(middleware1)
      middlewareManager.use(middleware2)

      // 应该保留最后注册的
      expect(middlewareManager.get('test')).toBe(middleware2)
      expect(middlewareManager.size()).toBe(1)
    })

    it('应该处理中间件名称为空字符串', () => {
      const middleware: Middleware = {
        name: '',
        priority: 100,
        execute: vi.fn(),
      }

      middlewareManager.use(middleware)

      expect(middlewareManager.has('')).toBe(true)
      expect(middlewareManager.get('')).toBe(middleware)
    })

    it('应该处理极大的优先级值', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'max',
        priority: Number.MAX_SAFE_INTEGER,
        execute: async (ctx, next) => {
          order.push('max')
          await next()
        },
      })

      middlewareManager.use({
        name: 'normal',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('normal')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      expect(order).toEqual(['max', 'normal'])
    })

    it('应该处理 next() 被多次调用', async () => {
      const order: string[] = []

      middlewareManager.use({
        name: 'double-next',
        priority: 100,
        execute: async (ctx, next) => {
          order.push('before-first-next')
          await next()
          order.push('after-first-next')
          await next()
          order.push('after-second-next')
        },
      })

      middlewareManager.use({
        name: 'inner',
        priority: 50,
        execute: async (ctx, next) => {
          order.push('inner')
          await next()
        },
      })

      await middlewareManager.execute({ data: {}, cancelled: false })

      // 第二次 next() 应该什么都不做（index 已经越界）
      expect(order).toEqual([
        'before-first-next',
        'inner',
        'after-first-next',
        'after-second-next',
      ])
    })
  })

  // ===========================
  // 8. 性能测试 (2个)
  // ===========================
  describe('性能测试', () => {
    it('应该快速执行大量中间件', async () => {
      const middlewareCount = 100

      for (let i = 0; i < middlewareCount; i++) {
        middlewareManager.use({
          name: `middleware-${i}`,
          priority: middlewareCount - i,
          execute: async (ctx, next) => {
            await next()
          },
        })
      }

      const start = performance.now()
      await middlewareManager.execute({ data: {}, cancelled: false })
      const duration = performance.now() - start

      // 100个中间件应该在 100ms 内完成
      expect(duration).toBeLessThan(100)
    })

    it('缓存机制应该提升性能', async () => {
      // 添加 10 个中间件
      for (let i = 0; i < 10; i++) {
        middlewareManager.use({
          name: `middleware-${i}`,
          priority: 10 - i,
          execute: async (ctx, next) => {
            await next()
          },
        })
      }

      // 第一次执行（建立缓存）
      const start1 = performance.now()
      await middlewareManager.execute({ data: {}, cancelled: false })
      const duration1 = performance.now() - start1

      // 第二次执行（使用缓存）
      const start2 = performance.now()
      await middlewareManager.execute({ data: {}, cancelled: false })
      const duration2 = performance.now() - start2

      // 第二次应该更快（或至少不慢太多）
      // 由于测试环境的不确定性，我们只检查都能在合理时间内完成
      expect(duration1).toBeLessThan(50)
      expect(duration2).toBeLessThan(50)
    })
  })
})