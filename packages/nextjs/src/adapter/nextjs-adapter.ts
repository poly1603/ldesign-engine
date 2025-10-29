/**
 * Next.js 框架适配器
 * 
 * 支持 App Router 和 Pages Router
 * 支持 Server Components 和 Server Actions
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

/**
 * Next.js 适配器配置
 */
export interface NextJSAdapterConfig {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 是否启用 SSR */
  enableSSR?: boolean
  /** 是否启用 Server Components */
  enableServerComponents?: boolean
  /** 是否启用 Server Actions */
  enableServerActions?: boolean
  /** 路由模式 */
  routerMode?: 'app' | 'pages'
  /** 序列化配置 */
  serialization?: {
    serializeState?: boolean
    serializeCache?: boolean
  }
}

/**
 * Next.js 框架适配器
 * 
 * 特点:
 * - 支持 App Router 和 Pages Router
 * - 支持 Server Components
 * - 支持 Server Actions
 * - 支持 ISR/SSG/SSR
 * - 支持 Middleware
 * 
 * @example
 * ```typescript
 * import { createEngine } from '@ldesign/engine-core'
 * import { NextJSAdapter } from '@ldesign/engine-nextjs'
 * 
 * const engine = createEngine({
 *   adapter: new NextJSAdapter({
 *     enableSSR: true,
 *     enableServerComponents: true,
 *     routerMode: 'app'
 *   })
 * })
 * ```
 */
export class NextJSAdapter implements FrameworkAdapter {
  readonly name = 'nextjs'
  readonly version = '1.0.0'
  
  private config: Required<NextJSAdapterConfig>
  private engine?: Engine
  private isServer: boolean
  
  constructor(config: NextJSAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableSSR: config.enableSSR ?? true,
      enableServerComponents: config.enableServerComponents ?? true,
      enableServerActions: config.enableServerActions ?? true,
      routerMode: config.routerMode ?? 'app',
      serialization: {
        serializeState: config.serialization?.serializeState ?? true,
        serializeCache: config.serialization?.serializeCache ?? false,
      },
    }
    
    this.isServer = typeof window === 'undefined'
  }

  /**
   * 初始化适配器
   */
  async init(engine: Engine): Promise<void> {
    this.engine = engine
    
    if (this.config.debug) {
      console.log('[NextJSAdapter] 初始化完成', {
        isServer: this.isServer,
        routerMode: this.config.routerMode,
      })
    }
    
    // 服务端初始化
    if (this.isServer && this.config.enableSSR) {
      await this.initServer()
    }
    
    // 客户端初始化
    if (!this.isServer) {
      await this.initClient()
    }
  }

  /**
   * 挂载组件
   */
  async mount(container: HTMLElement | string): Promise<void> {
    if (this.config.debug) {
      console.log('[NextJSAdapter] 挂载组件', container)
    }
    
    // Next.js 自动处理挂载
  }

  /**
   * 卸载组件
   */
  async unmount(): Promise<void> {
    if (this.config.debug) {
      console.log('[NextJSAdapter] 卸载组件')
    }
  }

  /**
   * 销毁适配器
   */
  async destroy(): Promise<void> {
    if (this.config.debug) {
      console.log('[NextJSAdapter] 销毁适配器')
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
   * 序列化状态 (SSR)
   */
  serializeState(): string {
    if (!this.engine) return '{}'
    
    const state = this.config.serialization.serializeState
      ? this.engine.state.getAll()
      : {}
    
    const cache = this.config.serialization.serializeCache
      ? this.engine.cache.getAll()
      : {}
    
    return JSON.stringify({ state, cache })
  }

  /**
   * 反序列化状态 (Hydration)
   */
  deserializeState(serialized: string): void {
    if (!this.engine) return
    
    try {
      const { state, cache } = JSON.parse(serialized)
      
      if (state && this.config.serialization.serializeState) {
        Object.entries(state).forEach(([key, value]) => {
          this.engine!.state.set(key, value)
        })
      }
      
      if (cache && this.config.serialization.serializeCache) {
        Object.entries(cache).forEach(([key, value]) => {
          this.engine!.cache.set(key, value)
        })
      }
      
      if (this.config.debug) {
        console.log('[NextJSAdapter] 状态反序列化完成')
      }
    } catch (error) {
      console.error('[NextJSAdapter] 状态反序列化失败:', error)
    }
  }

  /**
   * 检查是否在服务端
   */
  isServerSide(): boolean {
    return this.isServer
  }

  /**
   * 检查是否在客户端
   */
  isClientSide(): boolean {
    return !this.isServer
  }

  /**
   * 获取路由模式
   */
  getRouterMode(): 'app' | 'pages' {
    return this.config.routerMode
  }

  /**
   * 初始化服务端
   */
  private async initServer(): Promise<void> {
    if (this.config.debug) {
      console.log('[NextJSAdapter] 服务端初始化')
    }
    
    // 服务端特定初始化逻辑
  }

  /**
   * 初始化客户端
   */
  private async initClient(): Promise<void> {
    if (this.config.debug) {
      console.log('[NextJSAdapter] 客户端初始化')
    }
    
    // 尝试从 window 恢复状态
    if (typeof window !== 'undefined' && (window as any).__ENGINE_STATE__) {
      this.deserializeState((window as any).__ENGINE_STATE__)
    }
  }
}

/**
 * 创建 Next.js 适配器
 */
export function createNextJSAdapter(config?: NextJSAdapterConfig): NextJSAdapter {
  return new NextJSAdapter(config)
}

