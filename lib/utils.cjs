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

var loaders = require('./config/loaders.cjs');
var index = require('./utils/index.cjs');
var quickSetup = require('./utils/quick-setup.cjs');
var lazyLoader = require('./utils/lazy-loader.cjs');



exports.CompositeConfigLoader = loaders.CompositeConfigLoader;
exports.EnvironmentConfigLoader = loaders.EnvironmentConfigLoader;
exports.JsonConfigLoader = loaders.JsonConfigLoader;
exports.LocalStorageConfigLoader = loaders.LocalStorageConfigLoader;
exports.MemoryConfigLoader = loaders.MemoryConfigLoader;
exports.chunk = index.chunk;
exports.debounce = index.debounce;
exports.deepClone = index.deepClone;
exports.delay = index.delay;
exports.formatFileSize = index.formatFileSize;
exports.formatTime = index.formatTime;
exports.generateId = index.generateId;
exports.getNestedValue = index.getNestedValue;
exports.groupBy = index.groupBy;
exports.isEmpty = index.isEmpty;
exports.isFunction = index.isFunction;
exports.isObject = index.isObject;
exports.isPromise = index.isPromise;
exports.retry = index.retry;
exports.safeJsonParse = index.safeJsonParse;
exports.safeJsonStringify = index.safeJsonStringify;
exports.setNestedValue = index.setNestedValue;
exports.throttle = index.throttle;
exports.unique = index.unique;
exports.getDefaultCache = quickSetup.getDefaultCache;
exports.getDefaultLogger = quickSetup.getDefaultLogger;
exports.lightCache = quickSetup.lightCache;
exports.lightLogger = quickSetup.lightLogger;
exports.quickCache = quickSetup.quickCache;
exports.quickLogger = quickSetup.quickLogger;
exports.quickPerformance = quickSetup.quickPerformance;
exports.quickSetup = quickSetup.quickSetup;
exports.SmartPreloader = lazyLoader.SmartPreloader;
exports.clearLazyCache = lazyLoader.clearCache;
exports.getLazyCacheStats = lazyLoader.getCacheStats;
exports.lazyComponent = lazyLoader.lazyComponent;
exports.lazyLoad = lazyLoader.lazyLoad;
exports.preload = lazyLoader.preload;
exports.preloadBatch = lazyLoader.preloadBatch;
exports.smartPreloader = lazyLoader.smartPreloader;
//# sourceMappingURL=utils.cjs.map
