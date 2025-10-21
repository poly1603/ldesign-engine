/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { commonDirectives } from '../directives/directive-manager.js';
import { PerformanceBudgetManager } from '../performance/performance-budget.js';
import { ShortcutsManager } from '../shortcuts/shortcuts-manager.js';
import { createQuickLogger, createQuickCacheManager, createQuickPerformanceManager } from '../utils/quick-setup.js';
import { EngineImpl } from './engine.js';

async function createEngineApp(options = {}) {
  const { rootComponent, mountElement, config = {}, features = {}, logger: loggerOptions = {}, cache: cacheOptions = {}, performance: performanceOptions = {}, plugins = [], middleware = [], shortcuts: shortcutsOptions = {}, setupApp, onReady, onMounted, onError = (error, context) => console.error(`[EngineApp] Error in ${context}:`, error) } = options;
  try {
    const engineConfig = {
      app: {
        name: config.name || "LDesign App",
        version: config.version || "1.0.0",
        description: config.description || "",
        environment: config.environment || "development"
      },
      debug: config.debug ?? false,
      features: {
        enableHotReload: features.enableHotReload ?? false,
        enableDevTools: features.enableDevTools ?? false,
        enablePerformanceMonitoring: features.enablePerformanceMonitoring ?? false,
        enableErrorReporting: features.enableErrorReporting ?? true,
        enableSecurityProtection: features.enableSecurityProtection ?? false,
        enableCaching: features.enableCaching ?? true,
        enableNotifications: features.enableNotifications ?? false
      },
      ...config
      // 其他自定义配置
    };
    const engine = new EngineImpl(engineConfig);
    if (loggerOptions.enabled !== false) {
      const logger = createQuickLogger({
        level: loggerOptions.level || (config.debug ? "debug" : "warn"),
        maxLogs: loggerOptions.maxLogs || 100,
        showTimestamp: loggerOptions.showTimestamp ?? false,
        showContext: loggerOptions.showContext ?? false,
        prefix: loggerOptions.prefix
      });
      Object.defineProperty(engine, "logger", {
        value: logger,
        writable: false,
        configurable: false
      });
    }
    if (cacheOptions.enabled !== false && features.enableCaching !== false) {
      const cacheManager = createQuickCacheManager({
        maxSize: cacheOptions.maxSize || 100,
        defaultTTL: cacheOptions.defaultTTL || 3e5,
        // 5分钟
        cleanupInterval: cacheOptions.cleanupInterval || 6e4,
        // 1分钟
        enableMemoryLimit: cacheOptions.enableMemoryLimit ?? true,
        memoryLimit: cacheOptions.memoryLimit || 10
      });
      Object.defineProperty(engine, "cache", {
        value: cacheManager,
        writable: false,
        configurable: false
      });
    }
    if (performanceOptions.enabled === true || features.enablePerformanceMonitoring === true) {
      const performanceManager = createQuickPerformanceManager({
        sampleRate: performanceOptions.sampleRate || 1,
        monitorMemory: performanceOptions.monitorMemory ?? false,
        monitorNetwork: performanceOptions.monitorNetwork ?? false,
        monitorComponents: performanceOptions.monitorComponents ?? false,
        reportInterval: performanceOptions.reportInterval || 5e3
      });
      Object.defineProperty(engine, "performance", {
        value: performanceManager,
        writable: false,
        configurable: false
      });
    }
    if (performanceOptions.budget) {
      const budgetManager = new PerformanceBudgetManager(performanceOptions.budget, performanceOptions.onBudgetExceeded || ((metric) => {
        console.warn(`[\u6027\u80FD\u9884\u7B97\u8D85\u6807] ${metric.name}: ${metric.value}${metric.unit} > ${metric.limit}${metric.unit} (${metric.percentage.toFixed(1)}%)`);
      }));
      Object.defineProperty(engine, "performanceBudget", {
        value: budgetManager,
        writable: false,
        configurable: false
      });
      if (typeof window !== "undefined") {
        window.addEventListener("load", () => {
          budgetManager.startMonitoring();
        });
      }
    }
    engine.directives.registerBatch(commonDirectives);
    if (shortcutsOptions.keys || shortcutsOptions.scopes) {
      const shortcutsManager = new ShortcutsManager();
      if (shortcutsOptions.conflictMode) {
        shortcutsManager.setConflictMode(shortcutsOptions.conflictMode);
      }
      if (shortcutsOptions.keys) {
        shortcutsManager.registerBatch(shortcutsOptions.keys);
      }
      if (shortcutsOptions.scopes) {
        Object.entries(shortcutsOptions.scopes).forEach(([scopeName, shortcuts]) => {
          shortcutsManager.registerScope(scopeName, shortcuts);
        });
      }
      if (shortcutsOptions.enabled !== void 0) {
        shortcutsManager.setManagerEnabled(shortcutsOptions.enabled);
      }
      Object.defineProperty(engine, "shortcuts", {
        value: shortcutsManager,
        writable: false,
        configurable: false
      });
    }
    for (const m of middleware) {
      try {
        engine.middleware.use(m);
      } catch (error) {
        onError(error, `middleware registration: ${m.name}`);
      }
    }
    for (const plugin of plugins) {
      try {
        await engine.use(plugin);
      } catch (error) {
        onError(error, `plugin installation: ${plugin.name}`);
      }
    }
    if (onReady) {
      try {
        await onReady(engine);
      } catch (error) {
        onError(error, "onReady callback");
      }
    }
    if (rootComponent) {
      try {
        const app = engine.createApp(rootComponent);
        if (setupApp) {
          await setupApp(app);
        }
        if (mountElement) {
          await engine.mount(mountElement);
          if (onMounted) {
            try {
              await onMounted(engine);
            } catch (error) {
              onError(error, "onMounted callback");
            }
          }
        }
      } catch (error) {
        onError(error, "app creation/mounting");
        throw error;
      }
    }
    return engine;
  } catch (error) {
    onError(error, "engine initialization");
    throw error;
  }
}
async function createAndMountEngineApp(rootComponent, options = {}) {
  return createEngineApp({
    ...options,
    rootComponent,
    mountElement: "#app"
  });
}

export { createAndMountEngineApp, createEngineApp };
//# sourceMappingURL=create-engine-app.js.map
