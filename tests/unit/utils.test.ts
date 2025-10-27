/**
 * 工具函数单元测试
 */

import { describe, it, expect, vi } from 'vitest'
import {
  chunk,
  debounce,
  throttle,
  deepClone,
  generateId,
  formatFileSize,
  formatTime,
  unique,
  isEmpty,
  retry,
  createValidator,
  createTransformer,
  createPromiseQueue,
  withTimeout,
  generateUUID
} from '../../src/utils'

describe('工具函数', () => {
  describe('chunk', () => {
    it('应该正确分块数组', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7]
      const chunks = chunk(arr, 3)

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    })

    it('应该处理空数组', () => {
      expect(chunk([], 3)).toEqual([])
    })
  })

  describe('debounce', () => {
    it('应该延迟执行', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      expect(fn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('应该限制执行频率', async () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      // 立即执行一次
      expect(fn).toHaveBeenCalledTimes(1)

      await new Promise(resolve => setTimeout(resolve, 150))
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('deepClone', () => {
    it('应该深拷贝对象', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)

      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('应该处理数组', () => {
      const arr = [1, [2, 3], { a: 4 }]
      const cloned = deepClone(arr)

      expect(cloned).toEqual(arr)
      expect(cloned[1]).not.toBe(arr[1])
    })
  })

  describe('generateId', () => {
    it('应该生成唯一ID', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })
  })

  describe('formatFileSize', () => {
    it('应该格式化文件大小', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    })
  })

  describe('formatTime', () => {
    it('应该格式化时间', () => {
      expect(formatTime(500)).toBe('500ms')
      expect(formatTime(1500)).toBe('1.50s')
      expect(formatTime(65000)).toBe('1m 5s')
    })
  })

  describe('unique', () => {
    it('应该去重数组', () => {
      const arr = [1, 2, 2, 3, 3, 3, 4]
      expect(unique(arr)).toEqual([1, 2, 3, 4])
    })
  })

  describe('isEmpty', () => {
    it('应该检查空值', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty('')).toBe(true)
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
      expect(isEmpty('text')).toBe(false)
      expect(isEmpty([1])).toBe(false)
    })
  })

  describe('retry', () => {
    it('应该重试失败的操作', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) throw new Error('失败')
        return 'success'
      }

      const result = await retry(fn, { maxRetries: 3, delay: 10 })

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })
  })

  describe('DataValidator', () => {
    it('应该验证必填字段', () => {
      const validator = createValidator()

      const result1 = validator.required().validate('')
      expect(result1.valid).toBe(false)

      const result2 = validator.reset().required().validate('value')
      expect(result2.valid).toBe(true)
    })

    it('应该验证长度', () => {
      const validator = createValidator()

      const result = validator
        .minLength(3)
        .maxLength(10)
        .validate('test')

      expect(result.valid).toBe(true)
    })

    it('应该验证邮箱', () => {
      const validator = createValidator()

      expect(validator.isEmail('test@example.com')).toBe(true)
      expect(validator.isEmail('invalid')).toBe(false)
    })
  })

  describe('DataTransformer', () => {
    it('应该转换数字', () => {
      const transformer = createTransformer()

      expect(transformer.toNumber('123')).toBe(123)
      expect(transformer.toNumber('abc', 0)).toBe(0)
    })

    it('应该转换布尔值', () => {
      const transformer = createTransformer()

      expect(transformer.toBoolean('true')).toBe(true)
      expect(transformer.toBoolean('false')).toBe(false)
      expect(transformer.toBoolean(1)).toBe(true)
    })

    it('应该转换命名', () => {
      const transformer = createTransformer()

      expect(transformer.camelToSnake('userName')).toBe('user_name')
      expect(transformer.snakeToCamel('user_name')).toBe('userName')
    })
  })

  describe('PromiseQueue', () => {
    it('应该按顺序执行Promise', async () => {
      const queue = createPromiseQueue()
      const order: number[] = []

      queue.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        order.push(1)
      })

      queue.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push(2)
      })

      queue.add(async () => {
        order.push(3)
      })

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(order).toEqual([1, 2, 3])
    })
  })

  describe('withTimeout', () => {
    it('应该在超时后拒绝', async () => {
      const slowPromise = new Promise(resolve =>
        setTimeout(resolve, 1000)
      )

      await expect(
        withTimeout(slowPromise, 100, '超时')
      ).rejects.toThrow('超时')
    })

    it('应该在完成前不超时', async () => {
      const fastPromise = new Promise(resolve =>
        setTimeout(() => resolve('done'), 50)
      )

      const result = await withTimeout(fastPromise, 100)
      expect(result).toBe('done')
    })
  })

  describe('generateUUID', () => {
    it('应该生成有效的UUID', () => {
      const uuid = generateUUID()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(uuid).toMatch(uuidRegex)
    })

    it('应该生成唯一UUID', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()

      expect(uuid1).not.toBe(uuid2)
    })
  })
})

