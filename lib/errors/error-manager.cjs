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

exports.ErrorCategory = void 0;
(function(ErrorCategory2) {
  ErrorCategory2["NETWORK"] = "network";
  ErrorCategory2["COMPONENT"] = "component";
  ErrorCategory2["PLUGIN"] = "plugin";
  ErrorCategory2["STATE"] = "state";
  ErrorCategory2["SECURITY"] = "security";
  ErrorCategory2["PERFORMANCE"] = "performance";
  ErrorCategory2["UNKNOWN"] = "unknown";
})(exports.ErrorCategory || (exports.ErrorCategory = {}));
class ErrorManagerImpl {
  constructor(engineOrLogger) {
    this.errorHandlers = /* @__PURE__ */ new Set();
    this.errors = [];
    this.errorReports = /* @__PURE__ */ new Map();
    this.maxErrors = 100;
    this.maxReports = 50;
    this.maxErrorCounts = 200;
    this.maxErrorTypes = 100;
    this.errorCounts = /* @__PURE__ */ new Map();
    this.recoveryStrategies = /* @__PURE__ */ new Map();
    this.filters = /* @__PURE__ */ new Set();
    this.lastErrorTime = 0;
    this.errorBurst = 0;
    this.errorQueue = [];
    this.isReporting = false;
    this.batchReportInterval = 5e3;
    this.cleanupTimer = null;
    this.globalErrorHandler = null;
    this.unhandledRejectionHandler = null;
    if (engineOrLogger && "logger" in engineOrLogger) {
      this.engine = engineOrLogger;
      this.logger = this.engine.logger;
    } else {
      this.logger = engineOrLogger;
    }
    this.statistics = this.initStatistics();
    this.setupDefaultRecoveryStrategies();
    this.setupGlobalHandlers();
    this.startCleanupTimer();
  }
  onError(handler) {
    this.errorHandlers.add(handler);
  }
  offError(handler) {
    this.errorHandlers.delete(handler);
  }
  captureError(error, component, info) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      component,
      info,
      timestamp: Date.now(),
      level: "error"
    };
    this.detectErrorBurst();
    const category = this.categorizeError(errorInfo);
    this.updateErrorStats(errorInfo, category);
    this.addError(errorInfo);
    this.attemptRecovery(errorInfo);
    this.notifyHandlers(errorInfo);
  }
  addError(errorInfo) {
    this.errors.unshift(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    const fingerprint = this.generateErrorFingerprint(errorInfo);
    if (!this.errorReports.has(fingerprint)) {
      const report = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        error: errorInfo,
        context: { timestamp: errorInfo.timestamp },
        handled: true,
        recovered: false,
        attempts: 0,
        timestamp: Date.now(),
        fingerprint
      };
      this.errorReports.set(fingerprint, report);
      if (this.errorReports.size > this.maxReports) {
        const firstKey = this.errorReports.keys().next().value;
        if (firstKey) {
          this.errorReports.delete(firstKey);
        }
      }
    }
  }
  notifyHandlers(errorInfo) {
    for (const handler of this.errorHandlers) {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        this.logger?.error("Error in error handler:", handlerError);
      }
    }
  }
  getErrors() {
    return [...this.errors];
  }
  hasErrors() {
    return this.errors.length > 0;
  }
  clearErrors() {
    this.errors = [];
    this.errorCounts.clear();
    this.errorReports.clear();
    this.errorBurst = 0;
    this.statistics = this.initStatistics();
  }
  // 处理错误（兼容方法）
  handle(error, context) {
    this.captureError(error, void 0, context);
  }
  // 设置最大错误数量
  setMaxErrors(max) {
    this.maxErrors = max;
    if (this.errors.length > max) {
      this.errors = this.errors.slice(0, max);
    }
  }
  // 获取最大错误数量
  getMaxErrors() {
    return this.maxErrors;
  }
  // 按级别获取错误
  getErrorsByLevel(level) {
    return this.errors.filter((error) => error.level === level);
  }
  // 按时间范围获取错误
  getErrorsByTimeRange(startTime, endTime) {
    return this.errors.filter((error) => error.timestamp >= startTime && error.timestamp <= endTime);
  }
  // 获取最近的错误
  getRecentErrors(count) {
    return this.errors.slice(0, count);
  }
  // 搜索错误
  searchErrors(query) {
    const lowerQuery = query.toLowerCase();
    return this.errors.filter((error) => error.message.toLowerCase().includes(lowerQuery) || error.stack && error.stack.toLowerCase().includes(lowerQuery) || error.info && error.info.toLowerCase().includes(lowerQuery));
  }
  // 获取错误统计
  getErrorStats() {
    const now = Date.now();
    const hour = 60 * 60 * 1e3;
    const day = 24 * hour;
    const byLevel = {
      error: 0,
      warn: 0,
      info: 0
    };
    let recent24h = 0;
    let recentHour = 0;
    for (const error of this.errors) {
      byLevel[error.level]++;
      if (now - error.timestamp <= day) {
        recent24h++;
      }
      if (now - error.timestamp <= hour) {
        recentHour++;
      }
    }
    return {
      total: this.errors.length,
      byLevel,
      recent24h,
      recentHour
    };
  }
  // 导出错误日志
  exportErrors(format = "json") {
    if (format === "json") {
      return JSON.stringify(this.errors, null, 2);
    } else {
      const headers = ["timestamp", "level", "message", "stack", "info"];
      const rows = this.errors.map((error) => [
        new Date(error.timestamp).toISOString(),
        error.level,
        `"${error.message.replace(/"/g, '""')}"`,
        `"${(error.stack || "").replace(/"/g, '""')}"`,
        `"${(error.info || "").replace(/"/g, '""')}"`
      ]);
      return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    }
  }
  // 创建错误报告
  createErrorReport() {
    const summary = this.getErrorStats();
    const recentErrors = this.getRecentErrors(10);
    const errorCounts = /* @__PURE__ */ new Map();
    for (const error of this.errors) {
      const count = errorCounts.get(error.message) || 0;
      errorCounts.set(error.message, count + 1);
    }
    const topErrors = Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([message, count]) => ({ message, count }));
    return {
      summary,
      recentErrors,
      topErrors
    };
  }
  // 初始化统计信息
  initStatistics() {
    return {
      total: 0,
      handled: 0,
      recovered: 0,
      byType: /* @__PURE__ */ new Map(),
      byModule: /* @__PURE__ */ new Map(),
      byCategory: /* @__PURE__ */ new Map(),
      timeline: [],
      recent24h: 0,
      recentHour: 0
    };
  }
  // 设置全局错误处理器
  setupGlobalHandlers() {
    if (typeof window !== "undefined") {
      this.globalErrorHandler = (event) => {
        this.captureError(new Error(event.message), void 0, `${event.filename}:${event.lineno}:${event.colno}`);
      };
      this.unhandledRejectionHandler = (event) => {
        this.captureError(new Error(event.reason), void 0, "Unhandled Promise Rejection");
      };
      window.addEventListener("error", this.globalErrorHandler);
      window.addEventListener("unhandledrejection", this.unhandledRejectionHandler);
    }
  }
  // 设置默认恢复策略
  setupDefaultRecoveryStrategies() {
    this.recoveryStrategies.set("network", {
      canRecover: (error) => error.message.includes("network") || error.message.includes("fetch"),
      recover: async (error) => {
        this.logger?.info("Attempting network error recovery", error);
        return new Promise((resolve) => setTimeout(() => resolve(true), 1e3));
      },
      priority: 1
    });
    this.recoveryStrategies.set("component", {
      canRecover: (error) => !!error.component,
      recover: async (error) => {
        this.logger?.info("Attempting component error recovery", error);
        return true;
      },
      priority: 2
    });
  }
  // 检测错误爆发
  detectErrorBurst() {
    const now = Date.now();
    const timeDiff = now - this.lastErrorTime;
    if (timeDiff < 1e3) {
      this.errorBurst++;
      if (this.errorBurst > 10) {
        this.logger?.warn("Error burst detected", { count: this.errorBurst });
      }
    } else {
      this.errorBurst = 1;
    }
    this.lastErrorTime = now;
  }
  // 分类错误
  categorizeError(error) {
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch") || message.includes("xhr")) {
      return exports.ErrorCategory.NETWORK;
    }
    if (error.component) {
      return exports.ErrorCategory.COMPONENT;
    }
    if (message.includes("plugin")) {
      return exports.ErrorCategory.PLUGIN;
    }
    if (message.includes("state") || message.includes("store")) {
      return exports.ErrorCategory.STATE;
    }
    if (message.includes("security") || message.includes("xss") || message.includes("csrf")) {
      return exports.ErrorCategory.SECURITY;
    }
    if (message.includes("performance") || message.includes("memory") || message.includes("timeout")) {
      return exports.ErrorCategory.PERFORMANCE;
    }
    return exports.ErrorCategory.UNKNOWN;
  }
  // 更新错误统计
  updateErrorStats(error, category) {
    const key = `${category}:${error.message}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
    if (this.errorCounts.size > this.maxErrorCounts) {
      const firstKey = this.errorCounts.keys().next().value;
      if (firstKey) {
        this.errorCounts.delete(firstKey);
      }
    }
    if (count > 5) {
      this.logger?.warn("Frequent error detected", {
        category,
        message: error.message,
        count: count + 1
      });
    }
    this.statistics.total++;
    const typeCount = this.statistics.byCategory.get(category) || 0;
    this.statistics.byCategory.set(category, typeCount + 1);
    const now = Date.now();
    this.statistics.timeline.push({ time: now, count: 1 });
    if (this.statistics.timeline.length > 200) {
      this.statistics.timeline = this.statistics.timeline.slice(-200);
    }
  }
  // 尝试自动恢复
  async attemptRecovery(error) {
    const strategies = Array.from(this.recoveryStrategies.values()).filter((strategy) => strategy.canRecover(error)).sort((a, b) => a.priority - b.priority);
    for (const strategy of strategies) {
      try {
        const recovered = await strategy.recover(error);
        if (recovered) {
          this.logger?.info("Error recovery successful", error);
          return true;
        }
      } catch (recoveryError) {
        this.logger?.error("Error recovery failed", recoveryError);
      }
    }
    return false;
  }
  // 获取错误分类统计
  getCategoryStats() {
    const stats = {};
    for (const category of Object.values(exports.ErrorCategory)) {
      stats[category] = 0;
    }
    for (const [key, count] of this.errorCounts) {
      const category = key.split(":")[0];
      if (category in stats) {
        stats[category] += count;
      }
    }
    return stats;
  }
  // 生成错误指纹
  generateErrorFingerprint(error) {
    try {
      const message = typeof error.message === "string" ? error.message : JSON.stringify(error.message) || "";
      const component = typeof error.component === "string" ? error.component : "unknown";
      const stack = typeof error.stack === "string" ? error.stack.split("\n")[0] || "" : "";
      const parts = [message, component, stack];
      return parts.join("|").substring(0, 100);
    } catch (e) {
      return `error_${Date.now()}`;
    }
  }
  // 启动定期清理计时器
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1e3);
  }
  // 停止清理计时器
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  // 清理过期数据
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1e3;
    this.errors = this.errors.filter((error) => now - error.timestamp < maxAge);
    for (const [key, report] of this.errorReports.entries()) {
      if (now - report.timestamp > maxAge) {
        this.errorReports.delete(key);
      }
    }
    this.statistics.timeline = this.statistics.timeline.filter((item) => now - item.time < maxAge);
    if (this.errorCounts.size > this.maxErrorCounts) {
      const entries = Array.from(this.errorCounts.entries());
      const toKeep = entries.slice(-this.maxErrorCounts);
      this.errorCounts = new Map(toKeep);
    }
    this.logger?.debug("Error manager cleanup completed", {
      errorsRemaining: this.errors.length,
      reportsRemaining: this.errorReports.size,
      countsRemaining: this.errorCounts.size
    });
  }
  // 移除全局错误处理器
  removeGlobalHandlers() {
    if (typeof window !== "undefined") {
      if (this.globalErrorHandler) {
        window.removeEventListener("error", this.globalErrorHandler);
        this.globalErrorHandler = null;
      }
      if (this.unhandledRejectionHandler) {
        window.removeEventListener("unhandledrejection", this.unhandledRejectionHandler);
        this.unhandledRejectionHandler = null;
      }
    }
  }
  // 销毁方法
  destroy() {
    this.clearErrors();
    this.errorHandlers.clear();
    this.recoveryStrategies.clear();
    this.filters.clear();
    this.errorQueue = [];
    this.stopCleanupTimer();
    this.removeGlobalHandlers();
    this.logger?.debug("Error manager destroyed");
  }
}
function createErrorManager(logger) {
  return new ErrorManagerImpl(logger);
}
const errorHandlers = {
  // 控制台错误处理器
  console: (errorInfo) => {
    const errorData = {
      message: errorInfo.message,
      timestamp: new Date(errorInfo.timestamp).toISOString(),
      component: errorInfo.component,
      info: errorInfo.info,
      stack: errorInfo.stack
    };
    if (errorInfo.level === "error") {
      console.error("Engine Error:", errorData);
    } else if (errorInfo.level === "warn") {
      console.warn("Engine Warning:", errorData);
    } else {
      console.info("Engine Info:", errorData);
    }
  },
  // 通知错误处理器
  notification: (notificationManager) => (errorInfo) => {
    if (errorInfo.level === "error") {
      notificationManager.show({
        type: "error",
        title: "Application Error",
        message: errorInfo.message,
        duration: 5e3
      });
    }
  },
  // 远程上报错误处理器
  remote: (config) => async (errorInfo) => {
    try {
      const payload = {
        ...errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date(errorInfo.timestamp).toISOString()
      };
      const headers = {
        "Content-Type": "application/json"
      };
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }
      await fetch(config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Failed to report error to remote service:", error);
    }
  },
  // 本地存储错误处理器
  localStorage: (key = "engine-errors") => (errorInfo) => {
    try {
      const stored = localStorage.getItem(key);
      const errors = stored ? JSON.parse(stored) : [];
      errors.unshift(errorInfo);
      if (errors.length > 50) {
        errors.splice(50);
      }
      localStorage.setItem(key, JSON.stringify(errors));
    } catch (error) {
      console.error("Failed to store error in localStorage:", error);
    }
  }
};
function createErrorBoundary(errorManager) {
  return {
    name: "ErrorBoundary",
    data() {
      return {
        hasError: false,
        error: null
      };
    },
    errorCaptured(error, component, info) {
      this.hasError = true;
      this.error = error;
      errorManager.captureError(error, component, info);
      return false;
    },
    render() {
      const self = this;
      if (self.hasError) {
        return self.$slots.fallback?.({ error: self.error }) || "Something went wrong. Please try again.";
      }
      return self.$slots.default?.();
    }
  };
}

exports.ErrorManagerImpl = ErrorManagerImpl;
exports.createErrorBoundary = createErrorBoundary;
exports.createErrorManager = createErrorManager;
exports.errorHandlers = errorHandlers;
//# sourceMappingURL=error-manager.cjs.map
