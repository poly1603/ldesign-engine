/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class ModuleLoader {
  constructor(config = {}, logger) {
    this.logger = logger;
    this.modules = /* @__PURE__ */ new Map();
    this.loadingPromises = /* @__PURE__ */ new Map();
    this.moduleCache = /* @__PURE__ */ new Map();
    this.loadQueue = [];
    this.currentLoads = 0;
    this.config = {
      baseUrl: config.baseUrl || "",
      enableCache: config.enableCache ?? true,
      cacheMaxAge: config.cacheMaxAge || 5 * 60 * 1e3,
      // 5分钟
      enablePrefetch: config.enablePrefetch ?? true,
      maxConcurrentLoads: config.maxConcurrentLoads || 3,
      onModuleLoad: config.onModuleLoad || (() => {
      }),
      onModuleError: config.onModuleError || (() => {
      })
    };
  }
  /**
   * 动态加载模块
   */
  async load(moduleName, options = {}) {
    if (this.config.enableCache) {
      const cached = this.moduleCache.get(moduleName);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < this.config.cacheMaxAge) {
          this.logger?.debug(`Module loaded from cache: ${moduleName}`);
          return cached.module;
        } else {
          this.moduleCache.delete(moduleName);
        }
      }
    }
    const loadingPromise = this.loadingPromises.get(moduleName);
    if (loadingPromise) {
      this.logger?.debug(`Waiting for in-progress load: ${moduleName}`);
      return loadingPromise;
    }
    const promise = this.loadModule(moduleName, options);
    this.loadingPromises.set(moduleName, promise);
    try {
      const module = await promise;
      this.loadingPromises.delete(moduleName);
      if (this.config.enableCache) {
        this.moduleCache.set(moduleName, {
          module,
          timestamp: Date.now()
        });
      }
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }
  /**
   * 批量加载模块
   */
  async loadBatch(moduleNames, options = {}) {
    const promises = moduleNames.map((name) => this.load(name, options));
    return Promise.all(promises);
  }
  /**
   * 预加载模块（低优先级）
   */
  async prefetch(moduleNames) {
    if (!this.config.enablePrefetch) {
      return;
    }
    const options = {
      priority: "low",
      preload: true
    };
    moduleNames.forEach((name) => {
      this.load(name, options).catch((error) => {
        this.logger?.debug(`Prefetch failed for ${name}`, error);
      });
    });
  }
  /**
   * 注册模块元数据
   */
  register(metadata) {
    this.modules.set(metadata.name, {
      ...metadata,
      loaded: false
    });
    this.logger?.debug(`Module registered: ${metadata.name}`);
  }
  /**
   * 获取模块元数据
   */
  getMetadata(moduleName) {
    return this.modules.get(moduleName);
  }
  /**
   * 获取所有已注册模块
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }
  /**
   * 获取加载统计
   */
  getStats() {
    const allModules = this.getAllModules();
    const loaded = allModules.filter((m) => m.loaded);
    const loadTimes = loaded.map((m) => m.loadTime).filter((t) => t !== void 0);
    const averageLoadTime = loadTimes.length > 0 ? loadTimes.reduce((sum, t) => sum + t, 0) / loadTimes.length : 0;
    return {
      registered: allModules.length,
      loaded: loaded.length,
      cached: this.moduleCache.size,
      loading: this.loadingPromises.size,
      averageLoadTime
    };
  }
  /**
   * 生成依赖图
   */
  generateDependencyGraph() {
    let graph = "digraph ModuleDependencies {\n";
    graph += "  rankdir=LR;\n";
    graph += "  node [shape=box];\n\n";
    const allModules = this.getAllModules();
    for (const module of allModules) {
      const color = module.loaded ? "lightgreen" : "lightgray";
      const shape = module.dependencies.length === 0 ? "ellipse" : "box";
      graph += `  "${module.name}" [fillcolor=${color}, style=filled, shape=${shape}];
`;
    }
    graph += "\n";
    for (const module of allModules) {
      for (const dep of module.dependencies) {
        graph += `  "${dep}" -> "${module.name}";
`;
      }
    }
    graph += "}\n";
    return graph;
  }
  /**
   * 分析未使用的模块
   */
  findUnusedModules() {
    const allModules = this.getAllModules();
    return allModules.filter((m) => !m.loaded).map((m) => m.name);
  }
  /**
   * 清除缓存
   */
  clearCache() {
    this.moduleCache.clear();
    this.logger?.debug("Module cache cleared");
  }
  /**
   * 销毁加载器
   */
  destroy() {
    this.loadingPromises.clear();
    this.moduleCache.clear();
    this.modules.clear();
    this.loadQueue = [];
  }
  /**
   * 实际加载模块的私有方法
   */
  async loadModule(moduleName, options) {
    const startTime = Date.now();
    while (this.currentLoads >= this.config.maxConcurrentLoads) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    this.currentLoads++;
    try {
      const module = await this.dynamicImport(moduleName, options);
      const loadTime = Date.now() - startTime;
      const metadata = this.modules.get(moduleName);
      if (metadata) {
        metadata.loaded = true;
        metadata.loadTime = loadTime;
      }
      this.config.onModuleLoad({
        name: moduleName,
        dependencies: metadata?.dependencies || [],
        exports: metadata?.exports || [],
        loaded: true,
        loadTime
      });
      this.logger?.debug(`Module loaded: ${moduleName}`, { loadTime: `${loadTime}ms` });
      return module;
    } catch (error) {
      this.config.onModuleError(error, moduleName);
      this.logger?.error(`Failed to load module: ${moduleName}`, error);
      throw error;
    } finally {
      this.currentLoads--;
    }
  }
  /**
   * 动态导入实现
   */
  async dynamicImport(moduleName, options) {
    const retries = options.retry || 3;
    const timeout = options.timeout || 3e4;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Module load timeout: ${moduleName}`)), timeout);
        });
        const modulePath = this.config.baseUrl ? `${this.config.baseUrl}/${moduleName}` : moduleName;
        const importPromise = import(
          /* @vite-ignore */
          modulePath
        );
        const module = await Promise.race([importPromise, timeoutPromise]);
        return module;
      } catch (error) {
        if (attempt < retries) {
          this.logger?.debug(`Retrying module load: ${moduleName} (attempt ${attempt + 1})`);
          await new Promise((resolve) => setTimeout(resolve, 1e3 * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Failed to load module after ${retries} retries: ${moduleName}`);
  }
}
function createModuleLoader(config, logger) {
  return new ModuleLoader(config, logger);
}
function LazyModule(moduleName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    let moduleLoaded = false;
    let cachedModule;
    descriptor.value = async function(...args) {
      if (!moduleLoaded) {
        const loader = getGlobalModuleLoader();
        cachedModule = await loader.load(moduleName);
        moduleLoaded = true;
      }
      return originalMethod.apply(this, [cachedModule, ...args]);
    };
    return descriptor;
  };
}
let globalModuleLoader;
function getGlobalModuleLoader() {
  if (!globalModuleLoader) {
    globalModuleLoader = createModuleLoader();
  }
  return globalModuleLoader;
}
function setGlobalModuleLoader(loader) {
  globalModuleLoader = loader;
}

export { LazyModule, ModuleLoader, createModuleLoader, getGlobalModuleLoader, setGlobalModuleLoader };
//# sourceMappingURL=module-loader.js.map
