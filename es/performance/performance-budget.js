/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class PerformanceBudgetManager {
  constructor(budget, onExceeded) {
    this.metrics = /* @__PURE__ */ new Map();
    this.monitoring = false;
    this.budget = budget;
    this.onExceeded = onExceeded;
    this.initializeMetrics();
  }
  /**
   * 初始化指标
   */
  initializeMetrics() {
    if (this.budget.bundleSize) {
      this.metrics.set("bundleSize", {
        name: "Bundle Size",
        value: 0,
        limit: this.budget.bundleSize,
        unit: "bytes",
        exceeded: false,
        percentage: 0
      });
    }
    if (this.budget.initialLoadTime) {
      this.metrics.set("initialLoadTime", {
        name: "Initial Load Time",
        value: 0,
        limit: this.budget.initialLoadTime,
        unit: "ms",
        exceeded: false,
        percentage: 0
      });
    }
    if (this.budget.memoryUsage) {
      this.metrics.set("memoryUsage", {
        name: "Memory Usage",
        value: 0,
        limit: this.budget.memoryUsage,
        unit: "bytes",
        exceeded: false,
        percentage: 0
      });
    }
    if (this.budget.minFps) {
      this.metrics.set("fps", {
        name: "FPS",
        value: 60,
        limit: this.budget.minFps,
        unit: "fps",
        exceeded: false,
        percentage: 100
      });
    }
    if (this.budget.domNodes) {
      this.metrics.set("domNodes", {
        name: "DOM Nodes",
        value: 0,
        limit: this.budget.domNodes,
        unit: "nodes",
        exceeded: false,
        percentage: 0
      });
    }
    if (this.budget.networkRequests) {
      this.metrics.set("networkRequests", {
        name: "Network Requests",
        value: 0,
        limit: this.budget.networkRequests,
        unit: "requests",
        exceeded: false,
        percentage: 0
      });
    }
    if (this.budget.networkSize) {
      this.metrics.set("networkSize", {
        name: "Network Size",
        value: 0,
        limit: this.budget.networkSize,
        unit: "bytes",
        exceeded: false,
        percentage: 0
      });
    }
  }
  /**
   * 开始监控
   */
  startMonitoring() {
    if (this.monitoring)
      return;
    this.monitoring = true;
    this.monitorLoadPerformance();
    this.monitorMemory();
    this.monitorFPS();
    this.monitorDOMNodes();
    this.monitorNetwork();
  }
  /**
   * 停止监控
   */
  stopMonitoring() {
    this.monitoring = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = void 0;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = void 0;
    }
  }
  /**
   * 监控加载性能
   */
  monitorLoadPerformance() {
    if (typeof window === "undefined")
      return;
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      if (loadTime > 0 && this.metrics.has("initialLoadTime")) {
        this.updateMetric("initialLoadTime", loadTime);
      }
    }
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType("resource");
      let totalSize = 0;
      resources.forEach((resource) => {
        if ("transferSize" in resource) {
          totalSize += resource.transferSize;
        }
      });
      if (this.metrics.has("bundleSize")) {
        this.updateMetric("bundleSize", totalSize);
      }
    }
  }
  /**
   * 监控内存使用
   */
  monitorMemory() {
    if (typeof window === "undefined")
      return;
    if ("memory" in performance) {
      const checkMemory = () => {
        if (!this.monitoring)
          return;
        const memory = performance.memory;
        if (memory && this.metrics.has("memoryUsage")) {
          this.updateMetric("memoryUsage", memory.usedJSHeapSize);
        }
        setTimeout(() => checkMemory(), 1e3);
      };
      checkMemory();
    }
  }
  /**
   * 监控 FPS
   */
  monitorFPS() {
    if (typeof window === "undefined")
      return;
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;
    const measureFPS = () => {
      if (!this.monitoring)
        return;
      const currentTime = performance.now();
      frameCount++;
      if (currentTime >= lastTime + 1e3) {
        fps = Math.round(frameCount * 1e3 / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        if (this.metrics.has("fps")) {
          const metric = this.metrics.get("fps");
          if (metric) {
            metric.value = fps;
            metric.exceeded = fps < metric.limit;
            metric.percentage = fps / 60 * 100;
            if (metric.exceeded && this.onExceeded) {
              this.onExceeded(metric);
            }
          }
        }
      }
      this.animationFrameId = requestAnimationFrame(measureFPS);
    };
    measureFPS();
  }
  /**
   * 监控 DOM 节点数量
   */
  monitorDOMNodes() {
    if (typeof window === "undefined")
      return;
    const checkDOMNodes = () => {
      if (!this.monitoring)
        return;
      const nodeCount = document.getElementsByTagName("*").length;
      if (this.metrics.has("domNodes")) {
        this.updateMetric("domNodes", nodeCount);
      }
      setTimeout(() => checkDOMNodes(), 1e3);
    };
    checkDOMNodes();
  }
  /**
   * 监控网络请求
   */
  monitorNetwork() {
    if (typeof window === "undefined")
      return;
    let requestCount = 0;
    let totalSize = 0;
    if ("PerformanceObserver" in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "resource") {
            requestCount++;
            if ("transferSize" in entry) {
              totalSize += entry.transferSize;
            }
            if (this.metrics.has("networkRequests")) {
              this.updateMetric("networkRequests", requestCount);
            }
            if (this.metrics.has("networkSize")) {
              this.updateMetric("networkSize", totalSize);
            }
          }
        }
      });
      this.observer.observe({ entryTypes: ["resource"] });
    }
  }
  /**
   * 更新指标
   */
  updateMetric(name, value) {
    const metric = this.metrics.get(name);
    if (!metric)
      return;
    metric.value = value;
    metric.percentage = value / metric.limit * 100;
    const wasExceeded = metric.exceeded;
    metric.exceeded = metric.name === "FPS" ? value < metric.limit : value > metric.limit;
    if (!wasExceeded && metric.exceeded && this.onExceeded) {
      this.onExceeded(metric);
    }
  }
  /**
   * 手动检查特定指标
   */
  checkMetric(name, value) {
    if (!this.metrics.has(name))
      return null;
    this.updateMetric(name, value);
    return this.metrics.get(name) || null;
  }
  /**
   * 获取所有指标
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }
  /**
   * 获取超出预算的指标
   */
  getExceededMetrics() {
    return Array.from(this.metrics.values()).filter((m) => m.exceeded);
  }
  /**
   * 获取性能报告
   */
  getReport() {
    const metrics = this.getAllMetrics();
    const exceeded = this.getExceededMetrics();
    const passed = exceeded.length === 0;
    const summary = passed ? "\u2705 \u6240\u6709\u6027\u80FD\u6307\u6807\u90FD\u5728\u9884\u7B97\u8303\u56F4\u5185" : `\u26A0\uFE0F ${exceeded.length} \u4E2A\u6027\u80FD\u6307\u6807\u8D85\u51FA\u9884\u7B97: ${exceeded.map((m) => m.name).join(", ")}`;
    return {
      passed,
      metrics,
      exceeded,
      summary
    };
  }
  /**
   * 重置指标
   */
  reset() {
    this.stopMonitoring();
    this.metrics.clear();
    this.initializeMetrics();
  }
  /**
   * 更新预算
   */
  updateBudget(budget) {
    this.budget = { ...this.budget, ...budget };
    this.reset();
  }
  /**
   * 销毁
   */
  destroy() {
    this.stopMonitoring();
    this.metrics.clear();
  }
}

export { PerformanceBudgetManager };
//# sourceMappingURL=performance-budget.js.map
