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

exports.CacheStrategy = void 0;
(function(CacheStrategy2) {
  CacheStrategy2["LRU"] = "lru";
  CacheStrategy2["LFU"] = "lfu";
  CacheStrategy2["FIFO"] = "fifo";
  CacheStrategy2["TTL"] = "ttl";
})(exports.CacheStrategy || (exports.CacheStrategy = {}));
class CacheManager {
  constructor(config = {}, logger) {
    this.cache = /* @__PURE__ */ new Map();
    this.totalMemory = 0;
    this.layers = /* @__PURE__ */ new Map();
    this.preloadQueue = /* @__PURE__ */ new Set();
    this.updateTimers = /* @__PURE__ */ new Map();
    this.shards = [];
    this.SHARD_COUNT = 16;
    this.useSharding = false;
    this.logger = logger;
    this.config = this.normalizeConfig(config);
    this.stats = this.initStats();
    if (this.config.maxSize > 100) {
      this.useSharding = true;
      this.initializeShards();
    }
    this.initializeLayers();
    this.startCleanup();
  }
  /**
   * 初始化缓存分片
   */
  initializeShards() {
    for (let i = 0; i < this.SHARD_COUNT; i++) {
      this.shards.push(/* @__PURE__ */ new Map());
    }
    this.logger?.debug(`Cache sharding enabled with ${this.SHARD_COUNT} shards`);
  }
  /**
   * 根据key计算分片索引（使用简单哈希）
   */
  getShardIndex(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.SHARD_COUNT;
  }
  /**
   * 获取缓存分片
   */
  getShard(key) {
    if (!this.useSharding) {
      return this.cache;
    }
    return this.shards[this.getShardIndex(key)];
  }
  /**
   * 标准化配置
   */
  normalizeConfig(config) {
    return {
      maxSize: config.maxSize ?? 50,
      // 进一步减少默认缓存大小到50
      defaultTTL: config.defaultTTL ?? 3 * 60 * 1e3,
      // 减少默认TTL为3分钟
      strategy: config.strategy ?? exports.CacheStrategy.LRU,
      enableStats: config.enableStats ?? false,
      // 默认关闭统计以节省内存
      maxMemory: config.maxMemory ?? 5 * 1024 * 1024,
      // 减少最大内存到5MB
      cleanupInterval: config.cleanupInterval ?? 2e4,
      // 更频繁的清理（20秒）
      layers: config.layers ?? {},
      onEvict: config.onEvict ?? (() => {
      }),
      onError: config.onError ?? ((error) => this.logger?.error("Cache error", error))
    };
  }
  /**
   * 初始化统计信息
   */
  initStats() {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0,
      averageItemSize: 0
    };
  }
  /**
   * 初始化分层缓存
   */
  initializeLayers() {
    const { layers } = this.config;
    if (layers.memory?.enabled) {
      this.layers.set("memory", new MemoryLayer(layers.memory));
    }
    if (layers.localStorage?.enabled && typeof window !== "undefined") {
      this.layers.set("localStorage", new LocalStorageLayer(layers.localStorage));
    }
    if (layers.sessionStorage?.enabled && typeof window !== "undefined") {
      this.layers.set("sessionStorage", new SessionStorageLayer(layers.sessionStorage));
    }
    if (layers.indexedDB?.enabled && typeof window !== "undefined") {
      this.layers.set("indexedDB", new IndexedDBLayer(layers.indexedDB));
    }
  }
  // ============================================
  // 核心方法
  // ============================================
  /**
   * 获取缓存值
   */
  async get(key) {
    const memoryItem = this.getFromMemory(key);
    if (memoryItem !== void 0) {
      return memoryItem;
    }
    for (const [, layer] of this.layers) {
      try {
        const value = await layer.get(key);
        if (value !== void 0) {
          this.set(key, value);
          if (this.config?.enableStats) {
            this.stats.hits++;
            this.updateHitRate();
          }
          return value;
        }
      } catch (error) {
        this.config?.onError(error);
      }
    }
    if (this.config?.enableStats) {
      this.stats.misses++;
      this.updateHitRate();
    }
    return void 0;
  }
  /**
   * 从内存缓存获取（支持分片）
   */
  getFromMemory(key) {
    const shard = this.getShard(key);
    const item = shard.get(key);
    if (!item) {
      return void 0;
    }
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      this.stats.expirations++;
      return void 0;
    }
    item.lastAccessed = Date.now();
    item.accessCount++;
    this.updateItemOrder(key, item);
    if (this.config?.enableStats) {
      this.stats.hits++;
      this.updateHitRate();
    }
    return item.value;
  }
  /**
   * 设置缓存值
   */
  async set(key, value, ttl, metadata) {
    const effectiveTTL = ttl ?? this.config?.defaultTTL;
    const size = this.estimateSize(value);
    await this.ensureCapacity(key, size);
    const item = {
      key,
      value,
      timestamp: Date.now(),
      ttl: effectiveTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      metadata
    };
    const shard = this.getShard(key);
    shard.set(key, item);
    this.totalMemory += size;
    for (const [, layer] of this.layers) {
      try {
        await layer.set(key, value, effectiveTTL);
      } catch (error) {
        this.config?.onError(error);
      }
    }
    if (this.config?.enableStats) {
      this.stats.sets++;
      this.stats.size = this.cache.size;
      this.updateStats();
    }
  }
  /**
   * 删除缓存（支持分片）
   */
  async delete(key) {
    const shard = this.getShard(key);
    const item = shard.get(key);
    if (item) {
      shard.delete(key);
      this.totalMemory -= item.size || 0;
      for (const [, layer] of this.layers) {
        try {
          await layer.delete(key);
        } catch (error) {
          this.config?.onError(error);
        }
      }
      if (this.config?.enableStats) {
        this.stats.deletes++;
        this.stats.size = this.getTotalSize();
      }
      return true;
    }
    return false;
  }
  /**
   * 获取总缓存大小（支持分片）
   */
  getTotalSize() {
    if (!this.useSharding) {
      return this.cache.size;
    }
    return this.shards.reduce((total, shard) => total + shard.size, 0);
  }
  /**
   * 清空缓存（支持分片）
   */
  async clear() {
    if (this.useSharding) {
      this.shards.forEach((shard) => shard.clear());
    } else {
      this.cache.clear();
    }
    this.totalMemory = 0;
    for (const [, layer] of this.layers) {
      try {
        await layer.clear();
      } catch (error) {
        this.config?.onError(error);
      }
    }
    this.resetStats();
  }
  /**
   * 按命名空间清理缓存键（前缀匹配，支持分片）
   */
  async clearNamespace(namespace) {
    const prefix = `${namespace}:`;
    const keysToDelete = [];
    if (this.useSharding) {
      for (const shard of this.shards) {
        for (const key of shard.keys()) {
          if (key.startsWith(prefix)) {
            keysToDelete.push(key);
          }
        }
      }
    } else {
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }
    }
    await Promise.all(keysToDelete.map((key) => this.delete(key)));
  }
  // ============================================
  // 高级功能
  // ============================================
  /**
   * 批量预加载
   */
  async preload(keys, loader, options) {
    const priority = options?.priority ?? "normal";
    const ttl = options?.ttl;
    const sortedKeys = priority === "high" ? keys : priority === "low" ? keys.reverse() : keys;
    const promises = sortedKeys.map(async (key) => {
      try {
        const value = await loader(key);
        await this.set(key, value, ttl);
      } catch (error) {
        this.logger?.error(`Failed to preload ${key}`, error);
      }
    });
    await Promise.allSettled(promises);
  }
  /**
   * 缓存预热
   */
  async warmup(warmupData) {
    const promises = warmupData.map(async ({ key, loader, ttl }) => {
      try {
        const value = await loader();
        await this.set(key, value, ttl);
      } catch (error) {
        this.logger?.error(`Failed to warmup ${key}`, error);
      }
    });
    await Promise.allSettled(promises);
  }
  /**
   * 获取命名空间缓存
   */
  namespace(name) {
    return new NamespacedCache(this, name);
  }
  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = this.initStats();
  }
  /**
   * 事件监听（兼容方法）
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  on(event, callback) {
    const self = this;
    const listeners = self._eventListeners || /* @__PURE__ */ new Map();
    if (!self._eventListeners) {
      self._eventListeners = listeners;
    }
    const eventListeners = listeners.get(event) || [];
    eventListeners.push(callback);
    listeners.set(event, eventListeners);
    return () => {
      const callbacks = listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  // ============================================
  // 私有方法
  // ============================================
  /**
   * 确保有足够的容量（支持分片）
   */
  async ensureCapacity(key, size) {
    const shard = this.getShard(key);
    const totalSize = this.getTotalSize();
    if (totalSize >= this.config?.maxSize && !shard.has(key)) {
      await this.evict();
    }
    if (this.config?.maxMemory > 0) {
      while (this.totalMemory + size > this.config?.maxMemory && totalSize > 0) {
        await this.evict();
      }
    }
  }
  /**
   * 淘汰缓存项
   */
  async evict() {
    const strategy = this.config?.strategy;
    let keyToEvict;
    switch (strategy) {
      case exports.CacheStrategy.LRU:
        keyToEvict = this.findLRU();
        break;
      case exports.CacheStrategy.LFU:
        keyToEvict = this.findLFU();
        break;
      case exports.CacheStrategy.FIFO:
        keyToEvict = this.cache.keys().next().value;
        break;
      case exports.CacheStrategy.TTL:
        keyToEvict = this.findExpired();
        break;
    }
    if (keyToEvict) {
      const item = this.cache.get(keyToEvict);
      if (item) {
        this.config?.onEvict(keyToEvict, item.value);
        await this.delete(keyToEvict);
        this.stats.evictions++;
      }
    }
  }
  /**
   * 查找最久未使用的项 - 支持分片
   */
  findLRU() {
    const totalSize = this.getTotalSize();
    if (totalSize === 0)
      return void 0;
    let lruKey;
    let lruTime = Infinity;
    const maxSearch = Math.min(totalSize, 20);
    let searchCount = 0;
    const caches = this.useSharding ? this.shards : [this.cache];
    for (const cache of caches) {
      for (const [key, item] of cache) {
        if (item.lastAccessed < lruTime) {
          lruTime = item.lastAccessed;
          lruKey = key;
        }
        if (++searchCount >= maxSearch)
          return lruKey;
      }
    }
    return lruKey;
  }
  /**
   * 查找最少使用的项（支持分片）
   */
  findLFU() {
    let lfuKey;
    let lfuCount = Infinity;
    const caches = this.useSharding ? this.shards : [this.cache];
    for (const cache of caches) {
      for (const [key, item] of cache) {
        if (item.accessCount < lfuCount) {
          lfuCount = item.accessCount;
          lfuKey = key;
        }
      }
    }
    return lfuKey;
  }
  /**
   * 查找已过期的项（支持分片）
   */
  findExpired() {
    const now = Date.now();
    const caches = this.useSharding ? this.shards : [this.cache];
    for (const cache of caches) {
      for (const [key, item] of cache) {
        if (item.ttl && now - item.timestamp > item.ttl) {
          return key;
        }
      }
    }
    return void 0;
  }
  /**
   * 更新项顺序（支持分片）
   */
  updateItemOrder(key, item) {
    if (this.config?.strategy === exports.CacheStrategy.LRU) {
      const shard = this.getShard(key);
      shard.delete(key);
      shard.set(key, item);
    }
  }
  /**
   * 估算对象大小 - 极致优化版
   * 使用更精确的采样策略和缓存机制
   */
  estimateSize(obj, depth = 0, visited) {
    if (obj === null || obj === void 0)
      return 0;
    const type = typeof obj;
    if (type === "string") {
      return Math.min(obj.length * 2 + 24, 1e4);
    }
    if (type === "number")
      return 8;
    if (type === "boolean")
      return 4;
    if (type === "bigint")
      return 16;
    if (type === "symbol")
      return 32;
    if (type === "function")
      return 64;
    if (type !== "object")
      return 32;
    if (depth > 5)
      return 100;
    if (!visited) {
      visited = /* @__PURE__ */ new WeakSet();
    }
    if (visited.has(obj))
      return 0;
    visited.add(obj);
    if (obj instanceof Date)
      return 24;
    if (obj instanceof RegExp)
      return 48;
    if (obj instanceof Map)
      return 24 + obj.size * 48;
    if (obj instanceof Set)
      return 24 + obj.size * 32;
    if (Array.isArray(obj)) {
      const len = obj.length;
      if (len === 0)
        return 24;
      if (len <= 10) {
        let total = 24;
        for (let i = 0; i < len; i++) {
          total += this.estimateSize(obj[i], depth + 1, visited);
        }
        return total;
      } else {
        const samples = [];
        for (let i = 0; i < 5 && i < len; i++) {
          samples.push(this.estimateSize(obj[i], depth + 1, visited));
        }
        const mid = Math.floor(len / 2);
        for (let i = mid - 1; i <= mid + 1 && i < len; i++) {
          if (i >= 0)
            samples.push(this.estimateSize(obj[i], depth + 1, visited));
        }
        for (let i = len - 2; i < len; i++) {
          if (i >= 0)
            samples.push(this.estimateSize(obj[i], depth + 1, visited));
        }
        const avgSize = samples.reduce((a, b) => a + b, 0) / samples.length;
        return 24 + avgSize * len;
      }
    }
    try {
      const keys = Object.keys(obj);
      const keyCount = keys.length;
      if (keyCount === 0)
        return 32;
      let size = 32;
      if (keyCount <= 10) {
        for (const key of keys) {
          size += key.length * 2 + 16;
          size += this.estimateSize(obj[key], depth + 1, visited);
        }
      } else {
        const sampleKeys = [];
        for (let i = 0; i < 7 && i < keyCount; i++) {
          sampleKeys.push(keys[i]);
        }
        const mid = Math.floor(keyCount / 2);
        for (let i = mid - 1; i <= mid + 1 && i < keyCount; i++) {
          if (i >= 0)
            sampleKeys.push(keys[i]);
        }
        for (let i = keyCount - 3; i < keyCount; i++) {
          if (i >= 0)
            sampleKeys.push(keys[i]);
        }
        let sampleSize = 0;
        for (const key of sampleKeys) {
          sampleSize += key.length * 2 + 16;
          sampleSize += this.estimateSize(obj[key], depth + 1, visited);
        }
        const avgKeySize = sampleSize / sampleKeys.length;
        size += avgKeySize * keyCount;
      }
      return Math.min(size, 1e5);
    } catch {
      return 512;
    }
  }
  /**
   * 更新统计信息
   */
  updateStats() {
    this.stats.memoryUsage = this.totalMemory;
    this.stats.averageItemSize = this.cache.size > 0 ? this.totalMemory / this.cache.size : 0;
  }
  /**
   * 更新命中率
   */
  updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total * 100 : 0;
  }
  /**
   * 启动定期清理
   */
  startCleanup() {
    if (this.config?.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config?.cleanupInterval);
    }
  }
  /**
   * 清理过期项 - 优化版（支持分片）
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    const totalSize = this.getTotalSize();
    const maxCleanup = Math.min(30, Math.ceil(totalSize * 0.2));
    const caches = this.useSharding ? this.shards : [this.cache];
    outerLoop: for (const cache of caches) {
      for (const [key, item] of cache) {
        if (item.ttl && now - item.timestamp > item.ttl) {
          cache.delete(key);
          this.totalMemory = Math.max(0, this.totalMemory - (item.size || 0));
          expiredCount++;
          if (expiredCount >= maxCleanup)
            break outerLoop;
        }
      }
    }
    if (this.config?.enableStats && expiredCount > 0) {
      this.stats.expirations += expiredCount;
    }
    if (this.config?.maxMemory > 0 && this.totalMemory > this.config.maxMemory * 0.75) {
      const currentSize = this.getTotalSize();
      const targetSize = Math.floor(currentSize * 0.6);
      const toRemove = currentSize - targetSize;
      if (toRemove > 0) {
        for (let i = 0; i < toRemove && this.getTotalSize() > targetSize; i++) {
          let minAccess = Infinity;
          let minKey = "";
          let minShard;
          let checked = 0;
          outerSearch: for (const cache of caches) {
            for (const [key, item] of cache) {
              if (item.lastAccessed < minAccess) {
                minAccess = item.lastAccessed;
                minKey = key;
                minShard = cache;
              }
              if (++checked >= 20)
                break outerSearch;
            }
          }
          if (minKey && minShard) {
            const item = minShard.get(minKey);
            if (item) {
              minShard.delete(minKey);
              this.totalMemory = Math.max(0, this.totalMemory - (item.size || 0));
            }
          }
        }
      }
    }
    if (this.config?.enableStats) {
      this.stats.size = this.getTotalSize();
      this.updateStats();
    }
  }
  /**
   * 销毁缓存管理器
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    for (const timer of this.updateTimers.values()) {
      clearTimeout(timer);
    }
    this.updateTimers.clear();
    for (const layer of this.layers.values()) {
      layer.clear().catch(() => {
      });
    }
    this.layers.clear();
    const self = this;
    if (self._eventListeners) {
      self._eventListeners.clear();
      delete self._eventListeners;
    }
    if (this.useSharding) {
      this.shards.forEach((shard) => shard.clear());
      this.shards = [];
    } else {
      this.cache.clear();
    }
    this.preloadQueue.clear();
    this.totalMemory = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
      averageItemSize: 0
    };
  }
}
class StorageLayer {
  constructor(config) {
    this.config = config;
  }
}
class MemoryLayer extends StorageLayer {
  constructor(config) {
    super(config);
    this.storage = /* @__PURE__ */ new Map();
    this.maxSize = 200;
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 3e4);
  }
  cleanupExpired() {
    const now = Date.now();
    for (const [key, item] of this.storage) {
      if (item.expires > 0 && now > item.expires) {
        this.storage.delete(key);
      }
    }
  }
  async get(key) {
    const item = this.storage.get(key);
    if (!item)
      return void 0;
    if (item.expires > 0 && Date.now() > item.expires) {
      this.storage.delete(key);
      return void 0;
    }
    return item.value;
  }
  async set(key, value, ttl) {
    if (this.storage.size >= this.maxSize && !this.storage.has(key)) {
      const firstKey = this.storage.keys().next().value;
      if (firstKey) {
        this.storage.delete(firstKey);
      }
    }
    const expires = ttl ? Date.now() + ttl : 0;
    this.storage.set(key, { value, expires });
  }
  async delete(key) {
    return this.storage.delete(key);
  }
  async clear() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = void 0;
    }
    this.storage.clear();
  }
}
class LocalStorageLayer extends StorageLayer {
  constructor(config) {
    super(config);
    this.prefix = config.prefix || "cache:";
  }
  async get(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      if (!data)
        return void 0;
      const item = JSON.parse(data);
      if (item.expires > 0 && Date.now() > item.expires) {
        localStorage.removeItem(this.prefix + key);
        return void 0;
      }
      return item.value;
    } catch {
      return void 0;
    }
  }
  async set(key, value, ttl) {
    try {
      const expires = ttl ? Date.now() + ttl : 0;
      const data = JSON.stringify({ value, expires });
      localStorage.setItem(this.prefix + key, data);
    } catch {
    }
  }
  async delete(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch {
      return false;
    }
  }
  async clear() {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}
class SessionStorageLayer extends StorageLayer {
  constructor(config) {
    super(config);
    this.prefix = config.prefix || "cache:";
  }
  async get(key) {
    try {
      const data = sessionStorage.getItem(this.prefix + key);
      if (!data)
        return void 0;
      const item = JSON.parse(data);
      if (item.expires > 0 && Date.now() > item.expires) {
        sessionStorage.removeItem(this.prefix + key);
        return void 0;
      }
      return item.value;
    } catch {
      return void 0;
    }
  }
  async set(key, value, ttl) {
    try {
      const expires = ttl ? Date.now() + ttl : 0;
      const data = JSON.stringify({ value, expires });
      sessionStorage.setItem(this.prefix + key, data);
    } catch {
    }
  }
  async delete(key) {
    try {
      sessionStorage.removeItem(this.prefix + key);
      return true;
    } catch {
      return false;
    }
  }
  async clear() {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}
class IndexedDBLayer extends StorageLayer {
  constructor(config) {
    super(config);
    this.dbName = config.dbName || "CacheDB";
    this.storeName = config.storeName || "cache";
    this.initDB();
  }
  async initDB() {
    const request = indexedDB.open(this.dbName, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: "key" });
      }
    };
    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async get(key) {
    if (!this.db)
      await this.initDB();
    if (!this.db)
      return void 0;
    const db = this.db;
    return new Promise((resolve) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(void 0);
        } else if (result.expires > 0 && Date.now() > result.expires) {
          this.delete(key);
          resolve(void 0);
        } else {
          resolve(result.value);
        }
      };
      request.onerror = () => resolve(void 0);
    });
  }
  async set(key, value, ttl) {
    if (!this.db)
      await this.initDB();
    if (!this.db)
      return;
    const db = this.db;
    return new Promise((resolve) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const expires = ttl ? Date.now() + ttl : 0;
      store.put({ key, value, expires });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }
  async delete(key) {
    if (!this.db)
      await this.initDB();
    if (!this.db)
      return false;
    const db = this.db;
    return new Promise((resolve) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.delete(key);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    });
  }
  async clear() {
    if (!this.db)
      await this.initDB();
    if (!this.db)
      return;
    const db = this.db;
    return new Promise((resolve) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }
}
class NamespacedCache {
  constructor(parent, namespace) {
    this.parent = parent;
    this.namespace = namespace;
  }
  prefixKey(key) {
    return `${this.namespace}:${key}`;
  }
  async get(key) {
    return this.parent.get(this.prefixKey(key));
  }
  async set(key, value, ttl) {
    return this.parent.set(this.prefixKey(key), value, ttl);
  }
  async delete(key) {
    return this.parent.delete(this.prefixKey(key));
  }
  async clear() {
    await this.parent.clearNamespace(this.namespace);
  }
}
function createCacheManager(config, logger) {
  return new CacheManager(config, logger);
}

exports.CacheManager = CacheManager;
exports.createCacheManager = createCacheManager;
//# sourceMappingURL=cache-manager.cjs.map
