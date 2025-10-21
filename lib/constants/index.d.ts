/**
 * 引擎常量定义
 * 包含系统中使用的各种常量值
 */
/**
 * 默认配置常量
 * 🎯 提供引擎的默认配置值
 */
export declare const DEFAULT_CONFIG: {
    readonly debug: false;
    readonly appName: "Vue3 Engine App";
    readonly version: "1.0.0";
};
/**
 * 性能优化常量
 * 🚀 统一管理性能优化相关的配置值
 */
export declare const PERFORMANCE_CONSTANTS: {
    readonly BATCH_PROCESSOR: {
        readonly DEFAULT_BATCH_SIZE: 20;
        readonly DEFAULT_INTERVAL: 5000;
        readonly MAX_WAIT_TIME: 10000;
    };
    readonly CACHE_OPTIMIZATION: {
        readonly CLEANUP_BATCH_SIZE: 20;
        readonly CLEANUP_INTERVAL: 5000;
        readonly STATS_CLEANUP_INTERVAL: 300000;
        readonly MAX_SIZE_DEFAULT: 100;
        readonly DEFAULT_TTL: 300000;
    };
    readonly EVENT_OPTIMIZATION: {
        readonly STATS_CLEANUP_INTERVAL: 300000;
        readonly BATCH_REMOVE_THRESHOLD: 10;
        readonly MAX_LISTENERS_DEFAULT: 100;
    };
    readonly MEMORY_MANAGEMENT: {
        readonly OBJECT_POOL_MAX_SIZE: 100;
        readonly GC_THRESHOLD: 1000;
    };
    readonly THRESHOLDS: {
        readonly RESPONSE_TIME: {
            readonly EXCELLENT: 50;
            readonly GOOD: 100;
            readonly ACCEPTABLE: 500;
            readonly POOR: 1000;
        };
        readonly FPS: {
            readonly EXCELLENT: 60;
            readonly GOOD: 45;
            readonly ACCEPTABLE: 30;
            readonly POOR: 15;
        };
        readonly MEMORY: {
            readonly LOW: 50;
            readonly WARNING: 100;
            readonly CRITICAL: 200;
            readonly EMERGENCY: 500;
        };
        readonly CACHE_HIT_RATE: {
            readonly EXCELLENT: 0.9;
            readonly GOOD: 0.8;
            readonly ACCEPTABLE: 0.6;
            readonly POOR: 0.4;
        };
    };
};
/**
 * 事件名称常量
 * 📡 定义引擎系统中所有事件的标准名称
 */
export declare const EVENTS: {
    readonly ENGINE_MOUNTED: "engine:mounted";
    readonly ENGINE_UNMOUNTED: "engine:unmounted";
    readonly ENGINE_ERROR: "engine:error";
    readonly ENGINE_READY: "engine:ready";
    readonly ENGINE_DESTROYED: "engine:destroyed";
    readonly PLUGIN_REGISTERED: "plugin:registered";
    readonly PLUGIN_UNREGISTERED: "plugin:unregistered";
    readonly PLUGIN_INSTALLED: "plugin:installed";
    readonly PLUGIN_UNINSTALLED: "plugin:uninstalled";
    readonly PLUGIN_ERROR: "plugin:error";
    readonly MIDDLEWARE_ADDED: "middleware:added";
    readonly MIDDLEWARE_REMOVED: "middleware:removed";
    readonly MIDDLEWARE_EXECUTED: "middleware:executed";
    readonly STATE_CHANGED: "state:changed";
    readonly STATE_RESET: "state:reset";
    readonly ERROR_CAPTURED: "error:captured";
    readonly ERROR_HANDLED: "error:handled";
    readonly NOTIFICATION_SHOWN: "notification:shown";
    readonly NOTIFICATION_HIDDEN: "notification:hidden";
    readonly NOTIFICATION_CLICKED: "notification:clicked";
    readonly PERFORMANCE_MARK: "performance:mark";
    readonly PERFORMANCE_MEASURE: "performance:measure";
    readonly PERFORMANCE_THRESHOLD_VIOLATION: "performance:threshold:violation";
    readonly CACHE_HIT: "cache:hit";
    readonly CACHE_MISS: "cache:miss";
    readonly CACHE_EVICTED: "cache:evicted";
    readonly SECURITY_VIOLATION: "security:violation";
    readonly SECURITY_BLOCKED: "security:blocked";
    readonly CONFIG_CHANGED: "config:changed";
    readonly CONFIG_SAVED: "config:saved";
    readonly CONFIG_LOADED: "config:loaded";
    readonly LIFECYCLE_BEFORE_INIT: "lifecycle:before:init";
    readonly LIFECYCLE_AFTER_INIT: "lifecycle:after:init";
    readonly LIFECYCLE_BEFORE_START: "lifecycle:before:start";
    readonly LIFECYCLE_AFTER_START: "lifecycle:after:start";
    readonly LIFECYCLE_BEFORE_STOP: "lifecycle:before:stop";
    readonly LIFECYCLE_AFTER_STOP: "lifecycle:after:stop";
    readonly LIFECYCLE_BEFORE_DESTROY: "lifecycle:before:destroy";
    readonly LIFECYCLE_AFTER_DESTROY: "lifecycle:after:destroy";
};
/**
 * 日志级别常量
 * 📝 定义日志系统的标准级别
 */
export declare const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];
/**
 * 通知类型常量
 * 🔔 定义通知系统的标准类型
 */
export declare const NOTIFICATION_TYPES: readonly ["success", "error", "warning", "info"];
/**
 * 通知位置常量
 * 📍 定义通知显示的标准位置
 */
export declare const NOTIFICATION_POSITIONS: readonly ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
/**
 * 通知动画常量
 * ✨ 定义通知显示的标准动画效果
 */
export declare const NOTIFICATION_ANIMATIONS: readonly ["slide", "fade", "bounce", "scale", "flip"];
/**
 * 通知主题常量
 * 🎨 定义通知显示的标准主题
 */
export declare const NOTIFICATION_THEMES: readonly ["light", "dark", "auto"];
/**
 * 缓存策略常量
 * 💾 定义缓存系统的标准策略
 */
export declare const CACHE_STRATEGIES: readonly ["lru", "lfu", "fifo", "ttl"];
/**
 * 环境类型常量
 * 🌍 定义系统支持的标准环境
 */
export declare const ENVIRONMENTS: readonly ["development", "production", "test"];
/**
 * 功能开关常量
 * 🎛️ 定义引擎功能的标准开关名称
 */
export declare const FEATURE_FLAGS: {
    readonly ENABLE_HOT_RELOAD: "enableHotReload";
    readonly ENABLE_DEV_TOOLS: "enableDevTools";
    readonly ENABLE_PERFORMANCE_MONITORING: "enablePerformanceMonitoring";
    readonly ENABLE_ERROR_REPORTING: "enableErrorReporting";
    readonly ENABLE_SECURITY_PROTECTION: "enableSecurityProtection";
    readonly ENABLE_CACHING: "enableCaching";
    readonly ENABLE_NOTIFICATIONS: "enableNotifications";
};
/**
 * 性能阈值常量
 * ⚡ 定义性能监控的标准阈值
 */
export declare const PERFORMANCE_THRESHOLDS: {
    readonly RESPONSE_TIME: {
        readonly GOOD: 100;
        readonly POOR: 1000;
    };
    readonly FPS: {
        readonly GOOD: 60;
        readonly POOR: 30;
    };
    readonly MEMORY: {
        readonly WARNING: 50;
        readonly CRITICAL: 100;
    };
};
/**
 * 安全配置常量
 * 🔒 定义安全系统的标准配置
 */
export declare const SECURITY_CONFIG: {
    readonly XSS: {
        readonly ALLOWED_TAGS: readonly ["b", "i", "em", "strong", "a", "span", "div", "p"];
        readonly ALLOWED_ATTRIBUTES: {
            readonly a: readonly ["href", "title", "target"];
            readonly img: readonly ["src", "alt", "title"];
        };
    };
    readonly CSP: {
        readonly DIRECTIVES: {
            readonly 'default-src': readonly ["self"];
            readonly 'script-src': readonly ["self", "unsafe-inline"];
            readonly 'style-src': readonly ["self", "unsafe-inline"];
            readonly 'img-src': readonly ["self", "data:", "https:"];
        };
    };
};
/**
 * 存储键常量
 * 🔑 定义本地存储使用的标准键名
 */
export declare const STORAGE_KEYS: {
    readonly ENGINE_CONFIG: "engine-config";
    readonly ENGINE_LOGS: "engine-logs";
    readonly ENGINE_CACHE: "engine-cache";
    readonly ENGINE_STATE: "engine-state";
    readonly ENGINE_NOTIFICATIONS: "engine-notifications";
};
/**
 * 错误代码常量
 * 🚨 定义系统错误的标准代码
 */
export declare const ERROR_CODES: {
    readonly CONFIG_INVALID: "CONFIG_INVALID";
    readonly CONFIG_MISSING: "CONFIG_MISSING";
    readonly CONFIG_VALIDATION_FAILED: "CONFIG_VALIDATION_FAILED";
    readonly PLUGIN_INSTALL_FAILED: "PLUGIN_INSTALL_FAILED";
    readonly PLUGIN_DEPENDENCY_MISSING: "PLUGIN_DEPENDENCY_MISSING";
    readonly PLUGIN_CONFLICT: "PLUGIN_CONFLICT";
    readonly MIDDLEWARE_EXECUTION_FAILED: "MIDDLEWARE_EXECUTION_FAILED";
    readonly MIDDLEWARE_NOT_FOUND: "MIDDLEWARE_NOT_FOUND";
    readonly STATE_INVALID: "STATE_INVALID";
    readonly STATE_ACCESS_DENIED: "STATE_ACCESS_DENIED";
    readonly CACHE_FULL: "CACHE_FULL";
    readonly CACHE_INVALID_KEY: "CACHE_INVALID_KEY";
    readonly SECURITY_VIOLATION: "SECURITY_VIOLATION";
    readonly SECURITY_BLOCKED: "SECURITY_BLOCKED";
    readonly PERFORMANCE_THRESHOLD_EXCEEDED: "PERFORMANCE_THRESHOLD_EXCEEDED";
    readonly PERFORMANCE_MONITORING_FAILED: "PERFORMANCE_MONITORING_FAILED";
};
/**
 * 版本常量
 * 📦 定义引擎版本相关信息
 */
export declare const VERSION: {
    readonly CURRENT: "0.1.0";
    readonly MIN_SUPPORTED: "0.1.0";
    readonly API_VERSION: "1.0.0";
};
/**
 * 时间常量
 * ⏰ 定义系统中使用的标准时间值
 */
export declare const TIME: {
    readonly SECOND: 1000;
    readonly MINUTE: number;
    readonly HOUR: number;
    readonly DAY: number;
    readonly DEFAULT_AUTO_SAVE_INTERVAL: 30000;
    readonly DEFAULT_CACHE_CLEANUP_INTERVAL: 60000;
    readonly DEFAULT_PERFORMANCE_CHECK_INTERVAL: 5000;
    readonly DEFAULT_HEALTH_CHECK_INTERVAL: 30000;
};
/**
 * 大小限制常量
 * 📏 定义系统中各种大小限制
 */
export declare const LIMITS: {
    readonly MAX_CACHE_SIZE: 1000;
    readonly MAX_CACHE_ENTRY_SIZE: number;
    readonly MAX_LOG_ENTRIES: 10000;
    readonly MAX_LOG_ENTRY_SIZE: 1024;
    readonly MAX_NOTIFICATIONS: 100;
    readonly MAX_NOTIFICATION_DURATION: 10000;
    readonly MAX_PLUGINS: 100;
    readonly MAX_PLUGIN_DEPENDENCIES: 50;
    readonly MAX_MIDDLEWARE: 100;
    readonly MAX_MIDDLEWARE_PRIORITY: 1000;
    readonly MAX_STATE_KEYS: 10000;
    readonly MAX_STATE_VALUE_SIZE: number;
};
