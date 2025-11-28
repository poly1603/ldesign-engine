/**
 * 插件管理器实现
 *
 * 提供插件系统的核心功能,支持依赖管理、版本检查和生命周期管理
 *
 * @module plugin-manager
 */

import type { Plugin, PluginManager, PluginContext } from '../types'
import type { UnknownRecord } from '../types/common'
import { logger } from '../utils/logger'
import { getPerformanceTracker } from '../monitor/performance-tracker'

/**
 * 核心插件管理器
 *
 * 特性:
 * - 插件依赖管理
 * - 版本兼容性检查
 * - 插件生命周期管理
 * - 插件卸载支持
 * - 循环依赖检测
 * - 错误处理
 *
 * @example
 * ```typescript
 * const pluginManager = createPluginManager({
 *   engine: coreEngine,
 *   config: { debug: true }
 * })
 *
 * // 注册插件
 * await pluginManager.use({
 *   name: 'i18n',
 *   version: '1.0.0',
 *   install(ctx, options) {
 *     ctx.engine.state.set('locale', options.locale)
 *   }
 * }, { locale: 'zh-CN' })
 *
 * // 获取插件
 * const i18nPlugin = pluginManager.get('i18n')
 * ```
 */
export class CorePluginManager implements PluginManager {
  /** 已安装的插件存储 */
  private plugins = new Map<string, Plugin<unknown>>()

  /** 插件上下文 */
  private context: PluginContext

  /** 正在安装的插件集合 - 用于检测循环依赖 */
  private installing = new Set<string>()

  /** 插件选项存储 - 用于热重载时恢复配置 */
  private pluginOptions = new Map<string, unknown>()

  /** 热重载监听器 */
  private hotReloadListeners = new Map<string, Set<() => void | Promise<void>>>()

  /** 依赖图缓存 - 性能优化：快速查找依赖关系 */
  private dependencyGraph = new Map<string, Set<string>>()

  /** 反向依赖图 - 性能优化：快速查找依赖者 */
  private reverseDependencyGraph = new Map<string, Set<string>>()

  /** 修复：添加安装互斥锁，防止并发安装导致的竞态条件 */
  private installMutex = new Map<string, Promise<void>>()

  /** 修复：正在热重载的插件集合，防止热重载时的竞态条件 */
  private reloadingPlugins = new Set<string>()

  /**
   * 构造函数
   *
   * @param context - 插件上下文
   */
  constructor(context: PluginContext) {
    this.context = context
    logger.info('PluginManager', 'constructor', 'Plugin manager initialized')
  }

  /**
   * 注册插件
   *
   * 安装流程:
   * 1. 检查是否已安装
   * 2. 检查依赖是否满足
   * 3. 检测循环依赖
   * 4. 调用插件的 install 方法
   * 5. 保存插件实例
   *
   * @param plugin - 插件对象
   * @param options - 插件选项
   *
   * @example
   * ```typescript
   * await pluginManager.use({
   *   name: 'router',
   *   version: '1.0.0',
   *   dependencies: ['i18n'],
   *   async install(ctx, options) {
   *     // 插件安装逻辑
   *   }
   * }, { mode: 'history' })
   * ```
   */
  async use<T = UnknownRecord>(plugin: Plugin<T>, options?: T, customContext?: Partial<PluginContext>): Promise<void> {
    const tracker = getPerformanceTracker()
    const perfId = tracker.start('install', 'PluginManager', {
      plugin: plugin.name,
      version: plugin.version,
      hasDependencies: !!(plugin.dependencies && plugin.dependencies.length > 0),
    })

    logger.info('PluginManager', 'install', `Starting plugin installation: ${plugin.name}`, {
      version: plugin.version,
      dependencies: plugin.dependencies,
    })

    try {
      // 修复：检查是否已经有正在进行的安装操作
      const existingInstall = this.installMutex.get(plugin.name)
      if (existingInstall) {
        logger.debug('PluginManager', 'install', `Plugin ${plugin.name} installation already in progress, waiting...`)
        // 等待现有安装完成
        await existingInstall
        tracker.end(perfId)
        return
      }

      // 检查是否已安装
      if (this.plugins.has(plugin.name)) {
        logger.warn('PluginManager', 'install', `Plugin ${plugin.name} already installed, skipping...`)
        if (this.context.config?.debug) {
          console.warn(`Plugin "${plugin.name}" already installed, skipping...`)
        }
        tracker.end(perfId)
        return
      }

      // 检测循环依赖
      if (this.installing.has(plugin.name)) {
        const error = new Error(
          `Circular dependency detected: Plugin "${plugin.name}" is already being installed`
        )
        logger.error('PluginManager', 'install', `Circular dependency detected for plugin ${plugin.name}`, error)
        tracker.end(perfId)
        throw error
      }

      // 修复：创建安装互斥锁
      const installPromise = (async () => {
        // 标记为正在安装
        this.installing.add(plugin.name)
        logger.debug('PluginManager', 'install', `Acquired installation lock for ${plugin.name}`)

        try {
          // 检查并安装依赖
          if (plugin.dependencies && plugin.dependencies.length > 0) {
            logger.debug('PluginManager', 'install', `Checking dependencies for ${plugin.name}`, {
              dependencies: plugin.dependencies,
            })
            await this.checkDependencies(plugin as Plugin<unknown>)
          }

          // 合并上下文（如果提供了自定义上下文）
          const finalContext = customContext
            ? { ...this.context, ...customContext }
            : this.context

          // 调用插件的 install 方法
          logger.debug('PluginManager', 'install', `Calling install method for ${plugin.name}`)
          await plugin.install(finalContext, options)

          // 保存插件和选项
          this.plugins.set(plugin.name, plugin as Plugin<unknown>)
          if (options !== undefined) {
            this.pluginOptions.set(plugin.name, options)
          }

          // 性能优化：更新依赖图缓存
          this.updateDependencyGraph(plugin as Plugin<unknown>)

          logger.info('PluginManager', 'install', `Plugin ${plugin.name} v${plugin.version || 'unknown'} installed successfully`)
          if (this.context.config?.debug) {
            console.log(
              `Plugin "${plugin.name}" v${plugin.version || 'unknown'} installed successfully`
            )
          }
        } catch (error) {
          // 安装失败,记录错误
          logger.error('PluginManager', 'install', `Failed to install plugin ${plugin.name}`, error as Error)
          console.error(`Failed to install plugin "${plugin.name}":`, error)
          throw error
        } finally {
          // 移除安装标记
          this.installing.delete(plugin.name)
          logger.debug('PluginManager', 'install', `Released installation lock for ${plugin.name}`)
          // 移除互斥锁
          this.installMutex.delete(plugin.name)
        }
      })()

      // 保存安装 Promise
      this.installMutex.set(plugin.name, installPromise)
      
      // 等待安装完成
      await installPromise
      tracker.end(perfId)
    } catch (error) {
      tracker.end(perfId)
      throw error
    }
  }

  /**
   * 卸载插件
   *
   * 卸载流程:
   * 1. 检查插件是否存在
   * 2. 检查是否有其他插件依赖它
   * 3. 调用插件的 uninstall 方法
   * 4. 移除插件实例
   *
   * @param name - 插件名称
   * @param force - 是否强制卸载(忽略依赖检查)
   * @returns 是否卸载成功
   *
   * @example
   * ```typescript
   * // 正常卸载
   * await pluginManager.uninstall('router')
   *
   * // 强制卸载(忽略依赖)
   * await pluginManager.uninstall('i18n', true)
   * ```
   */
  async uninstall(name: string, force = false): Promise<boolean> {
    const tracker = getPerformanceTracker()
    const perfId = tracker.start('uninstall', 'PluginManager', { plugin: name, force })

    logger.info('PluginManager', 'uninstall', `Starting plugin uninstallation: ${name}`, { force })

    const plugin = this.plugins.get(name)

    if (!plugin) {
      logger.warn('PluginManager', 'uninstall', `Plugin ${name} not found`)
      if (this.context.config?.debug) {
        console.warn(`Plugin "${name}" not found`)
      }
      tracker.end(perfId)
      return false
    }

    // 检查是否有其他插件依赖它
    if (!force) {
      const dependents = this.getDependents(name)
      if (dependents.length > 0) {
        const error = new Error(
          `Cannot uninstall plugin "${name}": ` +
          `It is required by: ${dependents.join(', ')}. ` +
          `Use force=true to uninstall anyway.`
        )
        logger.error('PluginManager', 'uninstall', `Cannot uninstall ${name} due to dependencies`, error, {
          dependents,
        })
        tracker.end(perfId)
        throw error
      }
    }

    try {
      // 调用卸载函数
      if (plugin.uninstall) {
        logger.debug('PluginManager', 'uninstall', `Calling uninstall method for ${name}`)
        await plugin.uninstall(this.context)
      }

      // 移除插件
      const result = this.plugins.delete(name)

      // 性能优化：从依赖图中移除
      if (result) {
        this.removeDependencyGraph(name)
      }

      if (result) {
        logger.info('PluginManager', 'uninstall', `Plugin ${name} uninstalled successfully`)
      }

      if (this.context.config?.debug && result) {
        console.log(`Plugin "${name}" uninstalled successfully`)
      }

      tracker.end(perfId)
      return result
    } catch (error) {
      logger.error('PluginManager', 'uninstall', `Failed to uninstall plugin ${name}`, error as Error)
      console.error(`Failed to uninstall plugin "${name}":`, error)
      tracker.end(perfId)
      throw error
    }
  }

  /**
   * 获取插件
   *
   * @param name - 插件名称
   * @returns 插件对象
   *
   * @example
   * ```typescript
   * const routerPlugin = pluginManager.get('router')
   * if (routerPlugin) {
   *   console.log('Router version:', routerPlugin.version)
   * }
   * ```
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   *
   * @returns 插件数组
   *
   * @example
   * ```typescript
   * const allPlugins = pluginManager.getAll()
   * console.log('Installed plugins:', allPlugins.map(p => p.name))
   * ```
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 检查插件是否已安装
   *
   * @param name - 插件名称
   * @returns 是否已安装
   *
   * @example
   * ```typescript
   * if (pluginManager.has('router')) {
   *   console.log('Router plugin is installed')
   * }
   * ```
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * 清空所有插件
   *
   * 注意: 不会调用插件的 uninstall 方法
   *
   * @example
   * ```typescript
   * pluginManager.clear()
   * ```
   */
  clear(): void {
    logger.info('PluginManager', 'clear', 'Clearing all plugins', { count: this.plugins.size })
    this.plugins.clear()
    this.installing.clear()
    this.dependencyGraph.clear()
    this.reverseDependencyGraph.clear()
  }

  /**
   * 获取插件数量
   *
   * @returns 插件数量
   *
   * @example
   * ```typescript
   * const count = pluginManager.size()
   * console.log(`${count} plugins installed`)
   * ```
   */
  size(): number {
    return this.plugins.size
  }

  /**
   * 检查插件依赖 (内部方法)
   *
   * 性能优化：使用 Set 快速检查依赖
   *
   * @param plugin - 插件对象
   * @throws 如果依赖不满足
   * @private
   */
  private async checkDependencies(plugin: Plugin<unknown>): Promise<void> {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return
    }

    // 性能优化：使用 filter 和 Set.has 快速查找缺失依赖
    const missingDeps = plugin.dependencies.filter(dep => !this.plugins.has(dep))

    if (missingDeps.length > 0) {
      throw new Error(
        `Plugin "${plugin.name}" requires the following dependencies: ` +
        `${missingDeps.join(', ')}. Please install them first.`
      )
    }
  }

  /**
   * 更新依赖图缓存
   *
   * @param plugin - 插件对象
   * @private
   */
  private updateDependencyGraph(plugin: Plugin<unknown>): void {
    const name = plugin.name
    const deps = plugin.dependencies || []

    // 更新正向依赖图
    if (deps.length > 0) {
      this.dependencyGraph.set(name, new Set(deps))
    } else {
      this.dependencyGraph.delete(name)
    }

    // 更新反向依赖图
    for (const dep of deps) {
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set())
      }
      this.reverseDependencyGraph.get(dep)!.add(name)
    }
  }

  /**
   * 从依赖图中移除插件
   *
   * @param name - 插件名称
   * @private
   */
  private removeDependencyGraph(name: string): void {
    // 从正向依赖图移除
    const deps = this.dependencyGraph.get(name)
    this.dependencyGraph.delete(name)

    // 从反向依赖图移除
    if (deps) {
      for (const dep of deps) {
        const dependents = this.reverseDependencyGraph.get(dep)
        if (dependents) {
          dependents.delete(name)
          if (dependents.size === 0) {
            this.reverseDependencyGraph.delete(dep)
          }
        }
      }
    }

    // 从所有反向依赖中移除此插件
    this.reverseDependencyGraph.delete(name)
  }

  /**
   * 获取依赖某个插件的所有插件 (内部方法)
   *
   * 性能优化：使用反向依赖图O(1)查找
   *
   * @param name - 插件名称
   * @returns 依赖该插件的插件名称数组
   * @private
   */
  private getDependents(name: string): string[] {
    const dependents = this.reverseDependencyGraph.get(name)
    return dependents ? Array.from(dependents) : []
  }

  /**
   * 获取插件依赖树
   *
   * @param name - 插件名称
   * @returns 依赖树对象
   *
   * @example
   * ```typescript
   * const tree = pluginManager.getDependencyTree('router')
   * console.log('Dependencies:', tree)
   * ```
   */
  getDependencyTree(name: string): Record<string, string[]> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return {}
    }

    const tree: Record<string, string[]> = {
      [name]: plugin.dependencies || [],
    }

    // 递归获取依赖的依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        const depTree = this.getDependencyTree(dep)
        Object.assign(tree, depTree)
      }
    }

    return tree
  }

  /**
   * 热重载插件
   *
   * 热重载流程:
   * 1. 保存当前插件状态
   * 2. 卸载旧插件
   * 3. 安装新插件
   * 4. 失败时回滚
   *
   * @param name - 插件名称
   * @param newPlugin - 新插件对象
   * @returns 是否热重载成功
   *
   * @example
   * ```typescript
   * const newRouterPlugin = {
   *   name: 'router',
   *   version: '2.0.0',
   *   install: async (ctx, options) => {
   *     // 新版本逻辑
   *   }
   * }
   *
   * await pluginManager.hotReload('router', newRouterPlugin)
   * ```
   */
  async hotReload<T = UnknownRecord>(name: string, newPlugin: Plugin<T>): Promise<boolean> {
    const tracker = getPerformanceTracker()
    const perfId = tracker.start('hotReload', 'PluginManager', { plugin: name })

    logger.info('PluginManager', 'hotReload', `Starting hot reload for plugin: ${name}`)

    // 修复：检查是否已经在热重载中
    if (this.reloadingPlugins.has(name)) {
      const error = new Error(`Plugin "${name}" is currently being reloaded`)
      logger.error('PluginManager', 'hotReload', `Concurrent reload attempt for ${name}`, error)
      tracker.end(perfId)
      throw error
    }

    // 标记为正在热重载
    this.reloadingPlugins.add(name)
    logger.debug('PluginManager', 'hotReload', `Acquired hot reload lock for ${name}`)

    try {
      const oldPlugin = this.plugins.get(name)
      const options = this.pluginOptions.get(name) as T

      // 如果插件不存在，直接安装新插件
      if (!oldPlugin) {
        logger.info('PluginManager', 'hotReload', `Plugin ${name} not found, installing as new`)
        await this.use(newPlugin, options)
        tracker.end(perfId)
        return true
      }

      logger.debug('PluginManager', 'hotReload', `Removing old plugin ${name} from registry`)

      // 修复：先从 Map 中删除旧插件（原子性操作的第一步）
      this.plugins.delete(name)

      try {
        // 安装新插件
        logger.debug('PluginManager', 'hotReload', `Installing new version of ${name}`)
        await newPlugin.install(this.context, options)

        // 修复：安装成功后更新插件引用（原子性操作的第二步）
        this.plugins.set(name, newPlugin as Plugin<unknown>)

        logger.debug('PluginManager', 'hotReload', `Uninstalling old version of ${name}`)

        // 卸载旧插件
        if (oldPlugin.uninstall) {
          try {
            await oldPlugin.uninstall(this.context)
          } catch (error) {
            // 卸载失败不影响热重载，只记录警告
            logger.warn('PluginManager', 'hotReload', `Failed to uninstall old version of ${name}`, error as Error)
            console.warn(`Failed to uninstall old version of plugin "${name}":`, error)
          }
        }

        // 触发热重载监听器
        const listeners = this.hotReloadListeners.get(name)
        if (listeners && listeners.size > 0) {
          logger.debug('PluginManager', 'hotReload', `Triggering ${listeners.size} hot reload listeners for ${name}`)
          for (const listener of listeners) {
            try {
              await listener()
            } catch (error) {
              logger.error('PluginManager', 'hotReload', `Error in hot reload listener for ${name}`, error as Error)
              console.error(`Error in hot reload listener for plugin "${name}":`, error)
            }
          }
        }

        logger.info('PluginManager', 'hotReload', `Plugin ${name} hot reloaded successfully`)

        if (this.context.config?.debug) {
          console.log(`Plugin "${name}" hot reloaded successfully`)
        }

        tracker.end(perfId)
        return true
      } catch (error) {
        // 修复：安装失败时恢复旧插件到 Map 中
        logger.error('PluginManager', 'hotReload', `Failed to install new version of ${name}, rolling back`, error as Error)
        this.plugins.set(name, oldPlugin)
        throw error
      }
    } catch (error) {
      logger.error('PluginManager', 'hotReload', `Hot reload failed for ${name}`, error as Error)
      console.error(`Failed to hot reload plugin "${name}":`, error)

      tracker.end(perfId)
      throw error
    } finally {
      // 修复：无论成功或失败，都要清除热重载标记
      this.reloadingPlugins.delete(name)
      logger.debug('PluginManager', 'hotReload', `Released hot reload lock for ${name}`)
    }
  }

  /**
   * 注册热重载监听器
   *
   * 当插件热重载时，会触发注册的监听器
   *
   * @param name - 插件名称
   * @param listener - 监听器函数
   * @returns 取消监听函数
   *
   * @example
   * ```typescript
   * const unsubscribe = pluginManager.onHotReload('router', () => {
   *   console.log('Router plugin reloaded')
   *   // 重新初始化路由相关状态
   * })
   *
   * // 取消监听
   * unsubscribe()
   * ```
   */
  onHotReload(name: string, listener: () => void | Promise<void>): () => void {
    if (!this.hotReloadListeners.has(name)) {
      this.hotReloadListeners.set(name, new Set())
    }

    const listeners = this.hotReloadListeners.get(name)!
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.hotReloadListeners.delete(name)
      }
    }
  }

  /**
   * 检查插件是否支持热重载
   *
   * @param name - 插件名称
   * @returns 是否支持热重载
   *
   * @example
   * ```typescript
   * if (pluginManager.isHotReloadable('router')) {
   *   await pluginManager.hotReload('router', newRouterPlugin)
   * }
   * ```
   */
  isHotReloadable(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return false
    }

    // 插件必须实现 uninstall 方法才能支持热重载
    return typeof plugin.uninstall === 'function'
  }
}

/**
 * 创建插件管理器实例
 *
 * @param context - 插件上下文
 * @returns 插件管理器实例
 *
 * @example
 * ```typescript
 * import { createPluginManager } from '@ldesign/engine-core'
 *
 * const pluginManager = createPluginManager({
 *   engine: coreEngine,
 *   config: { debug: true }
 * })
 * ```
 */
export function createPluginManager(context: PluginContext): PluginManager {
  return new CorePluginManager(context)
}

