/**
 * Qwik 框架适配器
 * 
 * 为 Qwik 框架提供引擎集成
 * 支持 Qwik 的可恢复性 (Resumability) 和细粒度响应式
 * 
 * @packageDocumentation
 */

import type {
  FrameworkAdapter,
  Engine,
  StateManager,
  EventManager,
  CacheManager,
  PluginManager,
} from '@ldesign/engine-core'
import type { Signal, QRL } from '@builder.io/qwik'

/**
 * Qwik 适配器配置
 */
export interface QwikAdapterConfig {
  /** 是否启用 SSR 支持 */
  enableSSR?: boolean
  /** 是否启用调试模式 */
  debug?: boolean
  /** 序列化配置 */
  serialization?: {
    /** 是否序列化状态 */
    serializeState?: boolean
    /** 是否序列化事件 */
    serializeEvents?: boolean
  }
}

/**
 * Qwik 框架适配器
 * 
 * 特点:
 * - 支持 Qwik 的可恢复性 (Resumability)
 * - 集成 Qwik 的 Signal 系统
 * - 支持 SSR 和水合 (Hydration)
 * - 支持 QRL (Qwik URL) 序列化
 * 
 * @example
 * ```typescript
 * import { createEngine } from '@ldesign/engine-core'
 * import { QwikAdapter } from '@ldesign/engine-qwik'
 * 
 * const engine = createEngine({
 *   adapter: new QwikAdapter({
 *     enableSSR: true,
 *     debug: false
 *   })
 * })
 * ```
 */
export class QwikAdapter implements FrameworkAdapter {
  readonly name = 'qwik'
  readonly version = '1.0.0'
  
  private config: Required<QwikAdapterConfig>
  private engine?: Engine
  private signalMap = new WeakMap<any, Signal<any>>()
  
  constructor(config: QwikAdapterConfig = {}) {
    this.config = {
      enableSSR: config.enableSSR ?? false,
      debug: config.debug ?? false,
      serialization: {
        serializeState: config.serialization?.serializeState ?? true,
        serializeEvents: config.serialization?.serializeEvents ?? false,
      },
    }
  }

  /**
   * 初始化适配器
   */
  async init(engine: Engine): Promise<void> {
    this.engine = engine
    
    if (this.config.debug) {
      console.log('[QwikAdapter] 初始化完成')
    }
    
    // 设置 SSR 环境
    if (this.config.enableSSR) {
      this.setupSSR()
    }
  }

  /**
   * 挂载组件
   */
  async mount(container: HTMLElement | string): Promise<void> {
    if (this.config.debug) {
      console.log('[QwikAdapter] 挂载组件', container)
    }
    
    // Qwik 使用声明式挂载,通常不需要手动挂载
    // 组件通过 JSX 自动渲染
  }

  /**
   * 卸载组件
   */
  async unmount(): Promise<void> {
    if (this.config.debug) {
      console.log('[QwikAdapter] 卸载组件')
    }
    
    // 清理资源
    this.signalMap = new WeakMap()
  }

  /**
   * 销毁适配器
   */
  async destroy(): Promise<void> {
    if (this.config.debug) {
      console.log('[QwikAdapter] 销毁适配器')
    }
    
    await this.unmount()
    this.engine = undefined
  }

  /**
   * 获取状态管理器
   */
  getStateManager(): StateManager | undefined {
    return this.engine?.state
  }

  /**
   * 获取事件管理器
   */
  getEventManager(): EventManager | undefined {
    return this.engine?.events
  }

  /**
   * 获取缓存管理器
   */
  getCacheManager(): CacheManager | undefined {
    return this.engine?.cache
  }

  /**
   * 获取插件管理器
   */
  getPluginManager(): PluginManager | undefined {
    return this.engine?.plugins
  }

  /**
   * 创建响应式状态 (Signal)
   * 
   * @param initialValue - 初始值
   * @returns Qwik Signal
   * 
   * @example
   * ```typescript
   * const count = adapter.createSignal(0)
   * count.value++ // 触发更新
   * ```
   */
  createSignal<T>(initialValue: T): Signal<T> {
    // 注意: 这里需要实际的 Qwik Signal 实现
    // 这是一个简化的接口定义
    const signal = {
      value: initialValue,
    } as Signal<T>
    
    return signal
  }

  /**
   * 同步状态到 Signal
   * 
   * @param path - 状态路径
   * @param signal - Qwik Signal
   */
  syncStateToSignal<T>(path: string, signal: Signal<T>): () => void {
    const stateManager = this.getStateManager()
    if (!stateManager) {
      throw new Error('StateManager 未初始化')
    }
    
    // 初始同步
    const initialValue = stateManager.get<T>(path)
    if (initialValue !== undefined) {
      signal.value = initialValue
    }
    
    // 监听状态变化
    const unwatch = stateManager.watch<T>(path, (newValue) => {
      signal.value = newValue
    })
    
    return unwatch
  }

  /**
   * 同步 Signal 到状态
   * 
   * @param signal - Qwik Signal
   * @param path - 状态路径
   */
  syncSignalToState<T>(signal: Signal<T>, path: string): void {
    const stateManager = this.getStateManager()
    if (!stateManager) {
      throw new Error('StateManager 未初始化')
    }
    
    // 使用 Proxy 监听 Signal 变化
    const originalValue = signal.value
    Object.defineProperty(signal, 'value', {
      get() {
        return originalValue
      },
      set(newValue: T) {
        stateManager.set(path, newValue)
      },
    })
  }

  /**
   * 序列化状态 (用于 SSR)
   * 
   * @returns 序列化的状态
   */
  serializeState(): string {
    if (!this.config.serialization.serializeState) {
      return '{}'
    }
    
    const stateManager = this.getStateManager()
    if (!stateManager) {
      return '{}'
    }
    
    // 获取所有状态
    const state = stateManager.getState()
    
    // 序列化为 JSON
    return JSON.stringify(state)
  }

  /**
   * 反序列化状态 (用于水合)
   * 
   * @param serialized - 序列化的状态
   */
  deserializeState(serialized: string): void {
    if (!this.config.serialization.serializeState) {
      return
    }
    
    const stateManager = this.getStateManager()
    if (!stateManager) {
      return
    }
    
    try {
      const state = JSON.parse(serialized)
      
      // 恢复状态
      Object.entries(state).forEach(([key, value]) => {
        stateManager.set(key, value)
      })
    } catch (error) {
      console.error('[QwikAdapter] 反序列化状态失败:', error)
    }
  }

  /**
   * 设置 SSR 环境
   */
  private setupSSR(): void {
    if (typeof window === 'undefined') {
      // 服务端环境
      if (this.config.debug) {
        console.log('[QwikAdapter] SSR 模式已启用')
      }
    }
  }

  /**
   * 检查是否在服务端
   */
  isServer(): boolean {
    return typeof window === 'undefined'
  }

  /**
   * 检查是否在客户端
   */
  isClient(): boolean {
    return typeof window !== 'undefined'
  }
}

/**
 * 创建 Qwik 适配器
 * 
 * @param config - 适配器配置
 * @returns Qwik 适配器实例
 * 
 * @example
 * ```typescript
 * const adapter = createQwikAdapter({
 *   enableSSR: true,
 *   debug: process.env.NODE_ENV === 'development'
 * })
 * ```
 */
export function createQwikAdapter(config?: QwikAdapterConfig): QwikAdapter {
  return new QwikAdapter(config)
}

