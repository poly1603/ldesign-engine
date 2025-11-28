/**
 * 状态管理器深度比较修复测试
 * 
 * 测试达到深度限制的降级策略
 * 测试 JSON 序列化比较
 * 测试循环引用处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStateManager } from '../src/state/state-manager'
import type { StateManager } from '../src/types'

describe('状态管理器深度比较修复测试', () => {
  let stateManager: StateManager

  beforeEach(() => {
    stateManager = createStateManager()
  })

  describe('深度限制降级策略', () => {
    it('应该有最大深度限制', () => {
      // 创建超深嵌套对象（默认限制是10层）
      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' }
        return { nested: createDeepObject(depth - 1) }
      }

      const deepObj = createDeepObject(15)
      const listener = vi.fn()

      stateManager.watch('deep', listener)
      stateManager.set('deep', deepObj)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('达到深度限制时应该使用 JSON 序列化比较', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' }
        return { nested: createDeepObject(depth - 1) }
      }

      const deepObj1 = createDeepObject(15)
      const deepObj2 = createDeepObject(15)

      stateManager.set('deep', deepObj1)
      stateManager.set('deep', deepObj2)

      // 应该输出警告
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Deep equal reached max depth')
      )

      consoleWarn.mockRestore()
    })

    it('JSON 序列化比较应该正确识别相同对象', () => {
      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' }
        return { nested: createDeepObject(depth - 1) }
      }

      const deepObj1 = createDeepObject(15)
      const deepObj2 = createDeepObject(15)
      const listener = vi.fn()

      stateManager.watch('deep', listener)
      stateManager.set('deep', deepObj1)
      stateManager.set('deep', deepObj2)

      // 相同的对象结构，只应触发一次
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('JSON 序列化比较应该识别不同对象', () => {
      const createDeepObject = (depth: number, value: string): any => {
        if (depth === 0) return { value }
        return { nested: createDeepObject(depth - 1, value) }
      }

      const deepObj1 = createDeepObject(15, 'value1')
      const deepObj2 = createDeepObject(15, 'value2')
      const listener = vi.fn()

      stateManager.watch('deep', listener)
      stateManager.set('deep', deepObj1)
      stateManager.set('deep', deepObj2)

      // 不同的对象，应触发两次
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('循环引用处理', () => {
    it('应该处理循环引用对象', () => {
      const obj: any = { name: 'circular' }
      obj.self = obj

      const listener = vi.fn()
      stateManager.watch('circular', listener)

      // 应该能够设置循环引用对象
      expect(() => {
        stateManager.set('circular', obj)
      }).not.toThrow()

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('循环引用对象的比较应该使用浅比较', () => {
      const obj1: any = { name: 'circular1' }
      obj1.self = obj1

      const obj2: any = { name: 'circular1' }
      obj2.self = obj2

      const listener = vi.fn()
      stateManager.watch('circular', listener)

      stateManager.set('circular', obj1)
      stateManager.set('circular', obj2)

      // 不同的循环引用对象，应触发两次
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('JSON 序列化失败时应该降级为浅比较', () => {
      const obj1: any = { name: 'circular' }
      obj1.self = obj1

      const listener = vi.fn()
      stateManager.watch('circular', listener)

      stateManager.set('circular', obj1)
      stateManager.set('circular', obj1) // 相同引用

      // 相同引用，只应触发一次
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('setMaxDepth 配置', () => {
    it('应该允许配置最大深度', () => {
      stateManager.setMaxDepth(5)

      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' }
        return { nested: createDeepObject(depth - 1) }
      }

      const deepObj = createDeepObject(10)
      const listener = vi.fn()

      stateManager.watch('deep', listener)
      stateManager.set('deep', deepObj)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('最大深度应该在1-50之间', () => {
      stateManager.setMaxDepth(-10)
      stateManager.setMaxDepth(100)

      // 应该限制在合理范围内，不抛出错误
      expect(() => {
        const obj = { a: { b: { c: { d: { e: 'value' } } } } }
        stateManager.set('test', obj)
      }).not.toThrow()
    })
  })

  describe('性能测试', () => {
    it('深度比较不应显著影响性能', () => {
      const obj = {
        a: { b: { c: { d: { e: { f: { g: { h: { i: { j: 'value' } } } } } } } } },
      }

      const startTime = Date.now()

      for (let i = 0; i < 100; i++) {
        stateManager.set('test', { ...obj })
      }

      const duration = Date.now() - startTime

      // 100次设置应该在100ms内完成
      expect(duration).toBeLessThan(100)
    })

    it('JSON 序列化降级不应显著影响性能', () => {
      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' }
        return { nested: createDeepObject(depth - 1) }
      }

      const deepObj = createDeepObject(20)
      const startTime = Date.now()

      for (let i = 0; i < 10; i++) {
        stateManager.set('deep', { ...deepObj })
      }

      const duration = Date.now() - startTime

      // 10次深度对象设置应该在50ms内完成
      expect(duration).toBeLessThan(50)
    })
  })

  describe('边界情况', () => {
    it('应该正确处理 null 和 undefined', () => {
      const listener = vi.fn()
      stateManager.watch('test', listener)

      stateManager.set('test', null)
      stateManager.set('test', undefined)
      stateManager.set('test', null)

      expect(listener).toHaveBeenCalledTimes(3)
    })

    it('应该正确处理特殊对象类型', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-01')
      const listener = vi.fn()

      stateManager.watch('date', listener)
      stateManager.set('date', date1)
      stateManager.set('date', date2)

      // 相同时间戳，只触发一次
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('应该正确处理数组', () => {
      const arr1 = [1, 2, 3, { nested: [4, 5, 6] }]
      const arr2 = [1, 2, 3, { nested: [4, 5, 6] }]
      const listener = vi.fn()

      stateManager.watch('array', listener)
      stateManager.set('array', arr1)
      stateManager.set('array', arr2)

      // 相同内容，只触发一次
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
})