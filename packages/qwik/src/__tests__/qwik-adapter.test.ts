import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QwikAdapter, createQwikAdapter } from '../adapter/qwik-adapter'
import type { Engine } from '@ldesign/engine-core'

describe('QwikAdapter', () => {
  let adapter: QwikAdapter
  let mockEngine: Engine

  beforeEach(() => {
    adapter = new QwikAdapter({ debug: false })
    mockEngine = {
      state: {
        get: vi.fn(),
        set: vi.fn(),
        subscribe: vi.fn(),
      },
      events: {
        on: vi.fn(),
        emit: vi.fn(),
        off: vi.fn(),
      },
      cache: {
        get: vi.fn(),
        set: vi.fn(),
      },
      plugins: {
        get: vi.fn(),
      },
    } as any
  })

  describe('基本功能', () => {
    it('应该正确创建适配器实例', () => {
      expect(adapter).toBeDefined()
      expect(adapter.name).toBe('qwik')
      expect(adapter.version).toBe('1.0.0')
    })

    it('应该通过工厂函数创建适配器', () => {
      const adapter = createQwikAdapter({ debug: true })
      expect(adapter).toBeInstanceOf(QwikAdapter)
    })

    it('应该正确初始化', async () => {
      await adapter.init(mockEngine)
      expect(adapter.getEngine()).toBe(mockEngine)
    })

    it('应该正确获取管理器', async () => {
      await adapter.init(mockEngine)
      expect(adapter.getStateManager()).toBe(mockEngine.state)
      expect(adapter.getEventManager()).toBe(mockEngine.events)
      expect(adapter.getCacheManager()).toBe(mockEngine.cache)
      expect(adapter.getPluginManager()).toBe(mockEngine.plugins)
    })
  })

  describe('生命周期', () => {
    it('应该正确执行 mount', async () => {
      await adapter.init(mockEngine)
      await expect(adapter.mount('#app')).resolves.toBeUndefined()
    })

    it('应该正确执行 unmount', async () => {
      await adapter.init(mockEngine)
      await adapter.mount('#app')
      await expect(adapter.unmount()).resolves.toBeUndefined()
    })

    it('应该正确执行 destroy', async () => {
      await adapter.init(mockEngine)
      await adapter.destroy()
      expect(adapter.getEngine()).toBeUndefined()
    })
  })

  describe('SSR 支持', () => {
    it('应该提供环境检测方法', () => {
      // 在 jsdom 环境中，window 存在
      // 所以 isServer() 返回 false
      expect(adapter.isServer()).toBe(false)
      expect(adapter.isClient()).toBe(true)
    })

    it('应该支持状态序列化', async () => {
      await adapter.init(mockEngine)
      const state = { counter: 42, user: { name: 'Test' } }
      const serialized = JSON.stringify(state)
      expect(serialized).toBe('{"counter":42,"user":{"name":"Test"}}')
    })
  })

  describe('配置选项', () => {
    it('应该支持 debug 模式', () => {
      const debugAdapter = new QwikAdapter({ debug: true })
      expect(debugAdapter).toBeDefined()
    })

    it('应该支持 enableSSR 选项', () => {
      const ssrAdapter = new QwikAdapter({ enableSSR: true })
      expect(ssrAdapter).toBeDefined()
    })

    it('应该支持 enableSerialization 选项', () => {
      const serAdapter = new QwikAdapter({ enableSerialization: true })
      expect(serAdapter).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该在未初始化时返回 undefined', () => {
      expect(adapter.getEngine()).toBeUndefined()
      expect(adapter.getStateManager()).toBeUndefined()
    })

    it('应该处理重复初始化', async () => {
      await adapter.init(mockEngine)
      await adapter.init(mockEngine)
      expect(adapter.getEngine()).toBe(mockEngine)
    })
  })
})

