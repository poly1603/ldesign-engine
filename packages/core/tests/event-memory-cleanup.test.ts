/**
 * 事件管理器内存清理修复测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEventManager } from '../src/event/event-manager'
import type { EventManager } from '../src/types'

describe('事件管理器内存清理修复测试', () => {
  let eventManager: EventManager

  beforeEach(() => {
    eventManager = createEventManager()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('待清理队列大小限制', () => {
    it('达到最大队列大小时应该立即清理', () => {
      for (let i = 0; i < 100; i++) {
        const handler = vi.fn()
        eventManager.on(`event-${i}`, handler)
        eventManager.off(`event-${i}`, handler)
      }
      const eventNames = eventManager.eventNames()
      expect(eventNames.length).toBe(0)
    })

    it('未达到限制时应该延迟清理', () => {
      for (let i = 0; i < 10; i++) {
        const handler = vi.fn()
        eventManager.on(`event-${i}`, handler)
        eventManager.off(`event-${i}`, handler)
      }
      expect(eventManager.eventNames().length).toBe(10)
      vi.advanceTimersByTime(1000)
      expect(eventManager.eventNames().length).toBe(0)
    })
  })

  describe('定时器管理', () => {
    it('应该正确设置清理定时器', () => {
      const handler = vi.fn()
      eventManager.on('test-event', handler)
      eventManager.off('test-event', handler)
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(1000)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('多次添加/移除应该重置定时器', () => {
      const handler1 = vi.fn()
      eventManager.on('event-1', handler1)
      eventManager.off('event-1', handler1)
      vi.advanceTimersByTime(500)
      
      const handler2 = vi.fn()
      eventManager.on('event-2', handler2)
      eventManager.off('event-2', handler2)
      vi.advanceTimersByTime(500)
      
      expect(eventManager.eventNames()).toContain('event-1')
      vi.advanceTimersByTime(500)
      expect(eventManager.eventNames()).toHaveLength(0)
    })

    it('clear 操作应该清除定时器', () => {
      const handler = vi.fn()
      eventManager.on('test-event', handler)
      eventManager.off('test-event', handler)
      expect(vi.getTimerCount()).toBe(1)
      eventManager.clear()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('内存泄漏防护', () => {
    it('应该防止待清理队列无限增长', () => {
      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn()
        eventManager.on(`event-${i}`, handler)
        eventManager.off(`event-${i}`, handler)
      }
      expect(eventManager.eventNames().length).toBeLessThan(100)
    })
  })
})
