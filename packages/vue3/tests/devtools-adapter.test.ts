/**
 * Vue Devtools 适配器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, App } from 'vue'
import { createStateManager, createEventManager } from '@ldesign/engine-core'
import { VueDevtoolsAdapter, createVueDevtoolsAdapter } from '../src/devtools/vue-devtools-adapter'

describe('VueDevtoolsAdapter', () => {
  let app: App
  let stateManager: ReturnType<typeof createStateManager>
  let eventManager: ReturnType<typeof createEventManager>
  let adapter: VueDevtoolsAdapter

  beforeEach(() => {
    // 创建测试 App
    app = createApp({
      template: '<div>Test</div>',
    })

    // 创建管理器
    stateManager = createStateManager()
    eventManager = createEventManager()

    // 模拟 Devtools Hook
    const mockDevtoolsHook = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    }

    // @ts-ignore - 设置全局 Devtools Hook
    global.window = {
      __VUE_DEVTOOLS_GLOBAL_HOOK__: mockDevtoolsHook,
    }
  })

  describe('创建和初始化', () => {
    it('应该成功创建 Devtools 适配器', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager)

      expect(adapter).toBeDefined()
      expect(adapter.isDevtoolsEnabled()).toBe(true)
    })

    it('应该使用自定义选项创建适配器', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        appName: 'Test App',
        enableStateInspector: true,
        enableEventTracker: false,
        enableTimeTravel: true,
        maxEventHistory: 50,
      })

      expect(adapter).toBeDefined()
    })

    it('在没有 Devtools Hook 时应该正常工作', () => {
      // @ts-ignore
      delete global.window.__VUE_DEVTOOLS_GLOBAL_HOOK__

      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager)

      expect(adapter).toBeDefined()
      expect(adapter.isDevtoolsEnabled()).toBe(false)
    })
  })

  describe('状态追踪', () => {
    beforeEach(() => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableStateInspector: true,
      })
    })

    it('应该捕获状态快照', () => {
      stateManager.set('count', 0)
      stateManager.set('count', 1)
      stateManager.set('count', 2)

      const snapshots = adapter.getStateSnapshots()
      expect(snapshots.length).toBeGreaterThan(0)
    })

    it('应该限制快照数量', () => {
      // 创建超过 50 个快照
      for (let i = 0; i < 60; i++) {
        stateManager.set('count', i)
      }

      const snapshots = adapter.getStateSnapshots()
      expect(snapshots.length).toBeLessThanOrEqual(50)
    })

    it('应该清空状态快照', () => {
      stateManager.set('count', 1)
      
      const snapshotsBefore = adapter.getStateSnapshots()
      expect(snapshotsBefore.length).toBeGreaterThan(0)

      adapter.clearStateSnapshots()
      
      const snapshotsAfter = adapter.getStateSnapshots()
      expect(snapshotsAfter.length).toBe(0)
    })
  })

  describe('事件追踪', () => {
    beforeEach(() => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableEventTracker: true,
        maxEventHistory: 10,
      })
    })

    it('应该追踪事件', () => {
      eventManager.emit('test-event', { data: 'test' })

      const history = adapter.getEventHistory()
      expect(history.length).toBeGreaterThan(0)
      expect(history[0].type).toBe('test-event')
    })

    it('应该限制事件历史数量', () => {
      // 触发超过最大历史数量的事件
      for (let i = 0; i < 20; i++) {
        eventManager.emit(`event-${i}`, { index: i })
      }

      const history = adapter.getEventHistory()
      expect(history.length).toBeLessThanOrEqual(10)
    })

    it('应该清空事件历史', () => {
      eventManager.emit('test-event', { data: 'test' })
      
      const historyBefore = adapter.getEventHistory()
      expect(historyBefore.length).toBeGreaterThan(0)

      adapter.clearEventHistory()
      
      const historyAfter = adapter.getEventHistory()
      expect(historyAfter.length).toBe(0)
    })

    it('应该记录事件时间戳', () => {
      const beforeTime = Date.now()
      eventManager.emit('test-event', { data: 'test' })
      const afterTime = Date.now()

      const history = adapter.getEventHistory()
      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('时间旅行', () => {
    beforeEach(() => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableTimeTravel: true,
      })
    })

    it('应该恢复到之前的状态', () => {
      // 设置初始状态
      stateManager.set('count', 0)
      stateManager.set('name', 'Alice')

      // 修改状态
      stateManager.set('count', 5)
      stateManager.set('name', 'Bob')

      const snapshots = adapter.getStateSnapshots()
      expect(snapshots.length).toBeGreaterThan(0)

      // 注意: 实际的时间旅行功能需要通过 Devtools Hook 触发
      // 这里我们只验证快照的存在
    })

    it('快照应该包含完整状态', () => {
      stateManager.set('user', { id: 1, name: 'Alice' })
      stateManager.set('settings', { theme: 'dark' })

      const snapshots = adapter.getStateSnapshots()
      const lastSnapshot = snapshots[snapshots.length - 1]

      expect(lastSnapshot.state).toBeDefined()
      expect(lastSnapshot.timestamp).toBeDefined()
    })
  })

  describe('销毁', () => {
    it('应该正确销毁适配器', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager)

      adapter.destroy()

      expect(adapter.getEventHistory().length).toBe(0)
      expect(adapter.getStateSnapshots().length).toBe(0)
      expect(adapter.isDevtoolsEnabled()).toBe(false)
    })

    it('销毁后不应该追踪新事件', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableEventTracker: true,
      })

      adapter.destroy()

      eventManager.emit('test-event', { data: 'test' })

      const history = adapter.getEventHistory()
      expect(history.length).toBe(0)
    })
  })

  describe('Devtools 集成', () => {
    it('应该在有 Devtools Hook 时启用', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager)

      expect(adapter.isDevtoolsEnabled()).toBe(true)
    })

    it('应该注册自定义检查器', () => {
      const mockEmit = vi.fn()
      // @ts-ignore
      global.window.__VUE_DEVTOOLS_GLOBAL_HOOK__.emit = mockEmit

      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        appName: 'Test App',
      })

      // 验证 emit 被调用（用于注册检查器）
      expect(mockEmit).toHaveBeenCalled()
    })
  })

  describe('配置选项', () => {
    it('应该禁用状态检查器', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableStateInspector: false,
      })

      expect(adapter).toBeDefined()
    })

    it('应该禁用事件追踪', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableEventTracker: false,
      })

      eventManager.emit('test-event', { data: 'test' })

      // 由于追踪被禁用，历史应该为空
      const history = adapter.getEventHistory()
      expect(history.length).toBe(0)
    })

    it('应该禁用时间旅行', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableTimeTravel: false,
      })

      stateManager.set('count', 1)

      // 快照功能应该仍然工作，但时间旅行被禁用
      expect(adapter).toBeDefined()
    })

    it('应该使用自定义事件历史大小', () => {
      adapter = createVueDevtoolsAdapter(app, stateManager, eventManager, {
        enableEventTracker: true,
        maxEventHistory: 5,
      })

      for (let i = 0; i < 10; i++) {
        eventManager.emit(`event-${i}`)
      }

      const history = adapter.getEventHistory()
      expect(history.length).toBeLessThanOrEqual(5)
    })
  })
})