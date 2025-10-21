/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
export { createSharedState, useDark, useLocale, usePluginState, usePluginStates, useSize, useTheme } from './composables/use-plugin-state.js';
export { createAndMountEngineApp, createEngineApp } from './core/create-engine-app.js';
export { LazyModule, ModuleLoader, createModuleLoader, getGlobalModuleLoader, setGlobalModuleLoader } from './core/module-loader.js';
export { NotificationPool, ObjectPool, ObjectPoolManager, Pooled, RequestPool, TaskPool, createObjectPoolManager, getGlobalObjectPoolManager, setGlobalObjectPoolManager } from './core/object-pools.js';
export { createLocaleAwarePlugin, createSimpleLocaleAwarePlugin } from './locale/create-locale-aware-plugin.js';
export { LocaleManager, createLocaleManager } from './locale/locale-manager.js';
export { Measure, PerformanceMonitor, getGlobalPerformanceMonitor } from './performance/performance-monitor.js';
export { Profile, Profiler, createProfiler, getGlobalProfiler, setGlobalProfiler } from './performance/profiler.js';
export { createI18nEnginePlugin } from './plugins/i18n.js';
export { debounce, deepClone, generateId, throttle } from './utils/index.js';
export { SmartCacheStrategy, createSmartCacheStrategy } from './cache/smart-cache.js';
export { useEngine } from './vue/composables/useEngine.js';
export { useCache, useConfig, useErrorHandler, useEvents, useLogger, useNotification, usePerformance, usePlugins } from './vue/composables/useEngineFeatures.js';
export { LRUCache, createLRUCache } from './utils/lru-cache.js';

const version = "1.0.0";

export { version };
//# sourceMappingURL=index.js.map
