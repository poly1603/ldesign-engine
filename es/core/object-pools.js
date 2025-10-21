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
  constructor(factory, resetter, maxSize = 100) {
    this.pool = [];
    this.inUse = /* @__PURE__ */ new WeakSet();
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      reused: 0
    };
    this.factory = factory;
    this.resetter = resetter;
    this.maxSize = maxSize;
  }
  /**
   * 获取对象
   */
  acquire() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      this.stats.reused++;
    } else {
      obj = this.factory();
      this.stats.created++;
    }
    this.inUse.add(obj);
    this.stats.acquired++;
    return obj;
  }
  /**
   * 释放对象
   */
  release(obj) {
    if (!this.inUse.has(obj)) {
      console.warn("Attempting to release object not from this pool");
      return;
    }
    this.inUse.delete(obj);
    if (this.pool.length < this.maxSize) {
      this.resetter(obj);
      this.pool.push(obj);
      this.stats.released++;
    }
  }
  /**
   * 预填充池
   */
  prefill(count) {
    const fillCount = Math.min(count, this.maxSize - this.pool.length);
    for (let i = 0; i < fillCount; i++) {
      const obj = this.factory();
      this.stats.created++;
      this.pool.push(obj);
    }
  }
  /**
   * 清空池
   */
  clear() {
    this.pool = [];
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      reused: 0
    };
  }
  /**
   * 获取统计信息
   */
  getStats() {
    const total = this.stats.created + this.stats.reused;
    const reuseRate = total > 0 ? this.stats.reused / total * 100 : 0;
    return {
      poolSize: this.pool.length,
      created: this.stats.created,
      acquired: this.stats.acquired,
      released: this.stats.released,
      reused: this.stats.reused,
      reuseRate
    };
  }
}
class TaskPool extends ObjectPool {
  constructor(maxSize = 100) {
    super(() => ({
      id: "",
      type: "",
      data: null,
      priority: 0,
      status: "pending"
    }), (task) => {
      task.id = "";
      task.type = "";
      task.data = null;
      task.priority = 0;
      task.status = "pending";
      task.result = void 0;
      task.error = void 0;
    }, maxSize);
  }
  /**
   * 创建任务
   */
  createTask(id, type, data, priority = 0) {
    const task = this.acquire();
    task.id = id;
    task.type = type;
    task.data = data;
    task.priority = priority;
    return task;
  }
}
class NotificationPool extends ObjectPool {
  constructor(maxSize = 50) {
    super(() => ({
      id: "",
      type: "info",
      title: "",
      content: "",
      duration: 3e3,
      timestamp: 0
    }), (notification) => {
      notification.id = "";
      notification.type = "info";
      notification.title = "";
      notification.content = "";
      notification.duration = 3e3;
      notification.timestamp = 0;
      notification.actions = void 0;
    }, maxSize);
  }
  /**
   * 创建通知
   */
  createNotification(id, type, title, content, duration = 3e3) {
    const notification = this.acquire();
    notification.id = id;
    notification.type = type;
    notification.title = title;
    notification.content = content;
    notification.duration = duration;
    notification.timestamp = Date.now();
    return notification;
  }
}
class RequestPool extends ObjectPool {
  constructor(maxSize = 50) {
    super(() => ({
      url: "",
      method: "GET",
      headers: {},
      timeout: 3e4,
      retries: 3,
      timestamp: 0
    }), (request) => {
      request.url = "";
      request.method = "GET";
      request.headers = {};
      request.body = void 0;
      request.timeout = 3e4;
      request.retries = 3;
      request.timestamp = 0;
    }, maxSize);
  }
  /**
   * 创建请求
   */
  createRequest(url, method = "GET", options = {}) {
    const request = this.acquire();
    request.url = url;
    request.method = method;
    request.headers = options.headers || {};
    request.body = options.body;
    request.timeout = options.timeout || 3e4;
    request.retries = options.retries ?? 3;
    request.timestamp = Date.now();
    return request;
  }
}
class ObjectPoolManager {
  constructor(logger) {
    this.pools = /* @__PURE__ */ new Map();
    this.logger = logger;
    this.initializeDefaultPools();
  }
  /**
   * 初始化默认对象池
   */
  initializeDefaultPools() {
    this.register("task", new TaskPool());
    this.register("notification", new NotificationPool());
    this.register("request", new RequestPool());
    this.logger?.debug("Default object pools initialized");
  }
  /**
   * 注册对象池
   */
  register(name, pool) {
    if (this.pools.has(name)) {
      this.logger?.warn(`Object pool '${name}' already registered`);
      return;
    }
    this.pools.set(name, pool);
    this.logger?.debug(`Object pool '${name}' registered`);
  }
  /**
   * 获取对象池
   */
  get(name) {
    return this.pools.get(name);
  }
  /**
   * 获取对象（自动从对应池中获取）
   */
  acquire(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      this.logger?.warn(`Object pool '${poolName}' not found`);
      return void 0;
    }
    return pool.acquire();
  }
  /**
   * 释放对象（自动返回到对应池）
   */
  release(poolName, obj) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      this.logger?.warn(`Object pool '${poolName}' not found`);
      return;
    }
    pool.release(obj);
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
   * 清空所有对象池
   */
  clearAll() {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    this.logger?.debug("All object pools cleared");
  }
  /**
   * 销毁管理器
   */
  destroy() {
    this.clearAll();
    this.pools.clear();
  }
}
function createObjectPoolManager(logger) {
  return new ObjectPoolManager(logger);
}
function Pooled(poolName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      const poolManager = getGlobalObjectPoolManager();
      const obj = poolManager.acquire(poolName);
      try {
        const result = originalMethod.call(this, obj, ...args);
        return result;
      } finally {
        if (obj) {
          poolManager.release(poolName, obj);
        }
      }
    };
    return descriptor;
  };
}
let globalObjectPoolManager;
function getGlobalObjectPoolManager() {
  if (!globalObjectPoolManager) {
    globalObjectPoolManager = createObjectPoolManager();
  }
  return globalObjectPoolManager;
}
function setGlobalObjectPoolManager(manager) {
  globalObjectPoolManager = manager;
}

export { NotificationPool, ObjectPool, ObjectPoolManager, Pooled, RequestPool, TaskPool, createObjectPoolManager, getGlobalObjectPoolManager, setGlobalObjectPoolManager };
//# sourceMappingURL=object-pools.js.map
