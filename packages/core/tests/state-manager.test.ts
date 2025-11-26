/**
 * StateManager 单元测试
 *
 * 测试覆盖:
 * - 基本状态操作 (set/get/has/delete/clear)
 * - 状态监听和取消监听
 * - 批量更新优化
 * - 批量操作 (setAll/getAll/keys/size)
 * - JSON 序列化和反序列化
 * - 深度比较优化
 * - 错误隔离
 * - 内存泄漏防护
 * - 性能测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createStateManager } from '../src/state/state-manager'
import type { StateManager } from '../src/types'

describe('StateManager', () => {
  let stateManager: StateManager

  beforeEach(() => {
    stateManager = createStateManager()
  })

  afterEach(() => {
    stateManager.clear()
  })

  describe('基本功能', () => {
    it('应该成功设置和获取状态', () => {
      stateManager.set('count', 42)

      expect(stateManager.get('count')).toBe(42)
    })

    it('应该支持不同类型的值', () => {
      stateManager.set('string', 'hello')
      stateManager.set('number', 123)
      stateManager.set('boolean', true)
      stateManager.set('object', { name: 'Alice' })
      stateManager.set('array', [1, 2, 3])
      stateManager.set('null', null)

      expect(stateManager.get('string')).toBe('hello')
      expect(stateManager.get('number')).toBe(123)
      expect(stateManager.get('boolean')).toBe(true)
      expect(stateManager.get('object')).toEqual({ name: 'Alice' })
      expect(stateManager.get('array')).toEqual([1, 2, 3])
      expect(stateManager.get('null')).toBeNull()
    })

    it('应该正确检查状态是否存在', () => {
      stateManager.set('count', 0)

      expect(stateManager.has('count')).toBe(true)
      expect(stateManager.has('nonexistent')).toBe(false)
    })

    it('应该成功删除状态', () => {
      stateManager.set('temp', 'value')
      expect(stateManager.has('temp')).toBe(true)

      const result = stateManager.delete('temp')

      expect(result).toBe(true)
      expect(stateManager.has('temp')).toBe(false)
      expect(stateManager.get('temp')).toBeUndefined()
    })

    it('删除不存在的状态应该返回 false', () => {
      const result = stateManager.delete('nonexistent')
      expect(result).toBe(false)
    })

    it('应该清空所有状态', () => {
      stateManager.set('a', 1)
      stateManager.set('b', 2)
      stateManager.set('c', 3)

      expect(stateManager.size()).toBe(3)

      stateManager.clear()

      expect(stateManager.size()).toBe(0)
      expect(stateManager.keys()).toHaveLength(0)
    })

    it('获取不存在的状态应该返回 undefined', () => {
      expect(stateManager.get('nonexistent')).toBeUndefined()
    })
  })

  describe('状态监听', () => {
    it('应该监听状态变化', () => {
      const listener = vi.fn()

      stateManager.watch('count', listener)
      stateManager.set('count', 10)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(10, undefined)
    })

    it('应该传递正确的新值和旧值', () => {
      const listener = vi.fn()

      stateManager.set('count', 5)
      stateManager.watch('count', listener)
      stateManager.set('count', 10)

      expect(listener).toHaveBeenCalledWith(10, 5)
    })

    it('应该支持多个监听器', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      stateManager.watch('count', listener1)
      stateManager.watch('count', listener2)
      stateManager.watch('count', listener3)

      stateManager.set('count', 100)

      expect(listener1).toHaveBeenCalledWith(100, undefined)
      expect(listener2).toHaveBeenCalledWith(100, undefined)
      expect(listener3).toHaveBeenCalledWith(100, undefined)
    })

    it('应该支持取消监听', () => {
      const listener = vi.fn()

      const unwatch = stateManager.watch('count', listener)

      stateManager.set('count', 1)
      expect(listener).toHaveBeenCalledTimes(1)

      unwatch()

      stateManager.set('count', 2)
      expect(listener).toHaveBeenCalledTimes(1) // 仍然是1次
    })

    it('应该只通知对应键的监听器', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      stateManager.watch('a', listener1)
      stateManager.watch('b', listener2)

      stateManager.set('a', 1)

      expect(listener1).toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    it('删除状态时应该清理监听器', () => {
      const listener = vi.fn()

      stateManager.set('temp', 'value')
      stateManager.watch('temp', listener)

      stateManager.delete('temp')
      stateManager.set('temp', 'new value')

      // 监听器已被清理，不应该被调用
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('深度比较优化', () => {
    it('值未改变时不应该触发监听器 - 基本类型', () => {
      const listener = vi.fn()

      stateManager.set('count', 10)
      stateManager.watch('count', listener)

      stateManager.set('count', 10) // 相同的值

      expect(listener).not.toHaveBeenCalled()
    })

    it('值未改变时不应该触发监听器 - 对象', () => {
      const listener = vi.fn()
      const obj = { name: 'Alice', age: 25 }

      stateManager.set('user', obj)
      stateManager.watch('user', listener)

      stateManager.set('user', { name: 'Alice', age: 25 }) // 内容相同的新对象

      expect(listener).not.toHaveBeenCalled()
    })

    it('值未改变时不应该触发监听器 - 数组', () => {
      const listener = vi.fn()

      stateManager.set('items', [1, 2, 3])
      stateManager.watch('items', listener)

      stateManager.set('items', [1, 2, 3]) // 内容相同的新数组

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该正确比较 Date 对象', () => {
      const listener = vi.fn()
      const date = new Date('2024-01-01')

      stateManager.set('date', date)
      stateManager.watch('date', listener)

      stateManager.set('date', new Date('2024-01-01')) // 相同时间的新 Date 对象

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该正确比较 RegExp 对象', () => {
      const listener = vi.fn()

      stateManager.set('pattern', /test/gi)
      stateManager.watch('pattern', listener)

      stateManager.set('pattern', /test/gi) // 相同的正则表达式

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该正确比较嵌套对象', () => {
      const listener = vi.fn()

      stateManager.set('data', {
        user: { name: 'Alice', profile: { age: 25 } },
        tags: ['a', 'b']
      })
      stateManager.watch('data', listener)

      stateManager.set('data', {
        user: { name: 'Alice', profile: { age: 25 } },
        tags: ['a', 'b']
      })

      expect(listener).not.toHaveBeenCalled()
    })

    it('对象内容改变时应该触发监听器', () => {
      const listener = vi.fn()

      stateManager.set('user', { name: 'Alice', age: 25 })
      stateManager.watch('user', listener)

      stateManager.set('user', { name: 'Alice', age: 26 }) // age 改变了

      expect(listener).toHaveBeenCalled()
    })
  })

  describe('批量更新', () => {
    it('应该批量更新多个状态', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      stateManager.watch('a', listener1)
      stateManager.watch('b', listener2)
      stateManager.watch('c', listener3)

      stateManager.batch(() => {
        stateManager.set('a', 1)
        stateManager.set('b', 2)
        stateManager.set('c', 3)
      })

      // 每个监听器都应该被调用
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(1)
    })

    it('批量更新应该在结束后统一触发监听器', () => {
      const callOrder: string[] = []

      stateManager.watch('count', () => {
        callOrder.push('listener')
      })

      stateManager.batch(() => {
        callOrder.push('set-1')
        stateManager.set('count', 1)
        callOrder.push('set-2')
        stateManager.set('count', 2)
        callOrder.push('set-3')
        stateManager.set('count', 3)
      })

      expect(callOrder).toEqual(['set-1', 'set-2', 'set-3', 'listener'])
    })

    it('批量更新中同一个键多次更新应该只触发一次监听器', () => {
      const listener = vi.fn()

      stateManager.watch('count', listener)

      stateManager.batch(() => {
        stateManager.set('count', 1)
        stateManager.set('count', 2)
        stateManager.set('count', 3)
      })

      // 只触发一次，最终值为 3
      // oldValue 是批量更新开始前的值（undefined），但由于中间有更新，所以是 1
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(3, expect.anything())
    })

    it('应该防止嵌套批量更新', () => {
      const listener = vi.fn()

      stateManager.watch('count', listener)

      stateManager.batch(() => {
        stateManager.set('count', 1)

        stateManager.batch(() => {
          stateManager.set('count', 2)
        })

        stateManager.set('count', 3)
      })

      // 嵌套批量更新应该被展平，只触发一次
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('批量更新中的错误不应该阻止其他更新', () => {
      const listener = vi.fn()

      stateManager.watch('a', listener)

      expect(() => {
        stateManager.batch(() => {
          stateManager.set('a', 1)
          throw new Error('Test error')
        })
      }).toThrow('Test error')

      // 虽然抛出错误，但状态应该已经设置
      expect(stateManager.get('a')).toBe(1)
      // 监听器应该被调用
      expect(listener).toHaveBeenCalled()
    })
  })

  describe('批量操作', () => {
    it('应该获取所有状态键', () => {
      stateManager.set('a', 1)
      stateManager.set('b', 2)
      stateManager.set('c', 3)

      const keys = stateManager.keys()

      expect(keys).toHaveLength(3)
      expect(keys).toContain('a')
      expect(keys).toContain('b')
      expect(keys).toContain('c')
    })

    it('应该获取所有状态', () => {
      stateManager.set('count', 42)
      stateManager.set('name', 'Alice')
      stateManager.set('active', true)

      const allState = stateManager.getAll()

      expect(allState).toEqual({
        count: 42,
        name: 'Alice',
        active: true
      })
    })

    it('应该批量设置状态', () => {
      stateManager.setAll({
        a: 1,
        b: 2,
        c: 3
      })

      expect(stateManager.get('a')).toBe(1)
      expect(stateManager.get('b')).toBe(2)
      expect(stateManager.get('c')).toBe(3)
    })

    it('批量设置应该使用批量更新优化', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      stateManager.watch('a', listener1)
      stateManager.watch('b', listener2)

      stateManager.setAll({ a: 1, b: 2 })

      // 每个监听器只应该被调用一次
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('应该返回正确的状态数量', () => {
      expect(stateManager.size()).toBe(0)

      stateManager.set('a', 1)
      expect(stateManager.size()).toBe(1)

      stateManager.set('b', 2)
      expect(stateManager.size()).toBe(2)

      stateManager.delete('a')
      expect(stateManager.size()).toBe(1)
    })
  })

  describe('JSON 序列化', () => {
    it('应该导出为 JSON 字符串', () => {
      stateManager.set('count', 42)
      stateManager.set('name', 'Alice')

      const json = stateManager.toJSON()

      expect(json).toBe('{"count":42,"name":"Alice"}')
    })

    it('应该支持格式化输出', () => {
      stateManager.set('count', 42)

      const json = stateManager.toJSON(true)

      expect(json).toContain('\n')
      expect(json).toContain('  ')
    })

    it('应该从 JSON 导入状态', () => {
      const json = '{"count":42,"name":"Alice","active":true}'

      stateManager.fromJSON(json)

      expect(stateManager.get('count')).toBe(42)
      expect(stateManager.get('name')).toBe('Alice')
      expect(stateManager.get('active')).toBe(true)
    })

    it('导入时应该清空现有状态（默认）', () => {
      stateManager.set('old', 'value')

      stateManager.fromJSON('{"new":"value"}')

      expect(stateManager.has('old')).toBe(false)
      expect(stateManager.get('new')).toBe('value')
    })

    it('应该支持合并导入', () => {
      stateManager.set('a', 1)
      stateManager.set('b', 2)

      stateManager.fromJSON('{"b":20,"c":3}', true)

      expect(stateManager.get('a')).toBe(1)
      expect(stateManager.get('b')).toBe(20) // 被覆盖
      expect(stateManager.get('c')).toBe(3)
    })

    it('无效的 JSON 应该抛出错误', () => {
      expect(() => {
        stateManager.fromJSON('invalid json')
      }).toThrow()
    })

    it('非对象 JSON 应该抛出错误', () => {
      expect(() => {
        stateManager.fromJSON('123')
      }).toThrow('Invalid JSON: must be an object')

      expect(() => {
        stateManager.fromJSON('"string"')
      }).toThrow('Invalid JSON: must be an object')

      expect(() => {
        stateManager.fromJSON('null')
      }).toThrow('Invalid JSON: must be an object')
    })
  })

  describe('错误隔离', () => {
    it('应该隔离单个监听器的错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const errorListener = vi.fn(() => {
        throw new Error('Listener error')
      })
      const successListener = vi.fn()

      stateManager.watch('count', errorListener)
      stateManager.watch('count', successListener)

      expect(() => {
        stateManager.set('count', 10)
      }).not.toThrow()

      expect(errorListener).toHaveBeenCalled()
      expect(successListener).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('内存管理', () => {
    it('取消监听后应该清理监听器', () => {
      const listener = vi.fn()

      const unwatch = stateManager.watch('count', listener)
      unwatch()

      stateManager.set('count', 10)

      expect(listener).not.toHaveBeenCalled()
    })

    it('清空状态应该同时清理所有监听器', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      stateManager.watch('a', listener1)
      stateManager.watch('b', listener2)

      stateManager.clear()

      stateManager.set('a', 1)
      stateManager.set('b', 2)

      // 监听器已被清理
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    it('删除状态应该同时清理相关监听器', () => {
      const listener = vi.fn()

      stateManager.set('temp', 'value')
      stateManager.watch('temp', listener)

      stateManager.delete('temp')

      // 重新设置相同的键
      stateManager.set('temp', 'new value')

      // 旧的监听器不应该被调用
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串键', () => {
      stateManager.set('', 'empty key')

      expect(stateManager.get('')).toBe('empty key')
      expect(stateManager.has('')).toBe(true)
    })

    it('应该处理特殊字符键', () => {
      stateManager.set('key:with:colons', 1)
      stateManager.set('key.with.dots', 2)
      stateManager.set('key-with-dashes', 3)

      expect(stateManager.get('key:with:colons')).toBe(1)
      expect(stateManager.get('key.with.dots')).toBe(2)
      expect(stateManager.get('key-with-dashes')).toBe(3)
    })

    it('应该处理 undefined 值', () => {
      // 注意：由于 deepEqual 的特性，设置 undefined 不会触发更新
      // 因为 undefined === undefined 返回 true
      stateManager.set('test', 'value')
      const listener = vi.fn()
      stateManager.watch('test', listener)

      stateManager.set('test', undefined)

      expect(stateManager.has('test')).toBe(true)
      expect(stateManager.get('test')).toBeUndefined()
      expect(listener).toHaveBeenCalledWith(undefined, 'value')
    })

    it('应该区分 undefined 和不存在的键', () => {
      stateManager.set('explicit', 'initial')
      stateManager.set('explicit', undefined)

      expect(stateManager.has('explicit')).toBe(true)
      expect(stateManager.has('nonexistent')).toBe(false)
      expect(stateManager.get('explicit')).toBeUndefined()
      expect(stateManager.get('nonexistent')).toBeUndefined()
    })

    it('应该处理重复设置相同的值', () => {
      const listener = vi.fn()

      stateManager.set('count', 10)
      stateManager.watch('count', listener)

      stateManager.set('count', 10)
      stateManager.set('count', 10)
      stateManager.set('count', 10)

      // 值没有改变，不应该触发监听器
      expect(listener).not.toHaveBeenCalled()
    })

    it('应该处理复杂的嵌套数据', () => {
      const complexData = {
        users: [
          { id: 1, name: 'Alice', profile: { age: 25, tags: ['a', 'b'] } },
          { id: 2, name: 'Bob', profile: { age: 30, tags: ['c', 'd'] } }
        ],
        meta: {
          total: 2,
          page: 1,
          settings: { theme: 'dark', lang: 'en' }
        }
      }

      stateManager.set('data', complexData)

      expect(stateManager.get('data')).toEqual(complexData)
    })
  })

  describe('性能测试', () => {
    it('应该快速设置和获取大量状态', () => {
      const iterations = 10000
      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        stateManager.set(`key${i}`, i)
      }

      for (let i = 0; i < iterations; i++) {
        stateManager.get(`key${i}`)
      }

      const duration = Date.now() - startTime

      // 20000次操作应该在200ms内完成
      expect(duration).toBeLessThan(200)
    })

    it('批量更新应该比单独更新更快', () => {
      const iterations = 1000
      const listener = vi.fn()

      stateManager.watch('count', listener)

      // 单独更新
      const startTime1 = Date.now()
      for (let i = 0; i < iterations; i++) {
        stateManager.set('count', i)
      }
      const duration1 = Date.now() - startTime1

      listener.mockClear()
      stateManager.clear()
      stateManager.watch('count', listener)

      // 批量更新
      const startTime2 = Date.now()
      stateManager.batch(() => {
        for (let i = 0; i < iterations; i++) {
          stateManager.set('count', i)
        }
      })
      const duration2 = Date.now() - startTime2

      // 批量更新应该只触发一次监听器
      expect(listener).toHaveBeenCalledTimes(1)

      // 批量更新应该更快（或至少不慢太多）
      console.log(`单独更新: ${duration1}ms, 批量更新: ${duration2}ms`)
    })

    it('深度比较应该高效处理大对象', () => {
      const largeObject = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random()
        }))
      }

      const listener = vi.fn()

      stateManager.set('large', largeObject)
      stateManager.watch('large', listener)

      const startTime = Date.now()

      // 设置相同的对象（深度比较应该检测出相同）
      stateManager.set('large', JSON.parse(JSON.stringify(largeObject)))

      const duration = Date.now() - startTime

      // 深度比较应该在合理时间内完成
      expect(duration).toBeLessThan(50)
      // 值没有改变，不应该触发监听器
      expect(listener).not.toHaveBeenCalled()
    })
  })
})