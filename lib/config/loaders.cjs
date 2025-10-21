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

var logger = require('../logger/logger.cjs');

class EnvironmentConfigLoader {
  constructor(prefix = "VUE_APP_") {
    this.prefix = prefix;
    this.logger = logger.getLogger("EnvironmentConfigLoader");
  }
  load() {
    const config = {};
    try {
      const processKey = "process";
      const processEnv = globalThis?.[processKey]?.env;
      if (processEnv) {
        Object.keys(processEnv).forEach((key) => {
          if (key.startsWith(this.prefix)) {
            const configKey = key.substring(this.prefix.length).toLowerCase();
            const value = processEnv[key];
            config[configKey] = this.parseValue(value);
          }
        });
      }
    } catch {
    }
    return config;
  }
  parseValue(value) {
    if (value === void 0)
      return void 0;
    if (value.toLowerCase() === "true")
      return true;
    if (value.toLowerCase() === "false")
      return false;
    const numValue = Number(value);
    if (!Number.isNaN(numValue) && Number.isFinite(numValue))
      return numValue;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
class JsonConfigLoader {
  constructor(configPath) {
    this.configPath = configPath;
    this.logger = logger.getLogger("JsonConfigLoader");
  }
  async load() {
    try {
      const response = await fetch(this.configPath);
      if (!response.ok) {
        throw new Error(`Failed to load config from ${this.configPath}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.warn(`Failed to load config from ${this.configPath}:`, error);
      return {};
    }
  }
  watch(callback) {
    const interval = setInterval(async () => {
      try {
        const newConfig = await this.load();
        callback(newConfig);
      } catch (error) {
        this.logger.error("Config watch error:", error);
      }
    }, 5e3);
    return () => clearInterval(interval);
  }
}
class MemoryConfigLoader {
  constructor(config) {
    this.config = config;
  }
  load() {
    return { ...this.config };
  }
  updateConfig(updates) {
    Object.assign(this.config, updates);
  }
}
class LocalStorageConfigLoader {
  constructor(key) {
    this.key = key;
    this.logger = logger.getLogger("LocalStorageConfigLoader");
  }
  load() {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      this.logger.warn(`Failed to load config from localStorage:`, error);
    }
    return {};
  }
  save(config) {
    try {
      localStorage.setItem(this.key, JSON.stringify(config));
    } catch (error) {
      this.logger.error(`Failed to save config to localStorage:`, error);
    }
  }
  watch(callback) {
    const handler = (event) => {
      if (event.key === this.key && event.newValue) {
        try {
          const newConfig = JSON.parse(event.newValue);
          callback(newConfig);
        } catch (error) {
          this.logger.error("Failed to parse storage event:", error);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}
class CompositeConfigLoader {
  constructor(loaders) {
    this.loaders = loaders;
    this.logger = logger.getLogger("CompositeConfigLoader");
  }
  async load() {
    let config = {};
    for (const loader of this.loaders) {
      try {
        const loadedConfig = await loader.load();
        config = { ...config, ...loadedConfig };
      } catch (error) {
        this.logger.error("Failed to load config from loader:", error);
      }
    }
    return config;
  }
  watch(callback) {
    const unwatchers = [];
    for (const loader of this.loaders) {
      if (loader.watch) {
        const unwatcher = loader.watch(callback);
        if (unwatcher) {
          unwatchers.push(unwatcher);
        }
      }
    }
    return () => {
      unwatchers.forEach((unwatch) => unwatch());
    };
  }
}

exports.CompositeConfigLoader = CompositeConfigLoader;
exports.EnvironmentConfigLoader = EnvironmentConfigLoader;
exports.JsonConfigLoader = JsonConfigLoader;
exports.LocalStorageConfigLoader = LocalStorageConfigLoader;
exports.MemoryConfigLoader = MemoryConfigLoader;
//# sourceMappingURL=loaders.cjs.map
