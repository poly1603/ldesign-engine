import type { FrameworkAdapter, Engine, StateManager, EventManager, CacheManager, PluginManager } from '@ldesign/engine-core'

export interface AlpineJSAdapterConfig {
  debug?: boolean
  autoInit?: boolean
}

export class AlpineJSAdapter implements FrameworkAdapter {
  readonly name = 'alpinejs'
  readonly version = '1.0.0'
  
  private config: Required<AlpineJSAdapterConfig>
  private engine?: Engine
  
  constructor(config: AlpineJSAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      autoInit: config.autoInit ?? true,
    }
  }

  async init(engine: Engine): Promise<void> {
    this.engine = engine
    
    if (this.config.debug) {
      console.log('[AlpineJSAdapter] 初始化完成')
    }
    
    // 注册 Alpine.js magic properties
    if (typeof window !== 'undefined' && (window as any).Alpine) {
      this.registerMagicProperties()
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

  private registerMagicProperties(): void {
    const Alpine = (window as any).Alpine
    const engine = this.engine
    
    // $engine magic property
    Alpine.magic('engine', () => engine)
    
    // $engineState magic property
    Alpine.magic('engineState', () => (path: string) => engine?.state.get(path))
    
    // $engineEmit magic property
    Alpine.magic('engineEmit', () => (event: string, data?: any) => engine?.events.emit(event, data))
  }
}

export function createAlpineJSAdapter(config?: AlpineJSAdapterConfig): AlpineJSAdapter {
  return new AlpineJSAdapter(config)
}

