/**
 * 状态管理器单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStateManager } from '../../src/state/state-manager'

describe('StateManager', () => {
  let stateManager: ReturnType<typeof createStateManager>

  beforeEach(() => {
    stateManager = createStateManager()
  })

  describe('基础功能', () => {
    it('应该能设置和获取状态', () => {
      stateManager.set('user', { name: 'Alice' })
      const user = stateManager.get('user')

      expect(user).toEqual({ name: 'Alice' })
    })

    it('应该支持嵌套路径', () => {
      stateManager.set('user.profile.name', 'Bob')

      expect(stateManager.get('user.profile.name')).toBe('Bob')
      expect(stateManager.get('user.profile')).toEqual({ name: 'Bob' })
    })

    it('应该能删除状态', () => {
      stateManager.set('temp', 'value')
      stateManager.remove('temp')

      expect(stateManager.get('temp')).toBeUndefined()
    })

    it('应该能检查键是否存在', () => {
      stateManager.set('exists', true)

      expect(stateManager.has('exists')).toBe(true)
      expect(stateManager.has('not-exists')).toBe(false)
    })

    it('应该能获取所有键', () => {
      stateManager.set('key1', 'value1')
      stateManager.set('key2', 'value2')

      const keys = stateManager.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })

    it('应该能清空所有状态', () => {
      stateManager.set('key1', 'value1')
      stateManager.set('key2', 'value2')
      stateManager.clear()

      expect(stateManager.keys()).toHaveLength(0)
    })
  })

  describe('监听器', () => {
    it('应该能监听状态变化', () => {
      const callback = vi.fn()
      stateManager.watch('user', callback)

      stateManager.set('user', { name: 'Alice' })

      // 异步触发，需要等待
      return new Promise(resolve => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalledWith(
            { name: 'Alice' },
            undefined
          )
          resolve(undefined)
        }, 10)
      })
    })

    it('应该能取消监听', () => {
      const callback = vi.fn()
      const unwatch = stateManager.watch('user', callback)

      unwatch()
      stateManager.set('user', { name: 'Alice' })

      return new Promise(resolve => {
        setTimeout(() => {
          expect(callback).not.toHaveBeenCalled()
          resolve(undefined)
        }, 10)
      })
    })
  })

  describe('批量操作', () => {
    it('应该支持批量设置', () => {
      const callback = vi.fn()
      stateManager.watch('user.name', callback)
      stateManager.watch('user.age', callback)

      stateManager.batchSet({
        'user.name': 'Alice',
        'user.age': 30
      })

      return new Promise(resolve => {
        setTimeout(() => {
          expect(stateManager.get('user.name')).toBe('Alice')
          expect(stateManager.get('user.age')).toBe(30)
          resolve(undefined)
        }, 10)
      })
    })

    it('应该支持批量获取', () => {
      stateManager.set('key1', 'value1')
      stateManager.set('key2', 'value2')

      const result = stateManager.batchGet(['key1', 'key2', 'key3'])

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: undefined
      })
    })

    it('应该支持批量删除', () => {
      stateManager.set('key1', 'value1')
      stateManager.set('key2', 'value2')
      stateManager.set('key3', 'value3')

      stateManager.batchRemove(['key1', 'key2'])

      expect(stateManager.has('key1')).toBe(false)
      expect(stateManager.has('key2')).toBe(false)
      expect(stateManager.has('key3')).toBe(true)
    })
  })

  describe('事务操作', () => {
    it('应该支持事务成功', () => {
      const result = stateManager.transaction(() => {
        stateManager.set('balance', 100)
        stateManager.set('status', 'active')
        return 'success'
      })

      expect(result).toBe('success')
      expect(stateManager.get('balance')).toBe(100)
      expect(stateManager.get('status')).toBe('active')
    })

    it('应该在事务失败时回滚', () => {
      stateManager.set('balance', 50)

      try {
        stateManager.transaction(() => {
          stateManager.set('balance', 100)
          throw new Error('失败')
        })
      } catch {
        // 预期错误
      }

      // 状态应该回滚到50
      expect(stateManager.get('balance')).toBe(50)
    })
  })

  describe('历史记录', () => {
    it('应该能撤销变更', () => {
      stateManager.set('count', 1)
      stateManager.set('count', 2)
      stateManager.set('count', 3)

      const success = stateManager.undo()

      expect(success).toBe(true)
      expect(stateManager.get('count')).toBe(2)
    })

    it('应该能获取变更历史', () => {
      stateManager.set('count', 1)
      stateManager.set('count', 2)

      const history = stateManager.getChangeHistory(5)

      expect(history.length).toBeGreaterThan(0)
      expect(history[0].path).toBe('count')
    })
  })

  describe('命名空间', () => {
    it('应该支持命名空间', () => {
      const userState = stateManager.namespace('user')

      userState.set('name', 'Alice')

      expect(userState.get('name')).toBe('Alice')
      expect(stateManager.get('user.name')).toBe('Alice')
    })

    it('应该能清空命名空间', () => {
      const userState = stateManager.namespace('user')

      userState.set('name', 'Alice')
      userState.set('age', 30)
      userState.clear()

      expect(userState.keys()).toHaveLength(0)
    })
  })

  describe('性能', () => {
    it('单层访问应该很快', () => {
      stateManager.set('user', { name: 'Alice' })

      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        stateManager.get('user')
      }
      const duration = performance.now() - start

      // 10000次访问应该在10ms内
      expect(duration).toBeLessThan(10)
    })

    it('嵌套访问应该使用缓存', () => {
      stateManager.set('user.profile.name', 'Alice')

      // 第一次访问（无缓存）
      const start1 = performance.now()
      stateManager.get('user.profile.name')
      const duration1 = performance.now() - start1

      // 第二次访问（有缓存）
      const start2 = performance.now()
      stateManager.get('user.profile.name')
      const duration2 = performance.now() - start2

      // 缓存访问应该更快
      expect(duration2).toBeLessThanOrEqual(duration1)
    })
  })
})

