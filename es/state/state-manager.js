/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { LRUCache } from '../utils/lru-cache.js';
import { reactive } from 'vue';

class StateManagerImpl {
  constructor(logger) {
    this.logger = logger;
    this.state = reactive({});
    this.watchers = /* @__PURE__ */ new Map();
    this.changeHistory = [];
    this.historyIndex = 0;
    this.historySize = 0;
    this.maxHistorySize = 20;
    this.batchUpdates = null;
    this.batchTimer = null;
    this.cleanupTimer = null;
    this.CLEANUP_INTERVAL = 3e4;
    this.MAX_CACHE_SIZE = 100;
    this.pathCache = new LRUCache({
      maxSize: this.MAX_CACHE_SIZE,
      onEvict: (key) => {
        this.logger?.debug("Path cache evicted", { key });
      }
    });
    if (typeof window !== "undefined") {
      this.startPeriodicCleanup();
    }
  }
  /**
   * 获取状态值 - 优化内存访问（使用LRU缓存）
   * @param key 状态键，支持嵌套路径（如 'user.profile.name'）
   * @returns 状态值或undefined
   */
  get(key) {
    const cached = this.pathCache.get(key);
    if (cached !== void 0) {
      return cached;
    }
    const value = this.getNestedValue(this.state, key);
    if (value !== void 0) {
      this.pathCache.set(key, value);
    }
    return value;
  }
  /**
   * 设置状态值
   * @param key 状态键，支持嵌套路径
   * @param value 要设置的值
   */
  set(key, value) {
    try {
      const oldValue = this.getNestedValue(this.state, key);
      if (oldValue === value) {
        return;
      }
      this.recordChange(key, oldValue, value);
      this.setNestedValue(this.state, key, value);
      this.invalidatePathCache(key);
      this.triggerWatchers(key, value, oldValue);
    } catch (error) {
      this.logger?.error("Failed to set state", { key, value, error });
      throw error;
    }
  }
  remove(key) {
    this.deleteNestedValue(this.state, key);
  }
  /**
   * 清空所有状态和监听器
   */
  clear() {
    this.watchers.clear();
    this.pathCache.clear();
    if (this.state && typeof this.state === "object") {
      Object.keys(this.state).forEach((key) => {
        delete this.state[key];
      });
    }
    this.changeHistory.length = 0;
    this.historyIndex = 0;
  }
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, /* @__PURE__ */ new Set());
    }
    const watcherSet = this.watchers.get(key);
    const weakCallback = new WeakRef(callback);
    watcherSet.add(weakCallback);
    return () => {
      const callbacks = this.watchers.get(key);
      if (callbacks) {
        callbacks.forEach((ref) => {
          if (ref.deref() === callback) {
            callbacks.delete(ref);
          }
        });
        if (callbacks.size === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }
  triggerWatchers(key, newValue, oldValue) {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      const deadRefs = [];
      callbacks.forEach((weakCallback) => {
        const callback = weakCallback.deref();
        if (callback) {
          try {
            queueMicrotask(() => callback(newValue, oldValue));
          } catch (error) {
            this.logger?.error("Error in state watcher callback", { key, error });
          }
        } else {
          deadRefs.push(weakCallback);
        }
      });
      deadRefs.forEach((ref) => callbacks.delete(ref));
    }
  }
  // 获取嵌套值
  getNestedValue(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === void 0 || typeof current !== "object") {
        return void 0;
      }
      const rec = current;
      current = rec[key];
    }
    return current;
  }
  // 设置嵌套值
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const next = current[key];
      if (typeof next !== "object" || next === null || Array.isArray(next)) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }
  // 删除嵌套值
  deleteNestedValue(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current === null || current === void 0 || typeof current !== "object") {
        return;
      }
      const rec = current;
      const key = keys[i];
      const next = rec[key];
      if (typeof next !== "object" || next === null) {
        return;
      }
      current = next;
    }
    if (current && typeof current === "object") {
      delete current[keys[keys.length - 1]];
    }
  }
  // 检查键是否存在
  has(key) {
    return this.getNestedValue(this.state, key) !== void 0;
  }
  // 获取所有键
  keys() {
    return this.getAllKeys(this.state);
  }
  // 递归获取所有键 - 优化版：使用迭代器避免创建临时数组
  getAllKeys(obj, prefix = "") {
    const keys = [];
    const stack = [
      { obj, prefix, depth: 0 }
    ];
    const maxDepth = 10;
    while (stack.length > 0) {
      const { obj: current, prefix: currentPrefix, depth } = stack.pop();
      if (depth >= maxDepth)
        continue;
      const currentKeys = Object.keys(current);
      const maxKeys = Math.min(currentKeys.length, 100);
      for (let i = 0; i < maxKeys; i++) {
        const key = currentKeys[i];
        const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;
        keys.push(fullKey);
        const val = current[key];
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          stack.push({ obj: val, prefix: fullKey, depth: depth + 1 });
        }
      }
    }
    return keys;
  }
  // 获取状态快照 - 优化版：使用结构化克隆或浅拷贝
  getSnapshot() {
    if (typeof structuredClone !== "undefined") {
      try {
        return structuredClone(this.state);
      } catch {
      }
    }
    return this.deepClone(this.state);
  }
  /**
   * 高效深拷贝方法 - 极致优化版
   * 使用迭代方式替代递归，避免栈溢出
   * 使用WeakMap追踪循环引用，减少内存占用
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== "object")
      return obj;
    if (obj instanceof Date)
      return new Date(obj);
    if (obj instanceof RegExp)
      return new RegExp(obj);
    if (obj instanceof Map)
      return new Map(obj);
    if (obj instanceof Set)
      return new Set(obj);
    if (typeof structuredClone !== "undefined") {
      try {
        return structuredClone(obj);
      } catch {
      }
    }
    const visited = /* @__PURE__ */ new WeakMap();
    const stack = [];
    const isArray = Array.isArray(obj);
    const root = isArray ? [] : {};
    visited.set(obj, root);
    if (isArray) {
      const len = Math.min(obj.length, 1e3);
      for (let i = 0; i < len; i++) {
        stack.push({ source: obj, target: root, key: i });
      }
    } else {
      const keys = Object.keys(obj);
      const maxKeys = Math.min(keys.length, 100);
      for (let i = 0; i < maxKeys; i++) {
        stack.push({ source: obj, target: root, key: keys[i] });
      }
    }
    while (stack.length > 0) {
      const { source, target, key } = stack.pop();
      const value = source[key];
      if (value === null || typeof value !== "object") {
        target[key] = value;
        continue;
      }
      if (value instanceof Date) {
        target[key] = new Date(value);
        continue;
      }
      if (value instanceof RegExp) {
        target[key] = new RegExp(value);
        continue;
      }
      if (visited.has(value)) {
        target[key] = visited.get(value);
        continue;
      }
      if (Array.isArray(value)) {
        const clonedArray = [];
        target[key] = clonedArray;
        visited.set(value, clonedArray);
        const len = Math.min(value.length, 1e3);
        for (let i = 0; i < len; i++) {
          stack.push({ source: value, target: clonedArray, key: i });
        }
      } else {
        const clonedObj = {};
        target[key] = clonedObj;
        visited.set(value, clonedObj);
        const keys = Object.keys(value);
        const maxKeys = Math.min(keys.length, 100);
        for (let i = 0; i < maxKeys; i++) {
          stack.push({ source: value, target: clonedObj, key: keys[i] });
        }
      }
    }
    return root;
  }
  // 从快照恢复状态
  restoreFromSnapshot(snapshot) {
    this.clear();
    Object.assign(this.state, snapshot);
  }
  // 合并状态
  merge(newState) {
    this.deepMerge(this.state, newState);
  }
  // 深度合并对象
  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      const sVal = source[key];
      if (sVal && typeof sVal === "object" && !Array.isArray(sVal)) {
        const tVal = target[key];
        if (!tVal || typeof tVal !== "object" || Array.isArray(tVal)) {
          target[key] = {};
        }
        this.deepMerge(target[key], sVal);
      } else {
        target[key] = sVal;
      }
    }
  }
  // 获取状态统计信息
  getStats() {
    const totalWatchers = Array.from(this.watchers.values()).reduce((sum, set) => sum + set.size, 0);
    const memoryUsage = JSON.stringify(this.state).length;
    return {
      totalKeys: this.keys().length,
      totalWatchers,
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`
    };
  }
  // 创建命名空间
  namespace(ns) {
    return new StateNamespace(this, ns);
  }
  // 获取整个状态对象
  getState() {
    return { ...this.state };
  }
  // 设置整个状态对象
  setState(newState) {
    Object.assign(this.state, newState);
    this.logger?.debug("State updated", { newState });
  }
  /**
   * 启动定期清理任务
   * @private
   */
  startPeriodicCleanup() {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupOldHistory();
      this.cleanupEmptyWatchers();
      this.cleanupPathCache();
    }, this.CLEANUP_INTERVAL);
  }
  // 清理旧历史记录
  cleanupOldHistory() {
    if (this.changeHistory.length === 0)
      return;
    const now = Date.now();
    const maxAge = 5 * 60 * 1e3;
    const filtered = this.changeHistory.filter((change) => change && now - change.timestamp < maxAge);
    if (filtered.length < this.changeHistory.length) {
      this.changeHistory = filtered;
      this.logger?.debug("Cleaned old state history", {
        removed: this.changeHistory.length - filtered.length
      });
    }
  }
  // 清理空的监听器
  cleanupEmptyWatchers() {
    const emptyKeys = [];
    for (const [key, callbacks] of this.watchers.entries()) {
      if (callbacks.size === 0) {
        emptyKeys.push(key);
      }
    }
    emptyKeys.forEach((key) => this.watchers.delete(key));
  }
  // 记录变更历史 - 优化版使用环形缓冲区
  recordChange(path, oldValue, newValue) {
    const entry = {
      path,
      oldValue,
      newValue,
      timestamp: Date.now()
    };
    if (this.changeHistory.length < this.maxHistorySize) {
      this.changeHistory.unshift(entry);
    } else {
      this.changeHistory.pop();
      this.changeHistory.unshift(entry);
    }
  }
  // 批量更新优化（暂未使用，移除以通过严格类型检查）
  // private batchUpdate(key: string, updateFn: () => void): void {
  //   this.batchUpdates.add(key)
  //
  //   if (this.batchTimeout) {
  //     clearTimeout(this.batchTimeout)
  //   }
  //
  //   this.batchTimeout = setTimeout(() => {
  //     const updates = Array.from(this.batchUpdates)
  //     this.batchUpdates.clear()
  //     this.batchTimeout = null
  //
  //     // 执行批量更新
  //     updateFn()
  //
  //     this.logger?.debug('Batch state update completed', { keys: updates })
  //   }, 0) // 下一个事件循环执行
  // }
  // 获取变更历史
  getChangeHistory(limit) {
    return limit ? this.changeHistory.slice(0, limit) : [...this.changeHistory];
  }
  // 清除变更历史
  clearHistory() {
    this.changeHistory = [];
  }
  // 撤销最后一次变更
  undo() {
    const lastChange = this.changeHistory.shift();
    if (!lastChange) {
      return false;
    }
    try {
      const originalMaxSize = this.maxHistorySize;
      this.maxHistorySize = 0;
      this.setNestedValue(this.state, lastChange.path, lastChange.oldValue);
      this.maxHistorySize = originalMaxSize;
      this.logger?.debug("State change undone", lastChange);
      return true;
    } catch (error) {
      this.logger?.error("Failed to undo state change", {
        change: lastChange,
        error
      });
      return false;
    }
  }
  // 获取性能统计
  getPerformanceStats() {
    const now = Date.now();
    const recentChanges = this.changeHistory.filter(
      (change) => change && now - change.timestamp < 6e4
      // 最近1分钟
    ).length;
    const memoryUsage = JSON.stringify(this.state).length + JSON.stringify(this.changeHistory).length;
    return {
      totalChanges: this.changeHistory.length,
      recentChanges,
      batchedUpdates: this.batchUpdates?.length || 0,
      memoryUsage
    };
  }
  /**
   * 使路径缓存失效（优化版 - LRU缓存）
   * @private
   */
  invalidatePathCache(key) {
    const keysToDelete = [];
    for (const cacheKey of this.pathCache.keys()) {
      if (cacheKey === key || cacheKey.startsWith(`${key}.`) || key.startsWith(`${cacheKey}.`)) {
        keysToDelete.push(cacheKey);
      }
    }
    keysToDelete.forEach((k) => this.pathCache.delete(k));
  }
  /**
   * 清理路径缓存（LRU自动管理，无需手动清理）
   * @private
   */
  cleanupPathCache() {
    if (this.logger) {
      const stats = this.pathCache.getStats();
      this.logger.debug("Path cache stats", stats);
    }
  }
}
class StateNamespace {
  constructor(stateManager, namespaceName) {
    this.stateManager = stateManager;
    this.namespaceName = namespaceName;
  }
  getKey(key) {
    return `${this.namespaceName}.${key}`;
  }
  get(key) {
    return this.stateManager.get(this.getKey(key));
  }
  set(key, value) {
    this.stateManager.set(this.getKey(key), value);
  }
  remove(key) {
    this.stateManager.remove(this.getKey(key));
  }
  has(key) {
    return this.stateManager.has(this.getKey(key));
  }
  watch(key, callback) {
    return this.stateManager.watch(this.getKey(key), callback);
  }
  clear() {
    const keys = this.stateManager.keys();
    const namespacePrefix = `${this.namespaceName}.`;
    keys.forEach((key) => {
      if (key.startsWith(namespacePrefix)) {
        this.stateManager.remove(key);
      }
    });
  }
  keys() {
    const allKeys = this.stateManager.keys();
    const namespacePrefix = `${this.namespaceName}.`;
    return allKeys.filter((key) => key.startsWith(namespacePrefix)).map((key) => key.substring(namespacePrefix.length));
  }
  namespace(name) {
    return this.stateManager.namespace(`${this.namespaceName}.${name}`);
  }
  // 获取整个状态对象（仅限当前命名空间）
  getState() {
    const allState = this.stateManager.getState();
    const namespacePrefix = `${this.namespaceName}.`;
    const result = {};
    Object.keys(allState).forEach((key) => {
      if (key.startsWith(namespacePrefix)) {
        const shortKey = key.substring(namespacePrefix.length);
        result[shortKey] = allState[key];
      }
    });
    return result;
  }
  // 设置整个状态对象（仅限当前命名空间）
  setState(newState) {
    Object.keys(newState).forEach((key) => {
      this.set(key, newState[key]);
    });
  }
}
function createStateManager(logger) {
  const manager = new StateManagerImpl(logger);
  manager.destroy = function() {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.watchers.clear();
    if (this.batchUpdates) {
      this.batchUpdates = null;
    }
    if (this.pathCache) {
      this.pathCache.clear();
    }
    this.changeHistory = [];
    this.historyIndex = 0;
    if (this.state && typeof this.state === "object") {
      Object.keys(this.state).forEach((key) => {
        delete this.state[key];
      });
    }
    this.logger = void 0;
  };
  return manager;
}
const stateModules = {
  // 用户状态模块
  user: (stateManager) => {
    const userState = stateManager.namespace("user");
    return {
      setUser: (user) => userState.set("profile", user),
      getUser: () => userState.get("profile"),
      setToken: (token) => userState.set("token", token),
      getToken: () => userState.get("token"),
      logout: () => {
        userState.clear();
      },
      isLoggedIn: () => !!userState.get("token")
    };
  },
  // 应用状态模块
  app: (stateManager) => {
    const appState = stateManager.namespace("app");
    return {
      setLoading: (loading) => appState.set("loading", loading),
      isLoading: () => appState.get("loading") || false,
      setError: (error) => appState.set("error", error),
      getError: () => appState.get("error"),
      clearError: () => appState.remove("error"),
      setTitle: (title) => appState.set("title", title),
      getTitle: () => appState.get("title")
    };
  },
  // 设置状态模块
  settings: (stateManager) => {
    const settingsState = stateManager.namespace("settings");
    return {
      setSetting: (key, value) => settingsState.set(key, value),
      getSetting: (key, defaultValue) => settingsState.get(key) ?? defaultValue,
      removeSetting: (key) => settingsState.remove(key),
      getAllSettings: () => settingsState.get("") || {},
      resetSettings: () => settingsState.clear()
    };
  }
};

export { StateManagerImpl, StateNamespace, createStateManager, stateModules };
//# sourceMappingURL=state-manager.js.map
