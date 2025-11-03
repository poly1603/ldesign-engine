/**
 * Angular 引擎服务
 */

import { Injectable, InjectionToken, Inject, Optional, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { CoreEngineImpl, type Plugin, type Middleware, type CoreEngineConfig, type CoreEngine } from '@ldesign/engine-core'
import type { AngularEngine } from '../types'

/**
 * Engine injection token
 */
export const ENGINE_TOKEN = new InjectionToken<CoreEngine>('ENGINE_TOKEN')

/**
 * Provide engine instance to Angular DI
 */
export function provideEngine(engine: CoreEngine): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ENGINE_TOKEN, useValue: engine }
  ])
}

/**
 * 引擎服务
 * 
 * Angular 应用的核心引擎服务，提供 RxJS Observable 支持
 * 
 * @example
 * ```ts
 * @Component({
 *   selector: 'app-root',
 *   template: `
 *     <div>
 *       <p>Count: {{ count$ | async }}</p>
 *       <button (click)="increment()">+1</button>
 *     </div>
 *   `
 * })
 * export class AppComponent {
 *   count$ = this.engineService.getState$<number>('counter', 0)
 *   
 *   constructor(private engineService: EngineService) {}
 *   
 *   increment() {
 *     const current = this.engineService.getState<number>('counter', 0)
 *     this.engineService.setState('counter', current + 1)
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EngineService implements AngularEngine {
  private engine: CoreEngineImpl
  private engineSubject = new BehaviorSubject<CoreEngine | null>(null)
  
  /**
   * Engine observable
   */
  public engine$ = this.engineSubject.asObservable()

  // Plugin-specific observables
  public locale$: Observable<string>
  public theme$: Observable<string>
  public size$: Observable<string>
  public status$: Observable<string>
  public events$: Observable<any>

  constructor(@Optional() @Inject(ENGINE_TOKEN) injectedEngine?: CoreEngine) {
    // 使用注入的引擎实例或创建默认实例
    if (injectedEngine) {
      this.engine = injectedEngine as CoreEngineImpl
    } else {
      this.engine = new CoreEngineImpl({
        name: 'Angular Engine',
        version: '1.0.0'
      })
    }
    this.engineSubject.next(this.engine)

    // 初始化插件相关的 observables
    this.locale$ = this.createPluginObservable$('i18n', 'locale', 'en')
    this.theme$ = this.createPluginObservable$('theme', 'theme', 'light')
    this.size$ = this.createPluginObservable$('size', 'size', 'medium')
    this.status$ = this.createStatusObservable$()
    this.events$ = this.createEventsObservable$()
  }

  /**
   * 创建插件状态的 Observable
   */
  private createPluginObservable$(pluginName: string, statePath: string, defaultValue: any): Observable<any> {
    return new Observable(observer => {
      const updateValue = () => {
        const plugin = this.engine.plugins.get(pluginName)
        if (plugin?.api) {
          // 尝试从插件 API 获取值
          const getter = `get${statePath.charAt(0).toUpperCase() + statePath.slice(1)}`
          const value = plugin.api[getter] ? plugin.api[getter]() : defaultValue
          observer.next(value)
        } else {
          observer.next(defaultValue)
        }
      }

      // 立即发送初始值
      updateValue()

      // 监听状态变化
      const unwatch = this.engine.state.watch(`${pluginName}.${statePath}`, () => {
        updateValue()
      })

      // 监听插件注册
      const unsubscribe = this.engine.events.on('plugin:registered', (data: any) => {
        if (data.name === pluginName) {
          updateValue()
        }
      })

      return () => {
        unwatch()
        unsubscribe()
      }
    })
  }

  /**
   * 创建状态 Observable
   */
  private createStatusObservable$(): Observable<string> {
    return new Observable(observer => {
      const updateStatus = () => {
        const status = this.engine.getStatus()
        observer.next(status.status || 'initialized')
      }

      updateStatus()

      const interval = setInterval(updateStatus, 1000)

      return () => clearInterval(interval)
    })
  }

  /**
   * 创建事件流 Observable
   */
  private createEventsObservable$(): Observable<any> {
    return new Observable(observer => {
      const unsubscribe = this.engine.events.on('*', (event: any) => {
        observer.next(event)
      })

      return () => unsubscribe()
    })
  }

  /**
   * 初始化引擎
   */
  async init(config?: CoreEngineConfig): Promise<void> {
    if (config) {
      // 重新创建引擎实例
      this.engine = new CoreEngineImpl(config)
      this.engineSubject.next(this.engine)
    }
    await this.engine.init()
  }
  
  /**
   * 获取引擎实例
   */
  getEngine(): CoreEngine {
    return this.engine
  }

  /**
   * 注册插件
   */
  async use(plugin: Plugin): Promise<void> {
    return this.engine.use(plugin)
  }

  /**
   * 注册中间件
   */
  useMiddleware(middleware: Middleware): void {
    this.engine.middleware.use(middleware)
  }
  
  /**
   * 获取插件
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.engine.plugins.get(pluginName)
  }

  /**
   * 获取插件的 Observable
   * 
   * @param pluginName - 插件名称
   * @returns 插件的 Observable
   */
  getPlugin$(pluginName: string): Observable<Plugin | undefined> {
    const initialPlugin = this.engine.plugins.get(pluginName)
    const pluginSubject = new BehaviorSubject<Plugin | undefined>(initialPlugin)
    
    const unsubscribe = this.engine.events.on('plugin:registered', (data: any) => {
      if (data.name === pluginName) {
        pluginSubject.next(this.engine.plugins.get(pluginName))
      }
    })
    
    return pluginSubject.asObservable()
  }
  
  /**
   * 获取状态的 Observable
   * 
   * @param path - 状态路径
   * @param initialValue - 初始值
   * @returns 状态的 Observable
   */
  getState$<T>(path: string, initialValue?: T): Observable<T> {
    const value = this.engine.state.getState(path) ?? initialValue
    const stateSubject = new BehaviorSubject<T>(value as T)
    
    const unwatch = this.engine.state.watch(path, (newValue) => {
      stateSubject.next(newValue as T)
    })
    
    return stateSubject.asObservable()
  }
  
  /**
   * 获取状态值
   */
  getState<T>(path: string, initialValue?: T): T {
    return this.engine.state.getState(path) ?? initialValue
  }
  
  /**
   * 设置状态值
   */
  setState<T>(path: string, value: T): void {
    this.engine.state.setState(path, value)
  }
  
  /**
   * 获取配置的 Observable
   */
  getConfig$<T>(key: string, defaultValue?: T): Observable<T> {
    const value = this.engine.config.get(key, defaultValue)
    const configSubject = new BehaviorSubject<T>(value as T)
    
    const unwatch = this.engine.config.watch(key, (newValue) => {
      configSubject.next(newValue as T)
    })
    
    return configSubject.asObservable()
  }
  
  /**
   * 监听引擎事件
   */
  onEvent<T = any>(eventName: string): Observable<T> {
    return new Observable<T>(observer => {
      const unsubscribe = this.engine.events.on(eventName, (data: T) => {
        observer.next(data)
      })
      
      return () => unsubscribe()
    })
  }
  
  /**
   * 获取引擎状态的 Observable
   */
  getStatus$(): Observable<any> {
    const statusSubject = new BehaviorSubject(this.engine.getStatus())
    
    const interval = setInterval(() => {
      statusSubject.next(this.engine.getStatus())
    }, 1000)
    
    return new Observable(observer => {
      const subscription = statusSubject.subscribe(observer)
      
      return () => {
        clearInterval(interval)
        subscription.unsubscribe()
      }
    })
  }

  // 代理所有 CoreEngine 的属性和方法
  get state() {
    return this.engine.state
  }

  get events() {
    return this.engine.events
  }

  get lifecycle() {
    return this.engine.lifecycle
  }

  get logger() {
    return this.engine.logger
  }

  get plugins() {
    return this.engine.plugins
  }

  get middleware() {
    return this.engine.middleware
  }

  get config() {
    return this.engine.config
  }

  get version() {
    return this.engine.version
  }

  destroy(): void {
    this.engine.destroy()
  }
}


