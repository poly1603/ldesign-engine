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

var usePluginState = require('./composables/use-plugin-state.cjs');
var createEngineApp = require('./core/create-engine-app.cjs');
var moduleLoader = require('./core/module-loader.cjs');
var objectPools = require('./core/object-pools.cjs');
var createLocaleAwarePlugin = require('./locale/create-locale-aware-plugin.cjs');
var localeManager = require('./locale/locale-manager.cjs');
var performanceMonitor = require('./performance/performance-monitor.cjs');
var profiler = require('./performance/profiler.cjs');
var i18n = require('./plugins/i18n.cjs');
var index = require('./utils/index.cjs');
var smartCache = require('./cache/smart-cache.cjs');
var useEngine = require('./vue/composables/useEngine.cjs');
var useEngineFeatures = require('./vue/composables/useEngineFeatures.cjs');
var lruCache = require('./utils/lru-cache.cjs');

const version = "1.0.0";

exports.createSharedState = usePluginState.createSharedState;
exports.useDark = usePluginState.useDark;
exports.useLocale = usePluginState.useLocale;
exports.usePluginState = usePluginState.usePluginState;
exports.usePluginStates = usePluginState.usePluginStates;
exports.useSize = usePluginState.useSize;
exports.useTheme = usePluginState.useTheme;
exports.createAndMountEngineApp = createEngineApp.createAndMountEngineApp;
exports.createEngineApp = createEngineApp.createEngineApp;
exports.LazyModule = moduleLoader.LazyModule;
exports.ModuleLoader = moduleLoader.ModuleLoader;
exports.createModuleLoader = moduleLoader.createModuleLoader;
exports.getGlobalModuleLoader = moduleLoader.getGlobalModuleLoader;
exports.setGlobalModuleLoader = moduleLoader.setGlobalModuleLoader;
exports.NotificationPool = objectPools.NotificationPool;
exports.ObjectPool = objectPools.ObjectPool;
exports.ObjectPoolManager = objectPools.ObjectPoolManager;
exports.Pooled = objectPools.Pooled;
exports.RequestPool = objectPools.RequestPool;
exports.TaskPool = objectPools.TaskPool;
exports.createObjectPoolManager = objectPools.createObjectPoolManager;
exports.getGlobalObjectPoolManager = objectPools.getGlobalObjectPoolManager;
exports.setGlobalObjectPoolManager = objectPools.setGlobalObjectPoolManager;
exports.createLocaleAwarePlugin = createLocaleAwarePlugin.createLocaleAwarePlugin;
exports.createSimpleLocaleAwarePlugin = createLocaleAwarePlugin.createSimpleLocaleAwarePlugin;
exports.LocaleManager = localeManager.LocaleManager;
exports.createLocaleManager = localeManager.createLocaleManager;
exports.Measure = performanceMonitor.Measure;
exports.PerformanceMonitor = performanceMonitor.PerformanceMonitor;
exports.getGlobalPerformanceMonitor = performanceMonitor.getGlobalPerformanceMonitor;
exports.Profile = profiler.Profile;
exports.Profiler = profiler.Profiler;
exports.createProfiler = profiler.createProfiler;
exports.getGlobalProfiler = profiler.getGlobalProfiler;
exports.setGlobalProfiler = profiler.setGlobalProfiler;
exports.createI18nEnginePlugin = i18n.createI18nEnginePlugin;
exports.debounce = index.debounce;
exports.deepClone = index.deepClone;
exports.generateId = index.generateId;
exports.throttle = index.throttle;
exports.SmartCacheStrategy = smartCache.SmartCacheStrategy;
exports.createSmartCacheStrategy = smartCache.createSmartCacheStrategy;
exports.useEngine = useEngine.useEngine;
exports.useCache = useEngineFeatures.useCache;
exports.useConfig = useEngineFeatures.useConfig;
exports.useErrorHandler = useEngineFeatures.useErrorHandler;
exports.useEvents = useEngineFeatures.useEvents;
exports.useLogger = useEngineFeatures.useLogger;
exports.useNotification = useEngineFeatures.useNotification;
exports.usePerformance = useEngineFeatures.usePerformance;
exports.usePlugins = useEngineFeatures.usePlugins;
exports.LRUCache = lruCache.LRUCache;
exports.createLRUCache = lruCache.createLRUCache;
exports.version = version;
//# sourceMappingURL=index.cjs.map
