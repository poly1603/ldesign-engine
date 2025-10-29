/**
 * Preact 框架适配器
 * 
 * 为 Preact 框架提供引擎集成
 * 兼容 React API，但更轻量
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
import type { ComponentType, VNode } from 'preact'

/**
 * Preact 适配器配置
 */
export interface PreactAdapterConfig {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 是否启用 Signals 支持 */
  enableSignals?: boolean
  /** 是否启用 Preact DevTools */
  enableDevTools?: boolean
}

/**
 * Preact 框架适配器
 * 
 * 特点:
 * - 轻量级 (3KB)
 * - 兼容 React API
 * - 支持 Signals (@preact/signals)
 * - 快速虚拟 DOM
 * 
 * @example
 * ```typescript
 * import { createEngine } from '@ldesign/engine-core'
 * import { PreactAdapter } from '@ldesign/engine-preact'
 * 
 * const engine = createEngine({
 *   adapter: new PreactAdapter({
 *     debug: false,
 *     enableSignals: true
 *   })
 * })
 * ```
 */
export class PreactAdapter implements FrameworkAdapter {
  readonly name = 'preact'
  readonly version = '1.0.0'
  
  private config: Required<PreactAdapterConfig>
  private engine?: Engine
  private rootElement?: HTMLElement
  
  constructor(config: PreactAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableSignals: config.enableSignals ?? true,
      enableDevTools: config.enableDevTools ?? false,
    }
  }

  /**
   * 初始化适配器
   */
  async init(engine: Engine): Promise<void> {
    this.engine = engine
    
    if (this.config.debug) {
      console.log('[PreactAdapter] 初始化完成')
    }
    
    // 启用 DevTools
    if (this.config.enableDevTools && typeof window !== 'undefined') {
      this.setupDevTools()
    }
  }

  /**
   * 挂载组件
   */
  async mount(container: HTMLElement | string): Promise<void> {
    const element = typeof container === 'string'
      ? document.querySelector(container)
      : container
    
    if (!element) {
      throw new Error(`Container not found: ${container}`)
    }
    
    this.rootElement = element as HTMLElement
    
    if (this.config.debug) {
      console.log('[PreactAdapter] 挂载组件', element)
    }
  }

  /**
   * 卸载组件
   */
  async unmount(): Promise<void> {
    if (this.config.debug) {
      console.log('[PreactAdapter] 卸载组件')
    }
    
    this.rootElement = undefined
  }

  /**
   * 销毁适配器
   */
  async destroy(): Promise<void> {
    if (this.config.debug) {
      console.log('[PreactAdapter] 销毁适配器')
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
   * 获取引擎实例
   */
  getEngine(): Engine | undefined {
    return this.engine
  }

  /**
   * 获取根元素
   */
  getRootElement(): HTMLElement | undefined {
    return this.rootElement
  }

  /**
   * 设置 DevTools
   */
  private setupDevTools(): void {
    // Preact DevTools 自动检测
    if (typeof window !== 'undefined') {
      (window as any).__PREACT_DEVTOOLS__ = {
        attachPreact: '10.0.0',
      }
    }
  }

  /**
   * 检查是否支持 Signals
   */
  supportsSignals(): boolean {
    return this.config.enableSignals
  }
}

/**
 * 创建 Preact 适配器
 * 
 * @param config - 适配器配置
 * @returns Preact 适配器实例
 * 
 * @example
 * ```typescript
 * const adapter = createPreactAdapter({
 *   debug: process.env.NODE_ENV === 'development',
 *   enableSignals: true,
 *   enableDevTools: true
 * })
 * ```
 */
export function createPreactAdapter(config?: PreactAdapterConfig): PreactAdapter {
  return new PreactAdapter(config)
}

