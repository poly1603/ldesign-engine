import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LitAdapter, createLitAdapter } from '../adapter/lit-adapter'
import type { Engine } from '@ldesign/engine-core'

describe('LitAdapter', () => {
  let adapter: LitAdapter
  let mockEngine: Engine

  beforeEach(() => {
    adapter = new LitAdapter({ debug: false })
    mockEngine = {
      state: { get: vi.fn(), set: vi.fn(), subscribe: vi.fn() },
      events: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
      cache: { get: vi.fn(), set: vi.fn() },
      plugins: { get: vi.fn() },
    } as any
  })

  describe('基本功能', () => {
    it('应该正确创建适配器实例', () => {
      expect(adapter).toBeDefined()
      expect(adapter.name).toBe('lit')
      expect(adapter.version).toBe('1.0.0')
    })

    it('应该通过工厂函数创建适配器', () => {
      const adapter = createLitAdapter({ debug: true })
      expect(adapter).toBeInstanceOf(LitAdapter)
    })

    it('应该正确初始化', async () => {
      await adapter.init(mockEngine)
      expect(adapter.getEngine()).toBe(mockEngine)
    })
  })

  describe('生命周期', () => {
    it('应该正确执行 mount', async () => {
      await adapter.init(mockEngine)
      await expect(adapter.mount('#app')).resolves.toBeUndefined()
    })

    it('应该正确执行 destroy', async () => {
      await adapter.init(mockEngine)
      await adapter.destroy()
      expect(adapter.getEngine()).toBeUndefined()
    })
  })

  describe('配置选项', () => {
    it('应该支持 debug 模式', () => {
      const debugAdapter = new LitAdapter({ debug: true })
      expect(debugAdapter).toBeDefined()
    })

    it('应该支持 enableReactiveControllers 选项', () => {
      const adapter = new LitAdapter({ enableReactiveControllers: true })
      expect(adapter).toBeDefined()
    })
  })
})

