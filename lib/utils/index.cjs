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

var memoryManagement = require('./memory-management.cjs');
var memoryMonitor = require('./memory-monitor.cjs');
var resourceManager = require('./resource-manager.cjs');
var lruCache = require('./lru-cache.cjs');

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
function debounce(fn, delay2) {
  let timeoutId = null;
  return function(...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay2);
  };
}
function throttle(fn, delay2) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay2) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function formatFileSize(bytes) {
  if (bytes === 0)
    return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / k ** i * 100) / 100} ${sizes[i]}`;
}
function formatTime(ms) {
  if (ms < 1e3)
    return `${ms}ms`;
  if (ms < 6e4)
    return `${(ms / 1e3).toFixed(2)}s`;
  return `${Math.floor(ms / 6e4)}m ${Math.floor(ms % 6e4 / 1e3)}s`;
}
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === "function" ? key(item) : String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}
function unique(array) {
  return Array.from(new Set(array));
}
function isEmpty(value) {
  if (value == null)
    return true;
  if (typeof value === "string")
    return value.trim() === "";
  if (Array.isArray(value))
    return value.length === 0;
  if (typeof value === "object")
    return Object.keys(value).length === 0;
  return false;
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
function isPromise(value) {
  return value instanceof Promise;
}
function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function safeJsonStringify(obj, fallback = "{}") {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}
async function retry(fn, options = {}) {
  const { maxRetries = 3, delay: initialDelay = 1e3, backoff = 2 } = options;
  let lastError = null;
  let currentDelay = initialDelay;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unknown error");
}

exports.createManagedContext = memoryManagement.createManagedContext;
exports.destroyGlobalContext = memoryManagement.destroyGlobalContext;
exports.getGlobalContext = memoryManagement.getGlobalContext;
exports.MemoryMonitor = memoryMonitor.MemoryMonitor;
exports.createMemoryMonitor = memoryMonitor.createMemoryMonitor;
exports.ResourceManager = resourceManager.ResourceManager;
exports.createResourceManager = resourceManager.createResourceManager;
exports.LRUCache = lruCache.LRUCache;
exports.createLRUCache = lruCache.createLRUCache;
exports.chunk = chunk;
exports.debounce = debounce;
exports.deepClone = deepClone;
exports.delay = delay;
exports.formatFileSize = formatFileSize;
exports.formatTime = formatTime;
exports.generateId = generateId;
exports.getNestedValue = getNestedValue;
exports.groupBy = groupBy;
exports.isEmpty = isEmpty;
exports.isFunction = isFunction;
exports.isObject = isObject;
exports.isPromise = isPromise;
exports.retry = retry;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
exports.setNestedValue = setNestedValue;
exports.throttle = throttle;
exports.unique = unique;
//# sourceMappingURL=index.cjs.map
