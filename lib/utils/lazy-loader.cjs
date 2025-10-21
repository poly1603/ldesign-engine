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

const moduleCache = /* @__PURE__ */ new Map();
const preloadQueue = /* @__PURE__ */ new Set();
async function lazyLoad(importFn, cacheKey) {
  const key = cacheKey || importFn.toString();
  if (moduleCache.has(key)) {
    return moduleCache.get(key);
  }
  const promise = importFn();
  moduleCache.set(key, promise);
  return promise;
}
function preload(importFn, cacheKey) {
  const key = cacheKey || importFn.toString();
  if (moduleCache.has(key) || preloadQueue.has(key)) {
    return;
  }
  preloadQueue.add(key);
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(() => {
      lazyLoad(importFn, cacheKey).finally(() => {
        preloadQueue.delete(key);
      });
    });
  } else {
    setTimeout(() => {
      lazyLoad(importFn, cacheKey).finally(() => {
        preloadQueue.delete(key);
      });
    }, 0);
  }
}
function preloadBatch(loaders) {
  loaders.forEach(({ importFn, cacheKey }) => {
    preload(importFn, cacheKey);
  });
}
function clearCache(cacheKey) {
  if (cacheKey) {
    moduleCache.delete(cacheKey);
  } else {
    moduleCache.clear();
  }
}
function getCacheStats() {
  return {
    size: moduleCache.size,
    keys: Array.from(moduleCache.keys())
  };
}
function lazyComponent(importFn) {
  return () => lazyLoad(importFn);
}
class SmartPreloader {
  constructor() {
    this.patterns = /* @__PURE__ */ new Map();
    this.threshold = 3;
  }
  /**
   * 记录访问
   * @param key 访问键
   */
  record(key) {
    const count = (this.patterns.get(key) || 0) + 1;
    this.patterns.set(key, count);
  }
  /**
   * 检查是否应该预加载
   * @param key 检查键
   * @returns 是否应该预加载
   */
  shouldPreload(key) {
    return (this.patterns.get(key) || 0) >= this.threshold;
  }
  /**
   * 重置统计
   */
  reset() {
    this.patterns.clear();
  }
  /**
   * 获取热门项
   * @param limit 限制数量
   * @returns 热门项列表
   */
  getTopPatterns(limit = 10) {
    return Array.from(this.patterns.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
  }
}
const smartPreloader = new SmartPreloader();

exports.SmartPreloader = SmartPreloader;
exports.clearCache = clearCache;
exports.getCacheStats = getCacheStats;
exports.lazyComponent = lazyComponent;
exports.lazyLoad = lazyLoad;
exports.preload = preload;
exports.preloadBatch = preloadBatch;
exports.smartPreloader = smartPreloader;
//# sourceMappingURL=lazy-loader.cjs.map
