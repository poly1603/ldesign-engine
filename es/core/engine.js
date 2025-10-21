/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { createApp } from 'vue';
import { createCacheManager } from '../cache/cache-manager.js';
import { createConfigManager, defaultConfigSchema } from '../config/config-manager.js';
import { createDirectiveManager } from '../directives/directive-manager.js';
import { convertEngineToVueDirective } from '../directives/utils/directive-compatibility.js';
import { createEnvironmentManager } from '../environment/environment-manager.js';
import { createErrorManager } from '../errors/error-manager.js';
import { createEventManager } from '../events/event-manager.js';
import { createLifecycleManager } from '../lifecycle/lifecycle-manager.js';
import { createLogger } from '../logger/logger.js';
import { createMiddlewareManager } from '../middleware/middleware-manager.js';
import { createNotificationSystem } from '../notifications/notification-system.js';
import { createPerformanceManager } from '../performance/performance-manager.js';
import { createPluginManager } from '../plugins/plugin-manager.js';
import { createSecurityManager } from '../security/security-manager.js';
import { createStateManager } from '../state/state-manager.js';
import { ManagerRegistry } from './manager-registry.js';

class EngineImpl {
  /**
   * 懒加载事件管理器访问器
   */
  get events() {
    if (!this._events) {
      const startTime = Date.now();
      this._events = createEventManager(this.logger);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("events");
      this.logger.debug("Event manager initialized lazily", { initTime: `${initTime}ms` });
    }
    return this._events;
  }
  /**
   * 懒加载状态管理器访问器
   */
  get state() {
    if (!this._state) {
      const startTime = Date.now();
      this._state = createStateManager(this.logger);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("state");
      this.logger.debug("State manager initialized lazily", { initTime: `${initTime}ms` });
    }
    return this._state;
  }
  /**
   * 懒加载错误管理器访问器
   */
  get errors() {
    if (!this._errors) {
      const startTime = Date.now();
      this._errors = createErrorManager();
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("errors");
      this.logger.debug("Error manager initialized lazily", { initTime: `${initTime}ms` });
      this.ensureErrorHandling();
    }
    return this._errors;
  }
  /**
   * 懒加载指令管理器访问器
   */
  get directives() {
    if (!this._directives) {
      const startTime = Date.now();
      this._directives = createDirectiveManager();
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("directives");
      this.logger.debug("Directive manager initialized lazily", { initTime: `${initTime}ms` });
    }
    return this._directives;
  }
  /**
   * 懒加载通知管理器访问器
   */
  get notifications() {
    if (!this._notifications) {
      const startTime = Date.now();
      this._notifications = createNotificationSystem(this);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("notifications");
      this.logger.debug("Notification system initialized lazily", { initTime: `${initTime}ms` });
    }
    return this._notifications;
  }
  /**
   * 懒加载中间件管理器访问器
   */
  get middleware() {
    if (!this._middleware) {
      const startTime = Date.now();
      this._middleware = createMiddlewareManager(this.logger);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("middleware");
      this.logger.debug("Middleware manager initialized lazily", { initTime: `${initTime}ms` });
    }
    return this._middleware;
  }
  /**
   * 懒加载插件管理器访问器
   */
  get plugins() {
    if (!this._plugins) {
      const startTime = Date.now();
      this._plugins = createPluginManager(this);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("plugins");
      this.logger.debug("Plugin manager initialized lazily", { initTime: `${initTime}ms` });
    }
    return this._plugins;
  }
  /**
   * 懒加载缓存管理器访问器
   *
   * 使用懒加载模式来优化应用启动性能，只有在实际需要缓存功能时才初始化
   * 缓存管理器。这种方式可以显著减少应用的初始化时间。
   *
   * @returns {CacheManager} 缓存管理器实例
   *
   * @example
   * ```typescript
   * // 第一次访问时会自动初始化
   * const cache = engine.cache
   * cache.set('key', 'value')
   * ```
   */
  get cache() {
    if (!this._cache) {
      const startTime = Date.now();
      this._cache = createCacheManager(this.config?.get("cache", {}));
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("cache");
      this.logger.debug("Cache manager initialized lazily", {
        initTime: `${initTime}ms`
      });
    }
    return this._cache;
  }
  /**
   * 懒加载性能管理器访问器
   *
   * 性能管理器用于监控和优化应用性能，包括：
   * - 应用加载时间监控
   * - 组件渲染性能监控
   * - 内存使用情况监控
   * - 网络请求性能监控
   *
   * @returns {PerformanceManager} 性能管理器实例
   */
  get performance() {
    if (!this._performance) {
      const startTime = Date.now();
      this._performance = createPerformanceManager(void 0, this);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("performance");
      this.logger.debug("Performance manager initialized lazily", {
        initTime: `${initTime}ms`
      });
    }
    return this._performance;
  }
  /**
   * 懒加载安全管理器访问器
   *
   * 安全管理器提供应用安全防护功能，包括：
   * - XSS 攻击防护
   * - CSRF 攻击防护
   * - 内容安全策略 (CSP)
   * - 输入验证和清理
   * - 敏感操作权限检查
   *
   * @returns {SecurityManager} 安全管理器实例
   */
  get security() {
    if (!this._security) {
      const startTime = Date.now();
      this._security = createSecurityManager(void 0, this);
      const initTime = Date.now() - startTime;
      this.managerRegistry.markInitialized("security");
      this.logger.debug("Security manager initialized lazily", {
        initTime: `${initTime}ms`
      });
    }
    return this._security;
  }
  /**
   * 构造函数 - 按照依赖顺序初始化所有管理器
   *
   * 初始化顺序非常重要：
   * 1. 配置管理器 - 其他组件需要读取配置
   * 2. 日志器 - 所有组件都需要记录日志
   * 3. 管理器注册表 - 管理组件依赖关系
   * 4. 环境管理器 - 提供运行环境信息
   * 5. 生命周期管理器 - 管理组件生命周期
   * 6. 其他核心管理器 - 按依赖关系顺序初始化
   *
   * @param config 引擎配置对象
   */
  constructor(config = {}) {
    this._mounted = false;
    this._isReady = false;
    try {
      this.config = createConfigManager({
        debug: false,
        ...config
      });
      this.config?.setSchema(defaultConfigSchema);
      const logLevel = this.config?.get("debug", false) ? "debug" : "info";
      this.logger = createLogger(logLevel);
      this.managerRegistry = new ManagerRegistry(this.logger);
      this.registerManagers();
      this.environment = createEnvironmentManager(this.logger);
      this.lifecycle = createLifecycleManager(this.logger);
      this.setupConfigWatchers();
      Promise.resolve().then(() => {
        this.lifecycle.execute("afterInit", this).catch((error) => {
          this.logger.error("Error in afterInit lifecycle hooks", error);
        });
      });
    } catch (error) {
      console.error("Failed to initialize engine:", error);
      this.emergencyCleanup();
      throw error;
    }
  }
  /**
   * 确保错误处理已设置（延迟初始化）
   * @private
   */
  ensureErrorHandling() {
    if (!this._errors)
      return;
    if (this._errors._handlingSetup)
      return;
    this._errors._handlingSetup = true;
    this._errors.onError((errorInfo) => {
      this.logger.error("Global error captured", errorInfo);
      if (this._events) {
        this._events.emit("engine:error", errorInfo);
      }
      if (this.config?.get("debug", false) && this._notifications) {
        this._notifications.show({
          type: "error",
          title: "Error Captured",
          content: errorInfo.message,
          duration: 5e3
          // 5秒后自动消失
        });
      }
    });
  }
  /**
   * 设置配置变化监听器
   *
   * @private
   */
  setupConfigWatchers() {
    if (!this.configWatchers) {
      this.configWatchers = /* @__PURE__ */ new Map();
    }
    const debouncedDebugChange = this.debounce((newValue) => {
      this.logger.setLevel(newValue ? "debug" : "info");
      this.logger.info("Debug mode changed", { debug: newValue });
    }, 300);
    this.configWatchers.set("debug", debouncedDebugChange);
    this.config?.watch("debug", debouncedDebugChange);
    const debouncedLevelChange = this.debounce((newValue) => {
      const allowed = ["debug", "info", "warn", "error"];
      const level = typeof newValue === "string" && allowed.includes(newValue) ? newValue : this.logger.getLevel();
      this.logger.setLevel(level);
      this.logger.info("Log level changed", { level });
    }, 300);
    this.configWatchers.set("logger.level", debouncedLevelChange);
    this.config?.watch("logger.level", debouncedLevelChange);
  }
  /**
   * 防抖函数 - 优化性能和内存
   * @private
   * @template T 函数类型
   * @param func 要防抖的函数
   * @param wait 等待时间（毫秒）
   * @returns 防抖后的函数
   */
  debounce(func, wait) {
    let timeoutId;
    const debounced = (...args) => {
      if (timeoutId !== void 0) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        func(...args);
        timeoutId = void 0;
      }, wait);
    };
    debounced.cancel = () => {
      if (timeoutId !== void 0) {
        clearTimeout(timeoutId);
        timeoutId = void 0;
      }
    };
    return debounced;
  }
  // 核心方法
  async init() {
    try {
      await this.lifecycle.execute("beforeInit", this);
      await this.plugins.initializeAll();
      this._isReady = true;
      await this.lifecycle.execute("afterInit", this);
      this.logger.info("Engine initialization completed successfully");
    } catch (error) {
      this.logger.error("Engine initialization failed", error);
      this._isReady = false;
      throw error;
    }
  }
  isReady() {
    return this._isReady;
  }
  // 创建Vue应用
  createApp(rootComponent) {
    if (this._app) {
      this.logger.warn("Vue app already created");
      return this._app;
    }
    this._app = createApp(rootComponent);
    this.install(this._app);
    this.events.emit("app:created", this._app);
    return this._app;
  }
  install(app) {
    if (this._app && this._app !== app) {
      this.logger.warn("Engine already installed to different app");
      return;
    }
    this._app = app;
    app.config.globalProperties.$engine = this;
    app.provide("engine", this);
    if (this._directives) {
      const directiveNames = this._directives.getNames();
      directiveNames.forEach((name) => {
        const eng = this._directives.get(name);
        if (eng) {
          const vueDir = convertEngineToVueDirective(eng);
          app.directive(name, vueDir);
        }
      });
    }
    app.config.errorHandler = (error, component, info) => {
      this.errors.captureError(error, component || void 0, info);
    };
    if (this.router && typeof this.router.install === "function") {
      this.router.install(this);
    }
    if (this.store && typeof this.store.install === "function") {
      this.store.install(this);
    }
    if (this.i18n && typeof this.i18n.install === "function") {
      this.i18n.install(this);
    }
    if (this.theme && typeof this.theme.install === "function") {
      this.theme.install(this);
    }
    if (this._events) {
      this._events.emit("engine:installed", { app });
    }
  }
  async use(plugin) {
    await this.plugins.register(plugin);
  }
  async mount(selector) {
    if (!this._app) {
      throw new Error("Engine must have a Vue app before mounting. Use createApp() first.");
    }
    if (this._mounted) {
      this.logger.warn("Engine already mounted");
      return;
    }
    await this.lifecycle.execute("beforeMount", this);
    this._mountTarget = selector;
    this._app.mount(selector);
    this._mounted = true;
    this.events.emit("engine:mounted", { target: selector });
    await this.lifecycle.execute("afterMount", this);
  }
  async unmount() {
    if (!this._app || !this._mounted) {
      this.logger.warn("Engine not mounted");
      return;
    }
    await this.lifecycle.execute("beforeUnmount", this);
    this._app.unmount();
    this._mounted = false;
    this.logger.info("Engine unmounted");
    this.events.emit("engine:unmounted");
    await this.lifecycle.execute("afterUnmount", this);
  }
  // 扩展方法
  setRouter(router) {
    this.router = router;
    if (this._app) {
      router.install(this);
    }
    this.logger.info("Router adapter set");
  }
  setStore(store) {
    this.store = store;
    if (this._app) {
      store.install(this);
    }
    this.logger.info("Store adapter set");
  }
  setI18n(i18n) {
    this.i18n = i18n;
    if (this._app) {
      i18n.install(this);
    }
    this.logger.info("I18n adapter set");
  }
  setTheme(theme) {
    this.theme = theme;
    if (this._app) {
      theme.install(this);
    }
    this.logger.info("Theme adapter set");
  }
  // 获取Vue应用实例
  getApp() {
    return this._app;
  }
  // 检查是否已挂载
  isMounted() {
    return this._mounted;
  }
  // 获取挂载目标
  getMountTarget() {
    return this._mountTarget;
  }
  /**
   * 销毁引擎 - 完全清理所有资源和内存
   *
   * 按照依赖关系的反向顺序清理资源，确保没有内存泄漏
   * @returns Promise<void>
   */
  async destroy() {
    try {
      await this.lifecycle.execute("beforeDestroy", this);
      if (this._mounted) {
        await this.unmount();
      }
      this.events.emit("engine:destroy");
      await this.cleanupManagers();
      if (this._cache) {
        if ("destroy" in this._cache && typeof this._cache.destroy === "function") {
          this._cache.destroy();
        } else {
          this._cache.clear();
        }
        this._cache = void 0;
      }
      if (this._performance) {
        if ("destroy" in this._performance && typeof this._performance.destroy === "function") {
          this._performance.destroy();
        }
        this._performance = void 0;
      }
      if (this._security) {
        if ("destroy" in this._security && typeof this._security.destroy === "function") {
          this._security.destroy();
        }
        this._security = void 0;
      }
      if (this._app) {
        delete this._app.config.globalProperties.$engine;
        this._app = void 0;
      }
      this._mountTarget = void 0;
      this.config?.disableAutoSave();
      this._isReady = false;
      this._mounted = false;
      this.managerRegistry.clear();
      this.logger.info("Engine destroyed successfully");
      await this.lifecycle.execute("afterDestroy", this);
      this.logger = void 0;
    } catch (error) {
      console.error("Error during engine destruction:", error);
      this.emergencyCleanup();
    }
  }
  // 配置相关方法
  updateConfig(config) {
    this.config?.merge(config);
    this.logger.info("Engine configuration updated", {
      keys: Object.keys(config)
    });
  }
  getConfig(path, defaultValue) {
    return this.config?.get(path, defaultValue);
  }
  setConfig(path, value) {
    this.config?.set(path, value);
    this.logger.debug("Engine configuration set", { path, value });
  }
  // 获取管理器初始化统计
  getManagerStats() {
    return this.managerRegistry.getInitializationStats();
  }
  // 验证管理器依赖图
  validateManagers() {
    const { valid, errors } = this.managerRegistry.validateDependencyGraph();
    return { valid, errors };
  }
  // 私有方法：注册管理器（更新为懒加载模式）
  registerManagers() {
    this.managerRegistry.register("config", []);
    this.managerRegistry.register("logger", ["config"]);
    this.managerRegistry.register("environment", ["logger"]);
    this.managerRegistry.register("lifecycle", ["logger"]);
    this.managerRegistry.register("events", ["logger"], true);
    this.managerRegistry.register("state", ["logger"], true);
    this.managerRegistry.register("errors", [], true);
    this.managerRegistry.register("directives", [], true);
    this.managerRegistry.register("notifications", ["logger"], true);
    this.managerRegistry.register("middleware", ["logger"], true);
    this.managerRegistry.register("plugins", ["events", "state", "middleware"], true);
    this.managerRegistry.register("cache", ["config"], true);
    this.managerRegistry.register("performance", ["config", "logger"], true);
    this.managerRegistry.register("security", ["config", "logger"], true);
    this.logger.debug("Managers registered in registry (lazy-load mode)");
  }
  /**
   * 清理所有管理器 - 优化版（支持懒加载的管理器）
   * @private
   */
  async cleanupManagers() {
    try {
      if (this.configWatchers) {
        for (const watcher of this.configWatchers.values()) {
          watcher.cancel();
        }
        this.configWatchers.clear();
        this.configWatchers = void 0;
      }
      const cleanupOrder = [
        { key: "_plugins", name: "plugins" },
        { key: "_middleware", name: "middleware" },
        { key: "_notifications", name: "notifications" },
        { key: "_directives", name: "directives" },
        { key: "_errors", name: "errors" },
        { key: "_state", name: "state" },
        { key: "_events", name: "events" }
      ];
      for (const { key, name } of cleanupOrder) {
        const manager = this[key];
        if (manager) {
          if ("destroy" in manager && typeof manager.destroy === "function") {
            await Promise.resolve(manager.destroy());
          } else if ("clear" in manager && typeof manager.clear === "function") {
            manager.clear();
          }
          this[key] = void 0;
          this.logger?.debug(`Manager "${name}" cleaned up`);
        }
      }
    } catch (error) {
      this.logger?.error("Error cleaning up managers:", error);
    }
  }
  /**
   * 紧急清理 - 在发生严重错误时使用
   * @private
   */
  emergencyCleanup() {
    try {
      const managersToClean = [
        this._events,
        this._state,
        this._errors,
        this._directives,
        this._notifications,
        this._middleware,
        this._plugins,
        this._cache,
        this._performance,
        this._security
      ];
      for (const manager of managersToClean) {
        if (manager && typeof manager === "object") {
          if ("destroy" in manager && typeof manager.destroy === "function") {
            try {
              manager.destroy();
            } catch {
            }
          } else if ("clear" in manager && typeof manager.clear === "function") {
            try {
              manager.clear();
            } catch {
            }
          }
        }
      }
      if (this._app) {
        try {
          delete this._app.config.globalProperties.$engine;
        } catch {
        }
      }
      this._isReady = false;
      this._mounted = false;
    } catch (error) {
      console.error("Emergency cleanup failed:", error);
    }
  }
}

export { EngineImpl };
//# sourceMappingURL=engine.js.map
