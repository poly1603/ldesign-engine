/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class PerformanceMonitor {
  constructor(engine) {
    this.engine = engine;
    this.timings = /* @__PURE__ */ new Map();
    this.startTimes = /* @__PURE__ */ new Map();
    this.counters = /* @__PURE__ */ new Map();
    this.gauges = /* @__PURE__ */ new Map();
    this.observers = /* @__PURE__ */ new Set();
    this.maxTimingSamples = 100;
    this.maxMetricKeys = 50;
    this.maxObservers = 20;
    this.lastCleanup = Date.now();
    this.cleanupInterval = 6e4;
    this.metrics = this.initMetrics();
    this.startAutoMonitoring();
  }
  initMetrics() {
    return {
      cpu: { usage: 0, idle: 100 },
      memory: {
        used: 0,
        total: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      },
      timing: {},
      counters: /* @__PURE__ */ new Map(),
      gauges: /* @__PURE__ */ new Map()
    };
  }
  /**
   * 开始性能计时
   */
  startTiming(label) {
    if (this.startTimes.size >= this.maxMetricKeys) {
      const firstKey = this.startTimes.keys().next().value;
      if (firstKey !== void 0) {
        this.startTimes.delete(firstKey);
      }
    }
    this.startTimes.set(label, performance.now());
    this.performPeriodicCleanup();
  }
  /**
   * 结束性能计时并记录
   */
  endTiming(label) {
    const startTime = this.startTimes.get(label);
    if (!startTime)
      return 0;
    const duration = performance.now() - startTime;
    this.startTimes.delete(label);
    if (this.timings.size >= this.maxMetricKeys && !this.timings.has(label)) {
      const firstKey = this.timings.keys().next().value;
      if (firstKey) {
        this.timings.delete(firstKey);
        delete this.metrics.timing[firstKey];
      }
    }
    if (!this.timings.has(label)) {
      this.timings.set(label, []);
    }
    const samples = this.timings.get(label);
    samples.push(duration);
    if (samples.length > this.maxTimingSamples) {
      samples.shift();
    }
    this.updateTimingStats(label);
    return duration;
  }
  /**
   * 使用装饰器模式测量函数执行时间
   */
  measure(label, fn) {
    return ((...args) => {
      this.startTiming(label);
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.finally(() => this.endTiming(label));
        }
        this.endTiming(label);
        return result;
      } catch (error) {
        this.endTiming(label);
        throw error;
      }
    });
  }
  /**
   * 增加计数器
   */
  incrementCounter(name, value = 1) {
    if (this.counters.size >= this.maxMetricKeys && !this.counters.has(name)) {
      const firstKey = this.counters.keys().next().value;
      if (firstKey !== void 0) {
        this.counters.delete(firstKey);
      }
    }
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    this.metrics.counters = new Map(this.counters);
  }
  /**
   * 设置测量值
   */
  setGauge(name, value) {
    if (this.gauges.size >= this.maxMetricKeys && !this.gauges.has(name)) {
      const firstKey = this.gauges.keys().next().value;
      if (firstKey !== void 0) {
        this.gauges.delete(firstKey);
      }
    }
    this.gauges.set(name, value);
    this.metrics.gauges = new Map(this.gauges);
  }
  /**
   * 获取当前指标
   */
  getMetrics() {
    return { ...this.metrics };
  }
  /**
   * 重置所有指标
   */
  reset() {
    this.timings.clear();
    this.startTimes.clear();
    this.counters.clear();
    this.gauges.clear();
    this.metrics = this.initMetrics();
  }
  /**
   * 订阅性能指标更新
   */
  subscribe(callback) {
    if (this.observers.size >= this.maxObservers) {
      console.warn(`Performance monitor: Maximum observers (${this.maxObservers}) reached`);
      return () => {
      };
    }
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }
  /**
   * 获取性能报告
   */
  getReport() {
    const report = [];
    report.push("=== Performance Report ===");
    if (typeof performance !== "undefined" && performance.memory) {
      const mem = performance.memory;
      report.push(`Memory: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(mem.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    for (const [label, stats] of Object.entries(this.metrics.timing)) {
      report.push(`${label}: avg=${stats.average.toFixed(2)}ms, p99=${stats.p99.toFixed(2)}ms`);
    }
    if (this.counters.size > 0) {
      report.push("Counters:");
      for (const [name, value] of this.counters) {
        report.push(`  ${name}: ${value}`);
      }
    }
    return report.join("\n");
  }
  /**
   * 获取性能建议
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    for (const [label, stats] of Object.entries(this.metrics.timing)) {
      if (stats.p99 > 100) {
        suggestions.push(`\u8003\u8651\u4F18\u5316 "${label}" \u64CD\u4F5C\uFF0CP99\u5EF6\u8FDF\u4E3A ${stats.p99.toFixed(2)}ms`);
      }
    }
    if (typeof performance !== "undefined" && performance.memory) {
      const mem = performance.memory;
      const usagePercent = mem.usedJSHeapSize / mem.jsHeapSizeLimit * 100;
      if (usagePercent > 80) {
        suggestions.push(`\u5185\u5B58\u4F7F\u7528\u7387\u8F83\u9AD8 (${usagePercent.toFixed(1)}%)\uFF0C\u5EFA\u8BAE\u68C0\u67E5\u5185\u5B58\u6CC4\u6F0F`);
      }
    }
    if (this.engine?.events) {
      const stats = this.engine.events.getStats?.();
      if (stats?.totalListeners > 100) {
        suggestions.push(`\u4E8B\u4EF6\u76D1\u542C\u5668\u8FC7\u591A (${stats.totalListeners})\uFF0C\u53EF\u80FD\u5B58\u5728\u5185\u5B58\u6CC4\u6F0F`);
      }
    }
    if (this.engine?.cache) {
      const cacheStats = this.engine.cache.getStats();
      if (cacheStats.hitRate < 50) {
        suggestions.push(`\u7F13\u5B58\u547D\u4E2D\u7387\u8F83\u4F4E (${cacheStats.hitRate.toFixed(1)}%)\uFF0C\u8003\u8651\u8C03\u6574\u7F13\u5B58\u7B56\u7565`);
      }
    }
    return suggestions;
  }
  /**
   * 更新计时统计 - 优化版
   */
  updateTimingStats(label) {
    const samples = this.timings.get(label);
    if (!samples || samples.length === 0)
      return;
    const sorted = samples.slice().sort((a, b) => a - b);
    const len = sorted.length;
    let total = 0;
    for (let i = 0; i < len; i++) {
      total += sorted[i];
    }
    const stats = {
      count: len,
      total,
      min: sorted[0],
      max: sorted[len - 1],
      average: total / len,
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p99: sorted[Math.floor(len * 0.99)]
    };
    this.metrics.timing[label] = stats;
  }
  /**
   * 定期清理过期数据
   */
  performPeriodicCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      const timeout = 3e4;
      for (const [label, startTime] of this.startTimes) {
        if (now - startTime > timeout) {
          this.startTimes.delete(label);
        }
      }
      this.lastCleanup = now;
    }
  }
  /**
   * 开始自动监控 - 优化频率
   */
  startAutoMonitoring() {
    this.updateInterval = window.setInterval(() => {
      if (typeof performance !== "undefined" && performance.memory) {
        const mem = performance.memory;
        this.metrics.memory = {
          used: mem.usedJSHeapSize,
          total: mem.jsHeapSizeLimit,
          heapUsed: mem.usedJSHeapSize,
          heapTotal: mem.totalJSHeapSize,
          external: 0,
          arrayBuffers: 0
        };
      }
      this.performPeriodicCleanup();
      if (this.observers.size > 0) {
        this.notifyObservers();
      }
    }, 2e3);
  }
  /**
   * 通知所有观察者
   */
  notifyObservers() {
    for (const observer of this.observers) {
      observer(this.getMetrics());
    }
  }
  /**
   * 销毁监控器
   */
  destroy() {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
    }
    this.observers.clear();
    this.reset();
  }
}
let globalMonitor;
function getGlobalPerformanceMonitor(engine) {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(engine);
  }
  return globalMonitor;
}
function Measure(label) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const measureLabel = label || `${target.constructor.name}.${propertyKey}`;
    descriptor.value = function(...args) {
      const monitor = getGlobalPerformanceMonitor();
      return monitor.measure(measureLabel, originalMethod).apply(this, args);
    };
    return descriptor;
  };
}

export { Measure, PerformanceMonitor, getGlobalPerformanceMonitor };
//# sourceMappingURL=performance-monitor.js.map
