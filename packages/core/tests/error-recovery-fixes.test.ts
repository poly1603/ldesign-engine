/**
 * 错误恢复机制修复测试
 * 
 * 测试 wrapError 和 wrapAsyncError 正确传递 cause
 * 验证错误链完整性
 */

import { describe, it, expect } from 'vitest'
import {
  wrapError,
  wrapAsyncError,
  EngineError,
  PluginError,
  StateError,
  ErrorCode,
  ErrorCategory,
} from '../src/errors/engine-error'

describe('错误恢复机制修复测试', () => {
  describe('wrapError - 同步错误包装', () => {
    it('应该正确传递原始错误作为 cause', () => {
      const originalError = new Error('Original error message')
      const fn = () => {
        throw originalError
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.cause).toBe(originalError)
        expect(engineError.message).toBe('Original error message')
      }
    })

    it('应该正确传递非 Error 对象作为错误信息', () => {
      const fn = () => {
        throw 'String error'
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toBe('String error')
        expect(engineError.cause).toBeUndefined()
      }
    })

    it('应该保留已经是 EngineError 的错误', () => {
      const originalError = new PluginError(
        'Plugin failed',
        ErrorCode.PLUGIN_INSTALL_FAILED,
        {
          details: { pluginName: 'test-plugin' },
        }
      )

      const fn = () => {
        throw originalError
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBe(originalError)
        expect(error).toBeInstanceOf(PluginError)
      }
    })

    it('应该支持自定义错误类型', () => {
      const originalError = new Error('State update failed')
      const fn = () => {
        throw originalError
      }

      const wrapped = wrapError(fn, StateError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(StateError)
        const stateError = error as StateError
        expect(stateError.cause).toBe(originalError)
        expect(stateError.category).toBe(ErrorCategory.STATE)
      }
    })

    it('应该正确传递函数参数', () => {
      const fn = (a: number, b: number) => {
        if (a + b > 10) {
          throw new Error('Sum too large')
        }
        return a + b
      }

      const wrapped = wrapError(fn, EngineError)

      // 正常情况
      expect(wrapped(2, 3)).toBe(5)

      // 错误情况
      try {
        wrapped(6, 7)
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        expect((error as EngineError).cause).toBeInstanceOf(Error)
      }
    })
  })

  describe('wrapAsyncError - 异步错误包装', () => {
    it('应该正确传递原始错误作为 cause', async () => {
      const originalError = new Error('Async error message')
      const fn = async () => {
        throw originalError
      }

      const wrapped = wrapAsyncError(fn, EngineError)

      try {
        await wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.cause).toBe(originalError)
        expect(engineError.message).toBe('Async error message')
      }
    })

    it('应该正确处理 Promise 拒绝', async () => {
      const originalError = new Error('Promise rejected')
      const fn = async () => {
        return Promise.reject(originalError)
      }

      const wrapped = wrapAsyncError(fn, PluginError)

      try {
        await wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(PluginError)
        const pluginError = error as PluginError
        expect(pluginError.cause).toBe(originalError)
      }
    })

    it('应该保留已经是 EngineError 的错误', async () => {
      const originalError = new StateError(
        'State error',
        ErrorCode.STATE_UPDATE_FAILED
      )

      const fn = async () => {
        throw originalError
      }

      const wrapped = wrapAsyncError(fn, EngineError)

      try {
        await wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBe(originalError)
        expect(error).toBeInstanceOf(StateError)
      }
    })

    it('应该正确处理非 Error 对象', async () => {
      const fn = async () => {
        throw { code: 'CUSTOM_ERROR', message: 'Custom error' }
      }

      const wrapped = wrapAsyncError(fn, EngineError)

      try {
        await wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toContain('[object Object]')
        expect(engineError.cause).toBeUndefined()
      }
    })

    it('应该正确传递异步函数参数', async () => {
      const fn = async (delay: number, shouldFail: boolean) => {
        await new Promise(resolve => setTimeout(resolve, delay))
        if (shouldFail) {
          throw new Error('Async operation failed')
        }
        return 'success'
      }

      const wrapped = wrapAsyncError(fn, EngineError)

      // 正常情况
      const result = await wrapped(10, false)
      expect(result).toBe('success')

      // 错误情况
      try {
        await wrapped(10, true)
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        expect((error as EngineError).cause).toBeInstanceOf(Error)
      }
    })
  })

  describe('错误链完整性', () => {
    it('应该保持多层错误链', () => {
      const rootError = new Error('Root cause')
      const middleError = new PluginError(
        'Plugin error',
        ErrorCode.PLUGIN_INSTALL_FAILED,
        { cause: rootError }
      )

      const fn = () => {
        throw middleError
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        // 应该保留原始的 PluginError
        expect(error).toBe(middleError)
        expect((error as PluginError).cause).toBe(rootError)
      }
    })

    it('应该在 JSON 序列化中包含 cause', () => {
      const originalError = new Error('Original error')
      originalError.stack = 'Original stack trace'

      const fn = () => {
        throw originalError
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const json = engineError.toJSON()

        expect(json.cause).toBeDefined()
        expect(json.cause.name).toBe('Error')
        expect(json.cause.message).toBe('Original error')
        expect(json.cause.stack).toBe('Original stack trace')
      }
    })

    it('应该在 toString 中显示 cause', () => {
      const originalError = new Error('Original error message')
      const fn = () => {
        throw originalError
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const str = engineError.toString()

        expect(str).toContain('Caused by: Original error message')
      }
    })

    it('应该正确处理 cause 为 undefined 的情况', () => {
      const engineError = new EngineError(
        'Error without cause',
        ErrorCode.UNKNOWN
      )

      expect(engineError.cause).toBeUndefined()

      const json = engineError.toJSON()
      expect(json.cause).toBeUndefined()

      const str = engineError.toString()
      expect(str).not.toContain('Caused by')
    })
  })

  describe('边界情况', () => {
    it('应该处理 null 错误', () => {
      const fn = () => {
        throw null
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toBe('null')
        expect(engineError.cause).toBeUndefined()
      }
    })

    it('应该处理 undefined 错误', () => {
      const fn = () => {
        throw undefined
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toBe('undefined')
        expect(engineError.cause).toBeUndefined()
      }
    })

    it('应该处理数字错误', () => {
      const fn = () => {
        throw 404
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toBe('404')
        expect(engineError.cause).toBeUndefined()
      }
    })

    it('应该处理循环引用的错误对象', () => {
      const circularError: any = new Error('Circular error')
      circularError.self = circularError

      const fn = () => {
        throw circularError
      }

      const wrapped = wrapError(fn, EngineError)

      try {
        wrapped()
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.cause).toBe(circularError)
        
        // JSON 序列化应该处理循环引用
        expect(() => {
          engineError.toJSON()
        }).not.toThrow()
      }
    })
  })

  describe('性能测试', () => {
    it('包装函数不应显著影响性能', () => {
      const fn = (n: number) => {
        if (n < 0) {
          throw new Error('Negative number')
        }
        return n * 2
      }

      const wrapped = wrapError(fn, EngineError)

      const iterations = 10000
      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        wrapped(i)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // 10000 次调用应该在 100ms 内完成
      expect(duration).toBeLessThan(100)
    })

    it('异步包装函数应该支持高并发', async () => {
      const fn = async (id: number) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return id
      }

      const wrapped = wrapAsyncError(fn, EngineError)

      const concurrency = 100
      const startTime = Date.now()

      const results = await Promise.all(
        Array.from({ length: concurrency }, (_, i) => wrapped(i))
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(results).toHaveLength(concurrency)
      // 100 个并发请求应该在 200ms 内完成
      expect(duration).toBeLessThan(200)
    })
  })
})