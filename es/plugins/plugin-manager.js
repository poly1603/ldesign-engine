/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class PluginManagerImpl {
  constructor(engine) {
    this.name = "PluginManager";
    this.version = "1.0.0";
    this.plugins = /* @__PURE__ */ new Map();
    this.loadOrder = [];
    this.MAX_PLUGINS = 100;
    this.dependencyCache = /* @__PURE__ */ new WeakMap();
    this.dependentsCache = /* @__PURE__ */ new Map();
    this.cacheInvalidated = true;
    this.engine = engine;
  }
  /**
   * 使缓存失效
   */
  invalidateCache() {
    this.cacheInvalidated = true;
    this.dependencyGraphCache = void 0;
    this.dependentsCache.clear();
  }
  /**
   * 注册并安装插件。
   *
   * 会校验依赖、写入注册表、清理缓存并调用插件的 install。
   * @throws 当插件已注册或依赖缺失时抛出错误
   */
  async register(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    if (this.plugins.size >= this.MAX_PLUGINS) {
      throw new Error(`Maximum plugin limit (${this.MAX_PLUGINS}) reached`);
    }
    const { satisfied, missing } = this.checkDependencies(plugin);
    if (!satisfied) {
      if (missing.length === 1) {
        throw new Error(`Plugin "${plugin.name}" depends on "${missing[0]}" which is not registered`);
      } else {
        throw new Error(`Plugin "${plugin.name}" depends on missing plugins: ${missing.join(", ")}`);
      }
    }
    try {
      this.plugins.set(plugin.name, plugin);
      this.loadOrder.push(plugin.name);
      this.invalidateCache();
      if (this.engine) {
        const context = this.createPluginContext();
        await plugin.install(context);
      }
      if (this.engine?.events) {
        this.engine.events.emit("plugin:registered", {
          name: plugin.name,
          plugin
        });
      }
    } catch (error) {
      this.plugins.delete(plugin.name);
      const index = this.loadOrder.indexOf(plugin.name);
      if (index > -1) {
        this.loadOrder.splice(index, 1);
      }
      this.logPluginError(plugin.name, error);
      throw error;
    }
  }
  /**
   * 卸载并注销插件。
   *
   * 会检查是否存在依赖该插件的其他插件，若存在则拒绝卸载。
   * @throws 当插件未注册或存在依赖者时抛出错误
   */
  async unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }
    const dependents = this.getDependents(name);
    if (dependents.length > 0) {
      throw new Error(`Cannot unregister plugin "${name}" because it is required by: ${dependents.join(", ")}`);
    }
    try {
      if (plugin.uninstall && this.engine) {
        const context = this.createPluginContext();
        await plugin.uninstall(context);
      }
      this.plugins.delete(name);
      const index = this.loadOrder.indexOf(name);
      if (index > -1) {
        this.loadOrder.splice(index, 1);
      }
      this.invalidateCache();
      if (this.engine?.logger) {
        this.engine.logger.info(`Plugin "${name}" unregistered successfully`);
      }
      if (this.engine?.events) {
        this.engine.events.emit("plugin:unregistered", {
          name,
          plugin
        });
      }
    } catch (error) {
      if (this.engine?.logger) {
        this.engine.logger.error(`Failed to unregister plugin "${name}"`, error);
      }
      throw error;
    }
  }
  get(name) {
    return this.plugins.get(name);
  }
  getAll() {
    return this.loadOrder.map((name) => this.plugins.get(name)).filter(Boolean);
  }
  isRegistered(name) {
    return this.plugins.has(name);
  }
  has(name) {
    return this.plugins.has(name);
  }
  /**
   * 检查插件依赖满足情况（不修改状态）。
   */
  checkDependencies(plugin) {
    const missing = [];
    const conflicts = [];
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          missing.push(dep);
        }
      }
    }
    return {
      satisfied: missing.length === 0 && conflicts.length === 0,
      missing,
      conflicts
    };
  }
  /**
   * 获取依赖指定插件的插件列表 - 使用缓存优化
   */
  getDependents(pluginName) {
    if (!this.cacheInvalidated && this.dependentsCache.has(pluginName)) {
      return this.dependentsCache.get(pluginName);
    }
    const dependents = [];
    for (const [name, plugin] of this.plugins) {
      if (plugin.dependencies?.includes(pluginName)) {
        dependents.push(name);
      }
    }
    this.dependentsCache.set(pluginName, dependents);
    return dependents;
  }
  // 获取插件加载顺序
  /**
   * 获取插件按注册顺序的名称列表。
   */
  getLoadOrder() {
    return [...this.loadOrder];
  }
  /**
   * 获取当前插件依赖图 - 使用缓存优化
   */
  getDependencyGraph() {
    if (!this.cacheInvalidated && this.dependencyGraphCache) {
      return { ...this.dependencyGraphCache };
    }
    const graph = {};
    for (const [name, plugin] of this.plugins) {
      graph[name] = plugin.dependencies ? [...plugin.dependencies] : [];
    }
    this.dependencyGraphCache = graph;
    this.cacheInvalidated = false;
    return { ...graph };
  }
  /**
   * 验证所有已注册插件的依赖是否完整。
   */
  validateDependencies() {
    const errors = [];
    for (const [name, plugin] of this.plugins) {
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            errors.push(`Plugin "${name}" depends on missing plugin "${dep}"`);
          }
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  // 获取插件统计信息
  /**
   * 获取插件统计信息快照。
   */
  getStats() {
    return {
      total: this.plugins.size,
      loaded: this.getLoadOrder(),
      dependencies: this.getDependencyGraph(),
      installed: this.plugins.size,
      pending: 0,
      errors: 0,
      averageInstallTime: 0,
      timestamp: Date.now()
    };
  }
  // 获取插件信息
  /**
   * 获取单个插件的元信息摘要。
   */
  getInfo(name) {
    const plugin = this.plugins.get(name);
    if (!plugin)
      return void 0;
    return {
      plugin,
      status: "installed",
      installTime: void 0,
      error: void 0,
      dependencies: plugin.dependencies || [],
      dependents: this.getDependents(name)
    };
  }
  // 获取所有插件信息
  /**
   * 获取所有已注册插件的元信息摘要列表。
   */
  getAllInfo() {
    return Array.from(this.plugins.keys()).map((name) => this.getInfo(name)).filter(Boolean);
  }
  // 获取插件状态
  /**
   * 获取插件状态（当前实现为简化版）。
   */
  getStatus(name) {
    if (!this.plugins.has(name))
      return void 0;
    return "installed";
  }
  // 解析依赖
  /**
   * 解析插件依赖并按合适顺序返回（当前实现简化为原序）。
   */
  resolveDependencies(plugins) {
    return plugins;
  }
  // 按关键词查找插件
  /**
   * 按关键字搜索插件（基于名称与描述）- 优化版
   */
  findByKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const results = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.name.toLowerCase().includes(lowerKeyword) || plugin.description?.toLowerCase().includes(lowerKeyword)) {
        results.push(plugin);
      }
    }
    return results;
  }
  // 按作者查找插件
  /**
   * 按作者筛选插件（依赖插件公开 author 字段）。
   */
  findByAuthor(author) {
    return Array.from(this.plugins.values()).filter((plugin) => {
      return plugin.author === author;
    });
  }
  // 按依赖查找插件
  /**
   * 查找依赖了指定插件名称的插件。
   */
  findByDependency(dependency) {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.dependencies?.includes(dependency));
  }
  destroy() {
    const reversedOrder = [...this.loadOrder].reverse();
    for (const pluginName of reversedOrder) {
      const plugin = this.plugins.get(pluginName);
      if (plugin && plugin.uninstall && this.engine) {
        try {
          plugin.uninstall({
            engine: this.engine,
            logger: this.engine.logger,
            config: this.engine.config,
            events: this.engine.events
          });
        } catch (error) {
          this.engine?.logger?.error(`Error uninstalling plugin ${plugin.name}:`, error);
        }
      }
    }
    this.plugins.clear();
    this.loadOrder.length = 0;
    this.clearCaches();
    this.engine = void 0;
  }
  // 清理缓存 - 增强版
  clearCaches() {
    this.dependencyCache = /* @__PURE__ */ new WeakMap();
    this.dependencyGraphCache = void 0;
    this.dependentsCache.clear();
    this.cacheInvalidated = true;
  }
  // 实现接口需要的额外方法
  getInstalledPlugins() {
    return this.getAll();
  }
  isInstalled(name) {
    return this.isRegistered(name);
  }
  getPlugin(name) {
    return this.get(name);
  }
  getPluginStatus(name) {
    return this.getStatus(name);
  }
  async initializeAll() {
    const initPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      try {
        if (this.engine && plugin.install) {
          const context = this.createPluginContext();
          await plugin.install(context);
        }
      } catch (error) {
        this.engine?.logger?.error(`Failed to initialize plugin ${plugin.name}:`, error);
      }
    });
    await Promise.all(initPromises);
  }
  // 新增的辅助方法
  /**
   * 抽取创建上下文的逻辑
   */
  createPluginContext() {
    if (!this.engine) {
      throw new Error("Engine is not initialized");
    }
    return {
      engine: this.engine,
      logger: this.engine.logger,
      config: this.engine.config,
      events: this.engine.events
    };
  }
  /**
   * 记录插件错误
   */
  logPluginError(pluginName, error) {
    if (this.engine?.logger) {
      this.engine.logger.error(`Failed to register plugin "${pluginName}"`, error);
    }
  }
}
function createPluginManager(engine) {
  return new PluginManagerImpl(engine);
}

export { PluginManagerImpl, createPluginManager };
//# sourceMappingURL=plugin-manager.js.map
