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

var cacheManager = require('../cache/cache-manager.cjs');
var logger = require('../logger/logger.cjs');
var performanceManager = require('../performance/performance-manager.cjs');

function quickCache(options) {
  const config = {
    maxSize: options?.maxSize ?? 50,
    // 更小的默认缓存
    defaultTTL: options?.ttl ?? 5 * 60 * 1e3,
    // 5分钟TTL
    strategy: "lru",
    enableStats: false,
    // 默认关闭统计
    maxMemory: 5 * 1024 * 1024,
    // 5MB内存限制
    cleanupInterval: 3e4,
    // 30秒清理
    layers: options?.persistent ? {
      localStorage: {
        enabled: true,
        prefix: "qc_",
        maxSize: 2 * 1024 * 1024
        // 2MB
      }
    } : {}
  };
  return cacheManager.createCacheManager(config);
}
function quickLogger(options) {
  const config = {
    level: options?.level ?? "warn",
    // 生产环境默认只记录警告
    enabled: true,
    maxLogs: 50,
    // 减少日志存储
    console: options?.console ?? true,
    remote: false,
    file: false,
    format: "text",
    // 简单格式
    timestamp: false,
    context: false,
    async: false,
    bufferSize: 20
    // 小缓冲区
  };
  const logger$1 = logger.createUnifiedLogger(config);
  if (options?.prefix) {
    const originalDebug = logger$1.debug.bind(logger$1);
    const originalInfo = logger$1.info.bind(logger$1);
    const originalWarn = logger$1.warn.bind(logger$1);
    const originalError = logger$1.error.bind(logger$1);
    logger$1.debug = (msg, ...args) => originalDebug(`[${options.prefix}] ${msg}`, ...args);
    logger$1.info = (msg, ...args) => originalInfo(`[${options.prefix}] ${msg}`, ...args);
    logger$1.warn = (msg, ...args) => originalWarn(`[${options.prefix}] ${msg}`, ...args);
    logger$1.error = (msg, error, ...args) => originalError(`[${options.prefix}] ${msg}`, error, ...args);
  }
  return logger$1;
}
function quickPerformance(options) {
  const perf = performanceManager.createPerformanceManager({
    responseTime: { good: 200, poor: 2e3 },
    fps: { good: 50, poor: 25 },
    memory: { warning: 50, critical: 100 },
    // MB
    bundleSize: { warning: 250, critical: 500 }
    // KB
  });
  if (options?.monitoring) {
    setTimeout(() => {
      perf.startMonitoring();
    }, 1e3);
  }
  return perf;
}
function quickSetup(options) {
  const cache = quickCache(options?.cache);
  const logger = quickLogger(options?.logger);
  const performance = quickPerformance(options?.performance);
  const cleanup = () => {
    cache.clear();
    cache.destroy();
    performance.clearData();
    if (performance.isMonitoring()) {
      performance.stopMonitoring();
    }
    logger.clear();
    logger.destroy();
  };
  return {
    cache,
    logger,
    performance,
    cleanup
  };
}
function lightCache() {
  return quickCache({
    maxSize: 20,
    ttl: 60 * 1e3,
    // 1分钟
    persistent: false
  });
}
function lightLogger(prefix) {
  return quickLogger({
    level: "error",
    console: true,
    prefix
  });
}
let _defaultCache;
let _defaultLogger;
function getDefaultCache() {
  if (!_defaultCache) {
    _defaultCache = lightCache();
  }
  return _defaultCache;
}
function getDefaultLogger() {
  if (!_defaultLogger) {
    _defaultLogger = lightLogger();
  }
  return _defaultLogger;
}
function createQuickLogger(options) {
  return quickLogger({
    level: options?.level,
    console: true,
    prefix: options?.prefix
  });
}
function createQuickCacheManager(options) {
  return quickCache({
    maxSize: options?.maxSize,
    ttl: options?.defaultTTL,
    persistent: false
  });
}
function createQuickPerformanceManager(options) {
  return quickPerformance({
    monitoring: true,
    fpsTracking: options?.monitorComponents ?? false,
    memoryTracking: options?.monitorMemory ?? false
  });
}

exports.createQuickCacheManager = createQuickCacheManager;
exports.createQuickLogger = createQuickLogger;
exports.createQuickPerformanceManager = createQuickPerformanceManager;
exports.getDefaultCache = getDefaultCache;
exports.getDefaultLogger = getDefaultLogger;
exports.lightCache = lightCache;
exports.lightLogger = lightLogger;
exports.quickCache = quickCache;
exports.quickLogger = quickLogger;
exports.quickPerformance = quickPerformance;
exports.quickSetup = quickSetup;
//# sourceMappingURL=quick-setup.cjs.map
