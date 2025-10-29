import type { FrameworkAdapter, Engine, StateManager, EventManager, CacheManager, PluginManager } from '@ldesign/engine-core'

export interface AstroAdapterConfig {
  debug?: boolean
  enableIslands?: boolean
}

export class AstroAdapter implements FrameworkAdapter {
  readonly name = 'astro'
  readonly version = '1.0.0'
  
  private config: Required<AstroAdapterConfig>
  private engine?: Engine
  
  constructor(config: AstroAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableIslands: config.enableIslands ?? true,
    }
  }

  async init(engine: Engine): Promise<void> {
    this.engine = engine
    if (this.config.debug) {
      console.log('[AstroAdapter] 初始化完成')
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

export function createAstroAdapter(config?: AstroAdapterConfig): AstroAdapter {
  return new AstroAdapter(config)
}

