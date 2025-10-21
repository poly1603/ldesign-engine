/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:09 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

var directiveManager = require('../directives/directive-manager.cjs');
var performanceBudget = require('../performance/performance-budget.cjs');
var shortcutsManager = require('../shortcuts/shortcuts-manager.cjs');
var quickSetup = require('../utils/quick-setup.cjs');
var engine = require('./engine.cjs');

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
    const engine$1 = new engine.EngineImpl(engineConfig);
    if (loggerOptions.enabled !== false) {
      const logger = quickSetup.createQuickLogger({
        level: loggerOptions.level || (config.debug ? "debug" : "warn"),
        maxLogs: loggerOptions.maxLogs || 100,
        showTimestamp: loggerOptions.showTimestamp ?? false,
        showContext: loggerOptions.showContext ?? false,
        prefix: loggerOptions.prefix
      });
      Object.defineProperty(engine$1, "logger", {
        value: logger,
        writable: false,
        configurable: false
      });
    }
    if (cacheOptions.enabled !== false && features.enableCaching !== false) {
      const cacheManager = quickSetup.createQuickCacheManager({
        maxSize: cacheOptions.maxSize || 100,
        defaultTTL: cacheOptions.defaultTTL || 3e5,
        // 5分钟
        cleanupInterval: cacheOptions.cleanupInterval || 6e4,
        // 1分钟
        enableMemoryLimit: cacheOptions.enableMemoryLimit ?? true,
        memoryLimit: cacheOptions.memoryLimit || 10
      });
      Object.defineProperty(engine$1, "cache", {
        value: cacheManager,
        writable: false,
        configurable: false
      });
    }
    if (performanceOptions.enabled === true || features.enablePerformanceMonitoring === true) {
      const performanceManager = quickSetup.createQuickPerformanceManager({
        sampleRate: performanceOptions.sampleRate || 1,
        monitorMemory: performanceOptions.monitorMemory ?? false,
        monitorNetwork: performanceOptions.monitorNetwork ?? false,
        monitorComponents: performanceOptions.monitorComponents ?? false,
        reportInterval: performanceOptions.reportInterval || 5e3
      });
      Object.defineProperty(engine$1, "performance", {
        value: performanceManager,
        writable: false,
        configurable: false
      });
    }
    if (performanceOptions.budget) {
      const budgetManager = new performanceBudget.PerformanceBudgetManager(performanceOptions.budget, performanceOptions.onBudgetExceeded || ((metric) => {
        console.warn(`[\u6027\u80FD\u9884\u7B97\u8D85\u6807] ${metric.name}: ${metric.value}${metric.unit} > ${metric.limit}${metric.unit} (${metric.percentage.toFixed(1)}%)`);
      }));
      Object.defineProperty(engine$1, "performanceBudget", {
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
    engine$1.directives.registerBatch(directiveManager.commonDirectives);
    if (shortcutsOptions.keys || shortcutsOptions.scopes) {
      const shortcutsManager$1 = new shortcutsManager.ShortcutsManager();
      if (shortcutsOptions.conflictMode) {
        shortcutsManager$1.setConflictMode(shortcutsOptions.conflictMode);
      }
      if (shortcutsOptions.keys) {
        shortcutsManager$1.registerBatch(shortcutsOptions.keys);
      }
      if (shortcutsOptions.scopes) {
        Object.entries(shortcutsOptions.scopes).forEach(([scopeName, shortcuts]) => {
          shortcutsManager$1.registerScope(scopeName, shortcuts);
        });
      }
      if (shortcutsOptions.enabled !== void 0) {
        shortcutsManager$1.setManagerEnabled(shortcutsOptions.enabled);
      }
      Object.defineProperty(engine$1, "shortcuts", {
        value: shortcutsManager$1,
        writable: false,
        configurable: false
      });
    }
    for (const m of middleware) {
      try {
        engine$1.middleware.use(m);
      } catch (error) {
        onError(error, `middleware registration: ${m.name}`);
      }
    }
    for (const plugin of plugins) {
      try {
        await engine$1.use(plugin);
      } catch (error) {
        onError(error, `plugin installation: ${plugin.name}`);
      }
    }
    if (onReady) {
      try {
        await onReady(engine$1);
      } catch (error) {
        onError(error, "onReady callback");
      }
    }
    if (rootComponent) {
      try {
        const app = engine$1.createApp(rootComponent);
        if (setupApp) {
          await setupApp(app);
        }
        if (mountElement) {
          await engine$1.mount(mountElement);
          if (onMounted) {
            try {
              await onMounted(engine$1);
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
    return engine$1;
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

exports.createAndMountEngineApp = createAndMountEngineApp;
exports.createEngineApp = createEngineApp;
//# sourceMappingURL=create-engine-app.cjs.map
