/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { getNestedValue, setNestedValue, isObject } from '../utils/index.js';

class ConfigManagerImpl {
  constructor(initialConfig = {}, logger) {
    this.config = {};
    this.watchers = /* @__PURE__ */ new Map();
    this.snapshots = [];
    this.environment = "development";
    this.maxSnapshots = 5;
    this.loaders = [];
    this.loadWatchers = [];
    this.MAX_WATCHERS_PER_PATH = 50;
    this.MAX_LOADERS = 20;
    this.config = { ...initialConfig };
    this.logger = logger;
    this.environment = this.detectEnvironment();
    this.createSnapshot();
    this.logger?.info("ConfigManager initialized", {
      environment: this.environment,
      keys: Object.keys(this.config).length
    });
  }
  /**
   * 添加配置加载器 - 优化版：限制加载器数量
   *
   * @param loader 配置加载器实例
   * @returns this 支持链式调用
   */
  addLoader(loader) {
    if (this.loaders.length >= this.MAX_LOADERS) {
      this.logger?.warn(`Maximum config loaders limit (${this.MAX_LOADERS}) reached, removing oldest`);
      this.loaders.shift();
    }
    this.loaders.push(loader);
    return this;
  }
  /**
   * 从所有加载器加载配置
   *
   * 按顺序加载所有配置源，后面的配置会覆盖前面的
   */
  async loadFromLoaders() {
    for (const loader of this.loaders) {
      try {
        const loadedConfig = await loader.load();
        this.merge(loadedConfig);
        if (loader.watch) {
          const unwatcher = loader.watch((newConfig) => {
            this.merge(newConfig);
            this.logger?.info("Configuration hot-reloaded");
          });
          if (unwatcher) {
            this.loadWatchers.push(unwatcher);
          }
        }
      } catch (error) {
        this.logger?.error("Failed to load config from loader", error);
      }
    }
  }
  /**
   * 销毁配置管理器 - 增强版
   *
   * 清理所有监听器和定时器
   */
  destroy() {
    this.loadWatchers.forEach((unwatch) => unwatch());
    this.loadWatchers.length = 0;
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = void 0;
    }
    this.watchers.clear();
    this.snapshots.length = 0;
    this.loaders.length = 0;
    this.config = {};
    this.schema = void 0;
    this.logger?.info("ConfigManager destroyed");
    this.logger = void 0;
  }
  // 基础操作
  get(path, defaultValue) {
    const value = getNestedValue(this.config, path);
    return value !== void 0 ? value : defaultValue;
  }
  set(path, value) {
    const oldValue = this.get(path);
    if (this.schema) {
      const validation = this.validatePath(path, value);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed for "${path}": ${validation.errors.join(", ")}`);
      }
    }
    setNestedValue(this.config, path, value);
    this.triggerWatchers(path, value, oldValue);
    this.logger?.debug("Configuration updated", { path, value, oldValue });
  }
  has(path) {
    return getNestedValue(this.config, path) !== void 0;
  }
  remove(path) {
    const oldValue = this.get(path);
    this.deleteNestedValue(this.config, path);
    this.triggerWatchers(path, void 0, oldValue);
    this.logger?.debug("Configuration removed", { path, oldValue });
  }
  clear() {
    const oldConfig = { ...this.config };
    this.config = {};
    for (const path of Object.keys(oldConfig)) {
      this.triggerWatchers(path, void 0, oldConfig[path]);
    }
    this.logger?.info("Configuration cleared");
  }
  // 配置合并
  merge(newConfig) {
    const oldConfig = { ...this.config };
    this.deepMerge(this.config, newConfig);
    this.triggerMergeWatchers(oldConfig, this.config);
    this.logger?.info("Configuration merged", {
      newKeys: Object.keys(newConfig).length
    });
  }
  reset(path) {
    if (path) {
      if (this.schema) {
        const defaultValue = this.getDefaultValue(path);
        if (defaultValue !== void 0) {
          this.set(path, defaultValue);
        } else {
          this.remove(path);
        }
      } else {
        this.remove(path);
      }
    } else {
      this.clear();
      if (this.schema) {
        this.config = this.getDefaultConfig();
      }
    }
    this.logger?.info("Configuration reset", { path });
  }
  // 环境管理
  setEnvironment(env) {
    const oldEnv = this.environment;
    this.environment = env;
    this.logger?.info("Environment changed", { from: oldEnv, to: env });
  }
  getEnvironment() {
    return this.environment;
  }
  // 配置验证
  validate(schema) {
    const targetSchema = schema || this.schema;
    if (!targetSchema) {
      return { valid: true, errors: [], warnings: [] };
    }
    return this.validateConfig(this.config, targetSchema);
  }
  setSchema(schema) {
    this.schema = schema;
    const validation = this.validate();
    if (!validation.valid) {
      this.logger?.warn("Current configuration is invalid after schema update", {
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    this.logger?.info("Configuration schema updated");
  }
  getSchema() {
    return this.schema;
  }
  // 配置监听
  watch(path, callback) {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    const watchers = this.watchers.get(path);
    watchers?.push(callback);
    return () => {
      this.unwatch(path, callback);
    };
  }
  unwatch(path, callback) {
    const callbacks = this.watchers.get(path);
    if (!callbacks)
      return;
    if (callback) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.watchers.delete(path);
      }
    } else {
      this.watchers.delete(path);
    }
  }
  // 事件监听（兼容方法）
  on(event, callback) {
    return this.watch(event, callback);
  }
  // 持久化
  async save() {
    try {
      const data = JSON.stringify({
        config: this.config,
        environment: this.environment,
        timestamp: Date.now()
      });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("engine-config", data);
      }
      this.logger?.debug("Configuration saved to storage");
    } catch (error) {
      this.logger?.error("Failed to save configuration", error);
      throw error;
    }
  }
  async load() {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }
      const data = localStorage.getItem("engine-config");
      if (!data) {
        return;
      }
      const parsed = JSON.parse(data);
      this.config = parsed.config || {};
      this.environment = parsed.environment || this.environment;
      this.logger?.debug("Configuration loaded from storage");
    } catch (error) {
      this.logger?.error("Failed to load configuration", error);
      throw error;
    }
  }
  enableAutoSave(interval = 3e4) {
    this.disableAutoSave();
    this.autoSaveInterval = window.setInterval(() => {
      this.save().catch((error) => {
        this.logger?.error("Auto-save failed", error);
      });
    }, interval);
    this.logger?.info("Auto-save enabled", { interval });
  }
  disableAutoSave() {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = void 0;
      this.logger?.info("Auto-save disabled");
    }
  }
  // 配置快照
  createSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(this.config)),
      environment: this.environment,
      version: "1.0.0"
      // 可以从package.json获取
    };
    this.snapshots.unshift(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(0, this.maxSnapshots);
    }
    this.logger?.debug("Configuration snapshot created");
    return snapshot;
  }
  restoreSnapshot(snapshot) {
    const oldConfig = { ...this.config };
    this.config = JSON.parse(JSON.stringify(snapshot.config));
    this.environment = snapshot.environment;
    this.triggerMergeWatchers(oldConfig, this.config);
    this.logger?.info("Configuration restored from snapshot", {
      timestamp: snapshot.timestamp
    });
  }
  getSnapshots() {
    return [...this.snapshots];
  }
  // 配置统计
  getStats() {
    const totalWatchers = Array.from(this.watchers.values()).reduce((sum, array) => sum + array.length, 0);
    const memoryUsage = JSON.stringify(this.config).length;
    const lastSnapshot = this.snapshots[0];
    return {
      totalKeys: this.getAllKeys().length,
      watchers: totalWatchers,
      snapshots: this.snapshots.length,
      lastModified: lastSnapshot?.timestamp || 0,
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`
    };
  }
  // 配置导入导出
  export(format = "json") {
    const data = {
      config: this.config,
      environment: this.environment,
      timestamp: Date.now()
    };
    if (format === "json") {
      return JSON.stringify(data, null, 2);
    } else {
      return this.toYAML(data);
    }
  }
  import(data, format = "json") {
    try {
      let parsed;
      if (format === "json") {
        parsed = JSON.parse(data);
      } else {
        parsed = this.fromYAML(data);
      }
      if (parsed.config) {
        this.merge(parsed.config);
      }
      if (parsed.environment && typeof parsed.environment === "string") {
        this.setEnvironment(parsed.environment);
      }
      this.logger?.info("Configuration imported", { format });
    } catch (error) {
      this.logger?.error("Failed to import configuration", error);
      throw error;
    }
  }
  // 命名空间
  namespace(name) {
    return new NamespacedConfigManager(this, name);
  }
  // 私有方法
  detectEnvironment() {
    if (typeof globalThis !== "undefined" && globalThis.__vitest__ !== void 0) {
      return "test";
    }
    if (typeof window !== "undefined") {
      if (window.__ENV__ === "production") {
        return "production";
      }
    }
    return "development";
  }
  triggerWatchers(path, newValue, oldValue) {
    const callbacks = this.watchers.get(path);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          this.logger?.error("Error in config watcher callback", {
            path,
            error
          });
        }
      });
    }
    const pathParts = path.split(".");
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join(".");
      const parentCallbacks = this.watchers.get(parentPath);
      if (parentCallbacks) {
        const parentNewValue = this.get(parentPath);
        const parentOldValue = this.get(parentPath);
        parentCallbacks.forEach((callback) => {
          try {
            callback(parentNewValue, parentOldValue, parentPath);
          } catch (error) {
            this.logger?.error("Error in parent config watcher callback", {
              path: parentPath,
              error
            });
          }
        });
      }
    }
  }
  triggerMergeWatchers(oldConfig, newConfig) {
    const allKeys = /* @__PURE__ */ new Set([
      ...this.getAllKeysFromObject(oldConfig),
      ...this.getAllKeysFromObject(newConfig)
    ]);
    for (const key of allKeys) {
      const oldValue = getNestedValue(oldConfig, key);
      const newValue = getNestedValue(newConfig, key);
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        this.triggerWatchers(key, newValue, oldValue);
      }
    }
  }
  deleteNestedValue(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || !isObject(current[key])) {
        return;
      }
      current = current[key];
    }
    delete current[keys[keys.length - 1]];
  }
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && isObject(source[key])) {
        if (!target[key] || !isObject(target[key])) {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  validateConfig(config, schema, basePath = "") {
    const errors = [];
    const warnings = [];
    for (const [key, schemaItem] of Object.entries(schema)) {
      const fullPath = basePath ? `${basePath}.${key}` : key;
      const value = getNestedValue(config, fullPath);
      if (schemaItem.required && value === void 0) {
        errors.push(`Required field "${fullPath}" is missing`);
        continue;
      }
      if (value === void 0) {
        continue;
      }
      if (!this.validateType(value, schemaItem.type)) {
        errors.push(`Field "${fullPath}" has invalid type. Expected ${schemaItem.type}, got ${typeof value}`);
        continue;
      }
      if (schemaItem.validator && !schemaItem.validator(value)) {
        errors.push(`Field "${fullPath}" failed custom validation`);
        continue;
      }
      if (schemaItem.type === "object" && schemaItem.children && isObject(value)) {
        const childResult = this.validateConfig(config, schemaItem.children, fullPath);
        errors.push(...childResult.errors);
        warnings.push(...childResult.warnings);
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }
  validatePath(path, value) {
    if (!this.schema) {
      return { valid: true, errors: [], warnings: [] };
    }
    const pathParts = path.split(".");
    let currentSchema = this.schema;
    for (const part of pathParts) {
      if (!currentSchema[part]) {
        return { valid: true, errors: [], warnings: [] };
      }
      const schemaItem = currentSchema[part];
      if (part === pathParts[pathParts.length - 1]) {
        if (!this.validateType(value, schemaItem.type)) {
          return {
            valid: false,
            errors: [
              `Invalid type. Expected ${schemaItem.type}, got ${typeof value}`
            ],
            warnings: []
          };
        }
        if (schemaItem.validator && !schemaItem.validator(value)) {
          return {
            valid: false,
            errors: ["Failed custom validation"],
            warnings: []
          };
        }
        return { valid: true, errors: [], warnings: [] };
      }
      if (schemaItem.children) {
        currentSchema = schemaItem.children;
      } else {
        return { valid: true, errors: [], warnings: [] };
      }
    }
    return { valid: true, errors: [], warnings: [] };
  }
  validateType(value, expectedType) {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !Number.isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return isObject(value);
      case "array":
        return Array.isArray(value);
      default:
        return true;
    }
  }
  getDefaultValue(path) {
    if (!this.schema)
      return void 0;
    const pathParts = path.split(".");
    let currentSchema = this.schema;
    for (const part of pathParts) {
      if (!currentSchema[part]) {
        return void 0;
      }
      const schemaItem = currentSchema[part];
      if (part === pathParts[pathParts.length - 1]) {
        return schemaItem.default;
      }
      if (schemaItem.children) {
        currentSchema = schemaItem.children;
      } else {
        return void 0;
      }
    }
    return void 0;
  }
  getDefaultConfig() {
    if (!this.schema)
      return {};
    const config = {};
    this.buildDefaultConfig(config, this.schema);
    return config;
  }
  buildDefaultConfig(config, schema, basePath = "") {
    for (const [key, schemaItem] of Object.entries(schema)) {
      const fullPath = basePath ? `${basePath}.${key}` : key;
      if (schemaItem.default !== void 0) {
        setNestedValue(config, fullPath, schemaItem.default);
      }
      if (schemaItem.children) {
        this.buildDefaultConfig(config, schemaItem.children, fullPath);
      }
    }
  }
  getAllKeys() {
    return this.getAllKeysFromObject(this.config);
  }
  getAllKeysFromObject(obj, prefix = "") {
    const keys = [];
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
      if (isObject(obj[key])) {
        keys.push(...this.getAllKeysFromObject(obj[key], fullKey));
      }
    }
    return keys;
  }
  toYAML(obj, indent = 0) {
    const spaces = "  ".repeat(indent);
    let result = "";
    for (const [key, value] of Object.entries(obj)) {
      if (isObject(value)) {
        result += `${spaces}${key}:
${this.toYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:
`;
        value.forEach((item) => {
          result += `${spaces}  - ${item}
`;
        });
      } else {
        result += `${spaces}${key}: ${value}
`;
      }
    }
    return result;
  }
  fromYAML(yamlString) {
    const lines = yamlString.split("\n").filter((line) => line.trim());
    const result = {};
    lines.forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1)
        return;
      const beforeColon = line.slice(0, colonIndex);
      const afterColon = line.slice(colonIndex + 1);
      const key = beforeColon.trim();
      const value = afterColon.trim();
      if (key && value !== void 0) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    });
    return result;
  }
}
class NamespacedConfigManager {
  constructor(parent, namespaceName) {
    this.parent = parent;
    this.namespaceName = namespaceName;
  }
  getKey(key) {
    return `${this.namespaceName}.${key}`;
  }
  // 基础操作
  get(key, defaultValue) {
    return this.parent.get(this.getKey(key), defaultValue);
  }
  set(key, value) {
    this.parent.set(this.getKey(key), value);
  }
  has(key) {
    return this.parent.has(this.getKey(key));
  }
  remove(key) {
    this.parent.remove(this.getKey(key));
  }
  clear() {
    this.parent.remove(this.namespaceName);
  }
  // 配置合并
  merge(config) {
    const namespacedConfig = {};
    for (const [key, value] of Object.entries(config)) {
      namespacedConfig[this.getKey(key)] = value;
    }
    this.parent.merge(namespacedConfig);
  }
  reset(path) {
    if (path) {
      this.parent.reset(this.getKey(path));
    } else {
      this.clear();
    }
  }
  // 环境管理
  setEnvironment(env) {
    this.parent.setEnvironment(env);
  }
  getEnvironment() {
    return this.parent.getEnvironment();
  }
  // 配置验证
  validate(schema) {
    return this.parent.validate(schema);
  }
  setSchema(schema) {
    this.parent.setSchema(schema);
  }
  getSchema() {
    return this.parent.getSchema();
  }
  // 配置监听
  watch(key, callback) {
    return this.parent.watch(this.getKey(key), callback);
  }
  unwatch(key, callback) {
    this.parent.unwatch(this.getKey(key), callback);
  }
  // 事件监听（兼容方法）
  on(event, callback) {
    return this.parent.on(this.getKey(event), callback);
  }
  // 持久化
  async save() {
    return this.parent.save();
  }
  async load() {
    return this.parent.load();
  }
  enableAutoSave(interval) {
    this.parent.enableAutoSave(interval);
  }
  disableAutoSave() {
    this.parent.disableAutoSave();
  }
  // 配置快照
  createSnapshot() {
    return this.parent.createSnapshot();
  }
  restoreSnapshot(snapshot) {
    this.parent.restoreSnapshot(snapshot);
  }
  getSnapshots() {
    return this.parent.getSnapshots();
  }
  // 配置统计
  getStats() {
    return this.parent.getStats();
  }
  // 配置导入导出
  export(format) {
    return this.parent.export(format);
  }
  import(data, format) {
    this.parent.import(data, format);
  }
  // 命名空间
  namespace(name) {
    return this.parent.namespace(`${this.namespaceName}.${name}`);
  }
}
function createConfigManager(initialConfig, logger) {
  return new ConfigManagerImpl(initialConfig, logger);
}
const defaultConfigSchema = {
  app: {
    type: "object",
    required: true,
    default: {
      name: "Vue Engine App",
      version: "1.0.0"
    },
    children: {
      name: {
        type: "string",
        required: true,
        default: "Vue Engine App",
        description: "\u5E94\u7528\u540D\u79F0"
      },
      version: {
        type: "string",
        required: true,
        default: "1.0.0",
        description: "\u5E94\u7528\u7248\u672C"
      },
      description: {
        type: "string",
        description: "\u5E94\u7528\u63CF\u8FF0"
      },
      author: {
        type: "string",
        description: "\u5E94\u7528\u4F5C\u8005"
      },
      homepage: {
        type: "string",
        description: "\u5E94\u7528\u4E3B\u9875"
      }
    }
  },
  environment: {
    type: "string",
    required: true,
    default: "development",
    validator: (value) => typeof value === "string" && ["development", "production", "test"].includes(value),
    description: "\u8FD0\u884C\u73AF\u5883"
  },
  debug: {
    type: "boolean",
    required: true,
    default: true,
    description: "\u662F\u5426\u542F\u7528\u8C03\u8BD5\u6A21\u5F0F"
  },
  features: {
    type: "object",
    required: true,
    default: {
      enableHotReload: true,
      enableDevTools: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableSecurityProtection: true,
      enableCaching: true,
      enableNotifications: true
    },
    children: {
      enableHotReload: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u70ED\u91CD\u8F7D"
      },
      enableDevTools: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u5F00\u53D1\u5DE5\u5177"
      },
      enablePerformanceMonitoring: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u6027\u80FD\u76D1\u63A7"
      },
      enableErrorReporting: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u9519\u8BEF\u62A5\u544A"
      },
      enableSecurityProtection: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u5B89\u5168\u9632\u62A4"
      },
      enableCaching: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u7F13\u5B58"
      },
      enableNotifications: {
        type: "boolean",
        default: true,
        description: "\u662F\u5426\u542F\u7528\u901A\u77E5"
      }
    }
  }
};

export { ConfigManagerImpl, NamespacedConfigManager, createConfigManager, defaultConfigSchema };
//# sourceMappingURL=config-manager.js.map
