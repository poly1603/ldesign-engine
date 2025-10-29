/**
 * Lit 框架适配器
 * 
 * 为 Lit Web Components 提供引擎集成
 * 支持 Lit 的响应式属性和生命周期
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
import type { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * Lit 适配器配置
 */
export interface LitAdapterConfig {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 是否自动注册自定义元素 */
  autoRegister?: boolean
  /** 自定义元素前缀 */
  elementPrefix?: string
}

/**
 * Lit 框架适配器
 * 
 * 特点:
 * - 支持 Lit 的响应式属性系统
 * - 集成 Reactive Controllers
 * - 支持 Web Components 标准
 * - 支持 Shadow DOM
 * 
 * @example
 * ```typescript
 * import { createEngine } from '@ldesign/engine-core'
 * import { LitAdapter } from '@ldesign/engine-lit'
 * 
 * const engine = createEngine({
 *   adapter: new LitAdapter({
 *     debug: false,
 *     autoRegister: true,
 *     elementPrefix: 'app'
 *   })
 * })
 * ```
 */
export class LitAdapter implements FrameworkAdapter {
  readonly name = 'lit'
  readonly version = '1.0.0'
  
  private config: Required<LitAdapterConfig>
  private engine?: Engine
  private controllers = new WeakMap<ReactiveControllerHost, Set<ReactiveController>>()
  
  constructor(config: LitAdapterConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      autoRegister: config.autoRegister ?? true,
      elementPrefix: config.elementPrefix ?? 'app',
    }
  }

  /**
   * 初始化适配器
   */
  async init(engine: Engine): Promise<void> {
    this.engine = engine
    
    if (this.config.debug) {
      console.log('[LitAdapter] 初始化完成')
    }
  }

  /**
   * 挂载组件
   */
  async mount(container: HTMLElement | string): Promise<void> {
    if (this.config.debug) {
      console.log('[LitAdapter] 挂载组件', container)
    }
    
    // Lit 组件通过自定义元素自动挂载
    // 不需要手动挂载逻辑
  }

  /**
   * 卸载组件
   */
  async unmount(): Promise<void> {
    if (this.config.debug) {
      console.log('[LitAdapter] 卸载组件')
    }
    
    // 清理控制器
    this.controllers = new WeakMap()
  }

  /**
   * 销毁适配器
   */
  async destroy(): Promise<void> {
    if (this.config.debug) {
      console.log('[LitAdapter] 销毁适配器')
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
   * 创建状态控制器
   * 
   * @param host - Lit 组件实例
   * @param path - 状态路径
   * @param initialValue - 初始值
   * @returns 状态控制器
   * 
   * @example
   * ```typescript
   * class MyElement extends LitElement {
   *   private countController = adapter.createStateController(this, 'count', 0)
   *   
   *   render() {
   *     return html`<div>Count: ${this.countController.value}</div>`
   *   }
   * }
   * ```
   */
  createStateController<T>(
    host: ReactiveControllerHost,
    path: string,
    initialValue?: T
  ): StateController<T> {
    const controller = new StateController<T>(
      host,
      this.getStateManager()!,
      path,
      initialValue
    )
    
    // 注册控制器
    if (!this.controllers.has(host)) {
      this.controllers.set(host, new Set())
    }
    this.controllers.get(host)!.add(controller)
    
    return controller
  }

  /**
   * 创建事件控制器
   * 
   * @param host - Lit 组件实例
   * @param eventName - 事件名称
   * @param handler - 事件处理函数
   * @returns 事件控制器
   */
  createEventController<T = any>(
    host: ReactiveControllerHost,
    eventName: string,
    handler: (data: T) => void | Promise<void>
  ): EventController<T> {
    const controller = new EventController<T>(
      host,
      this.getEventManager()!,
      eventName,
      handler
    )
    
    // 注册控制器
    if (!this.controllers.has(host)) {
      this.controllers.set(host, new Set())
    }
    this.controllers.get(host)!.add(controller)
    
    return controller
  }

  /**
   * 获取引擎实例
   */
  getEngine(): Engine | undefined {
    return this.engine
  }
}

/**
 * 状态控制器
 * 
 * Lit Reactive Controller for state management
 */
export class StateController<T> implements ReactiveController {
  private _value: T
  private unwatch?: () => void
  
  constructor(
    private host: ReactiveControllerHost,
    private stateManager: StateManager,
    private path: string,
    initialValue?: T
  ) {
    this.host.addController(this)
    
    // 初始化值
    const existingValue = this.stateManager.get<T>(this.path)
    if (existingValue !== undefined) {
      this._value = existingValue
    } else if (initialValue !== undefined) {
      this._value = initialValue
      this.stateManager.set(this.path, initialValue)
    } else {
      this._value = undefined as T
    }
  }
  
  hostConnected(): void {
    // 监听状态变化
    this.unwatch = this.stateManager.watch<T>(this.path, (newValue) => {
      this._value = newValue
      this.host.requestUpdate()
    })
  }
  
  hostDisconnected(): void {
    // 取消监听
    if (this.unwatch) {
      this.unwatch()
      this.unwatch = undefined
    }
  }
  
  get value(): T {
    return this._value
  }
  
  set value(newValue: T) {
    this._value = newValue
    this.stateManager.set(this.path, newValue)
    this.host.requestUpdate()
  }
}

/**
 * 事件控制器
 * 
 * Lit Reactive Controller for event handling
 */
export class EventController<T = any> implements ReactiveController {
  private unsubscribe?: () => void
  
  constructor(
    private host: ReactiveControllerHost,
    private eventManager: EventManager,
    private eventName: string,
    private handler: (data: T) => void | Promise<void>
  ) {
    this.host.addController(this)
  }
  
  hostConnected(): void {
    // 订阅事件
    this.unsubscribe = this.eventManager.on<T>(this.eventName, this.handler)
  }
  
  hostDisconnected(): void {
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }
  
  emit(data?: T): void {
    this.eventManager.emit(this.eventName, data)
  }
}

/**
 * 创建 Lit 适配器
 * 
 * @param config - 适配器配置
 * @returns Lit 适配器实例
 * 
 * @example
 * ```typescript
 * const adapter = createLitAdapter({
 *   debug: process.env.NODE_ENV === 'development',
 *   autoRegister: true,
 *   elementPrefix: 'my-app'
 * })
 * ```
 */
export function createLitAdapter(config?: LitAdapterConfig): LitAdapter {
  return new LitAdapter(config)
}

