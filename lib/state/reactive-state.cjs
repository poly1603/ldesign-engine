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

var vue = require('vue');

class ReactiveStateManager {
  constructor(logger, ssrContext) {
    this.logger = logger;
    this.ssrContext = ssrContext;
    this.state = vue.reactive({});
    this.computedStates = /* @__PURE__ */ new Map();
    this.watchers = /* @__PURE__ */ new Map();
    this.transactions = /* @__PURE__ */ new Map();
    this.currentTransaction = null;
    this.persistenceOptions = /* @__PURE__ */ new Map();
    this.collections = /* @__PURE__ */ new Map();
    this.isSSR = typeof window === "undefined";
    this.hydrationPromise = null;
    this.stateSnapshots = [];
    this.maxSnapshots = 10;
    this.MAX_COMPUTED = 100;
    this.MAX_COLLECTIONS = 50;
    this.MAX_TRANSACTIONS = 30;
    this.MAX_PERSISTENCE = 30;
    this.MAX_WATCHERS = 200;
    this.storageEventHandler = null;
    this.pathValueCache = /* @__PURE__ */ new WeakMap();
    if (this.isSSR && ssrContext?.initialState) {
      Object.assign(this.state, ssrContext.initialState);
    } else if (!this.isSSR && typeof window !== "undefined" && window.__SSR_STATE__) {
      this.hydrate(window.__SSR_STATE__);
    }
    if (!this.isSSR) {
      this.setupPersistence();
    }
  }
  /**
   * Get a reactive reference to a state value
   */
  getRef(key) {
    return vue.computed(() => this.getNestedValue(this.state, key));
  }
  /**
   * Get a shallow reactive reference (better performance for large objects)
   */
  getShallowRef(key) {
    const value = this.getNestedValue(this.state, key);
    return vue.shallowRef(value);
  }
  /**
   * Define a computed state that derives from other states - 优化版：限制数量
   */
  defineComputed(key, definition) {
    if (this.computedStates.size >= this.MAX_COMPUTED && !this.computedStates.has(key)) {
      this.logger?.warn(`Maximum computed states limit (${this.MAX_COMPUTED}) reached`);
      const firstKey = this.computedStates.keys().next().value;
      if (firstKey) {
        this.computedStates.delete(firstKey);
      }
    }
    const def = typeof definition === "function" ? { get: definition } : definition;
    const computedState = def.set ? vue.computed({
      get: def.get,
      set: def.set
    }) : vue.computed(def.get);
    this.computedStates.set(key, computedState);
    return computedState;
  }
  /**
   * Get a computed state value
   */
  getComputed(key) {
    return this.computedStates.get(key);
  }
  /**
   * Create a reactive collection with helper methods - 优化版：限制数量
   */
  createCollection(key, initialItems = []) {
    if (this.collections.size >= this.MAX_COLLECTIONS && !this.collections.has(key)) {
      this.logger?.warn(`Maximum collections limit (${this.MAX_COLLECTIONS}) reached`);
      const firstKey = this.collections.keys().next().value;
      if (firstKey) {
        const oldCollection = this.collections.get(firstKey);
        if (oldCollection) {
          oldCollection.clear();
        }
        this.collections.delete(firstKey);
      }
    }
    const items = vue.ref(initialItems);
    const collection = {
      items,
      add: (item) => {
        const arr = items.value;
        arr.push(item);
      },
      remove: (index) => {
        const arr = items.value;
        arr.splice(index, 1);
      },
      update: (index, item) => {
        const arr = items.value;
        if (index >= 0 && index < arr.length) {
          arr[index] = item;
        }
      },
      clear: () => {
        items.value.length = 0;
      },
      // 更高效的清空
      find: (predicate) => {
        const arr = items.value;
        return arr.find(predicate);
      },
      filter: (predicate) => {
        const arr = items.value;
        return arr.filter(predicate);
      },
      map: (mapper) => {
        const arr = items.value;
        return arr.map(mapper);
      },
      forEach: (callback) => {
        const arr = items.value;
        arr.forEach(callback);
      },
      size: vue.computed(() => items.value.length),
      isEmpty: vue.computed(() => items.value.length === 0)
    };
    this.collections.set(key, collection);
    return collection;
  }
  /**
   * Get a reactive collection
   */
  getCollection(key) {
    return this.collections.get(key);
  }
  /**
   * Start a new transaction - 优化版：限制事务数量
   */
  beginTransaction(id) {
    const transactionId = id || this.generateTransactionId();
    if (this.currentTransaction) {
      this.logger?.warn("Transaction already in progress", {
        current: this.currentTransaction.id
      });
    }
    if (this.transactions.size >= this.MAX_TRANSACTIONS) {
      const toRemove = [];
      for (const [txId, tx] of this.transactions.entries()) {
        if (tx.status !== "pending" && toRemove.length < 10) {
          toRemove.push(txId);
        }
      }
      toRemove.forEach((id2) => this.transactions.delete(id2));
    }
    this.currentTransaction = {
      id: transactionId,
      timestamp: Date.now(),
      operations: [],
      status: "pending"
    };
    this.transactions.set(transactionId, this.currentTransaction);
    return transactionId;
  }
  /**
   * Commit the current transaction
   */
  async commitTransaction() {
    if (!this.currentTransaction) {
      throw new Error("No transaction in progress");
    }
    try {
      this.currentTransaction.status = "committed";
      this.logger?.debug("Transaction committed", {
        id: this.currentTransaction.id,
        operations: this.currentTransaction.operations.length
      });
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    } finally {
      this.currentTransaction = null;
    }
  }
  /**
   * Rollback the current transaction
   */
  async rollbackTransaction() {
    if (!this.currentTransaction) {
      throw new Error("No transaction in progress");
    }
    for (const op of this.currentTransaction.operations.reverse()) {
      switch (op.type) {
        case "set": {
          if (op.oldValue !== void 0) {
            this.setNestedValue(this.state, op.path, op.oldValue);
          } else {
            this.deleteNestedValue(this.state, op.path);
          }
          break;
        }
        case "remove": {
          if (op.oldValue !== void 0) {
            this.setNestedValue(this.state, op.path, op.oldValue);
          }
          break;
        }
        case "clear": {
          if (op.oldValue && typeof op.oldValue === "object") {
            Object.assign(this.state, op.oldValue);
          }
          break;
        }
      }
    }
    this.currentTransaction.status = "rolled-back";
    this.logger?.debug("Transaction rolled back", {
      id: this.currentTransaction.id
    });
    this.currentTransaction = null;
  }
  /**
   * Execute a function within a transaction
   */
  async transaction(fn, options) {
    const { id, retries = 0 } = options || {};
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      this.beginTransaction(id);
      try {
        const result = await fn();
        await this.commitTransaction();
        return result;
      } catch (error) {
        lastError = error;
        await this.rollbackTransaction();
        if (attempt < retries) {
          this.logger?.debug("Transaction failed, retrying", {
            attempt: attempt + 1,
            retries,
            error
          });
          await this.delay(2 ** attempt * 100);
        }
      }
    }
    throw lastError;
  }
  /**
   * Set a value with transaction support
   */
  set(key, value) {
    const oldValue = this.getNestedValue(this.state, key);
    if (this.currentTransaction) {
      this.currentTransaction.operations.push({
        type: "set",
        path: key,
        oldValue,
        newValue: value
      });
    }
    this.setNestedValue(this.state, key, value);
    this.saveToPersistence(key);
  }
  /**
   * Update a value using an updater function
   */
  update(key, updater) {
    const oldValue = this.getNestedValue(this.state, key);
    const newValue = updater(oldValue);
    this.set(key, newValue);
  }
  /**
   * Setup persistence for a state key - 优化版：限制持久化键数量
   */
  persist(key, options) {
    if (this.persistenceOptions.size >= this.MAX_PERSISTENCE && !this.persistenceOptions.has(key)) {
      this.logger?.warn(`Maximum persistence keys limit (${this.MAX_PERSISTENCE}) reached`);
      const firstKey = this.persistenceOptions.keys().next().value;
      if (firstKey) {
        this.persistenceOptions.delete(firstKey);
      }
    }
    this.persistenceOptions.set(key, options);
    this.loadFromPersistence(key);
    this.watch(key, () => {
      this.saveToPersistence(key);
    });
  }
  /**
   * 监听状态变化 - 使用Vue的watch API
   * @param key 要监听的键或键数组
   * @param callback 回调函数
   * @param options 监听选项
   * @returns 取消监听的函数
   */
  watch(key, callback, options) {
    const totalWatchers = Array.from(this.watchers.values()).reduce((sum, arr) => sum + arr.length, 0);
    if (totalWatchers >= this.MAX_WATCHERS) {
      this.logger?.warn(`Maximum watchers limit (${this.MAX_WATCHERS}) reached`);
      this.cleanupOldWatchers();
    }
    const keys = Array.isArray(key) ? key : [key];
    const sources = keys.map((k) => () => this.getNestedValue(this.state, k));
    const stopWatcher = vue.watch(sources.length === 1 ? sources[0] : sources, callback, options);
    keys.forEach((k) => {
      if (!this.watchers.has(k)) {
        this.watchers.set(k, []);
      }
      const watcherArray = this.watchers.get(k);
      watcherArray.push(stopWatcher);
    });
    return stopWatcher;
  }
  /**
   * Create a derived state using a selector function
   */
  select(selector) {
    return vue.computed(() => selector(this.state));
  }
  /**
   * Batch multiple state updates
   */
  batch(updates) {
    this.beginTransaction();
    try {
      for (const { key, value } of updates) {
        this.set(key, value);
      }
      this.commitTransaction();
    } catch (error) {
      this.rollbackTransaction();
      throw error;
    }
  }
  /**
   * Subscribe to state changes with pattern matching
   */
  subscribe(pattern, callback) {
    const regex = typeof pattern === "string" ? new RegExp(`^${pattern.replace(/\*/g, ".*")}$`) : pattern;
    const unsubscribes = [];
    for (const key of Object.keys(this.state)) {
      if (regex.test(key)) {
        const unsubscribe = this.watch(key, (newValue) => {
          callback(key, newValue);
        });
        unsubscribes.push(unsubscribe);
      }
    }
    return () => {
      unsubscribes.forEach((fn) => fn());
    };
  }
  // Helper methods
  getNestedValue(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === void 0 || typeof current !== "object") {
        return void 0;
      }
      current = current[key];
    }
    return current;
  }
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }
  deleteNestedValue(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current || typeof current !== "object")
        return;
      current = current[keys[i]];
    }
    if (current && typeof current === "object") {
      delete current[keys[keys.length - 1]];
    }
  }
  setupPersistence() {
    if (typeof window === "undefined")
      return;
    this.storageEventHandler = (e) => {
      if (!e.key || !e.newValue)
        return;
      for (const [key, options] of this.persistenceOptions) {
        if (e.key === options.key) {
          const value = options.deserialize ? options.deserialize(e.newValue) : JSON.parse(e.newValue);
          this.set(key, value);
        }
      }
    };
    window.addEventListener("storage", this.storageEventHandler);
  }
  loadFromPersistence(key) {
    const options = this.persistenceOptions.get(key);
    if (!options)
      return;
    const storage = options.storage || localStorage;
    const stored = storage.getItem(options.key);
    if (!stored)
      return;
    try {
      let value = options.deserialize ? options.deserialize(stored) : JSON.parse(stored);
      if (options.version && options.migrate) {
        const storedVersion = storage.getItem(`${options.key}:version`);
        const oldVersion = storedVersion ? Number.parseInt(storedVersion) : 0;
        if (oldVersion < options.version) {
          value = options.migrate(value, oldVersion);
          storage.setItem(`${options.key}:version`, options.version.toString());
        }
      }
      this.set(key, value);
    } catch (error) {
      this.logger?.error("Failed to load from persistence", { key, error });
    }
  }
  saveToPersistence(key) {
    const options = this.persistenceOptions.get(key);
    if (!options)
      return;
    const value = this.getNestedValue(this.state, key);
    const storage = options.storage || localStorage;
    try {
      const serialized = options.serialize ? options.serialize(value) : JSON.stringify(value);
      storage.setItem(options.key, serialized);
      if (options.version) {
        storage.setItem(`${options.key}:version`, options.version.toString());
      }
    } catch (error) {
      this.logger?.error("Failed to save to persistence", { key, error });
    }
  }
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * SSR: Serialize state for server-side rendering
   */
  serialize(options) {
    const { include, exclude, compress = false } = options || {};
    let stateToSerialize = { ...this.state };
    if (include) {
      stateToSerialize = Object.keys(stateToSerialize).filter((key) => include.some((pattern) => key.match(pattern))).reduce((acc, key) => ({ ...acc, [key]: stateToSerialize[key] }), {});
    }
    if (exclude) {
      stateToSerialize = Object.keys(stateToSerialize).filter((key) => !exclude.some((pattern) => key.match(pattern))).reduce((acc, key) => ({ ...acc, [key]: stateToSerialize[key] }), {});
    }
    const serialized = JSON.stringify(stateToSerialize);
    if (compress && typeof btoa !== "undefined") {
      return btoa(serialized);
    }
    return serialized;
  }
  /**
   * SSR: Hydrate state on client side
   */
  async hydrate(serializedState) {
    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }
    this.hydrationPromise = new Promise((resolve) => {
      try {
        const stateToHydrate = typeof serializedState === "string" ? JSON.parse(serializedState) : serializedState;
        Object.assign(this.state, stateToHydrate);
        this.logger?.info("State hydrated successfully", {
          keys: Object.keys(stateToHydrate).length
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("state:hydrated", {
            detail: { state: stateToHydrate }
          }));
        }
        resolve();
      } catch (error) {
        this.logger?.error("Failed to hydrate state", error);
        resolve();
      }
    });
    return this.hydrationPromise;
  }
  /**
   * Generate SSR script tag for state injection
   */
  generateSSRScript() {
    const serialized = this.serialize();
    return `<script>window.__SSR_STATE__ = ${JSON.stringify(serialized)};<\/script>`;
  }
  /**
   * Time Travel: Create a state snapshot - 优化版：使用环形缓冲区
   */
  createSnapshot(label) {
    const snapshot = {
      timestamp: Date.now(),
      state: this.serialize()
    };
    if (this.stateSnapshots.length >= this.maxSnapshots) {
      this.stateSnapshots.shift();
    }
    this.stateSnapshots.push({
      timestamp: snapshot.timestamp,
      state: snapshot.state
    });
    this.logger?.debug("State snapshot created", { label, timestamp: snapshot.timestamp });
    return snapshot.state;
  }
  /**
   * Time Travel: Restore from snapshot
   */
  restoreSnapshot(snapshotId) {
    let snapshot;
    if (typeof snapshotId === "number") {
      snapshot = this.stateSnapshots[snapshotId];
    } else {
      snapshot = this.stateSnapshots.find((s) => s.state === snapshotId);
    }
    if (!snapshot) {
      this.logger?.warn("Snapshot not found", { snapshotId });
      return false;
    }
    try {
      const stateToRestore = JSON.parse(snapshot.state);
      this.clear();
      Object.assign(this.state, stateToRestore);
      this.logger?.info("State restored from snapshot", {
        timestamp: snapshot.timestamp
      });
      return true;
    } catch (error) {
      this.logger?.error("Failed to restore snapshot", error);
      return false;
    }
  }
  /**
   * Time Travel: Get snapshot history
   */
  getSnapshotHistory() {
    return this.stateSnapshots.map((snapshot, index) => ({
      index,
      timestamp: snapshot.timestamp,
      size: snapshot.state.length
    }));
  }
  /**
   * Time Travel: Clear snapshot history - 优化版
   */
  clearSnapshots() {
    this.stateSnapshots.length = 0;
    this.logger?.debug("Snapshot history cleared");
  }
  /**
   * Export state for debugging
   */
  exportState(format = "json") {
    const stateData = JSON.parse(JSON.stringify(this.state));
    switch (format) {
      case "csv": {
        const rows = Object.entries(stateData).map(([key, value]) => `"${key}","${JSON.stringify(value)}"`);
        return `key,value
${rows.join("\n")}`;
      }
      case "yaml": {
        return Object.entries(stateData).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
      }
      default:
        return JSON.stringify(stateData, null, 2);
    }
  }
  /**
   * Import state from external source
   */
  importState(data, format = "json") {
    try {
      let parsedData = {};
      switch (format) {
        case "csv": {
          const lines = data.split("\n");
          const headers = lines[0]?.split(",") || [];
          if (headers[0] === "key" && headers[1] === "value") {
            for (let i = 1; i < lines.length; i++) {
              const match = lines[i].match(/"([^"]+)","([^"]+)"/);
              if (match) {
                parsedData[match[1]] = JSON.parse(match[2]);
              }
            }
          }
          break;
        }
        case "yaml": {
          data.split("\n").forEach((line) => {
            const [key, ...valueParts] = line.split(": ");
            if (key && valueParts.length > 0) {
              parsedData[key] = JSON.parse(valueParts.join(": "));
            }
          });
          break;
        }
        default:
          parsedData = JSON.parse(data);
      }
      Object.assign(this.state, parsedData);
      this.logger?.info("State imported successfully", { format });
      return true;
    } catch (error) {
      this.logger?.error("Failed to import state", { format, error });
      return false;
    }
  }
  /**
   * 清理旧的监听器 - 新增方法
   * @private
   */
  cleanupOldWatchers() {
    const keysToDelete = [];
    for (const [key, watchers] of this.watchers.entries()) {
      if (watchers.length === 0) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.watchers.delete(key));
    if (this.watchers.size > this.MAX_WATCHERS * 0.8) {
      const entries = Array.from(this.watchers.entries());
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        const [key, watchers] = entries[i];
        watchers.forEach((stop) => {
          try {
            stop();
          } catch {
          }
        });
        this.watchers.delete(key);
      }
      this.logger?.debug("Cleaned old watchers", {
        removed: toRemove,
        remaining: this.watchers.size
      });
    }
  }
  /**
   * 清理所有状态和资源 - 完全增强版
   *
   * 按照正确的顺序清理所有资源，确保没有内存泄漏
   */
  dispose() {
    try {
      if (this.storageEventHandler && typeof window !== "undefined") {
        window.removeEventListener("storage", this.storageEventHandler);
        this.storageEventHandler = null;
      }
      for (const watchers of this.watchers.values()) {
        watchers.forEach((stop) => {
          try {
            stop();
          } catch {
          }
        });
      }
      this.watchers.clear();
      this.computedStates.clear();
      for (const collection of this.collections.values()) {
        try {
          collection.clear();
        } catch {
        }
      }
      this.collections.clear();
      this.transactions.clear();
      this.currentTransaction = null;
      this.stateSnapshots.length = 0;
      this.persistenceOptions.clear();
      this.hydrationPromise = null;
      if (this.state && typeof this.state === "object") {
        Object.keys(this.state).forEach((key) => {
          try {
            delete this.state[key];
          } catch {
          }
        });
      }
      this.logger = void 0;
      this.ssrContext = void 0;
    } catch (error) {
      console.error("Error during ReactiveStateManager disposal:", error);
    }
  }
  /**
   * 别名方法 - 用于统一接口
   */
  destroy() {
    this.dispose();
  }
  /**
   * Clear state (helper method)
   */
  clear() {
    Object.keys(this.state).forEach((key) => delete this.state[key]);
  }
}
function createReactiveStateManager(logger, ssrContext) {
  return new ReactiveStateManager(logger, ssrContext);
}
function createSSRStateManager(initialState, logger) {
  return new ReactiveStateManager(logger, { initialState });
}

exports.ReactiveStateManager = ReactiveStateManager;
exports.createReactiveStateManager = createReactiveStateManager;
exports.createSSRStateManager = createSSRStateManager;
//# sourceMappingURL=reactive-state.cjs.map
