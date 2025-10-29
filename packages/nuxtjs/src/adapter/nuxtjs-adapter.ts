/**
 * Nuxt.js 框架适配器
 */

import type {
  FrameworkAdapter,
  Engine,
  StateManager,
  EventManager,
  CacheManager,
  PluginManager,
} from '@ldesign/engine-core'

export interface NuxtJSAdapterConfig {
  debug?: boolean
  enableSSR?: boolean
  enableAutoImports?: boolean
  serialization?: {
    serializeState?: boolean
    serializeCache?: boolean
  }
}

export class NuxtJSAdapter implements FrameworkAdapter {
  readonly name = 'nuxtjs'
  readonly version = '1.0.0'
  
  private config: Required<NuxtJSAdapterConfig>
  private engine?: Engine
  private isServer: boolean
  
  constructor(config: NuxtJSAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableSSR: config.enableSSR ?? true,
      enableAutoImports: config.enableAutoImports ?? true,
      serialization: {
        serializeState: config.serialization?.serializeState ?? true,
        serializeCache: config.serialization?.serializeCache ?? false,
      },
    }
    
    this.isServer = typeof window === 'undefined'
  }

  async init(engine: Engine): Promise<void> {
    this.engine = engine
    
    if (this.config.debug) {
      console.log('[NuxtJSAdapter] 初始化完成', { isServer: this.isServer })
    }
    
    if (this.isServer && this.config.enableSSR) {
      await this.initServer()
    }
    
    if (!this.isServer) {
      await this.initClient()
    }
  }

  async mount(container: HTMLElement | string): Promise<void> {
    if (this.config.debug) {
      console.log('[NuxtJSAdapter] 挂载组件', container)
    }
  }

  async unmount(): Promise<void> {
    if (this.config.debug) {
      console.log('[NuxtJSAdapter] 卸载组件')
    }
  }

  async destroy(): Promise<void> {
    if (this.config.debug) {
      console.log('[NuxtJSAdapter] 销毁适配器')
    }
    
    await this.unmount()
    this.engine = undefined
  }

  getStateManager(): StateManager | undefined {
    return this.engine?.state
  }

  getEventManager(): EventManager | undefined {
    return this.engine?.events
  }

  getCacheManager(): CacheManager | undefined {
    return this.engine?.cache
  }

  getPluginManager(): PluginManager | undefined {
    return this.engine?.plugins
  }

  getEngine(): Engine | undefined {
    return this.engine
  }

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
        console.log('[NuxtJSAdapter] 状态反序列化完成')
      }
    } catch (error) {
      console.error('[NuxtJSAdapter] 状态反序列化失败:', error)
    }
  }

  isServerSide(): boolean {
    return this.isServer
  }

  isClientSide(): boolean {
    return !this.isServer
  }

  private async initServer(): Promise<void> {
    if (this.config.debug) {
      console.log('[NuxtJSAdapter] 服务端初始化')
    }
  }

  private async initClient(): Promise<void> {
    if (this.config.debug) {
      console.log('[NuxtJSAdapter] 客户端初始化')
    }
    
    if (typeof window !== 'undefined' && (window as any).__NUXT_ENGINE_STATE__) {
      this.deserializeState((window as any).__NUXT_ENGINE_STATE__)
    }
  }
}

export function createNuxtJSAdapter(config?: NuxtJSAdapterConfig): NuxtJSAdapter {
  return new NuxtJSAdapter(config)
}

