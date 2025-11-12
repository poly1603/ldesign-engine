/**
 * 插件管理器实现
 *
 * 提供插件系统的核心功能,支持依赖管理、版本检查和生命周期管理
 *
 * @module plugin-manager
 */

import type { Plugin, PluginManager, PluginContext } from '../types'

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
  private plugins = new Map<string, Plugin>()

  /** 插件上下文 */
  private context: PluginContext

  /** 正在安装的插件集合 - 用于检测循环依赖 */
  private installing = new Set<string>()

  /**
   * 构造函数
   *
   * @param context - 插件上下文
   */
  constructor(context: PluginContext) {
    this.context = context
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
  async use<T = any>(plugin: Plugin<T>, options?: T, customContext?: Partial<PluginContext>): Promise<void> {
    // 检查是否已安装
    if (this.plugins.has(plugin.name)) {
      if (this.context.config?.debug) {
        console.warn(`Plugin "${plugin.name}" already installed, skipping...`)
      }
      return
    }

    // 检测循环依赖
    if (this.installing.has(plugin.name)) {
      throw new Error(
        `Circular dependency detected: Plugin "${plugin.name}" is already being installed`
      )
    }

    // 标记为正在安装
    this.installing.add(plugin.name)

    try {
      // 检查并安装依赖
      if (plugin.dependencies && plugin.dependencies.length > 0) {
        await this.checkDependencies(plugin)
      }

      // 合并上下文（如果提供了自定义上下文）
      const finalContext = customContext
        ? { ...this.context, ...customContext }
        : this.context

      // 调用插件的 install 方法
      await plugin.install(finalContext, options)

      // 保存插件
      this.plugins.set(plugin.name, plugin)

      if (this.context.config?.debug) {
        console.log(
          `Plugin "${plugin.name}" v${plugin.version || 'unknown'} installed successfully`
        )
      }
    } catch (error) {
      // 安装失败,记录错误
      console.error(`Failed to install plugin "${plugin.name}":`, error)
      throw error
    } finally {
      // 移除安装标记
      this.installing.delete(plugin.name)
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
    const plugin = this.plugins.get(name)

    if (!plugin) {
      if (this.context.config?.debug) {
        console.warn(`Plugin "${name}" not found`)
      }
      return false
    }

    // 检查是否有其他插件依赖它
    if (!force) {
      const dependents = this.getDependents(name)
      if (dependents.length > 0) {
        throw new Error(
          `Cannot uninstall plugin "${name}": ` +
          `It is required by: ${dependents.join(', ')}. ` +
          `Use force=true to uninstall anyway.`
        )
      }
    }

    try {
      // 调用卸载函数
      if (plugin.uninstall) {
        await plugin.uninstall(this.context)
      }

      // 移除插件
      const result = this.plugins.delete(name)

      if (this.context.config?.debug && result) {
        console.log(`Plugin "${name}" uninstalled successfully`)
      }

      return result
    } catch (error) {
      console.error(`Failed to uninstall plugin "${name}":`, error)
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
    this.plugins.clear()
    this.installing.clear()
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
   * @param plugin - 插件对象
   * @throws 如果依赖不满足
   * @private
   */
  private async checkDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return
    }

    const missingDeps: string[] = []

    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        missingDeps.push(dep)
      }
    }

    if (missingDeps.length > 0) {
      throw new Error(
        `Plugin "${plugin.name}" requires the following dependencies: ` +
        `${missingDeps.join(', ')}. Please install them first.`
      )
    }
  }

  /**
   * 获取依赖某个插件的所有插件 (内部方法)
   *
   * @param name - 插件名称
   * @returns 依赖该插件的插件名称数组
   * @private
   */
  private getDependents(name: string): string[] {
    const dependents: string[] = []

    for (const [pluginName, plugin] of this.plugins) {
      if (plugin.dependencies?.includes(name)) {
        dependents.push(pluginName)
      }
    }

    return dependents
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

