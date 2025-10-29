import type { FrameworkAdapter, Engine, StateManager, EventManager, CacheManager, PluginManager } from '@ldesign/engine-core'

export interface SvelteKitAdapterConfig {
  debug?: boolean
  enableSSR?: boolean
}

export class SvelteKitAdapter implements FrameworkAdapter {
  readonly name = 'sveltekit'
  readonly version = '1.0.0'
  
  private config: Required<SvelteKitAdapterConfig>
  private engine?: Engine
  
  constructor(config: SvelteKitAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableSSR: config.enableSSR ?? true,
    }
  }

  async init(engine: Engine): Promise<void> {
    this.engine = engine
    if (this.config.debug) {
      console.log('[SvelteKitAdapter] 初始化完成')
    }
  }

  async mount(container: HTMLElement | string): Promise<void> {}
  async unmount(): Promise<void> {}
  async destroy(): Promise<void> {
    await this.unmount()
    this.engine = undefined
  }

  getStateManager(): StateManager | undefined { return this.engine?.state }
  getEventManager(): EventManager | undefined { return this.engine?.events }
  getCacheManager(): CacheManager | undefined { return this.engine?.cache }
  getPluginManager(): PluginManager | undefined { return this.engine?.plugins }
  getEngine(): Engine | undefined { return this.engine }
}

export function createSvelteKitAdapter(config?: SvelteKitAdapterConfig): SvelteKitAdapter {
  return new SvelteKitAdapter(config)
}

