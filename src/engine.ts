import { createApp, App, ComponentPublicInstance, readonly } from 'vue'
import type {
  Engine,
  EngineConfig,
  Plugin,
  LifecycleHook,
  MiddlewareFunction,
  EventHandler,
  UnsubscribeFn,
  ConfigWatcher,
  UnwatchFn,
  ErrorHandler,
  DEFAULT_CONFIG,
  SYSTEM_EVENTS
} from './types'
import { EngineState } from './types'
import { EngineError } from './types'
import { EventEmitterImpl } from './event-emitter'
import { ConfigManagerImpl } from './config-manager'
import { DIContainerImpl } from './di-container'
import { MiddlewareManagerImpl } from './middleware-manager'
import { PluginManagerImpl } from './plugin-manager'

/**
 * 引擎实现类
 */
export class EngineImpl implements Engine {
  // 引擎信息
  readonly name: string
  readonly version: string
  
  private _state: EngineState = EngineState.CREATED
  private _app: App | null = null
  private _mountedInstance: ComponentPublicInstance | null = null
  private _rootComponent: any = null
  
  // 核心管理器
  private eventEmitter: EventEmitterImpl
  private configManager: ConfigManagerImpl
  private diContainer: DIContainerImpl
  private middlewareManager: MiddlewareManagerImpl
  private pluginManager: PluginManagerImpl
  
  // 错误处理
  private errorHandler?: ErrorHandler
  
  constructor(config: EngineConfig = {}) {
    try {
      // 初始化引擎信息
      this.name = config.name || 'LDesignEngine'
      this.version = config.version || '1.0.0'
      
      // 初始化管理器
      this.eventEmitter = new EventEmitterImpl()
      this.configManager = new ConfigManagerImpl(config)
      this.diContainer = new DIContainerImpl()
      this.middlewareManager = new MiddlewareManagerImpl()
      this.pluginManager = new PluginManagerImpl()
      
      // 设置错误处理器
      if (config.errorHandler) {
        this.errorHandler = config.errorHandler
      }
      
      // 注入核心服务
      this.setupCoreServices()
      
      // 发射创建事件
      this.emit('engine:created', this)
      
    } catch (error) {
      this.handleError(new EngineError('Failed to create engine', 'CREATE_ERROR', { cause: error }))
      throw error
    }
  }
  
  // 状态属性
  get state(): EngineState {
    return this._state
  }
  
  get app(): App | null {
    return this._app
  }
  
  get config(): Readonly<EngineConfig> {
    return readonly(this.configManager.getAll())
  }
  
  // 核心方法
  async mount(selector: string | Element): Promise<ComponentPublicInstance> {
    try {
      if (this._state !== EngineState.CREATED) {
        throw new EngineError(`Cannot mount engine in state: ${this._state}`)
      }
      
      this._state = EngineState.MOUNTING
      
      // 执行 beforeMount 中间件
      await this.executeMiddleware('beforeMount')
      
      // 创建 Vue 应用
      this._app = this.createVueApp()
      
      // 挂载应用
      this._mountedInstance = this._app.mount(selector)
      
      this._state = EngineState.MOUNTED
      
      // 执行 mounted 中间件
      await this.executeMiddleware('mounted')
      
      // 发射挂载事件
      this.emit('engine:mounted', this._mountedInstance)
      
      return this._mountedInstance
      
    } catch (error) {
      this._state = EngineState.ERROR
      const engineError = new EngineError('Failed to mount engine', 'MOUNT_ERROR', { cause: error })
      this.handleError(engineError)
      throw engineError
    }
  }
  
  async unmount(): Promise<void> {
    try {
      if (this._state !== EngineState.MOUNTED) {
        throw new EngineError(`Cannot unmount engine in state: ${this._state}`)
      }
      
      this._state = EngineState.UNMOUNTING
      
      // 执行 beforeUnmount 中间件
      await this.executeMiddleware('beforeUnmount')
      
      // 卸载应用
      if (this._app) {
        this._app.unmount()
        this._app = null
      }
      
      this._mountedInstance = null
      this._state = EngineState.UNMOUNTED
      
      // 执行 unmounted 中间件
      await this.executeMiddleware('unmounted')
      
      // 发射卸载事件
      this.emit('engine:unmounted')
      
    } catch (error) {
      this._state = EngineState.ERROR
      const engineError = new EngineError('Failed to unmount engine', 'UNMOUNT_ERROR', { cause: error })
      this.handleError(engineError)
      throw engineError
    }
  }
  
  async destroy(): Promise<void> {
    try {
      // 如果已挂载，先卸载
      if (this._state === EngineState.MOUNTED) {
        await this.unmount()
      }
      
      this._state = EngineState.DESTROYING
      
      // 卸载所有插件
      await this.pluginManager.clear(this)
      
      // 清理所有管理器
      this.middlewareManager.destroy()
      this.configManager.destroy()
      this.diContainer.destroy()
      this.eventEmitter.destroy()
      
      this._state = EngineState.DESTROYED
      
      // 发射销毁事件
      this.emit('engine:destroyed')
      
    } catch (error) {
      this._state = EngineState.ERROR
      const engineError = new EngineError('Failed to destroy engine', 'DESTROY_ERROR', { cause: error })
      this.handleError(engineError)
      throw engineError
    }
  }
  
  // 配置管理
  getConfig<T>(key: string): T | undefined {
    return this.configManager.get<T>(key)
  }
  
  setConfig(key: string, value: any): void {
    this.configManager.set(key, value)
  }
  
  updateConfig(updates: Partial<EngineConfig>): void {
    this.configManager.update(updates)
  }
  
  watchConfig(key: string, callback: ConfigWatcher): UnwatchFn {
    return this.configManager.watch(key, callback)
  }
  
  // 插件系统
  async use(plugin: Plugin, options?: any): Promise<Engine> {
    try {
      await this.pluginManager.install(plugin, this, options)
      return this
    } catch (error) {
      const pluginError = new EngineError(`Failed to install plugin: ${plugin.name}`, 'PLUGIN_INSTALL_ERROR', { cause: error })
      this.handleError(pluginError)
      this.emit('plugin:error', pluginError, { plugin: plugin.name })
      throw pluginError
    }
  }
  
  async unuse(pluginName: string): Promise<Engine> {
    try {
      await this.pluginManager.uninstall(pluginName, this)
      return this
    } catch (error) {
      const pluginError = new EngineError(`Failed to uninstall plugin: ${pluginName}`, 'PLUGIN_UNINSTALL_ERROR', { cause: error })
      this.handleError(pluginError)
      this.emit('plugin:error', pluginError, { plugin: pluginName })
      throw pluginError
    }
  }
  
  hasPlugin(pluginName: string): boolean {
    return this.pluginManager.has(pluginName)
  }
  
  // 中间件系统
  addMiddleware(hook: LifecycleHook, middleware: MiddlewareFunction): void {
    this.middlewareManager.add(hook, middleware)
  }
  
  removeMiddleware(hook: LifecycleHook, middleware: MiddlewareFunction): void {
    this.middlewareManager.remove(hook, middleware)
  }
  
  // 事件系统
  emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args)
  }
  
  on(event: string, handler: EventHandler): UnsubscribeFn {
    return this.eventEmitter.on(event, handler)
  }
  
  off(event: string, handler?: EventHandler): void {
    this.eventEmitter.off(event, handler)
  }
  
  once(event: string, handler: EventHandler): UnsubscribeFn {
    return this.eventEmitter.once(event, handler)
  }
  
  // 依赖注入
  provide(key: string | symbol, value: any): void {
    this.diContainer.provide(key, value)
    
    // 如果应用已创建，也在Vue应用中提供
    if (this._app) {
      this._app.provide(key, value)
    }
  }
  
  inject<T>(key: string | symbol): T | undefined {
    return this.diContainer.inject<T>(key)
  }
  
  // 私有方法
  
  /**
   * 设置核心服务
   */
  private setupCoreServices(): void {
    // 注入核心管理器
    this.diContainer.provide('eventEmitter', this.eventEmitter)
    this.diContainer.provide('configManager', this.configManager)
    this.diContainer.provide('diContainer', this.diContainer)
    this.diContainer.provide('middlewareManager', this.middlewareManager)
    this.diContainer.provide('pluginManager', this.pluginManager)
    this.diContainer.provide('engine', this)
  }
  
  /**
   * 创建Vue应用
   */
  private createVueApp(): App {
    // 获取根组件
    const rootComponent = this.configManager.get('rootComponent') || this.createDefaultRootComponent()
    
    // 创建应用
    const app = createApp(rootComponent)
    
    // 设置全局属性
    app.config.globalProperties.$engine = this
    
    // 提供核心服务到Vue应用
    const serviceKeys = this.diContainer.keys()
    serviceKeys.forEach((key: string | symbol) => {
      const value = this.diContainer.inject(key)
      if (value !== undefined) {
        app.provide(key, value)
      }
    })
    
    // 设置错误处理器
    if (this.errorHandler) {
      app.config.errorHandler = (error: unknown, instance, info) => {
        const engineError = error instanceof Error ? error : new Error(String(error))
        this.handleError(engineError, { instance, info, source: 'vue' })
      }
    }
    
    return app
  }
  
  /**
   * 创建默认根组件
   */
  private createDefaultRootComponent() {
    return {
      name: 'EngineRoot',
      template: '<div id="engine-root"><slot /></div>',
      setup() {
        return {}
      }
    }
  }
  
  /**
   * 执行中间件
   */
  private async executeMiddleware(hook: LifecycleHook): Promise<void> {
    try {
      const context = {
        engine: this,
        app: this._app,
        config: this.config,
        state: this._state,
        hook
      }
      
      await this.middlewareManager.execute(hook, context)
      
    } catch (error) {
      const middlewareError = new EngineError(`Middleware execution failed for hook: ${hook}`, 'MIDDLEWARE_ERROR', { cause: error })
      this.handleError(middlewareError)
      this.emit('middleware:error', middlewareError, { hook })
      throw middlewareError
    }
  }
  
  /**
   * 处理错误
   */
  private handleError(error: Error, context?: any): void {
    try {
      // 调用配置的错误处理器
      if (this.errorHandler) {
        this.errorHandler(error, context)
      }
      
      // 发射错误事件
      this.emit('engine:error', error, context)
      
      // 开发模式下输出到控制台
      if (this.configManager.get('dev.enabled')) {
        console.error('Engine Error:', error)
        if (context) {
          console.error('Context:', context)
        }
      }
      
    } catch (handlerError) {
      // 错误处理器本身出错，直接输出到控制台
      console.error('Error in error handler:', handlerError)
      console.error('Original error:', error)
    }
  }
  
  // 调试和开发方法
  
  /**
   * 获取引擎状态信息
   */
  getDebugInfo() {
    return {
      state: this._state,
      hasApp: !!this._app,
      hasMountedInstance: !!this._mountedInstance,
      config: this.config,
      plugins: this.pluginManager.list(),
      middlewareStats: this.middlewareManager.getStats(),
      eventListeners: this.eventEmitter.eventNames(),
      diServices: this.diContainer.keys(),
      memoryUsage: {
        middleware: this.middlewareManager.getMemoryUsage(),
        plugins: this.pluginManager.getMemoryUsage(),
        di: this.diContainer.getMemoryUsage(),
        events: this.eventEmitter.eventNames().reduce((total: number, event: string) => {
          return total + this.eventEmitter.listenerCount(event)
        }, 0)
      }
    }
  }
  
  /**
   * 检查引擎健康状态
   */
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = []
    
    // 检查状态
    if (this._state === EngineState.ERROR) {
      issues.push('Engine is in error state')
    }
    
    // 检查内存使用
    const memoryUsage = this.middlewareManager.getMemoryUsage()
    if (memoryUsage.middlewares > 100) {
      issues.push('Too many middleware registered')
    }
    
    // 检查事件监听器
    const totalListeners = this.eventEmitter.eventNames().reduce((total: number, event: string) => {
      return total + this.eventEmitter.listenerCount(event)
    }, 0)
    if (totalListeners > 1000) {
      issues.push('Too many event listeners')
    }
    
    // 检查插件状态
    const plugins = this.pluginManager.list()
    const failedPlugins = plugins.filter(p => !p.installed)
    if (failedPlugins.length > 0) {
      issues.push(`Failed plugins: ${failedPlugins.map(p => p.plugin.name).join(', ')}`)
    }
    
    return {
      healthy: issues.length === 0,
      issues
    }
  }
}