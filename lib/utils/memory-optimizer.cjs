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

Object.defineProperty(exports, '__esModule', { value: true });

class ObjectPool {
  constructor(factory, reset, maxSize = 50) {
    this.pool = [];
    this.inUse = /* @__PURE__ */ new WeakSet();
    this.created = 0;
    this.recycled = 0;
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }
  /**
   * 获取对象
   */
  acquire() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      this.recycled++;
    } else {
      obj = this.factory();
      this.created++;
    }
    if (typeof obj === "object" && obj !== null) {
      this.inUse.add(obj);
    }
    return obj;
  }
  /**
   * 释放对象
   */
  release(obj) {
    if (typeof obj === "object" && obj !== null) {
      if (!this.inUse.has(obj)) {
        console.warn("Attempting to release object that was not acquired from pool");
        return;
      }
      this.inUse.delete(obj);
    }
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
  /**
   * 清空对象池
   */
  clear() {
    for (const obj of this.pool) {
      if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
          try {
            delete obj[key];
          } catch {
          }
        }
      }
    }
    this.pool.length = 0;
    this.created = 0;
    this.recycled = 0;
  }
  /**
   * 获取池大小
   */
  size() {
    return this.pool.length;
  }
  /**
   * 预填充对象池
   */
  prefill(count) {
    const fillCount = Math.min(count, Math.floor(this.maxSize * 0.5));
    for (let i = 0; i < fillCount && this.pool.length < fillCount; i++) {
      const obj = this.factory();
      this.created++;
      this.pool.push(obj);
    }
  }
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      size: this.pool.length,
      created: this.created,
      recycled: this.recycled,
      efficiency: this.created > 0 ? this.recycled / (this.created + this.recycled) * 100 : 0
    };
  }
}
class WeakRefCache {
  constructor(onCleanup) {
    this.cache = /* @__PURE__ */ new WeakMap();
    if (typeof globalThis.FinalizationRegistry !== "undefined" && onCleanup) {
      this.registry = new globalThis.FinalizationRegistry(onCleanup);
    }
  }
  /**
   * 设置缓存值
   */
  set(key, value) {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    if (this.registry && typeof value === "object" && value !== null) {
      this.registry.register(value, key);
    }
  }
  /**
   * 获取缓存值
   */
  get(key) {
    const ref = this.cache.get(key);
    if (ref) {
      const value = ref.deref();
      if (value === void 0) {
        this.cache.delete(key);
      }
      return value;
    }
    return void 0;
  }
  /**
   * 检查缓存是否存在
   */
  has(key) {
    const ref = this.cache.get(key);
    if (ref) {
      const value = ref.deref();
      if (value === void 0) {
        this.cache.delete(key);
        return false;
      }
      return true;
    }
    return false;
  }
  /**
   * 删除缓存
   */
  delete(key) {
    return this.cache.delete(key);
  }
}
class MemoryOptimizer {
  constructor(config = {}, logger) {
    this.objectPools = /* @__PURE__ */ new Map();
    this.weakCaches = /* @__PURE__ */ new Map();
    this.isMonitoring = false;
    this.lastGCTime = 0;
    this.config = {
      maxMemory: config.maxMemory ?? 256,
      // 减少到256MB
      warningThreshold: config.warningThreshold ?? 0.6,
      // 更早预警
      criticalThreshold: config.criticalThreshold ?? 0.8,
      // 更早触发清理
      gcInterval: config.gcInterval ?? 3e4,
      // 30秒
      autoGC: config.autoGC ?? true,
      enableObjectPooling: config.enableObjectPooling ?? true,
      poolMaxSize: config.poolMaxSize ?? 50,
      // 减少池大小
      enableWeakRefs: config.enableWeakRefs ?? true,
      onMemoryWarning: config.onMemoryWarning ?? (() => {
      }),
      onMemoryCritical: config.onMemoryCritical ?? (() => {
      })
    };
    this.logger = logger;
    if (this.config.autoGC) {
      this.startAutoGC();
    }
    this.startMemoryMonitoring();
  }
  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    if (typeof window !== "undefined" && window.performance?.memory) {
      const memory = window.performance.memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024,
        total: memory.jsHeapSizeLimit / 1024 / 1024,
        percentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        heap: {
          used: memory.usedJSHeapSize / 1024 / 1024,
          total: memory.totalJSHeapSize / 1024 / 1024,
          limit: memory.jsHeapSizeLimit / 1024 / 1024
        }
      };
    }
    return {
      used: 0,
      total: this.config.maxMemory,
      percentage: 0,
      heap: { used: 0, total: 0, limit: this.config.maxMemory }
    };
  }
  /**
   * 检查内存状态
   */
  checkMemory() {
    const usage = this.getMemoryUsage();
    if (usage.percentage > this.config.criticalThreshold) {
      this.logger?.error("Memory usage critical", usage);
      this.config.onMemoryCritical(usage);
      this.forceGC();
    } else if (usage.percentage > this.config.warningThreshold) {
      this.logger?.warn("Memory usage warning", usage);
      this.config.onMemoryWarning(usage);
    }
  }
  /**
   * 创建对象池
   */
  createObjectPool(name, factory, reset, maxSize) {
    if (!this.config.enableObjectPooling) {
      throw new Error("Object pooling is disabled");
    }
    const pool = new ObjectPool(factory, reset, maxSize ?? this.config.poolMaxSize);
    this.objectPools.set(name, pool);
    return pool;
  }
  /**
   * 获取对象池
   */
  getObjectPool(name) {
    return this.objectPools.get(name);
  }
  /**
   * 创建弱引用缓存
   */
  createWeakCache(name, onCleanup) {
    if (!this.config.enableWeakRefs) {
      throw new Error("Weak references are disabled");
    }
    const cache = new WeakRefCache(onCleanup);
    this.weakCaches.set(name, cache);
    return cache;
  }
  /**
   * 获取弱引用缓存
   */
  getWeakCache(name) {
    return this.weakCaches.get(name);
  }
  /**
   * 强制垃圾回收
   */
  forceGC() {
    const now = Date.now();
    if (now - this.lastGCTime < 1e3) {
      return;
    }
    this.lastGCTime = now;
    if (typeof globalThis.gc === "function") {
      globalThis.gc();
      this.logger?.debug("Manual GC triggered");
    }
    for (const pool of this.objectPools.values()) {
      pool.clear();
    }
    this.logger?.debug("Memory cleanup completed");
  }
  /**
   * 启动自动垃圾回收
   */
  startAutoGC() {
    if (this.gcTimer) {
      window.clearInterval(this.gcTimer);
    }
    this.gcTimer = window.setInterval(() => {
      this.checkMemory();
      this.cleanupInactivePools();
    }, this.config.gcInterval);
  }
  /**
   * 启动内存监控
   */
  startMemoryMonitoring() {
    if (this.memoryCheckTimer) {
      window.clearInterval(this.memoryCheckTimer);
    }
    this.memoryCheckTimer = window.setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage.percentage > this.config.warningThreshold) {
        this.optimizeMemory();
      }
    }, 1e4);
  }
  /**
   * 清理不活跃的对象池
   */
  cleanupInactivePools() {
    for (const [name, pool] of this.objectPools) {
      const stats = pool.getStats();
      if (stats.efficiency < 30 && stats.size > 10) {
        const toRemove = Math.floor(stats.size * 0.5);
        for (let i = 0; i < toRemove; i++) {
          pool.acquire();
        }
        this.logger?.debug(`Reduced pool ${name} size by ${toRemove}`);
      }
    }
  }
  /**
   * 优化内存使用
   */
  optimizeMemory() {
    for (const pool of this.objectPools.values()) {
      const stats = pool.getStats();
      if (stats.size > 20) {
        pool.clear();
      }
    }
    this.forceGC();
  }
  /**
   * 优化数组内存使用
   */
  optimizeArray(arr) {
    if (arr.length > 1e4) {
      this.logger?.debug(`Large array detected: ${arr.length} items`);
    }
    return arr.filter((item) => item !== void 0 && item !== null);
  }
  /**
   * 优化对象内存使用
   */
  optimizeObject(obj) {
    const optimized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== void 0) {
          optimized[key] = value;
        }
      }
    }
    return optimized;
  }
  /**
   * 分片处理大数据
   */
  async processInChunks(data, processor, chunkSize = 1e3) {
    const results = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const result = await processor(chunk);
      results.push(result);
      if (i % (chunkSize * 5) === 0) {
        this.checkMemory();
      }
    }
    return results;
  }
  /**
   * 延迟加载
   */
  createLazyLoader(loader) {
    let cached;
    let loading = false;
    let promise;
    return async () => {
      if (cached !== void 0) {
        return cached;
      }
      if (loading && promise) {
        return promise;
      }
      loading = true;
      promise = Promise.resolve(loader()).then((result) => {
        cached = result;
        loading = false;
        promise = void 0;
        return result;
      });
      return promise;
    };
  }
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      memory: this.getMemoryUsage(),
      objectPools: Array.from(this.objectPools.entries()).map(([name, pool]) => ({
        name,
        size: pool.size()
      })),
      weakCaches: Array.from(this.weakCaches.keys())
    };
  }
  /**
   * 销毁优化器
   */
  destroy() {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = void 0;
    }
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = void 0;
    }
    for (const pool of this.objectPools.values()) {
      pool.clear();
    }
    this.objectPools.clear();
    this.weakCaches.clear();
    this.isMonitoring = false;
  }
}
class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
    this.maxSnapshots = 100;
    this.leakThreshold = 10;
    this.checkInterval = 5e3;
    this.objectCounts = /* @__PURE__ */ new Map();
  }
  /**
   * 开始检测
   */
  start() {
    if (this.timer)
      return;
    this.timer = window.setInterval(() => {
      this.takeSnapshot();
      this.analyzeSnapshots();
    }, this.checkInterval);
  }
  /**
   * 停止检测
   */
  stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = void 0;
    }
  }
  /**
   * 拍摄内存快照
   */
  takeSnapshot() {
    const usage = this.getHeapUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      objects: this.countObjects()
    });
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }
  /**
   * 分析快照
   */
  analyzeSnapshots() {
    if (this.snapshots.length < 10)
      return;
    const recent = this.snapshots.slice(-10);
    const growth = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
    if (growth > this.leakThreshold) {
      console.warn(`Potential memory leak detected: ${growth.toFixed(2)}MB growth`);
    }
  }
  /**
   * 获取堆使用情况
   */
  getHeapUsage() {
    if (typeof window !== "undefined" && window.performance?.memory) {
      const memory = window.performance.memory;
      return { heapUsed: memory.usedJSHeapSize / 1024 / 1024 };
    }
    return { heapUsed: 0 };
  }
  /**
   * 统计对象数量
   */
  countObjects() {
    return this.objectCounts.size;
  }
  /**
   * 追踪对象
   */
  trackObject(id) {
    const count = this.objectCounts.get(id) || 0;
    this.objectCounts.set(id, count + 1);
  }
  /**
   * 取消追踪对象
   */
  untrackObject(id) {
    const count = this.objectCounts.get(id) || 0;
    if (count <= 1) {
      this.objectCounts.delete(id);
    } else {
      this.objectCounts.set(id, count - 1);
    }
  }
  /**
   * 获取报告
   */
  getReport() {
    const possibleLeaks = [];
    for (const [id, count] of this.objectCounts) {
      if (count > 100) {
        possibleLeaks.push(`Object ${id}: ${count} instances`);
      }
    }
    return {
      snapshots: this.snapshots.slice(-20),
      possibleLeaks,
      recommendation: possibleLeaks.length > 0 ? "Review object lifecycle and ensure proper cleanup" : "No obvious memory leaks detected"
    };
  }
  /**
   * 清理
   */
  destroy() {
    this.stop();
    this.snapshots = [];
    this.objectCounts.clear();
  }
}
function createMemoryOptimizer(config, logger) {
  return new MemoryOptimizer(config, logger);
}
function createMemoryLeakDetector() {
  return new MemoryLeakDetector();
}
var memoryOptimizer = {
  MemoryOptimizer,
  MemoryLeakDetector,
  ObjectPool,
  WeakRefCache,
  createMemoryOptimizer,
  createMemoryLeakDetector
};

exports.MemoryLeakDetector = MemoryLeakDetector;
exports.MemoryOptimizer = MemoryOptimizer;
exports.ObjectPool = ObjectPool;
exports.WeakRefCache = WeakRefCache;
exports.createMemoryLeakDetector = createMemoryLeakDetector;
exports.createMemoryOptimizer = createMemoryOptimizer;
exports.default = memoryOptimizer;
//# sourceMappingURL=memory-optimizer.cjs.map
