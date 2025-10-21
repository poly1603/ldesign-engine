/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
const DEFAULT_CONFIG = {
  debug: false,
  appName: "Vue3 Engine App",
  version: "1.0.0"
};
const PERFORMANCE_CONSTANTS = {
  // 批处理配置
  BATCH_PROCESSOR: {
    DEFAULT_BATCH_SIZE: 20,
    DEFAULT_INTERVAL: 5e3,
    // 5秒
    MAX_WAIT_TIME: 1e4
    // 10秒
  },
  // 缓存优化
  CACHE_OPTIMIZATION: {
    CLEANUP_BATCH_SIZE: 20,
    CLEANUP_INTERVAL: 5e3,
    // 5秒
    STATS_CLEANUP_INTERVAL: 3e5,
    // 5分钟
    MAX_SIZE_DEFAULT: 100,
    DEFAULT_TTL: 3e5
    // 5分钟
  },
  // 事件优化
  EVENT_OPTIMIZATION: {
    STATS_CLEANUP_INTERVAL: 3e5,
    // 5分钟
    BATCH_REMOVE_THRESHOLD: 10,
    MAX_LISTENERS_DEFAULT: 100
  },
  // 内存管理
  MEMORY_MANAGEMENT: {
    OBJECT_POOL_MAX_SIZE: 100,
    GC_THRESHOLD: 1e3
    // 触发垃圾回收的阈值
  },
  // 性能阈值
  THRESHOLDS: {
    // 响应时间阈值（毫秒）
    RESPONSE_TIME: {
      EXCELLENT: 50,
      GOOD: 100,
      ACCEPTABLE: 500,
      POOR: 1e3
    },
    // FPS阈值
    FPS: {
      EXCELLENT: 60,
      GOOD: 45,
      ACCEPTABLE: 30,
      POOR: 15
    },
    // 内存使用阈值（MB）
    MEMORY: {
      LOW: 50,
      WARNING: 100,
      CRITICAL: 200,
      EMERGENCY: 500
    },
    // 缓存命中率阈值
    CACHE_HIT_RATE: {
      EXCELLENT: 0.9,
      GOOD: 0.8,
      ACCEPTABLE: 0.6,
      POOR: 0.4
    }
  }
};
const EVENTS = {
  // 引擎生命周期事件
  ENGINE_MOUNTED: "engine:mounted",
  ENGINE_UNMOUNTED: "engine:unmounted",
  ENGINE_ERROR: "engine:error",
  ENGINE_READY: "engine:ready",
  ENGINE_DESTROYED: "engine:destroyed",
  // 插件相关事件
  PLUGIN_REGISTERED: "plugin:registered",
  PLUGIN_UNREGISTERED: "plugin:unregistered",
  PLUGIN_INSTALLED: "plugin:installed",
  PLUGIN_UNINSTALLED: "plugin:uninstalled",
  PLUGIN_ERROR: "plugin:error",
  // 中间件相关事件
  MIDDLEWARE_ADDED: "middleware:added",
  MIDDLEWARE_REMOVED: "middleware:removed",
  MIDDLEWARE_EXECUTED: "middleware:executed",
  // 状态管理事件
  STATE_CHANGED: "state:changed",
  STATE_RESET: "state:reset",
  // 错误处理事件
  ERROR_CAPTURED: "error:captured",
  ERROR_HANDLED: "error:handled",
  // 通知相关事件
  NOTIFICATION_SHOWN: "notification:shown",
  NOTIFICATION_HIDDEN: "notification:hidden",
  NOTIFICATION_CLICKED: "notification:clicked",
  // 性能监控事件
  PERFORMANCE_MARK: "performance:mark",
  PERFORMANCE_MEASURE: "performance:measure",
  PERFORMANCE_THRESHOLD_VIOLATION: "performance:threshold:violation",
  // 缓存相关事件
  CACHE_HIT: "cache:hit",
  CACHE_MISS: "cache:miss",
  CACHE_EVICTED: "cache:evicted",
  // 安全相关事件
  SECURITY_VIOLATION: "security:violation",
  SECURITY_BLOCKED: "security:blocked",
  // 配置相关事件
  CONFIG_CHANGED: "config:changed",
  CONFIG_SAVED: "config:saved",
  CONFIG_LOADED: "config:loaded",
  // 生命周期事件
  LIFECYCLE_BEFORE_INIT: "lifecycle:before:init",
  LIFECYCLE_AFTER_INIT: "lifecycle:after:init",
  LIFECYCLE_BEFORE_START: "lifecycle:before:start",
  LIFECYCLE_AFTER_START: "lifecycle:after:start",
  LIFECYCLE_BEFORE_STOP: "lifecycle:before:stop",
  LIFECYCLE_AFTER_STOP: "lifecycle:after:stop",
  LIFECYCLE_BEFORE_DESTROY: "lifecycle:before:destroy",
  LIFECYCLE_AFTER_DESTROY: "lifecycle:after:destroy"
};
const LOG_LEVELS = ["debug", "info", "warn", "error"];
const NOTIFICATION_TYPES = [
  "success",
  "error",
  "warning",
  "info"
];
const NOTIFICATION_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];
const NOTIFICATION_ANIMATIONS = [
  "slide",
  "fade",
  "bounce",
  "scale",
  "flip"
];
const NOTIFICATION_THEMES = ["light", "dark", "auto"];
const CACHE_STRATEGIES = ["lru", "lfu", "fifo", "ttl"];
const ENVIRONMENTS = ["development", "production", "test"];
const FEATURE_FLAGS = {
  ENABLE_HOT_RELOAD: "enableHotReload",
  ENABLE_DEV_TOOLS: "enableDevTools",
  ENABLE_PERFORMANCE_MONITORING: "enablePerformanceMonitoring",
  ENABLE_ERROR_REPORTING: "enableErrorReporting",
  ENABLE_SECURITY_PROTECTION: "enableSecurityProtection",
  ENABLE_CACHING: "enableCaching",
  ENABLE_NOTIFICATIONS: "enableNotifications"
};
const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME: {
    GOOD: 100,
    // 100ms
    POOR: 1e3
    // 1s
  },
  FPS: {
    GOOD: 60,
    // 60fps
    POOR: 30
    // 30fps
  },
  MEMORY: {
    WARNING: 50,
    // 50MB
    CRITICAL: 100
    // 100MB
  }
};
const SECURITY_CONFIG = {
  XSS: {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "span", "div", "p"],
    ALLOWED_ATTRIBUTES: {
      a: ["href", "title", "target"],
      img: ["src", "alt", "title"]
    }
  },
  CSP: {
    DIRECTIVES: {
      "default-src": ["self"],
      "script-src": ["self", "unsafe-inline"],
      "style-src": ["self", "unsafe-inline"],
      "img-src": ["self", "data:", "https:"]
    }
  }
};
const STORAGE_KEYS = {
  ENGINE_CONFIG: "engine-config",
  ENGINE_LOGS: "engine-logs",
  ENGINE_CACHE: "engine-cache",
  ENGINE_STATE: "engine-state",
  ENGINE_NOTIFICATIONS: "engine-notifications"
};
const ERROR_CODES = {
  // 配置相关错误
  CONFIG_INVALID: "CONFIG_INVALID",
  CONFIG_MISSING: "CONFIG_MISSING",
  CONFIG_VALIDATION_FAILED: "CONFIG_VALIDATION_FAILED",
  // 插件相关错误
  PLUGIN_INSTALL_FAILED: "PLUGIN_INSTALL_FAILED",
  PLUGIN_DEPENDENCY_MISSING: "PLUGIN_DEPENDENCY_MISSING",
  PLUGIN_CONFLICT: "PLUGIN_CONFLICT",
  // 中间件相关错误
  MIDDLEWARE_EXECUTION_FAILED: "MIDDLEWARE_EXECUTION_FAILED",
  MIDDLEWARE_NOT_FOUND: "MIDDLEWARE_NOT_FOUND",
  // 状态相关错误
  STATE_INVALID: "STATE_INVALID",
  STATE_ACCESS_DENIED: "STATE_ACCESS_DENIED",
  // 缓存相关错误
  CACHE_FULL: "CACHE_FULL",
  CACHE_INVALID_KEY: "CACHE_INVALID_KEY",
  // 安全相关错误
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  SECURITY_BLOCKED: "SECURITY_BLOCKED",
  // 性能相关错误
  PERFORMANCE_THRESHOLD_EXCEEDED: "PERFORMANCE_THRESHOLD_EXCEEDED",
  PERFORMANCE_MONITORING_FAILED: "PERFORMANCE_MONITORING_FAILED"
};
const VERSION = {
  CURRENT: "0.1.0",
  MIN_SUPPORTED: "0.1.0",
  API_VERSION: "1.0.0"
};
const TIME = {
  SECOND: 1e3,
  MINUTE: 60 * 1e3,
  HOUR: 60 * 60 * 1e3,
  DAY: 24 * 60 * 60 * 1e3,
  // 默认间隔
  DEFAULT_AUTO_SAVE_INTERVAL: 3e4,
  // 30秒
  DEFAULT_CACHE_CLEANUP_INTERVAL: 6e4,
  // 1分钟
  DEFAULT_PERFORMANCE_CHECK_INTERVAL: 5e3,
  // 5秒
  DEFAULT_HEALTH_CHECK_INTERVAL: 3e4
  // 30秒
};
const LIMITS = {
  // 缓存限制
  MAX_CACHE_SIZE: 1e3,
  MAX_CACHE_ENTRY_SIZE: 1024 * 1024,
  // 1MB
  // 日志限制
  MAX_LOG_ENTRIES: 1e4,
  MAX_LOG_ENTRY_SIZE: 1024,
  // 1KB
  // 通知限制
  MAX_NOTIFICATIONS: 100,
  MAX_NOTIFICATION_DURATION: 1e4,
  // 10秒
  // 插件限制
  MAX_PLUGINS: 100,
  MAX_PLUGIN_DEPENDENCIES: 50,
  // 中间件限制
  MAX_MIDDLEWARE: 100,
  MAX_MIDDLEWARE_PRIORITY: 1e3,
  // 状态限制
  MAX_STATE_KEYS: 1e4,
  MAX_STATE_VALUE_SIZE: 1024 * 1024
  // 1MB
};

export { CACHE_STRATEGIES, DEFAULT_CONFIG, ENVIRONMENTS, ERROR_CODES, EVENTS, FEATURE_FLAGS, LIMITS, LOG_LEVELS, NOTIFICATION_ANIMATIONS, NOTIFICATION_POSITIONS, NOTIFICATION_THEMES, NOTIFICATION_TYPES, PERFORMANCE_CONSTANTS, PERFORMANCE_THRESHOLDS, SECURITY_CONFIG, STORAGE_KEYS, TIME, VERSION };
//# sourceMappingURL=index.js.map
