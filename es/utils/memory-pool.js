/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class ObjectPool {
  constructor(factory, options = {}) {
    this.factory = factory;
    this.options = options;
    this.pool = [];
    this.inUse = /* @__PURE__ */ new WeakSet();
    this.created = 0;
    this.lastCleanup = Date.now();
    this.CLEANUP_INTERVAL = 6e4;
    const { preAllocate = 0, maxCreated = 1e4 } = options;
    this.maxCreated = maxCreated;
    const allocateCount = Math.min(preAllocate, this.maxCreated);
    for (let i = 0; i < allocateCount; i++) {
      this.pool.push(this.createObject());
    }
  }
  /**
   * 从池中获取对象
   */
  acquire() {
    this.maybeCleanup();
    let obj = this.pool.pop();
    if (!obj) {
      if (this.created >= this.maxCreated) {
        console.warn(`ObjectPool: Hit max created limit (${this.maxCreated})`);
        return null;
      }
      obj = this.createObject();
    }
    this.inUse.add(obj);
    return obj;
  }
  /**
   * 释放对象回池
   */
  release(obj) {
    if (!this.inUse.has(obj)) {
      return;
    }
    this.inUse.delete(obj);
    if (this.options.resetOnRelease !== false && obj.reset) {
      obj.reset();
    }
    const maxSize = this.options.maxSize || 1e3;
    if (this.pool.length < maxSize) {
      this.pool.push(obj);
    }
  }
  /**
   * 批量释放对象
   */
  releaseAll(objects) {
    for (const obj of objects) {
      this.release(obj);
    }
  }
  /**
   * 清空池
   */
  clear() {
    for (const obj of this.pool) {
      if (obj.reset) {
        obj.reset();
      }
    }
    this.pool.length = 0;
    this.created = 0;
  }
  /**
   * Perform periodic cleanup
   */
  maybeCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.lastCleanup = now;
      const maxSize = this.options.maxSize || 1e3;
      if (this.pool.length > maxSize) {
        const toRemove = this.pool.length - maxSize;
        this.pool.splice(0, toRemove);
      }
    }
  }
  /**
   * 获取池统计信息
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      created: this.created,
      available: this.pool.length
    };
  }
  createObject() {
    if (this.created >= this.maxCreated) {
      throw new Error(`Cannot create more objects, limit reached: ${this.maxCreated}`);
    }
    this.created++;
    return this.factory();
  }
}
class MemoryPoolManager {
  constructor() {
    this.pools = /* @__PURE__ */ new Map();
    this.MAX_POOLS = 100;
  }
  /**
   * 注册新的对象池
   */
  registerPool(name, factory, options) {
    if (this.pools.has(name)) {
      throw new Error(`Pool "${name}" already exists`);
    }
    if (this.pools.size >= this.MAX_POOLS) {
      console.warn(`MemoryPoolManager: Reached max pools limit (${this.MAX_POOLS})`);
      const firstKey = this.pools.keys().next().value;
      if (firstKey) {
        this.pools.get(firstKey)?.clear();
        this.pools.delete(firstKey);
      }
    }
    const pool = new ObjectPool(factory, options);
    this.pools.set(name, pool);
    return pool;
  }
  /**
   * 获取对象池
   */
  getPool(name) {
    return this.pools.get(name);
  }
  /**
   * 获取所有池的统计信息
   */
  getAllStats() {
    const stats = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }
  /**
   * 清理所有池
   */
  clearAll() {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }
  /**
   * 销毁管理器
   */
  destroy() {
    this.clearAll();
    this.pools.clear();
  }
}
class ArrayPool {
  constructor() {
    this.pools = /* @__PURE__ */ new Map();
    this.MAX_ARRAY_SIZE = 1e4;
    this.MAX_POOLS_PER_SIZE = 100;
  }
  /**
   * 获取指定大小的数组
   */
  acquire(size) {
    if (size > this.MAX_ARRAY_SIZE) {
      return Array.from({ length: size });
    }
    const pool = this.getPoolForSize(size);
    const array = pool.pop();
    if (array) {
      return array;
    }
    return Array.from({ length: size });
  }
  /**
   * 释放数组回池
   */
  release(array) {
    const size = array.length;
    if (size > this.MAX_ARRAY_SIZE) {
      return;
    }
    array.length = 0;
    const pool = this.getPoolForSize(size);
    if (pool.length < this.MAX_POOLS_PER_SIZE) {
      pool.push(array);
    }
  }
  getPoolForSize(size) {
    let pool = this.pools.get(size);
    if (!pool) {
      if (this.pools.size >= 50) {
        const firstKey = this.pools.keys().next().value;
        if (firstKey !== void 0) {
          this.pools.delete(firstKey);
        }
      }
      pool = [];
      this.pools.set(size, pool);
    }
    return pool;
  }
  /**
   * 清理所有数组池
   */
  clear() {
    this.pools.clear();
  }
}
class StringBuilderPool {
  constructor() {
    this.pool = [];
    this.maxPoolSize = 50;
  }
  acquire() {
    const builder = this.pool.pop() || new StringBuilder();
    return builder;
  }
  release(builder) {
    builder.clear();
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(builder);
    }
  }
}
class StringBuilder {
  constructor() {
    this.parts = [];
    this.MAX_PARTS = 1e3;
  }
  append(str) {
    if (this.parts.length >= this.MAX_PARTS) {
      const consolidated = this.parts.join("");
      this.parts.length = 0;
      this.parts.push(consolidated);
    }
    this.parts.push(str);
    return this;
  }
  toString() {
    return this.parts.join("");
  }
  clear() {
    this.parts.length = 0;
  }
  reset() {
    this.clear();
  }
}
let globalMemoryPoolManager;
function getGlobalMemoryPoolManager() {
  if (!globalMemoryPoolManager) {
    globalMemoryPoolManager = new MemoryPoolManager();
    globalMemoryPoolManager.registerPool("event", () => ({
      type: "",
      data: null,
      reset() {
        this.type = "";
        this.data = null;
      }
    }), {
      maxSize: 100,
      preAllocate: 10,
      resetOnRelease: true
    });
    globalMemoryPoolManager.registerPool("promise", () => ({
      resolve: null,
      reject: null,
      reset() {
        this.resolve = null;
        this.reject = null;
      }
    }), {
      maxSize: 50,
      preAllocate: 5,
      resetOnRelease: true
    });
  }
  return globalMemoryPoolManager;
}
const memoryPool = {
  acquire(poolName) {
    const manager = getGlobalMemoryPoolManager();
    const pool = manager.getPool(poolName);
    const acquired = pool ? pool.acquire() : void 0;
    return acquired === null ? void 0 : acquired;
  },
  release(poolName, obj) {
    const manager = getGlobalMemoryPoolManager();
    const pool = manager.getPool(poolName);
    pool?.release(obj);
  },
  getStats(poolName) {
    const manager = getGlobalMemoryPoolManager();
    if (poolName) {
      const pool = manager.getPool(poolName);
      return pool?.getStats();
    }
    return manager.getAllStats();
  }
};
function Poolable(poolName) {
  return function(constructor) {
    const originalConstructor = constructor;
    function newConstructor(...args) {
      const manager = getGlobalMemoryPoolManager();
      let pool = manager.getPool(poolName);
      if (!pool) {
        pool = manager.registerPool(poolName, () => new originalConstructor(...args), {
          maxSize: 100,
          resetOnRelease: true
        });
      }
      return pool.acquire();
    }
    newConstructor.prototype = originalConstructor.prototype;
    newConstructor.prototype.release = function() {
      const manager = getGlobalMemoryPoolManager();
      const pool = manager.getPool(poolName);
      pool?.release(this);
    };
    return newConstructor;
  };
}

export { ArrayPool, MemoryPoolManager, ObjectPool, Poolable, StringBuilder, StringBuilderPool, getGlobalMemoryPoolManager, memoryPool };
//# sourceMappingURL=memory-pool.js.map
