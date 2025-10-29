import type { FrameworkAdapter, Engine, StateManager, EventManager, CacheManager, PluginManager } from '@ldesign/engine-core'

export interface RemixAdapterConfig {
  debug?: boolean
  enableSSR?: boolean
}

export class RemixAdapter implements FrameworkAdapter {
  readonly name = 'remix'
  readonly version = '1.0.0'
  
  private config: Required<RemixAdapterConfig>
  private engine?: Engine
  
  constructor(config: RemixAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableSSR: config.enableSSR ?? true,
    }
  }

  async init(engine: Engine): Promise<void> {
    this.engine = engine
    if (this.config.debug) {
      console.log('[RemixAdapter] 初始化完成')
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

export function createRemixAdapter(config?: RemixAdapterConfig): RemixAdapter {
  return new RemixAdapter(config)
}

