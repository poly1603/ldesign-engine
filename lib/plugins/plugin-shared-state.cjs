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
var reactiveState = require('../state/reactive-state.cjs');

class PluginSharedStateManager {
  constructor(logger) {
    this.logger = logger;
    this.namespaces = /* @__PURE__ */ new Map();
    this.sharedStates = /* @__PURE__ */ new Map();
    this.pluginContexts = /* @__PURE__ */ new Map();
    this.messageBus = vue.reactive([]);
    this.messageHandlers = /* @__PURE__ */ new Map();
    this.globalComputed = /* @__PURE__ */ new Map();
  }
  /**
   * Register a plugin with the shared state system
   */
  registerPlugin(plugin) {
    const context = {
      pluginName: plugin.name,
      permissions: /* @__PURE__ */ new Set(),
      dependencies: plugin.metadata?.dependencies || []
    };
    this.pluginContexts.set(plugin.name, context);
    const namespace = new reactiveState.ReactiveStateManager(this.logger);
    this.namespaces.set(plugin.name, namespace);
    this.logger?.debug(`Plugin "${plugin.name}" registered in shared state system`);
  }
  /**
   * Unregister a plugin from the shared state system
   */
  unregisterPlugin(pluginName) {
    const namespace = this.namespaces.get(pluginName);
    if (namespace) {
      namespace.dispose();
      this.namespaces.delete(pluginName);
    }
    for (const [key, entry] of this.sharedStates) {
      if (entry.metadata.pluginName === pluginName) {
        this.sharedStates.delete(key);
      }
    }
    this.messageHandlers.delete(pluginName);
    this.pluginContexts.delete(pluginName);
    this.logger?.debug(`Plugin "${pluginName}" unregistered from shared state system`);
  }
  /**
   * Get a plugin's isolated namespace
   */
  getNamespace(pluginName) {
    return this.namespaces.get(pluginName);
  }
  /**
   * Create a shared state that can be accessed by other plugins
   */
  createSharedState(pluginName, key, initialValue, options) {
    const fullKey = `${pluginName}:${key}`;
    if (this.sharedStates.has(fullKey)) {
      throw new Error(`Shared state "${fullKey}" already exists`);
    }
    const valueRef = vue.ref(initialValue);
    const metadata = {
      pluginName,
      key,
      access: options?.access || "protected",
      description: options?.description,
      type: typeof initialValue,
      readonly: options?.readonly || false,
      persist: options?.persist || false
    };
    const entry = {
      value: valueRef,
      metadata,
      watchers: /* @__PURE__ */ new Set(),
      dependencies: /* @__PURE__ */ new Set()
    };
    this.sharedStates.set(fullKey, entry);
    if (options?.persist) {
      this.setupPersistence(fullKey, valueRef);
    }
    this.logger?.debug(`Created shared state "${fullKey}"`, metadata);
    return valueRef;
  }
  /**
   * Access a shared state from another plugin
   */
  accessSharedState(requestingPlugin, ownerPlugin, key) {
    const fullKey = `${ownerPlugin}:${key}`;
    const entry = this.sharedStates.get(fullKey);
    if (!entry) {
      this.logger?.warn(`Shared state "${fullKey}" not found`);
      return void 0;
    }
    if (!this.checkAccess(requestingPlugin, entry.metadata)) {
      this.logger?.warn(`Access denied to shared state "${fullKey}" for plugin "${requestingPlugin}"`);
      return void 0;
    }
    entry.dependencies.add(requestingPlugin);
    if (entry.metadata.readonly) {
      return vue.computed(() => entry.value.value);
    }
    return entry.value;
  }
  /**
   * Watch a shared state for changes
   */
  watchSharedState(pluginName, ownerPlugin, key, callback) {
    const state = this.accessSharedState(pluginName, ownerPlugin, key);
    if (!state) {
      throw new Error(`Cannot watch non-existent shared state "${ownerPlugin}:${key}"`);
    }
    return vue.watch(state, callback);
  }
  /**
   * Create a computed state that derives from multiple shared states
   */
  createGlobalComputed(key, getter, options) {
    if (this.globalComputed.has(key)) {
      throw new Error(`Global computed state "${key}" already exists`);
    }
    const computedState = vue.computed(getter);
    this.globalComputed.set(key, computedState);
    this.logger?.debug(`Created global computed state "${key}"`, options);
    return computedState;
  }
  /**
   * Get a global computed state
   */
  getGlobalComputed(key) {
    return this.globalComputed.get(key);
  }
  /**
   * Send a message to another plugin or broadcast to all
   */
  sendMessage(from, to, type, data) {
    const message = {
      from,
      to,
      type,
      data,
      timestamp: Date.now()
    };
    this.messageBus.push(message);
    if (to === "*") {
      for (const [pluginName, handlers] of this.messageHandlers) {
        if (pluginName !== from) {
          handlers.forEach((handler) => handler(message));
        }
      }
    } else {
      const handlers = this.messageHandlers.get(to);
      if (handlers) {
        handlers.forEach((handler) => handler(message));
      }
    }
    this.logger?.debug(`Message sent from "${from}" to "${to}"`, { type, data });
  }
  /**
   * Subscribe to messages for a plugin
   */
  onMessage(pluginName, handler, filter) {
    if (!this.messageHandlers.has(pluginName)) {
      this.messageHandlers.set(pluginName, /* @__PURE__ */ new Set());
    }
    const wrappedHandler = filter ? (msg) => filter(msg) && handler(msg) : handler;
    this.messageHandlers.get(pluginName).add(wrappedHandler);
    return () => {
      const handlers = this.messageHandlers.get(pluginName);
      if (handlers) {
        handlers.delete(wrappedHandler);
      }
    };
  }
  /**
   * Create a reactive bridge between plugins
   */
  createBridge(sourcePlugin, sourceKey, targetPlugin, targetKey, transformer) {
    const source = this.accessSharedState(targetPlugin, sourcePlugin, sourceKey);
    const target = this.getNamespace(targetPlugin);
    if (!source || !target) {
      throw new Error("Cannot create bridge: source or target not found");
    }
    return vue.watch(source, (newValue) => {
      const transformed = transformer ? transformer(newValue) : newValue;
      target.set(targetKey, transformed);
    });
  }
  /**
   * Synchronize state between multiple plugins
   */
  synchronize(plugins, key, options) {
    const unsubscribes = [];
    const { bidirectional = true, debounce: debounceMs = 0 } = options || {};
    let syncing = false;
    const syncFn = (value) => {
      if (syncing)
        return;
      syncing = true;
      plugins.forEach((plugin) => {
        const namespace = this.getNamespace(plugin);
        if (namespace) {
          namespace.set(key, value);
        }
      });
      setTimeout(() => syncing = false, 0);
    };
    const debouncedSync = debounceMs > 0 ? this.debounce(syncFn, debounceMs) : syncFn;
    plugins.forEach((plugin) => {
      const namespace = this.getNamespace(plugin);
      if (namespace && bidirectional) {
        const unsubscribe = namespace.watch(key, debouncedSync);
        unsubscribes.push(unsubscribe);
      }
    });
    return () => {
      unsubscribes.forEach((fn) => fn());
    };
  }
  /**
   * Get state dependency graph
   */
  getDependencyGraph() {
    const graph = {};
    for (const [key, entry] of this.sharedStates) {
      graph[key] = Array.from(entry.dependencies);
    }
    return graph;
  }
  /**
   * Get state statistics
   */
  getStats() {
    const memoryUsage = JSON.stringify({
      states: Array.from(this.sharedStates.values()).map((e) => e.value.value),
      messages: this.messageBus
    }).length;
    return {
      totalPlugins: this.pluginContexts.size,
      totalSharedStates: this.sharedStates.size,
      totalGlobalComputed: this.globalComputed.size,
      totalMessages: this.messageBus.length,
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`
    };
  }
  // Helper methods
  checkAccess(requestingPlugin, metadata) {
    if (metadata.access === "public") {
      return true;
    }
    if (metadata.access === "private") {
      return requestingPlugin === metadata.pluginName;
    }
    if (metadata.access === "protected") {
      const context = this.pluginContexts.get(requestingPlugin);
      if (!context)
        return false;
      return requestingPlugin === metadata.pluginName || context.dependencies.includes(metadata.pluginName);
    }
    return false;
  }
  setupPersistence(key, valueRef) {
    if (typeof window === "undefined")
      return;
    const storageKey = `plugin-state:${key}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        valueRef.value = JSON.parse(stored);
      } catch (error) {
        this.logger?.error(`Failed to load persisted state for "${key}"`, error);
      }
    }
    vue.watch(valueRef, (newValue) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newValue));
      } catch (error) {
        this.logger?.error(`Failed to persist state for "${key}"`, error);
      }
    });
  }
  debounce(func, wait) {
    let timeout;
    return ((...args) => {
      if (timeout)
        clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    });
  }
  /**
   * Dispose and clean up all resources
   */
  dispose() {
    for (const namespace of this.namespaces.values()) {
      namespace.dispose();
    }
    this.namespaces.clear();
    this.sharedStates.clear();
    this.messageHandlers.clear();
    this.globalComputed.clear();
    this.pluginContexts.clear();
    this.messageBus.length = 0;
  }
}
function createPluginSharedStateManager(logger) {
  return new PluginSharedStateManager(logger);
}
function usePluginState(pluginName, key, defaultValue) {
  const state = vue.ref(defaultValue);
  const setState = (value) => {
    state.value = value;
  };
  const watchState = (callback) => {
    const stopWatch = vue.watch(state, callback);
    return stopWatch;
  };
  return {
    state,
    setState,
    watchState
  };
}

exports.PluginSharedStateManager = PluginSharedStateManager;
exports.createPluginSharedStateManager = createPluginSharedStateManager;
exports.usePluginState = usePluginState;
//# sourceMappingURL=plugin-shared-state.cjs.map
