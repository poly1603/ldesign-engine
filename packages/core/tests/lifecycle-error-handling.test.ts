/**
 * 生命周期钩子错误处理修复测试
 * 
 * 测试钩子失败时抛出错误
 * 测试错误信息包含所有失败的钩子
 * 测试后续流程被正确阻止
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLifecycleManager } from '../src/lifecycle/lifecycle-manager'
import { EngineError } from '../src/errors/engine-error'
import type { LifecycleManager } from '../src/types'

describe('生命周期钩子错误处理修复测试', () => {
  let lifecycleManager: LifecycleManager

  beforeEach(() => {
    lifecycleManager = createLifecycleManager()
  })

  describe('单个钩子失败', () => {
    it('应该在钩子失败时抛出 EngineError', async () => {
      const error = new Error('Hook execution failed')
      
      lifecycleManager.on('mounted', () => {
        throw error
      })

      await expect(lifecycleManager.trigger('mounted')).rejects.toThrow(EngineError)
    })

    it('错误信息应该包含钩子名称', async () => {
      lifecycleManager.on('beforeMount', () => {
        throw new Error('Validation failed')
      })

      try {
        await lifecycleManager.trigger('beforeMount')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toContain('beforeMount')
        expect(engineError.message).toContain('Validation failed')
      }
    })

    it('错误应该包含原始错误信息', async () => {
      const originalError = new Error('Original error message')
      
      lifecycleManager.on('init', () => {
        throw originalError
      })

      try {
        await lifecycleManager.trigger('init')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toContain('Original error message')
      }
    })

    it('应该记录错误数量', async () => {
      lifecycleManager.on('updated', () => {
        throw new Error('Update failed')
      })

      try {
        await lifecycleManager.trigger('updated')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toContain('1 error(s)')
      }
    })
  })

  describe('多个钩子失败', () => {
    it('应该收集所有失败的钩子错误', async () => {
      lifecycleManager.on('mounted', () => {
        throw new Error('First handler failed')
      })

      lifecycleManager.on('mounted', () => {
        throw new Error('Second handler failed')
      })

      lifecycleManager.on('mounted', () => {
        throw new Error('Third handler failed')
      })

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        
        // 应该包含错误数量
        expect(engineError.message).toContain('3 error(s)')
        
        // 应该包含所有错误信息
        expect(engineError.message).toContain('First handler failed')
        expect(engineError.message).toContain('Second handler failed')
        expect(engineError.message).toContain('Third handler failed')
      }
    })

    it('错误详情应该包含所有错误的详细信息', async () => {
      lifecycleManager.on('beforeMount', () => {
        throw new Error('Error A')
      })

      lifecycleManager.on('beforeMount', () => {
        throw new Error('Error B')
      })

      try {
        await lifecycleManager.trigger('beforeMount')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const errors = (engineError as any).context?.data?.errors
        
        expect(errors).toBeDefined()
        expect(errors).toHaveLength(2)
        expect(errors[0].message).toBe('Error A')
        expect(errors[1].message).toBe('Error B')
      }
    })

    it('应该包含所有错误的堆栈信息', async () => {
      lifecycleManager.on('init', () => {
        const error = new Error('Stack error')
        error.stack = 'Mock stack trace 1'
        throw error
      })

      lifecycleManager.on('init', () => {
        const error = new Error('Another stack error')
        error.stack = 'Mock stack trace 2'
        throw error
      })

      try {
        await lifecycleManager.trigger('init')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const errors = (engineError as any).context?.data?.errors
        
        expect(errors[0].stack).toBe('Mock stack trace 1')
        expect(errors[1].stack).toBe('Mock stack trace 2')
      }
    })
  })

  describe('部分钩子失败', () => {
    it('成功的钩子应该执行，失败的钩子应该被记录', async () => {
      const successHandler = vi.fn()
      const failHandler = vi.fn(() => {
        throw new Error('Failed handler')
      })

      lifecycleManager.on('mounted', successHandler)
      lifecycleManager.on('mounted', failHandler)
      lifecycleManager.on('mounted', successHandler)

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        // 所有处理器都应该被调用（错误隔离）
        expect(successHandler).toHaveBeenCalledTimes(2)
        expect(failHandler).toHaveBeenCalledTimes(1)
        
        // 但最终应该抛出错误
        expect(error).toBeInstanceOf(EngineError)
        const engineError = error as EngineError
        expect(engineError.message).toContain('1 error(s)')
      }
    })

    it('应该并行执行所有钩子（包括失败的）', async () => {
      const executionOrder: number[] = []
      
      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        executionOrder.push(1)
      })

      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        executionOrder.push(2)
        throw new Error('Handler 2 failed')
      })

      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        executionOrder.push(3)
      })

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        // 应该按完成顺序执行（并行）
        expect(executionOrder).toEqual([3, 2, 1])
        expect(error).toBeInstanceOf(EngineError)
      }
    })
  })

  describe('后续流程阻止', () => {
    it('钩子失败后应该阻止后续操作', async () => {
      const beforeMountHandler = vi.fn(() => {
        throw new Error('Before mount failed')
      })

      const mountedHandler = vi.fn()

      lifecycleManager.on('beforeMount', beforeMountHandler)
      lifecycleManager.on('mounted', mountedHandler)

      // beforeMount 失败
      try {
        await lifecycleManager.trigger('beforeMount')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
      }

      // mounted 不应该被触发（需要手动控制）
      expect(mountedHandler).not.toHaveBeenCalled()
    })

    it('错误应该标记为不可恢复', async () => {
      lifecycleManager.on('init', () => {
        throw new Error('Critical init error')
      })

      try {
        await lifecycleManager.trigger('init')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        expect((engineError as any).recoverable).toBe(false)
      }
    })

    it('错误严重级别应该为 high', async () => {
      lifecycleManager.on('beforeMount', () => {
        throw new Error('Mount preparation failed')
      })

      try {
        await lifecycleManager.trigger('beforeMount')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        expect((engineError as any).severity).toBe('high')
      }
    })
  })

  describe('错误上下文信息', () => {
    it('应该包含钩子名称在上下文中', async () => {
      lifecycleManager.on('updated', () => {
        throw new Error('Update error')
      })

      try {
        await lifecycleManager.trigger('updated')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const context = (engineError as any).context
        
        expect(context).toBeDefined()
        expect(context.data.hook).toBe('updated')
      }
    })

    it('应该包含错误数量在上下文中', async () => {
      lifecycleManager.on('mounted', () => {
        throw new Error('Error 1')
      })
      lifecycleManager.on('mounted', () => {
        throw new Error('Error 2')
      })

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const context = (engineError as any).context
        
        expect(context.data.errorCount).toBe(2)
      }
    })

    it('应该包含操作类型在上下文中', async () => {
      lifecycleManager.on('beforeUnmount', () => {
        throw new Error('Unmount error')
      })

      try {
        await lifecycleManager.trigger('beforeUnmount')
        expect.fail('应该抛出错误')
      } catch (error) {
        const engineError = error as EngineError
        const context = (engineError as any).context
        
        expect(context.operation).toBe('lifecycle:beforeUnmount')
      }
    })
  })

  describe('异步钩子错误处理', () => {
    it('应该正确捕获异步钩子中的错误', async () => {
      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        throw new Error('Async error')
      })

      await expect(lifecycleManager.trigger('mounted')).rejects.toThrow(EngineError)
    })

    it('应该等待所有异步钩子完成后再抛出错误', async () => {
      const results: string[] = []

      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 30))
        results.push('handler1')
      })

      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        results.push('handler2')
        throw new Error('Async error')
      })

      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        results.push('handler3')
      })

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        // 所有钩子都应该执行完成
        expect(results).toHaveLength(3)
        expect(results).toContain('handler1')
        expect(results).toContain('handler2')
        expect(results).toContain('handler3')
      }
    })

    it('应该捕获 Promise 拒绝', async () => {
      lifecycleManager.on('init', async () => {
        return Promise.reject(new Error('Promise rejected'))
      })

      try {
        await lifecycleManager.trigger('init')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        expect((error as EngineError).message).toContain('Promise rejected')
      }
    })
  })

  describe('边界情况', () => {
    it('没有钩子时不应该抛出错误', async () => {
      await expect(lifecycleManager.trigger('mounted')).resolves.toBeUndefined()
    })

    it('所有钩子成功时不应该抛出错误', async () => {
      lifecycleManager.on('mounted', () => {
        // 成功执行
      })

      lifecycleManager.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        // 成功执行
      })

      await expect(lifecycleManager.trigger('mounted')).resolves.toBeUndefined()
    })

    it('应该处理非 Error 对象的抛出', async () => {
      lifecycleManager.on('mounted', () => {
        throw 'String error'
      })

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        expect((error as EngineError).message).toContain('String error')
      }
    })

    it('应该处理 null 错误', async () => {
      lifecycleManager.on('mounted', () => {
        throw null
      })

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        // 应该能够处理 null 错误
        expect((error as EngineError).message).toContain('null')
      }
    })

    it('应该处理带参数的钩子触发', async () => {
      const handler = vi.fn((...args: unknown[]) => {
        if (args[0] === 'fail') {
          throw new Error('Triggered failure')
        }
      })

      lifecycleManager.on('beforeUpdate', handler)

      // 正常情况
      await expect(
        lifecycleManager.trigger('beforeUpdate', 'success')
      ).resolves.toBeUndefined()

      // 错误情况
      await expect(
        lifecycleManager.trigger('beforeUpdate', 'fail')
      ).rejects.toThrow(EngineError)

      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('性能测试', () => {
    it('大量钩子失败时应该高效处理', async () => {
      const hookCount = 100

      for (let i = 0; i < hookCount; i++) {
        lifecycleManager.on('mounted', () => {
          throw new Error(`Error ${i}`)
        })
      }

      const startTime = Date.now()

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        const duration = Date.now() - startTime

        expect(error).toBeInstanceOf(EngineError)
        expect((error as EngineError).message).toContain(`${hookCount} error(s)`)
        
        // 100 个错误处理应该在 100ms 内完成
        expect(duration).toBeLessThan(100)
      }
    })

    it('混合成功和失败的钩子应该正确处理', async () => {
      const successCount = 50
      const failCount = 50

      for (let i = 0; i < successCount; i++) {
        lifecycleManager.on('mounted', () => {
          // 成功执行
        })
      }

      for (let i = 0; i < failCount; i++) {
        lifecycleManager.on('mounted', () => {
          throw new Error(`Error ${i}`)
        })
      }

      try {
        await lifecycleManager.trigger('mounted')
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(EngineError)
        expect((error as EngineError).message).toContain(`${failCount} error(s)`)
      }
    })
  })
})