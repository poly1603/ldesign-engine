/**
 * Vue3 引擎实现
 *
 * 提供基于 Vue3 的应用引擎，整合框架适配器、插件系统和路由功能
 *
 * @module engine/vue-engine
 */

import { createApp, App, Component } from 'vue'
import {
  CoreEngine,
  EngineCoreImpl,
  CoreEngineConfig,
  createServiceContainer,
  createConfigManager,
  ServiceContainer,
  ConfigManager,
  Plugin,
} from '@ldesign/engine-core'
import { ENGINE_KEY, CONTAINER_KEY, CONFIG_KEY } from '../composables/use-engine'
import { VueDevtoolsAdapter, DevtoolsOptions, createVueDevtoolsAdapter } from '../devtools'

/**
 * Vue3 引擎配置
 */
export interface VueEngineConfig extends CoreEngineConfig {
  /** Vue 应用配置 */
  app?: {
    /** 根组件 */
    rootComponent?: Component
    /** 挂载选项 */
    mountOptions?: Record<string, any>
    /** 全局属性 */
    globalProperties?: Record<string, any>
    /** 全局组件 */
    globalComponents?: Record<string, Component>
    /** 全局指令 */
    globalDirectives?: Record<string, any>
  }
  /** 插件列表（在 beforeMount 时自动安装） */
  plugins?: Plugin[]
  /** Devtools 配置 */
  devtools?: DevtoolsOptions | boolean
}

/**
 * Vue3 引擎实现
 * 
 * 特性：
 * - 基于 Core 引擎扩展
 * - 内置 Vue3 框架适配
 * - 支持路由集成
 * - 支持依赖注入
 * - 支持插件扩展
 * - 支持配置管理
 * 
 * @example
 * ```typescript
 * const engine = new VueEngine({
 *   name: 'My App',
 *   debug: true,
 *   app: {
 *     rootComponent: App,
 *     globalProperties: {
 *       $api: apiService
 *     }
 *   },
 *   router: {
 *     enabled: true,
 *     options: routerOptions
 *   }
 * })
 * 
 * await engine.mount('#app')
 * ```
 */
export class VueEngine extends EngineCoreImpl {
  /** Vue 应用实例 */
  private app: App | null = null

  /** 服务容器 */
  readonly container: ServiceContainer

  /** 配置管理器 */
  readonly configManager: ConfigManager

  /** 引擎配置 */
  protected vueConfig: VueEngineConfig

  /** 是否已挂载 */
  private mounted = false

  /** Devtools 适配器 */
  private devtoolsAdapter: VueDevtoolsAdapter | null = null

  /**
   * 构造函数
   * 
   * @param config - 引擎配置
   */
  constructor(config: VueEngineConfig = {}) {
    // 调用父类构造函数
    super(config)

    this.vueConfig = config

    // 创建服务容器
    this.container = createServiceContainer()

    // 创建配置管理器
    this.configManager = createConfigManager({
      environment: config.environment || 'development',
      defaults: config.defaults,
    })

    // 注册核心服务
    this.registerCoreServices()

    // 自动安装配置中的插件
    if (config.plugins && config.plugins.length > 0) {
      this.lifecycle.on('beforeMount', async () => {
        for (const plugin of config.plugins!) {
          await this.use(plugin)
        }
      })
    }
  }

  /**
   * 创建 Vue 应用
   * 
   * @param rootComponent - 根组件
   * @returns Vue 应用实例
   */
  async createVueApp(rootComponent?: Component): Promise<App> {
    // 使用传入的根组件或配置中的根组件
    const component = rootComponent || this.vueConfig.app?.rootComponent

    if (!component) {
      throw new Error('Root component is required')
    }

    // 创建 Vue 应用
    this.app = createApp(component, this.vueConfig.app?.mountOptions)

    // 设置全局属性
    if (this.vueConfig.app?.globalProperties) {
      Object.entries(this.vueConfig.app.globalProperties).forEach(([key, value]) => {
        this.app!.config.globalProperties[key] = value
      })
    }

    // 注册全局组件
    if (this.vueConfig.app?.globalComponents) {
      Object.entries(this.vueConfig.app.globalComponents).forEach(([name, component]) => {
        this.app!.component(name, component)
      })
    }

    // 注册全局指令
    if (this.vueConfig.app?.globalDirectives) {
      Object.entries(this.vueConfig.app.globalDirectives).forEach(([name, directive]) => {
        this.app!.directive(name, directive)
      })
    }

    // 提供引擎实例（使用 Symbol 键）
    this.app.provide(ENGINE_KEY, this)
    this.app.provide(CONTAINER_KEY, this.container)
    this.app.provide(CONFIG_KEY, this.configManager)

    // 同时提供字符串键以保持向后兼容
    this.app.provide('engine', this)
    this.app.provide('container', this.container)
    this.app.provide('config', this.configManager)

    // 设置全局属性
    this.app.config.globalProperties.$engine = this
    this.app.config.globalProperties.$container = this.container
    this.app.config.globalProperties.$config = this.configManager

    // 发射 app:created 事件，供插件使用
    this.events.emit('app:created', { app: this.app })

    // 初始化 Devtools (仅在开发模式下)
    if (this.shouldEnableDevtools()) {
      this.initDevtools()
    }

    if (this.config.debug) {
      console.log('[VueEngine] Vue application created, app:created event emitted')
    }

    return this.app
  }

  /**
   * 检查是否应该启用 Devtools
   */
  private shouldEnableDevtools(): boolean {
    // 生产模式下不启用
    if (this.config.environment === 'production') {
      return false
    }

    const devtoolsConfig = this.vueConfig.devtools

    // 如果显式设置为 false，则不启用
    if (devtoolsConfig === false) {
      return false
    }

    // 默认在开发模式下启用
    return true
  }

  /**
   * 初始化 Devtools 适配器
   */
  private initDevtools(): void {
    if (!this.app) {
      console.warn('[VueEngine] Cannot init devtools: app not created')
      return
    }

    const devtoolsConfig = this.vueConfig.devtools
    const options: DevtoolsOptions = typeof devtoolsConfig === 'object'
      ? devtoolsConfig
      : {
          appName: this.config.name || 'LDesign Engine',
          enableStateInspector: true,
          enableEventTracker: true,
          enableTimeTravel: true,
        }

    try {
      this.devtoolsAdapter = createVueDevtoolsAdapter(
        this.app,
        this.state,
        this.events,
        options
      )

      if (this.config.debug) {
        console.log('[VueEngine] Devtools adapter initialized')
      }
    } catch (error) {
      console.error('[VueEngine] Failed to initialize devtools:', error)
    }
  }

  /**
   * 挂载应用
   * 
   * @param selector - 挂载目标选择器或元素
   * @param rootComponent - 根组件（可选）
   */
  async mount(selector: string | Element, rootComponent?: Component): Promise<void> {
    if (this.mounted) {
      if (this.config.debug) {
        console.warn('[VueEngine] Application already mounted')
      }
      return
    }

    // 初始化引擎
    await this.init()

    // 创建 Vue 应用
    if (!this.app) {
      await this.createVueApp(rootComponent)
    }

    // 触发挂载前生命周期（插件会在这里安装）
    await this.lifecycle.trigger('beforeMount')

    // 挂载应用
    this.app!.mount(selector)
    this.mounted = true

    // 触发挂载后生命周期
    await this.lifecycle.trigger('mounted')

    if (this.config.debug) {
      console.log('[VueEngine] Application mounted successfully')
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.mounted || !this.app) {
      return
    }

    // 触发卸载前生命周期
    await this.lifecycle.trigger('beforeUnmount')

    // 卸载应用
    this.app.unmount()
    this.mounted = false

    // 触发卸载后生命周期
    await this.lifecycle.trigger('unmounted')

    // 销毁引擎
    await this.destroy()

    if (this.config.debug) {
      console.log('[VueEngine] Application unmounted')
    }
  }

  /**
   * 使用 Vue 插件
   * 
   * @param plugin - Vue 插件
   * @param options - 插件选项
   */
  useVuePlugin(plugin: any, options?: any): this {
    if (!this.app) {
      throw new Error('Vue app not created. Call createVueApp() first.')
    }

    this.app.use(plugin, options)
    return this
  }

  /**
   * 获取 Vue 应用实例
   * 
   * @returns Vue 应用实例
   */
  getApp(): App | null {
    return this.app
  }

  /**
   * 注册服务
   * 
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  registerService(identifier: string | symbol, implementation: any): void {
    this.container.singleton(identifier, implementation)
  }

  /**
   * 解析服务
   * 
   * @param identifier - 服务标识
   * @returns 服务实例
   */
  resolveService<T = any>(identifier: string | symbol): T {
    return this.container.resolve(identifier)
  }

  /**
   * 注册核心服务
   * 
   * @private
   */
  private registerCoreServices(): void {
    // 注册引擎自身
    this.container.singleton('engine', this)

    // 注册配置管理器
    this.container.singleton('config', this.configManager)

    // 注册事件管理器
    this.container.singleton('events', this.events)

    // 注册状态管理器
    this.container.singleton('state', this.state)

    // 注册生命周期管理器
    this.container.singleton('lifecycle', this.lifecycle)

    // 注册中间件管理器
    this.container.singleton('middleware', this.middleware)

    // 注册插件管理器
    this.container.singleton('plugins', this.plugins)
  }

  /**
   * 重写 use 方法，提供增强的插件上下文
   */
  async use<T = any>(plugin: Plugin<T>, options?: T): Promise<void> {
    // 构建增强的上下文
    const enhancedContext = {
      // 提供框架信息
      framework: {
        name: 'vue' as const,
        version: this.app?.version,
        app: this.app,
      },
      // 提供服务容器
      container: {
        singleton: this.container.singleton.bind(this.container),
        resolve: this.container.resolve.bind(this.container),
        has: this.container.has.bind(this.container),
      },
    }

    // 调用父类的 use 方法，传入增强的上下文
    await this.plugins.use(plugin, options, enhancedContext)
  }

  /**
   * 获取 Devtools 适配器
   */
  getDevtools(): VueDevtoolsAdapter | null {
    return this.devtoolsAdapter
  }

  /**
   * 重写销毁方法
   */
  async destroy(): Promise<void> {
    // 清理 Devtools 适配器
    if (this.devtoolsAdapter) {
      this.devtoolsAdapter.destroy()
      this.devtoolsAdapter = null
    }

    // 清理 Vue 应用
    if (this.app) {
      this.app = null
    }

    // 清理容器
    this.container.clear()

    // 调用父类销毁方法
    await super.destroy()
  }
}

/**
 * 创建 Vue3 引擎
 * 
 * @param config - 引擎配置
 * @returns Vue3 引擎实例
 * 
 * @example
 * ```typescript
 * const engine = createVueEngine({
 *   name: 'My App',
 *   debug: true,
 *   app: {
 *     rootComponent: App
 *   }
 * })
 * 
 * await engine.mount('#app')
 * ```
 */
export function createVueEngine(config?: VueEngineConfig): VueEngine {
  return new VueEngine(config)
}

/**
 * Vue3 引擎插件接口
 * 
 * 扩展核心插件接口，添加 Vue 特定功能
 */
export interface VueEnginePlugin extends Plugin {
  /** 安装到 Vue 应用（可选） */
  installVue?(app: App, options?: any): void
}