/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class UnifiedLogger {
  constructor(config = {}) {
    this.logs = [];
    this.buffer = [];
    this.transports = /* @__PURE__ */ new Map();
    this.plugins = [];
    this.remoteQueue = [];
    this.MAX_LOGS_ABSOLUTE = 1e3;
    this.MAX_BUFFER = 200;
    this.MAX_REMOTE_QUEUE = 500;
    this.config = this.normalizeConfig(config);
    this.stats = this.initStats();
    this.initTransports();
    if (config.plugins) {
      this.plugins = config.plugins.slice(0, 10);
    }
    if (this.config?.async && this.config?.flushInterval > 0) {
      this.startFlushTimer();
    }
    if (this.config?.remote && this.config?.remoteInterval > 0) {
      this.startRemoteTimer();
    }
  }
  /**
   * 标准化配置 - 优化版：更严格的默认值
   */
  normalizeConfig(config) {
    return {
      level: config.level ?? "warn",
      enabled: config.enabled ?? true,
      maxLogs: Math.min(config.maxLogs ?? 100, this.MAX_LOGS_ABSOLUTE),
      // 限制最大日志数
      console: config.console ?? true,
      remote: config.remote ?? false,
      file: config.file ?? false,
      remoteUrl: config.remoteUrl ?? "",
      remoteHeaders: config.remoteHeaders ?? {},
      remoteBatchSize: Math.min(config.remoteBatchSize ?? 50, 100),
      // 限制批次大小
      remoteInterval: Math.max(config.remoteInterval ?? 1e4, 5e3),
      // 最小5秒间隔
      format: config.format ?? "text",
      timestamp: config.timestamp ?? false,
      context: config.context ?? false,
      async: config.async ?? false,
      bufferSize: Math.min(config.bufferSize ?? 50, this.MAX_BUFFER),
      // 限制缓冲区大小
      flushInterval: Math.max(config.flushInterval ?? 2e3, 1e3),
      // 最小1秒刷新
      filters: config.filters?.slice(0, 5) ?? [],
      // 最多5个过滤器
      plugins: config.plugins?.slice(0, 10) ?? [],
      // 最多10个插件
      showTimestamp: config.showTimestamp ?? false,
      showContext: config.showContext ?? false,
      prefix: config.prefix ?? ""
    };
  }
  /**
   * 初始化统计信息
   */
  initStats() {
    return {
      total: 0,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0
      },
      errors: 0,
      dropped: 0,
      buffered: 0
    };
  }
  /**
   * 初始化传输器
   */
  initTransports() {
    if (this.config?.console) {
      this.transports.set("console", new ConsoleTransport(this.config));
    }
    if (this.config?.remote && this.config?.remoteUrl) {
      this.transports.set("remote", new RemoteTransport(this.config));
    }
    if (this.config?.file && typeof window !== "undefined") {
      this.transports.set("file", new IndexedDBTransport(this.config));
    }
  }
  // ============================================
  // 核心日志方法
  // ============================================
  debug(message, ...args) {
    this.log("debug", message, ...args);
  }
  info(message, ...args) {
    this.log("info", message, ...args);
  }
  warn(message, ...args) {
    this.log("warn", message, ...args);
  }
  error(message, error, ...args) {
    this.log("error", message, error, ...args);
  }
  /**
   * 核心日志方法
   */
  log(level, message, ...args) {
    if (!this.config?.enabled)
      return;
    if (!this.shouldLog(level))
      return;
    let entry = {
      timestamp: Date.now(),
      level,
      message,
      data: args.length > 0 ? args : void 0
    };
    for (const plugin of this.plugins) {
      const result = plugin.process(entry);
      if (!result)
        return;
      entry = result;
    }
    for (const filter of this.config?.filters) {
      if (!filter(entry)) {
        this.stats.dropped++;
        return;
      }
    }
    this.updateStats(level);
    if (this.config?.async) {
      if (this.buffer.length >= this.MAX_BUFFER) {
        this.flush();
      }
      this.buffer.push(entry);
      this.stats.buffered++;
      if (this.buffer.length >= this.config?.bufferSize) {
        this.flush();
      }
    } else {
      this.writeEntry(entry);
    }
    this.addToHistory(entry);
  }
  /**
   * 写入日志条目
   */
  writeEntry(entry) {
    for (const transport of this.transports.values()) {
      try {
        transport.write(entry);
      } catch (error) {
        this.stats.errors++;
        if (this.config?.console) {
          console.error("Logger transport error:", error);
        }
      }
    }
  }
  /**
   * 添加到历史记录 - 优化版：使用环形缓冲区避免数组扩容
   */
  addToHistory(entry) {
    const effectiveMax = Math.min(this.config?.maxLogs, this.MAX_LOGS_ABSOLUTE);
    if (this.logs.length >= effectiveMax) {
      this.logs.shift();
    }
    this.logs.push(entry);
  }
  /**
   * 检查是否应该记录
   */
  shouldLog(level) {
    const levels = ["debug", "info", "warn", "error"];
    const configIndex = levels.indexOf(this.config?.level);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= configIndex;
  }
  /**
   * 更新统计信息
   */
  updateStats(level) {
    this.stats.total++;
    this.stats.byLevel[level]++;
  }
  // ============================================
  // 批处理和刷新
  // ============================================
  /**
   * 刷新缓冲区
   */
  flush() {
    if (this.buffer.length === 0)
      return;
    const entries = this.buffer.splice(0, this.buffer.length);
    this.stats.buffered = 0;
    for (const entry of entries) {
      this.writeEntry(entry);
    }
    for (const transport of this.transports.values()) {
      if (transport.flush) {
        transport.flush();
      }
    }
    for (const plugin of this.plugins) {
      if (plugin.flush) {
        plugin.flush();
      }
    }
  }
  /**
   * 启动定期刷新
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config?.flushInterval);
  }
  /**
   * 启动远程日志定时器
   */
  startRemoteTimer() {
    this.remoteTimer = setInterval(() => {
      this.flushRemote();
    }, this.config?.remoteInterval);
  }
  /**
   * 刷新远程日志 - 优化版：限制队列大小避免无限增长
   */
  async flushRemote() {
    if (this.remoteQueue.length === 0)
      return;
    if (this.remoteQueue.length > this.MAX_REMOTE_QUEUE) {
      const excess = this.remoteQueue.length - this.MAX_REMOTE_QUEUE;
      this.remoteQueue.splice(0, excess);
      this.stats.dropped += excess;
    }
    const batch = this.remoteQueue.splice(0, this.config?.remoteBatchSize);
    try {
      await fetch(this.config?.remoteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config?.remoteHeaders
        },
        body: JSON.stringify(batch)
      });
    } catch {
      this.stats.errors++;
      const toRestore = batch.slice(0, Math.min(batch.length, 50));
      this.remoteQueue.unshift(...toRestore);
      if (batch.length > toRestore.length) {
        this.stats.dropped += batch.length - toRestore.length;
      }
    }
  }
  // ============================================
  // 高级功能
  // ============================================
  /**
   * 创建子日志器
   */
  child(context) {
    const childConfig = { ...this.config };
    const childLogger = new UnifiedLogger(childConfig);
    childLogger.use({
      name: "context",
      process(entry) {
        return {
          ...entry,
          context: { ...context, ...entry.context }
        };
      }
    });
    return childLogger;
  }
  /**
   * 使用插件
   */
  use(plugin) {
    this.plugins.push(plugin);
  }
  /**
   * 添加传输器
   */
  addTransport(name, transport) {
    this.transports.set(name, transport);
  }
  /**
   * 移除传输器
   */
  removeTransport(name) {
    this.transports.delete(name);
  }
  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (this.config) {
      this.config.level = level;
    }
  }
  /**
   * 获取日志级别
   */
  getLevel() {
    return this.config?.level;
  }
  /**
   * 获取日志历史
   */
  getLogs(filter) {
    if (!filter)
      return [...this.logs];
    return this.logs.filter((log) => {
      if (filter.level && log.level !== filter.level)
        return false;
      if (filter.message && !log.message.includes(filter.message))
        return false;
      return true;
    });
  }
  /**
   * 清空日志
   */
  clearLogs() {
    this.logs.length = 0;
    this.buffer.length = 0;
    this.remoteQueue.length = 0;
    for (const plugin of this.plugins) {
      if (typeof plugin.flush === "function") {
        plugin.flush();
      }
    }
  }
  /**
   * 清空日志（别名方法，与 Logger 接口兼容）
   */
  clear() {
    this.clearLogs();
    this.resetStats();
  }
  /**
   * 设置最大日志数
   */
  setMaxLogs(max) {
    if (this.config) {
      this.config.maxLogs = max;
    }
    while (this.logs.length > max) {
      this.logs.shift();
    }
  }
  /**
   * 获取最大日志数
   */
  getMaxLogs() {
    return this.config?.maxLogs;
  }
  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = this.initStats();
  }
  /**
   * 销毁日志器
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = void 0;
    }
    if (this.remoteTimer) {
      clearInterval(this.remoteTimer);
      this.remoteTimer = void 0;
    }
    this.flush();
    this.clearLogs();
    for (const transport of this.transports.values()) {
      if (typeof transport.destroy === "function") {
        transport.destroy();
      }
    }
    this.transports.clear();
    for (const plugin of this.plugins) {
      if (typeof plugin.flush === "function") {
        plugin.flush();
      }
    }
    this.plugins.length = 0;
  }
}
class ConsoleTransport {
  constructor(config) {
    this.config = config;
    this.name = "console";
  }
  write(entry) {
    const { level, message, data } = entry;
    const timestamp = this.config?.timestamp ? new Date(entry.timestamp).toISOString() : "";
    const prefix = this.config?.format === "pretty" ? this.getPrettyPrefix(level, timestamp) : timestamp;
    const dataArray = Array.isArray(data) ? data : [];
    const args = [prefix, message, ...dataArray];
    switch (level) {
      case "debug":
        break;
      case "info":
        console.info(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
  }
  getPrettyPrefix(level, timestamp) {
    const colors = {
      debug: "\x1B[36m",
      // Cyan
      info: "\x1B[32m",
      // Green
      warn: "\x1B[33m",
      // Yellow
      error: "\x1B[31m"
      // Red
    };
    const reset = "\x1B[0m";
    const color = colors[level];
    return `${color}[${level.toUpperCase()}]${reset} ${timestamp}`;
  }
}
class RemoteTransport {
  constructor(config) {
    this.config = config;
    this.name = "remote";
    this.queue = [];
    this.maxQueueSize = 1e4;
  }
  write(entry) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }
    this.queue.push(entry);
    if (this.queue.length >= this.config?.remoteBatchSize) {
      this.flush();
    }
  }
  async flush() {
    if (this.queue.length === 0)
      return;
    const batch = this.queue.splice(0, this.queue.length);
    try {
      await fetch(this.config?.remoteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config?.remoteHeaders
        },
        body: JSON.stringify(batch)
      });
    } catch (error) {
      const restoreCount = Math.min(batch.length, this.maxQueueSize - this.queue.length);
      this.queue.unshift(...batch.slice(0, restoreCount));
      throw error;
    }
  }
  // 添加销毁方法
  destroy() {
    this.queue.length = 0;
  }
}
class IndexedDBTransport {
  constructor(config) {
    this.config = config;
    this.name = "indexeddb";
    this.dbName = "LoggerDB";
    this.storeName = "logs";
    this.initDB();
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 6e4);
  }
  async initDB() {
    const request = indexedDB.open(this.dbName, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, {
          keyPath: "id",
          autoIncrement: true
        });
        store.createIndex("timestamp", "timestamp");
        store.createIndex("level", "level");
      }
    };
    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async write(entry) {
    if (!this.db)
      await this.initDB();
    if (!this.db)
      return;
    const transaction = this.db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    store.add(entry);
    await this.cleanup();
  }
  async cleanup() {
    if (!this.db)
      return;
    const transaction = this.db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    const count = await this.getCount(store);
    if (count > this.config?.maxLogs) {
      const deleteCount = count - this.config?.maxLogs;
      const request = store.openCursor();
      let deleted = 0;
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && deleted < deleteCount) {
          cursor.delete();
          deleted++;
          cursor.continue();
        }
      };
    }
  }
  getCount(store) {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  // 添加销毁方法
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    if (this.db) {
      this.db.close();
      this.db = void 0;
    }
  }
}
class PerformancePlugin {
  constructor() {
    this.name = "performance";
    this.timings = /* @__PURE__ */ new Map();
    this.maxTimings = 1e3;
  }
  process(entry) {
    const start = performance.now();
    const id = `${entry.timestamp}-${entry.level}`;
    if (this.timings.size >= this.maxTimings) {
      const firstKey = this.timings.keys().next().value;
      if (firstKey !== void 0) {
        this.timings.delete(firstKey);
      }
    }
    this.timings.set(id, start);
    return {
      ...entry,
      metadata: {
        ...entry.metadata,
        logTime: performance.now() - start
      }
    };
  }
  flush() {
    this.timings.clear();
  }
}
class ErrorTrackingPlugin {
  constructor() {
    this.name = "error-tracking";
  }
  process(entry) {
    if (entry.level !== "error")
      return entry;
    const dataArray = Array.isArray(entry.data) ? entry.data : [entry.data];
    const error = dataArray[0];
    if (error instanceof Error) {
      return {
        ...entry,
        metadata: {
          ...entry.metadata,
          errorStack: error.stack,
          errorName: error.name,
          errorMessage: error.message
        }
      };
    }
    return entry;
  }
}
class SamplingPlugin {
  constructor(sampleRate = 1) {
    this.sampleRate = sampleRate;
    this.name = "sampling";
  }
  process(entry) {
    if (Math.random() <= this.sampleRate) {
      return entry;
    }
    return null;
  }
}
function createUnifiedLogger(config) {
  return new UnifiedLogger(config);
}
function createLogger(levelOrConfig) {
  if (typeof levelOrConfig === "string") {
    return new UnifiedLogger({ level: levelOrConfig });
  }
  return new UnifiedLogger(levelOrConfig);
}
const loggerInstances = /* @__PURE__ */ new Map();
function getLogger(name = "default", config) {
  if (loggerInstances.has(name) && !config) {
    const existing = loggerInstances.get(name);
    if (existing)
      return existing;
  }
  const logger = new UnifiedLogger({
    ...config,
    // 添加默认前缀
    format: config?.format ?? "pretty"
  });
  loggerInstances.set(name, logger);
  return logger;
}

export { ErrorTrackingPlugin, UnifiedLogger as Logger, PerformancePlugin, SamplingPlugin, UnifiedLogger, createLogger, createUnifiedLogger, getLogger };
//# sourceMappingURL=logger.js.map
