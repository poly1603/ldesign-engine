/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { ref, onUnmounted, computed, onMounted } from 'vue';
import { useEngine } from './useEngine.js';

function useNotification() {
  const engine = useEngine();
  const show = (options) => {
    return engine.notifications.show(options);
  };
  const success = (message, title, duration) => {
    return engine.notifications.show({
      type: "success",
      title: title || "Success",
      content: message,
      duration: duration || 3e3
    });
  };
  const error = (message, title, duration) => {
    return engine.notifications.show({
      type: "error",
      title: title || "Error",
      content: message,
      duration: duration || 5e3
    });
  };
  const warning = (message, title, duration) => {
    return engine.notifications.show({
      type: "warning",
      title: title || "Warning",
      content: message,
      duration: duration || 4e3
    });
  };
  const info = (message, title, duration) => {
    return engine.notifications.show({
      type: "info",
      title: title || "Info",
      content: message,
      duration: duration || 3e3
    });
  };
  const loading = (message, title) => {
    return engine.notifications.show({
      type: "info",
      title: title || "Loading",
      content: message,
      duration: 0,
      // 不自动关闭
      closable: false
    });
  };
  const clear = () => {
    engine.notifications.hideAll?.();
  };
  return {
    show,
    success,
    error,
    warning,
    info,
    loading,
    clear
  };
}
function useLogger(context) {
  const engine = useEngine();
  const logger = engine.logger;
  const logs = ref([]);
  const maxLogs = 100;
  const addLog = (level, message) => {
    logs.value.push({ level, message, timestamp: /* @__PURE__ */ new Date() });
    if (logs.value.length > maxLogs) {
      logs.value.shift();
    }
  };
  const debug = (message, ...args) => {
    logger.debug(context ? `[${context}] ${message}` : message, ...args);
    addLog("debug", message);
  };
  const info = (message, ...args) => {
    logger.info(context ? `[${context}] ${message}` : message, ...args);
    addLog("info", message);
  };
  const warn = (message, ...args) => {
    logger.warn(context ? `[${context}] ${message}` : message, ...args);
    addLog("warn", message);
  };
  const error = (message, ...args) => {
    logger.error(context ? `[${context}] ${message}` : message, ...args);
    addLog("error", message);
  };
  const clearLogs = () => {
    logs.value = [];
  };
  return {
    logs: computed(() => logs.value),
    debug,
    info,
    warn,
    error,
    clearLogs
  };
}
function useCache(key, defaultValue) {
  const engine = useEngine();
  const cache = engine.cache;
  const value = ref(cache.get(key) || defaultValue);
  const set = (newValue, ttl) => {
    cache.set(key, newValue, ttl);
    value.value = newValue;
  };
  const remove = () => {
    cache.delete(key);
    value.value = defaultValue;
  };
  const refresh = () => {
    value.value = cache.get(key) || defaultValue;
  };
  const unsubscribe = cache.on?.("change", (...args) => {
    const changedKey = args[0];
    if (changedKey === key) {
      refresh();
    }
  });
  onUnmounted(() => {
    unsubscribe?.();
  });
  return {
    value: computed(() => value.value),
    set,
    remove,
    refresh
  };
}
function useEvents() {
  const engine = useEngine();
  const events = engine.events;
  const listeners = [];
  const on = (event, handler) => {
    events.on(event, handler);
    const off2 = () => events.off(event, handler);
    listeners.push(off2);
    return off2;
  };
  const once = (event, handler) => {
    events.once(event, handler);
  };
  const emit = (event, ...args) => {
    events.emit(event, ...args);
  };
  const off = (event, handler) => {
    if (handler) {
      events.off(event, handler);
    }
  };
  onUnmounted(() => {
    listeners.forEach((off2) => off2());
  });
  return {
    on,
    once,
    emit,
    off
  };
}
function usePerformance() {
  const engine = useEngine();
  const performance = engine.performance;
  const metrics = ref({});
  const isMonitoring = ref(false);
  const startMonitoring = () => {
    if (isMonitoring.value)
      return;
    isMonitoring.value = true;
    performance.startMonitoring();
    const interval = setInterval(() => {
      if (!isMonitoring.value) {
        clearInterval(interval);
        return;
      }
      const currentMetrics = performance.collectMetrics();
      metrics.value = {
        memory: currentMetrics.memory,
        rendering: currentMetrics.rendering,
        network: currentMetrics.network
      };
    }, 1e3);
  };
  const stopMonitoring = () => {
    isMonitoring.value = false;
    performance.stopMonitoring();
  };
  const measure = (name, fn) => {
    const eventId = performance.startEvent("custom", name);
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => performance.endEvent(eventId));
      }
      performance.endEvent(eventId);
      return result;
    } catch (error) {
      performance.endEvent(eventId);
      throw error;
    }
  };
  const mark = (name) => {
    performance.recordEvent({
      type: "custom",
      name,
      startTime: Date.now()
    });
  };
  onMounted(() => {
    if (engine.config.get("features.enablePerformanceMonitoring")) {
      startMonitoring();
    }
  });
  onUnmounted(() => {
    stopMonitoring();
  });
  return {
    metrics: computed(() => metrics.value),
    isMonitoring: computed(() => isMonitoring.value),
    startMonitoring,
    stopMonitoring,
    measure,
    mark
  };
}
function useConfig(path, defaultValue) {
  const engine = useEngine();
  const config = engine.config;
  const value = ref(config.get(path, defaultValue));
  const set = (newValue) => {
    config.set(path, newValue);
    value.value = newValue;
  };
  const reset = () => {
    config.reset(path);
    value.value = config.get(path, defaultValue);
  };
  const unsubscribe = config.on("change", (...args) => {
    const changedPath = args[0];
    if (changedPath === path || changedPath.startsWith(`${path}.`)) {
      value.value = config.get(path, defaultValue);
    }
  });
  onUnmounted(() => {
    unsubscribe();
  });
  return {
    value: computed(() => value.value),
    set,
    reset
  };
}
function useErrorHandler() {
  const engine = useEngine();
  const errors = engine.errors;
  const errorList = ref([]);
  const handle = (error, context) => {
    errorList.value.push(error);
    errors.handle(error, context);
  };
  const capture = async (fn, context) => {
    try {
      const result = await fn();
      return [result, null];
    } catch (error) {
      handle(error, context);
      return [null, error];
    }
  };
  const clearErrors = () => {
    errorList.value = [];
  };
  return {
    errors: computed(() => errorList.value),
    handle,
    capture,
    clearErrors
  };
}
function usePlugins() {
  const engine = useEngine();
  const plugins = engine.plugins;
  const installedPlugins = computed(() => plugins.getInstalledPlugins());
  const pluginCount = computed(() => installedPlugins.value.length);
  const isInstalled = (name) => {
    return plugins.isInstalled(name);
  };
  const getPlugin = (name) => {
    return plugins.getPlugin(name);
  };
  const getPluginStatus = (name) => {
    return plugins.getPluginStatus?.(name);
  };
  return {
    plugins: installedPlugins,
    count: pluginCount,
    isInstalled,
    getPlugin,
    getPluginStatus
  };
}

export { useCache, useConfig, useErrorHandler, useEvents, useLogger, useNotification, usePerformance, usePlugins };
//# sourceMappingURL=useEngineFeatures.js.map
