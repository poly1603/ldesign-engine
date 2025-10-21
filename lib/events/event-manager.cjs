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

class EventObjectPool {
  constructor() {
    this.pool = [];
    this.maxSize = 100;
  }
  get() {
    return this.pool.pop() || { handler: () => {
    }, once: false, priority: 0 };
  }
  release(obj) {
    if (this.pool.length < this.maxSize) {
      obj.handler = () => {
      };
      obj.once = false;
      obj.priority = 0;
      this.pool.push(obj);
    }
  }
  clear() {
    this.pool.length = 0;
  }
}
class EventManagerImpl {
  constructor(logger) {
    this.logger = logger;
    this.events = /* @__PURE__ */ new Map();
    this.maxListeners = 50;
    this.sortedListenersCache = /* @__PURE__ */ new Map();
    this.eventStats = /* @__PURE__ */ new Map();
    this.eventPool = new EventObjectPool();
    this.weakSortedCache = /* @__PURE__ */ new WeakMap();
    this.maxEventStats = 1e3;
    this.cleanupInterval = 6e4;
    this.cleanupTimer = null;
    this.setupCleanupTimer();
  }
  setupCleanupTimer() {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupStats();
      this.checkMemoryUsage();
    }, this.cleanupInterval);
  }
  on(event, handler, priority = 0) {
    this.addEventListener(String(event), handler, false, priority);
  }
  off(event, handler) {
    const key = String(event);
    if (!this.events.has(key)) {
      return;
    }
    const listeners = this.events.get(key);
    if (!listeners) {
      return;
    }
    if (!handler) {
      this.events.delete(key);
      this.sortedListenersCache.delete(key);
      return;
    }
    const index = listeners.findIndex((listener) => listener.handler === handler);
    if (index > -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.events.delete(key);
        this.sortedListenersCache.delete(key);
      } else {
        this.sortedListenersCache.delete(key);
      }
    }
  }
  emit(event, ...args) {
    const key = String(event);
    this.updateEventStats(key);
    const listeners = this.events.get(key);
    if (!listeners || listeners.length === 0) {
      return;
    }
    let listenersToExecute = this.weakSortedCache.get(listeners);
    if (!listenersToExecute) {
      if (listeners.length < 10) {
        listenersToExecute = this.insertionSort([...listeners]);
      } else {
        listenersToExecute = [...listeners].sort((a, b) => b.priority - a.priority);
      }
      this.weakSortedCache.set(listeners, listenersToExecute);
    }
    const removeIndexes = new Uint8Array(listenersToExecute.length);
    let hasOnceListeners = false;
    for (let i = 0; i < listenersToExecute.length; i++) {
      const listener = listenersToExecute[i];
      try {
        listener.handler(args[0]);
      } catch (error) {
        this.logger?.error(`Error in event handler for "${key}":`, error);
      }
      if (listener.once) {
        removeIndexes[i] = 1;
        hasOnceListeners = true;
      }
    }
    if (hasOnceListeners) {
      this.batchRemoveIndexedListeners(key, listeners, removeIndexes);
    }
  }
  once(event, handler, priority = 0) {
    this.addEventListener(String(event), handler, true, priority);
  }
  addEventListener(event, handler, once, priority) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    const listeners = this.events.get(event);
    if (!listeners)
      return;
    if (listeners.length >= this.maxListeners) {
      this.logger?.warn(`MaxListenersExceededWarning: Possible EventManager memory leak detected. ${listeners.length + 1} "${event}" listeners added. Use setMaxListeners() to increase limit.`);
    }
    const listener = this.eventPool.get();
    listener.handler = handler;
    listener.once = once;
    listener.priority = priority;
    listeners.push(listener);
    this.sortedListenersCache.delete(event);
  }
  // 获取事件的监听器数量
  listenerCount(event) {
    const listeners = this.events.get(event);
    return listeners ? listeners.length : 0;
  }
  // 获取所有事件名称
  eventNames() {
    return Array.from(this.events.keys());
  }
  // 获取指定事件的所有监听器
  listeners(event) {
    const listeners = this.events.get(event);
    return listeners ? listeners.map((l) => l.handler) : [];
  }
  // 设置最大监听器数量
  setMaxListeners(n) {
    this.maxListeners = n;
  }
  // 获取最大监听器数量
  getMaxListeners() {
    return this.maxListeners;
  }
  // 移除所有监听器
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
      this.sortedListenersCache.delete(event);
    } else {
      this.events.clear();
      this.sortedListenersCache.clear();
    }
  }
  // 在指定事件前添加监听器
  prependListener(event, handler, priority = 1e3) {
    this.addEventListener(event, handler, false, priority);
  }
  /**
   * 性能优化：更新事件统计
   */
  updateEventStats(event) {
    const stats = this.eventStats.get(event);
    const now = Date.now();
    if (stats) {
      stats.count++;
      stats.lastEmit = now;
    } else {
      this.eventStats.set(event, { count: 1, lastEmit: now });
    }
  }
  /**
   * 新方法：按索引批量移除监听器
   */
  batchRemoveIndexedListeners(event, listeners, removeIndexes) {
    for (let i = removeIndexes.length - 1; i >= 0; i--) {
      if (removeIndexes[i] === 1) {
        this.eventPool.release(listeners[i]);
        listeners.splice(i, 1);
      }
    }
    if (listeners.length === 0) {
      this.events.delete(event);
      this.sortedListenersCache.delete(event);
    } else {
      this.sortedListenersCache.delete(event);
      this.weakSortedCache.delete(listeners);
    }
  }
  /**
   * 性能优化：批量移除监听器
   */
  batchRemoveListeners(event, listenersToRemove) {
    const listeners = this.events.get(event);
    if (!listeners)
      return;
    const removeSet = new Set(listenersToRemove.map((l) => l.handler));
    const filteredListeners = listeners.filter((l) => {
      if (removeSet.has(l.handler)) {
        this.eventPool.release(l);
        return false;
      }
      return true;
    });
    if (filteredListeners.length === 0) {
      this.events.delete(event);
      this.sortedListenersCache.delete(event);
    } else {
      this.events.set(event, filteredListeners);
      this.sortedListenersCache.delete(event);
      this.weakSortedCache.delete(listeners);
    }
  }
  /**
   * 性能优化：清理过期的统计数据 - 改进版
   */
  cleanupStats() {
    const now = Date.now();
    const maxAge = 3e5;
    if (this.eventStats.size > this.maxEventStats) {
      const sortedEvents = Array.from(this.eventStats.entries()).sort((a, b) => b[1].lastEmit - a[1].lastEmit).slice(0, this.maxEventStats - 100);
      this.eventStats.clear();
      for (const [event, stats] of sortedEvents) {
        this.eventStats.set(event, stats);
      }
    } else {
      for (const [event, stats] of this.eventStats.entries()) {
        if (now - stats.lastEmit > maxAge) {
          this.eventStats.delete(event);
        }
      }
    }
  }
  /**
   * 检查内存使用
   */
  checkMemoryUsage() {
    const stats = this.getStats();
    if (stats.totalListeners > 1e3) {
      this.logger?.warn("High number of event listeners detected", {
        totalListeners: stats.totalListeners,
        events: Object.entries(stats.events).filter(([, count]) => count > 20).map(([event, count]) => `${event}: ${count}`)
      });
    }
  }
  /**
   * 获取事件统计信息
   */
  getEventStats() {
    return new Map(this.eventStats);
  }
  /**
   * 清理所有资源 - 增强版
   */
  cleanup() {
    this.events.clear();
    this.sortedListenersCache.clear();
    this.eventStats.clear();
  }
  /**
   * 销毁方法 - 确保完全清理
   */
  destroy() {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.events.clear();
    this.sortedListenersCache.clear();
    this.eventStats.clear();
    this.eventPool.clear();
  }
  prependOnceListener(event, handler, priority = 1e3) {
    this.addEventListener(event, handler, true, priority);
  }
  namespace(ns) {
    return new EventNamespace(this, ns);
  }
  /**
   * 新增：批量事件操作
   * 一次性添加多个事件监听器
   */
  addListeners(listeners) {
    for (const { event, handler, options } of listeners) {
      this.addEventListener(event, handler, !!options?.once, options?.priority ?? 0);
    }
  }
  /**
   * 新增：事件管道
   * 支持事件的链式处理
   */
  pipe(sourceEvent, targetEvent, transform) {
    this.on(sourceEvent, (data) => {
      const transformedData = transform ? transform(data) : data;
      this.emit(targetEvent, transformedData);
    });
  }
  /**
   * 新增：条件事件监听
   * 只有满足条件时才触发监听器
   */
  onWhen(event, condition, handler, options) {
    this.addEventListener(event, (data) => {
      if (condition(data)) {
        handler(data);
      }
    }, !!options?.once, options?.priority ?? 0);
  }
  /**
   * 新增：事件防抖
   * 在指定时间内只触发一次事件
   */
  debounce(event, delay = 300) {
    return new EventDebouncer(this, event, delay);
  }
  /**
   * 新增：事件节流
   * 在指定时间间隔内最多触发一次事件
   */
  throttle(event, interval = 300) {
    return new EventThrottler(this, event, interval);
  }
  /**
   * 插入排序 - 对小数组更高效
   */
  insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
      const current = arr[i];
      let j = i - 1;
      while (j >= 0 && arr[j].priority < current.priority) {
        arr[j + 1] = arr[j];
        j--;
      }
      arr[j + 1] = current;
    }
    return arr;
  }
  getStats() {
    const stats = {};
    let totalListeners = 0;
    for (const [event, listeners] of this.events.entries()) {
      stats[event] = listeners.length;
      totalListeners += listeners.length;
    }
    return {
      totalEvents: this.events.size,
      totalListeners,
      events: stats
    };
  }
}
const ENGINE_EVENTS = {
  CREATED: "engine:created",
  INSTALLED: "engine:installed",
  MOUNTED: "engine:mounted",
  UNMOUNTED: "engine:unmounted",
  DESTROYED: "engine:destroy",
  ERROR: "engine:error",
  PLUGIN_REGISTERED: "plugin:registered",
  PLUGIN_UNREGISTERED: "plugin:unregistered",
  PLUGIN_ERROR: "plugin:error",
  MIDDLEWARE_ADDED: "middleware:added",
  MIDDLEWARE_REMOVED: "middleware:removed",
  MIDDLEWARE_ERROR: "middleware:error",
  STATE_CHANGED: "state:changed",
  STATE_CLEARED: "state:cleared",
  CONFIG_CHANGED: "config:changed",
  ROUTE_CHANGED: "route:changed",
  ROUTE_ERROR: "route:error",
  THEME_CHANGED: "theme:changed",
  LOCALE_CHANGED: "locale:changed"
};
class EventNamespace {
  constructor(eventManager, namespace) {
    this.eventManager = eventManager;
    this.namespace = namespace;
  }
  getNamespacedEvent(event) {
    return `${this.namespace}:${event}`;
  }
  on(event, handler, priority) {
    this.eventManager.on(this.getNamespacedEvent(event), handler, priority ?? 0);
  }
  once(event, handler, priority) {
    this.eventManager.once(this.getNamespacedEvent(event), handler, priority ?? 0);
  }
  emit(event, data) {
    this.eventManager.emit(this.getNamespacedEvent(event), data);
  }
  off(event, handler) {
    this.eventManager.off(this.getNamespacedEvent(event), handler);
  }
  clear() {
    const namespacedPrefix = `${this.namespace}:`;
    const eventsToRemove = [];
    for (const event of this.eventManager.eventNames()) {
      if (event.startsWith(namespacedPrefix)) {
        eventsToRemove.push(event);
      }
    }
    for (const event of eventsToRemove) {
      this.eventManager.removeAllListeners(event);
    }
  }
}
class EventDebouncer {
  constructor(eventManager, event, delay) {
    this.eventManager = eventManager;
    this.event = event;
    this.delay = delay;
  }
  emit(data) {
    this.lastArgs = data;
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
    this.timeoutId = window.setTimeout(() => {
      this.eventManager.emit(this.event, this.lastArgs);
      this.timeoutId = void 0;
    }, this.delay);
  }
  cancel() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = void 0;
    }
  }
  flush() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.eventManager.emit(this.event, this.lastArgs);
      this.timeoutId = void 0;
    }
  }
  destroy() {
    this.cancel();
    this.lastArgs = void 0;
  }
}
class EventThrottler {
  constructor(eventManager, event, interval) {
    this.eventManager = eventManager;
    this.event = event;
    this.interval = interval;
    this.lastEmitTime = 0;
  }
  emit(data) {
    const now = Date.now();
    this.lastArgs = data;
    if (now - this.lastEmitTime >= this.interval) {
      this.eventManager.emit(this.event, data);
      this.lastEmitTime = now;
    } else if (!this.timeoutId) {
      const remainingTime = this.interval - (now - this.lastEmitTime);
      this.timeoutId = window.setTimeout(() => {
        this.eventManager.emit(this.event, this.lastArgs);
        this.lastEmitTime = Date.now();
        this.timeoutId = void 0;
      }, remainingTime);
    }
  }
  cancel() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = void 0;
    }
  }
  destroy() {
    this.cancel();
    this.lastArgs = void 0;
    this.lastEmitTime = 0;
  }
}
function createEventManager(logger) {
  const manager = new EventManagerImpl(logger);
  manager.destroy = function() {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.events.clear();
    this.sortedListenersCache.clear();
    this.eventStats.clear();
    this.eventPool.clear();
  };
  return manager;
}

exports.ENGINE_EVENTS = ENGINE_EVENTS;
exports.EventDebouncer = EventDebouncer;
exports.EventManagerImpl = EventManagerImpl;
exports.EventNamespace = EventNamespace;
exports.EventThrottler = EventThrottler;
exports.createEventManager = createEventManager;
//# sourceMappingURL=event-manager.cjs.map
