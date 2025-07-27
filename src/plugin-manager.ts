import type {
  Engine,
  Plugin,
  PluginInfo,
  PluginManager,
} from './types'
import { PluginError } from './types'

/**
 * 插件依赖图节点
 */
interface DependencyNode {
  plugin: Plugin
  dependencies: string[]
  dependents: string[]
  installed: boolean
}

/**
 * 插件管理器实现
 * 提供插件的注册、卸载、依赖管理等功能
 */
export class PluginManagerImpl implements PluginManager {
  private plugins = new Map<string, PluginInfo>()
  private dependencyGraph = new Map<string, DependencyNode>()
  private installOrder: string[] = []
  private installing = new Set<string>()
  private uninstalling = new Set<string>()

  constructor() {}

  /**
   * 安装插件
   */
  async install(plugin: Plugin, engine: Engine, options?: any): Promise<void> {
    if (!plugin || typeof plugin !== 'object') {
      throw new PluginError('Invalid plugin object', 'unknown')
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new PluginError('Plugin must have a valid name', plugin.name || 'unknown')
    }

    if (typeof plugin.install !== 'function') {
      throw new PluginError(
        'Plugin must have an install function',
        plugin.name,
      )
    }

    if (this.plugins.has(plugin.name)) {
      throw new PluginError(
        `Plugin '${plugin.name}' is already installed`,
        plugin.name,
      )
    }

    if (this.installing.has(plugin.name)) {
      throw new PluginError(
        `Plugin '${plugin.name}' is currently being installed`,
        plugin.name,
      )
    }

    this.installing.add(plugin.name)

    try {
      // 检查依赖
      await this.checkDependencies(plugin)

      // 安装依赖
      await this.installDependencies(plugin)

      // 创建插件信息
      const pluginInfo: PluginInfo = {
        plugin,
        options,
        installed: false,
        installTime: Date.now(),
      }

      // 执行安装
      await this.installPlugin(pluginInfo, engine)

      // 注册插件
      this.plugins.set(plugin.name, pluginInfo)
      this.installOrder.push(plugin.name)

      // 更新依赖图
      this.updateDependencyGraph(plugin)

      // 发射安装事件
      engine.emit('plugin:installed', {
        name: plugin.name,
        plugin,
        options,
      })
    }
 catch (error) {
      const pluginError = new PluginError(
        `Failed to install plugin '${plugin.name}': ${error instanceof Error ? error.message : String(error)}`,
        plugin.name,
        { error, options },
      )

      // 发射错误事件
      engine.emit('plugin:error', pluginError)

      throw pluginError
    }
 finally {
      this.installing.delete(plugin.name)
    }
  }

  /**
   * 使用插件（install的别名）
   */
  async use(plugin: Plugin, engine: Engine, options?: any): Promise<void> {
    return this.install(plugin, engine, options)
  }

  /**
   * 移除插件（uninstall的别名）
   */
  async unuse(pluginName: string): Promise<void> {
    // 注意：这个方法需要engine参数，但接口定义中没有
    // 这是一个设计问题，暂时抛出错误提示
    throw new PluginError(
      'unuse method requires engine parameter. Use uninstall(pluginName, engine) instead.',
      pluginName,
    )
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginName: string, engine: Engine): Promise<void> {
    if (!this.plugins.has(pluginName)) {
      throw new PluginError(
        `Plugin '${pluginName}' is not installed`,
        pluginName,
      )
    }

    if (this.uninstalling.has(pluginName)) {
      throw new PluginError(
        `Plugin '${pluginName}' is currently being uninstalled`,
        pluginName,
      )
    }

    // 检查依赖关系
    const dependents = this.getDependents(pluginName)
    if (dependents.length > 0) {
      throw new PluginError(
        `Cannot uninstall plugin '${pluginName}' because it is required by: ${dependents.join(', ')}`,
        pluginName,
      )
    }

    this.uninstalling.add(pluginName)

    try {
      const pluginInfo = this.plugins.get(pluginName)!

      // 执行卸载
      await this.uninstallPlugin(pluginInfo, engine)

      // 移除插件
      this.plugins.delete(pluginName)
      const orderIndex = this.installOrder.indexOf(pluginName)
      if (orderIndex !== -1) {
        this.installOrder.splice(orderIndex, 1)
      }

      // 更新依赖图
      this.dependencyGraph.delete(pluginName)

      // 发射卸载事件
      engine.emit('plugin:uninstalled', {
        name: pluginName,
        plugin: pluginInfo.plugin,
      })
    }
 catch (error) {
      const pluginError = new PluginError(
        `Failed to uninstall plugin '${pluginName}': ${error instanceof Error ? error.message : String(error)}`,
        pluginName,
        { error },
      )

      // 发射错误事件
      engine.emit('plugin:error', pluginError)

      throw pluginError
    }
 finally {
      this.uninstalling.delete(pluginName)
    }
  }

  /**
   * 检查插件是否已安装
   */
  has(pluginName: string): boolean {
    return this.plugins.has(pluginName)
  }

  /**
   * 获取插件信息
   */
  get(pluginName: string): PluginInfo | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * 获取所有插件信息
   */
  list(): PluginInfo[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 清除所有插件
   */
  async clear(engine?: Engine): Promise<void> {
    // 按安装顺序的逆序卸载
    const uninstallOrder = [...this.installOrder].reverse()

    for (const pluginName of uninstallOrder) {
      try {
        if (engine) {
          await this.uninstall(pluginName, engine)
        }
      }
 catch (error) {
        console.error(`Error uninstalling plugin '${pluginName}':`, error)
      }
    }

    this.plugins.clear()
    this.dependencyGraph.clear()
    this.installOrder.length = 0
  }

  /**
   * 获取插件依赖
   */
  getDependencies(pluginName: string): string[] {
    const node = this.dependencyGraph.get(pluginName)
    return node ? [...node.dependencies] : []
  }

  /**
   * 获取插件依赖者
   */
  getDependents(pluginName: string): string[] {
    const node = this.dependencyGraph.get(pluginName)
    return node ? [...node.dependents] : []
  }

  /**
   * 获取安装顺序
   */
  getInstallOrder(): string[] {
    return [...this.installOrder]
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return
    }

    const missingDependencies: string[] = []

    for (const dependency of plugin.dependencies) {
      if (!this.plugins.has(dependency)) {
        missingDependencies.push(dependency)
      }
    }

    if (missingDependencies.length > 0) {
      throw new PluginError(
        `Plugin '${plugin.name}' has missing dependencies: ${missingDependencies.join(', ')}`,
        plugin.name,
      )
    }
  }

  /**
   * 安装依赖
   */
  private async installDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return
    }

    // 检查循环依赖
    this.checkCircularDependency(plugin.name, plugin.dependencies)
  }

  /**
   * 检查循环依赖
   */
  private checkCircularDependency(
    pluginName: string,
    dependencies: string[],
    visited = new Set<string>(),
  ): void {
    if (visited.has(pluginName)) {
      throw new PluginError(
        `Circular dependency detected for plugin '${pluginName}'`,
        pluginName,
      )
    }

    visited.add(pluginName)

    for (const dependency of dependencies) {
      const depNode = this.dependencyGraph.get(dependency)
      if (depNode) {
        this.checkCircularDependency(dependency, depNode.dependencies, visited)
      }
    }

    visited.delete(pluginName)
  }

  /**
   * 安装插件
   */
  private async installPlugin(pluginInfo: PluginInfo, engine: Engine): Promise<void> {
    const { plugin, options } = pluginInfo

    try {
      const result = plugin.install(engine, options)

      // 如果返回Promise，等待完成
      if (result && typeof result.then === 'function') {
        await result
      }

      pluginInfo.installed = true
    }
 catch (error) {
      throw new PluginError(
        `Plugin '${plugin.name}' installation failed: ${error instanceof Error ? error.message : String(error)}`,
        plugin.name,
        { error, options },
      )
    }
  }

  /**
   * 卸载插件
   */
  private async uninstallPlugin(pluginInfo: PluginInfo, engine: Engine): Promise<void> {
    const { plugin } = pluginInfo

    if (typeof plugin.uninstall === 'function') {
      try {
        const result = plugin.uninstall(engine)

        // 如果返回Promise，等待完成
        if (result && typeof result.then === 'function') {
          await result
        }
      }
 catch (error) {
        throw new PluginError(
          `Plugin '${plugin.name}' uninstallation failed: ${error instanceof Error ? error.message : String(error)}`,
          plugin.name,
          { error },
        )
      }
    }

    pluginInfo.installed = false
  }

  /**
   * 更新依赖图
   */
  private updateDependencyGraph(plugin: Plugin): void {
    const dependencies = plugin.dependencies || []

    // 创建节点
    const node: DependencyNode = {
      plugin,
      dependencies: [...dependencies],
      dependents: [],
      installed: true,
    }

    this.dependencyGraph.set(plugin.name, node)

    // 更新依赖关系
    for (const dependency of dependencies) {
      const depNode = this.dependencyGraph.get(dependency)
      if (depNode) {
        depNode.dependents.push(plugin.name)
      }
    }
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    total: number
    installed: number
    installing: number
    uninstalling: number
  } {
    return {
      total: this.plugins.size,
      installed: Array.from(this.plugins.values()).filter(p => p.installed).length,
      installing: this.installing.size,
      uninstalling: this.uninstalling.size,
    }
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): {
    plugins: number
    dependencyNodes: number
    installOrder: number
  } {
    return {
      plugins: this.plugins.size,
      dependencyNodes: this.dependencyGraph.size,
      installOrder: this.installOrder.length,
    }
  }

  /**
   * 销毁插件管理器
   */
  async destroy(engine?: Engine): Promise<void> {
    await this.clear(engine)
    this.installing.clear()
    this.uninstalling.clear()
  }
}
