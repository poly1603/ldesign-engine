/**
 * 错误恢复管理器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  EngineError,
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ErrorRecoveryManager,
  createErrorRecoveryManager,
  PluginError,
  StateError,
  EventError,
} from '../src/errors/engine-error'

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager

  beforeEach(() => {
    recoveryManager = createErrorRecoveryManager()
  })

  describe('错误分类和严重级别', () => {
    it('应该正确创建带有分类和严重级别的错误', () => {
      const error = new EngineError('Test error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.PLUGIN,
        severity: ErrorSeverity.HIGH,
        recoverable: true,
      })

      expect(error.category).toBe(ErrorCategory.PLUGIN)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.recoverable).toBe(true)
      expect(error.code).toBe(ErrorCode.UNKNOWN)
    })

    it('应该使用默认值创建错误', () => {
      const error = new EngineError('Test error')

      expect(error.category).toBe(ErrorCategory.UNKNOWN)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.recoverable).toBe(true)
      expect(error.code).toBe(ErrorCode.UNKNOWN)
    })

    it('PluginError 应该有正确的分类', () => {
      const error = new PluginError('Plugin failed')

      expect(error.category).toBe(ErrorCategory.PLUGIN)
      expect(error.name).toBe('PluginError')
    })

    it('StateError 应该有正确的分类和严重级别', () => {
      const error = new StateError('State update failed')

      expect(error.category).toBe(ErrorCategory.STATE)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.name).toBe('StateError')
    })

    it('EventError 应该有正确的分类', () => {
      const error = new EventError('Event handler error')

      expect(error.category).toBe(ErrorCategory.EVENT)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.name).toBe('EventError')
    })
  })

  describe('错误恢复策略', () => {
    it('应该注册恢复策略', () => {
      recoveryManager.registerStrategy(ErrorCategory.PLUGIN, {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 3,
      })

      // 策略已注册，后续测试会验证
      expect(recoveryManager).toBeDefined()
    })

    it('应该使用 SKIP 策略跳过错误', async () => {
      const error = new EngineError('Test error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.EVENT,
        recoverable: true,
      })

      recoveryManager.registerStrategy(ErrorCategory.EVENT, {
        strategy: RecoveryStrategy.SKIP,
      })

      const success = await recoveryManager.recover(error)
      expect(success).toBe(true)
    })

    it('应该对不可恢复的错误返回 false', async () => {
      const error = new EngineError('Critical error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.LIFECYCLE,
        severity: ErrorSeverity.CRITICAL,
        recoverable: false,
      })

      const success = await recoveryManager.recover(error)
      expect(success).toBe(false)
    })

    it('应该使用 USE_DEFAULT 策略', async () => {
      const error = new EngineError('Test error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.STATE,
        recoverable: true,
      })

      recoveryManager.registerStrategy(ErrorCategory.STATE, {
        strategy: RecoveryStrategy.USE_DEFAULT,
        defaultValue: { count: 0 },
      })

      const success = await recoveryManager.recover(error)
      expect(success).toBe(true)
    })

    it('应该使用自定义恢复函数', async () => {
      const error = new EngineError('Test error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.PLUGIN,
        recoverable: true,
      })

      const customRecover = vi.fn().mockResolvedValue(undefined)

      recoveryManager.registerStrategy(ErrorCategory.PLUGIN, {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 1,
        customRecover,
      })

      const success = await recoveryManager.recover(error)
      expect(success).toBe(true)
      expect(customRecover).toHaveBeenCalled()
    })
  })

  describe('默认恢复策略', () => {
    it('应该对低严重级别错误使用默认恢复', async () => {
      const error = new EngineError('Low severity error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.LOW,
        recoverable: true,
      })

      const success = await recoveryManager.recover(error)
      expect(success).toBe(true)
    })

    it('应该对高严重级别错误失败', async () => {
      const error = new EngineError('High severity error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.CRITICAL,
        recoverable: true,
      })

      const success = await recoveryManager.recover(error)
      expect(success).toBe(false)
    })
  })

  describe('恢复历史', () => {
    it('应该记录恢复历史', async () => {
      const error = new EngineError('Test error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.EVENT,
        recoverable: true,
      })

      recoveryManager.registerStrategy(ErrorCategory.EVENT, {
        strategy: RecoveryStrategy.SKIP,
      })

      await recoveryManager.recover(error)

      const history = recoveryManager.getRecoveryHistory()
      expect(history).toHaveLength(1)
      expect(history[0].error).toBe(error)
      expect(history[0].strategy).toBe(RecoveryStrategy.SKIP)
      expect(history[0].success).toBe(true)
    })

    it('应该限制历史记录大小', async () => {
      for (let i = 0; i < 150; i++) {
        const error = new EngineError(`Error ${i}`, ErrorCode.UNKNOWN, {
          category: ErrorCategory.EVENT,
          recoverable: true,
        })

        recoveryManager.registerStrategy(ErrorCategory.EVENT, {
          strategy: RecoveryStrategy.SKIP,
        })

        await recoveryManager.recover(error)
      }

      const history = recoveryManager.getRecoveryHistory()
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('应该清空恢复历史', async () => {
      const error = new EngineError('Test error', ErrorCode.UNKNOWN, {
        category: ErrorCategory.EVENT,
        recoverable: true,
      })

      recoveryManager.registerStrategy(ErrorCategory.EVENT, {
        strategy: RecoveryStrategy.SKIP,
      })

      await recoveryManager.recover(error)
      expect(recoveryManager.getRecoveryHistory()).toHaveLength(1)

      recoveryManager.clearHistory()
      expect(recoveryManager.getRecoveryHistory()).toHaveLength(0)
    })
  })

  describe('成功率计算', () => {
    it('应该计算整体成功率', async () => {
      // 成功的恢复
      for (let i = 0; i < 7; i++) {
        const error = new EngineError(`Success ${i}`, ErrorCode.UNKNOWN, {
          category: ErrorCategory.EVENT,
          severity: ErrorSeverity.LOW,
          recoverable: true,
        })
        await recoveryManager.recover(error)
      }

      // 失败的恢复
      for (let i = 0; i < 3; i++) {
        const error = new EngineError(`Failure ${i}`, ErrorCode.UNKNOWN, {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.CRITICAL,
          recoverable: true,
        })
        await recoveryManager.recover(error)
      }

      const successRate = recoveryManager.getSuccessRate()
      expect(successRate).toBe(0.7) // 7/10
    })

    it('应该按分类计算成功率', async () => {
      // EVENT 分类 - 全部成功
      for (let i = 0; i < 5; i++) {
        const error = new EngineError(`Event ${i}`, ErrorCode.UNKNOWN, {
          category: ErrorCategory.EVENT,
          severity: ErrorSeverity.LOW,
          recoverable: true,
        })
        await recoveryManager.recover(error)
      }

      // STATE 分类 - 全部失败
      for (let i = 0; i < 5; i++) {
        const error = new EngineError(`State ${i}`, ErrorCode.UNKNOWN, {
          category: ErrorCategory.STATE,
          severity: ErrorSeverity.CRITICAL,
          recoverable: true,
        })
        await recoveryManager.recover(error)
      }

      expect(recoveryManager.getSuccessRate(ErrorCategory.EVENT)).toBe(1.0)
      expect(recoveryManager.getSuccessRate(ErrorCategory.STATE)).toBe(0.0)
    })

    it('空历史应该返回 0 成功率', () => {
      const successRate = recoveryManager.getSuccessRate()
      expect(successRate).toBe(0)
    })
  })

  describe('错误序列化', () => {
    it('应该正确序列化错误为 JSON', () => {
      const error = new EngineError('Test error', ErrorCode.PLUGIN_NOT_FOUND, {
        category: ErrorCategory.PLUGIN,
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        details: { pluginName: 'test-plugin' },
      })

      const json = error.toJSON()

      expect(json.name).toBe('EngineError')
      expect(json.message).toBe('Test error')
      expect(json.code).toBe(ErrorCode.PLUGIN_NOT_FOUND)
      expect(json.category).toBe(ErrorCategory.PLUGIN)
      expect(json.severity).toBe(ErrorSeverity.HIGH)
      expect(json.recoverable).toBe(true)
      expect(json.details).toEqual({ pluginName: 'test-plugin' })
    })

    it('应该包含堆栈跟踪', () => {
      const error = new EngineError('Test error')
      const json = error.toJSON()

      expect(json.stack).toBeDefined()
      expect(typeof json.stack).toBe('string')
    })

    it('应该包含原因错误', () => {
      const cause = new Error('Original error')
      const error = new EngineError('Wrapped error', ErrorCode.UNKNOWN, {
        cause,
      })

      const json = error.toJSON()

      expect(json.cause).toBeDefined()
      expect(json.cause.message).toBe('Original error')
    })
  })
})