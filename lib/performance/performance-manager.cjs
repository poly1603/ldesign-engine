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

exports.PerformanceEventType = void 0;
(function(PerformanceEventType2) {
  PerformanceEventType2["NAVIGATION"] = "navigation";
  PerformanceEventType2["RESOURCE_LOAD"] = "resource_load";
  PerformanceEventType2["USER_INTERACTION"] = "user_interaction";
  PerformanceEventType2["COMPONENT_RENDER"] = "component_render";
  PerformanceEventType2["API_CALL"] = "api_call";
  PerformanceEventType2["NETWORK"] = "network";
  PerformanceEventType2["RENDER"] = "render";
  PerformanceEventType2["CUSTOM"] = "custom";
})(exports.PerformanceEventType || (exports.PerformanceEventType = {}));
class MemoryMonitor {
  constructor() {
    this.baseInterval = 3e4;
    this.currentInterval = 3e4;
    this.memoryHistory = [];
    this.maxHistorySize = 50;
    this.leakThreshold = 10 * 1024 * 1024;
  }
  start(callback, interval = 3e4) {
    this.callback = callback;
    this.baseInterval = interval;
    this.currentInterval = interval;
    this.startAdaptiveMonitoring();
  }
  /**
   * 自适应监控 - 根据内存压力调整采样频率
   */
  startAdaptiveMonitoring() {
    const sample = () => {
      const memory = this.getMemoryInfo();
      if (memory && this.callback) {
        this.callback(memory);
        this.memoryHistory.push({
          timestamp: Date.now(),
          used: memory.used
        });
        if (this.memoryHistory.length > this.maxHistorySize) {
          this.memoryHistory.shift();
        }
        this.detectMemoryLeak();
        this.adjustSamplingInterval(memory);
      }
      if (this.intervalId) {
        clearTimeout(this.intervalId);
      }
      this.intervalId = setTimeout(sample, this.currentInterval);
    };
    sample();
  }
  /**
   * 根据内存使用情况调整采样间隔
   */
  adjustSamplingInterval(memory) {
    const usagePercent = memory.used / memory.limit;
    if (usagePercent > 0.8) {
      this.currentInterval = 5e3;
    } else if (usagePercent > 0.6) {
      this.currentInterval = 15e3;
    } else {
      this.currentInterval = this.baseInterval;
    }
  }
  /**
   * 检测内存泄漏
   */
  detectMemoryLeak() {
    if (this.memoryHistory.length < 10) {
      return;
    }
    const recentSamples = this.memoryHistory.slice(-10);
    const firstSample = recentSamples[0];
    const lastSample = recentSamples[recentSamples.length - 1];
    const growthRate = lastSample.used - firstSample.used;
    const timeDiff = lastSample.timestamp - firstSample.timestamp;
    if (growthRate > this.leakThreshold && timeDiff < 5 * 60 * 1e3) {
      console.warn("[MemoryMonitor] Potential memory leak detected", {
        growth: `${(growthRate / 1024 / 1024).toFixed(2)}MB`,
        duration: `${(timeDiff / 1e3).toFixed(0)}s`,
        rate: `${(growthRate / timeDiff * 1e3 / 1024).toFixed(2)}KB/s`
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("memory-leak-warning", {
          detail: { growth: growthRate, duration: timeDiff }
        }));
      }
    }
  }
  /**
   * 获取内存趋势
   */
  getMemoryTrend() {
    if (this.memoryHistory.length < 5) {
      return null;
    }
    const recent = this.memoryHistory.slice(-10);
    const average = recent.reduce((sum, s) => sum + s.used, 0) / recent.length;
    const peak = Math.max(...recent.map((s) => s.used));
    const current = recent[recent.length - 1].used;
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.used, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.used, 0) / secondHalf.length;
    let trend = "stable";
    const diff = secondAvg - firstAvg;
    if (diff > 1024 * 1024) {
      trend = "increasing";
    } else if (diff < -1024 * 1024) {
      trend = "decreasing";
    }
    return { average, peak, current, trend };
  }
  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = void 0;
    }
    this.callback = void 0;
    this.memoryHistory = [];
  }
  getMemoryInfo() {
    if (typeof globalThis !== "undefined" && typeof globalThis.performance !== "undefined" && "memory" in globalThis.performance) {
      const memory = globalThis.performance.memory;
      if (!memory)
        return void 0;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return void 0;
  }
}
class FPSMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 0;
  }
  start(callback) {
    this.callback = callback;
    this.frameCount = 0;
    this.lastTime = globalThis.performance?.now() || Date.now();
    this.measureFPS();
  }
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = void 0;
    }
    this.callback = void 0;
  }
  measureFPS() {
    if (!this.callback)
      return;
    this.frameCount++;
    const currentTime = globalThis.performance?.now() || Date.now();
    if (currentTime - this.lastTime >= 1e3) {
      this.fps = Math.round(this.frameCount * 1e3 / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      this.callback(this.fps);
    }
    this.animationId = requestAnimationFrame(() => this.measureFPS());
  }
  getFPS() {
    return this.fps;
  }
}
class PerformanceManagerImpl {
  constructor(thresholds = {}, engine) {
    this.events = /* @__PURE__ */ new Map();
    this.metrics = [];
    this.violationCallbacks = [];
    this.metricsCallbacks = [];
    this.monitoring = false;
    this.fpsMonitor = new FPSMonitor();
    this.memoryMonitor = new MemoryMonitor();
    this.eventIdCounter = 0;
    this.maxEvents = 50;
    this.maxMetrics = 50;
    this.destroyed = false;
    this.engine = engine;
    this.thresholds = {
      responseTime: { good: 100, poor: 1e3 },
      fps: { good: 55, poor: 30 },
      memory: { warning: 100, critical: 200 },
      bundleSize: { warning: 500, critical: 1e3 },
      ...thresholds
    };
  }
  startEvent(type, name, metadata) {
    const id = `perf_${++this.eventIdCounter}_${Date.now()}`;
    const event = {
      id,
      type,
      name,
      startTime: globalThis.performance.now(),
      metadata
    };
    this.events.set(id, event);
    if (this.events.size > this.maxEvents) {
      const oldestKey = this.events.keys().next().value;
      if (oldestKey) {
        this.events.delete(oldestKey);
      }
    }
    return id;
  }
  endEvent(id, metadata) {
    const event = this.events.get(id);
    if (!event) {
      this.engine?.logger?.warn(`Performance event ${id} not found`);
      return;
    }
    const endTime = globalThis.performance.now();
    const duration = endTime - event.startTime;
    event.endTime = endTime;
    event.duration = duration;
    if (metadata) {
      event.metadata = { ...event.metadata, ...metadata };
    }
    this.checkThresholdViolations(event);
    if (this.engine?.events) {
      this.engine.events.emit("performance:event", event);
    }
  }
  recordEvent(event) {
    const id = `perf_${++this.eventIdCounter}_${Date.now()}`;
    const fullEvent = {
      ...event,
      id
    };
    this.events.set(id, fullEvent);
    this.checkThresholdViolations(fullEvent);
    return id;
  }
  collectMetrics() {
    const timestamp = Date.now();
    const metrics = {
      timestamp,
      duration: 0
      // 将在后续更新
    };
    if (typeof globalThis !== "undefined" && typeof globalThis.performance !== "undefined" && "memory" in globalThis.performance) {
      const memory = globalThis.performance.memory;
      if (!memory)
        return metrics;
      metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.getEntriesByType) {
      const networkEntries = globalThis.performance.getEntriesByType("navigation");
      if (networkEntries.length > 0) {
        const entry = networkEntries[0];
        metrics.network = {
          latency: entry.responseStart - entry.requestStart,
          bandwidth: entry.transferSize ? entry.transferSize / (entry.responseEnd - entry.responseStart) * 1e3 : 0,
          requests: 1,
          totalSize: entry.transferSize || 0,
          averageTime: entry.loadEventEnd - entry.loadEventStart
        };
      }
    }
    return metrics;
  }
  recordMetrics(metrics) {
    if (this.destroyed)
      return;
    const fullMetrics = {
      timestamp: Date.now(),
      duration: 0,
      ...metrics
    };
    this.metrics.push(fullMetrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    this.checkMetricsViolations(fullMetrics);
    this.metricsCallbacks.forEach((callback) => {
      try {
        callback(fullMetrics);
      } catch (error) {
        this.engine?.logger?.error("Error in metrics callback", error);
      }
    });
  }
  startMonitoring() {
    if (this.monitoring) {
      return;
    }
    this.monitoring = true;
    if (typeof requestAnimationFrame !== "undefined") {
      this.fpsMonitor.start((fps) => {
        this.recordMetrics({
          rendering: {
            fps,
            frameTime: 1e3 / fps,
            droppedFrames: fps < 30 ? 1 : 0,
            renderTime: 1e3 / fps
          }
        });
      });
    }
    this.memoryMonitor.start((memory) => {
      this.recordMetrics({ memory });
    });
    if (typeof PerformanceObserver !== "undefined") {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          if (this.destroyed)
            return;
          for (const entry of list.getEntries()) {
            this.handlePerformanceEntry(entry);
          }
        });
        this.performanceObserver.observe({
          entryTypes: ["navigation", "resource", "measure", "mark"]
        });
      } catch (error) {
        this.engine?.logger?.warn("PerformanceObserver not supported", error);
      }
    }
    this.engine?.logger?.info("Performance monitoring started");
  }
  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }
    this.monitoring = false;
    this.fpsMonitor.stop();
    this.memoryMonitor.stop();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = void 0;
    }
    this.engine?.logger?.info("Performance monitoring stopped");
  }
  isMonitoring() {
    return this.monitoring;
  }
  getEvents(filter) {
    let events = Array.from(this.events.values());
    if (filter) {
      events = events.filter((event) => {
        return Object.entries(filter).every(([key, value]) => {
          return event[key] === value;
        });
      });
    }
    return events.sort((a, b) => a.startTime - b.startTime);
  }
  getMetrics(timeRange) {
    let metrics = [...this.metrics];
    if (timeRange) {
      metrics = metrics.filter((metric) => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end);
    }
    return metrics.sort((a, b) => a.timestamp - b.timestamp);
  }
  getReport(timeRange) {
    const events = this.getEvents();
    const metrics = this.getMetrics(timeRange);
    const completedEvents = events.filter((e) => e.duration !== void 0);
    const totalResponseTime = completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageResponseTime = completedEvents.length > 0 ? totalResponseTime / completedEvents.length : 0;
    const fpsMetrics = metrics.filter((m) => m.rendering?.fps);
    const averageFPS = fpsMetrics.length > 0 ? fpsMetrics.reduce((sum, m) => sum + (m.rendering?.fps || 0), 0) / fpsMetrics.length : 0;
    const latestMemory = metrics.filter((m) => m.memory).pop();
    const memoryUsage = latestMemory?.memory?.used || 0;
    const timeStart = timeRange?.start || (events.length > 0 ? Math.min(...events.map((e) => e.startTime)) : Date.now());
    const timeEnd = timeRange?.end || Date.now();
    return {
      summary: {
        totalEvents: events.length,
        averageResponseTime,
        averageFPS,
        memoryUsage,
        timeRange: {
          start: timeStart,
          end: timeEnd
        }
      },
      events,
      metrics,
      violations: this.getViolations(timeRange),
      recommendations: this.generateRecommendations(events, metrics)
    };
  }
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
  getThresholds() {
    return { ...this.thresholds };
  }
  onViolation(callback) {
    this.violationCallbacks.push(callback);
  }
  onMetrics(callback) {
    this.metricsCallbacks.push(callback);
    return () => {
      const index = this.metricsCallbacks.indexOf(callback);
      if (index > -1) {
        this.metricsCallbacks.splice(index, 1);
      }
    };
  }
  clearData(olderThan) {
    const cutoff = olderThan || Date.now() - 24 * 60 * 60 * 1e3;
    for (const [id, event] of this.events.entries()) {
      if (event.startTime < cutoff) {
        this.events.delete(id);
      }
    }
    this.metrics = this.metrics.filter((metric) => metric.timestamp >= cutoff);
  }
  exportData() {
    return JSON.stringify({
      events: Array.from(this.events.values()),
      metrics: this.metrics,
      thresholds: this.thresholds
    });
  }
  importData(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.events) {
        this.events.clear();
        parsed.events.forEach((event) => {
          this.events.set(event.id, event);
        });
      }
      if (parsed.metrics) {
        this.metrics = parsed.metrics;
      }
      if (parsed.thresholds) {
        this.thresholds = { ...this.thresholds, ...parsed.thresholds };
      }
    } catch (error) {
      this.engine?.logger?.error("Failed to import performance data", error);
    }
  }
  handlePerformanceEntry(entry) {
    const eventType = this.getEventTypeFromEntry(entry);
    this.recordEvent({
      type: eventType,
      name: entry.name,
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      metadata: {
        entryType: entry.entryType,
        ...this.getEntryMetadata(entry)
      }
    });
  }
  getEventTypeFromEntry(entry) {
    switch (entry.entryType) {
      case "navigation":
        return exports.PerformanceEventType.NAVIGATION;
      case "resource":
        return exports.PerformanceEventType.RESOURCE_LOAD;
      case "measure":
      case "mark":
        return exports.PerformanceEventType.CUSTOM;
      default:
        return exports.PerformanceEventType.CUSTOM;
    }
  }
  getEntryMetadata(entry) {
    const metadata = {};
    const anyEntry = entry;
    if (typeof anyEntry.transferSize === "number") {
      metadata.transferSize = anyEntry.transferSize;
    }
    if (typeof anyEntry.decodedBodySize === "number") {
      metadata.decodedBodySize = anyEntry.decodedBodySize;
    }
    return metadata;
  }
  checkThresholdViolations(event) {
    if (!event.duration)
      return;
    const { responseTime } = this.thresholds;
    if (responseTime && event.duration > responseTime.poor) {
      this.reportViolation({
        type: "threshold",
        severity: "high",
        message: `Slow operation detected: ${event.name} took ${event.duration.toFixed(2)}ms`,
        details: { event, threshold: responseTime.poor },
        timestamp: Date.now()
      });
    }
  }
  checkMetricsViolations(metrics) {
    if (metrics.memory && this.thresholds.memory) {
      const memoryMB = metrics.memory.used / (1024 * 1024);
      if (memoryMB > this.thresholds.memory.critical) {
        this.reportViolation({
          type: "memory_leak",
          severity: "critical",
          message: `Critical memory usage: ${memoryMB.toFixed(2)}MB`,
          details: {
            memory: metrics.memory,
            threshold: this.thresholds.memory.critical
          },
          timestamp: Date.now()
        });
      } else if (memoryMB > this.thresholds.memory.warning) {
        this.reportViolation({
          type: "memory_leak",
          severity: "medium",
          message: `High memory usage: ${memoryMB.toFixed(2)}MB`,
          details: {
            memory: metrics.memory,
            threshold: this.thresholds.memory.warning
          },
          timestamp: Date.now()
        });
      }
    }
    if (metrics.rendering?.fps && this.thresholds.fps) {
      if (metrics.rendering.fps < this.thresholds.fps.poor) {
        this.reportViolation({
          type: "threshold",
          severity: "medium",
          message: `Low FPS detected: ${metrics.rendering.fps}`,
          details: {
            fps: metrics.rendering.fps,
            threshold: this.thresholds.fps.poor
          },
          timestamp: Date.now()
        });
      }
    }
  }
  reportViolation(violation) {
    this.violationCallbacks.forEach((callback) => {
      try {
        callback(violation);
      } catch (error) {
        this.engine?.logger?.error("Error in violation callback", error);
      }
    });
    if (this.engine?.events) {
      this.engine.events.emit("performance:violation", violation);
    }
  }
  getViolations(_timeRange) {
    return [];
  }
  generateRecommendations(events, metrics) {
    const recommendations = [];
    const slowEvents = events.filter((e) => e.duration && e.duration > 1e3);
    if (slowEvents.length > 0) {
      recommendations.push(`\u53D1\u73B0 ${slowEvents.length} \u4E2A\u6162\u64CD\u4F5C\uFF0C\u5EFA\u8BAE\u4F18\u5316\u6027\u80FD`);
      const slowestEvent = slowEvents.reduce((prev, current) => (prev.duration || 0) > (current.duration || 0) ? prev : current);
      recommendations.push(`\u6700\u6162\u64CD\u4F5C: ${slowestEvent.name} (${slowestEvent.duration}ms)`);
    }
    const memoryMetrics = metrics.filter((m) => m.memory);
    if (memoryMetrics.length > 0) {
      if (memoryMetrics.length > 1) {
        const firstMemory = memoryMetrics[0].memory?.used || 0;
        const lastMemory = memoryMetrics[memoryMetrics.length - 1].memory?.used || 0;
        const memoryGrowth = lastMemory - firstMemory;
        const memoryGrowthMB = memoryGrowth / (1024 * 1024);
        if (memoryGrowthMB > 50) {
          recommendations.push(`\u68C0\u6D4B\u5230\u5185\u5B58\u589E\u957F ${memoryGrowthMB.toFixed(2)}MB\uFF0C\u53EF\u80FD\u5B58\u5728\u5185\u5B58\u6CC4\u6F0F`);
        }
      }
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + (m.memory?.used || 0), 0) / memoryMetrics.length;
      const memoryMB = avgMemory / (1024 * 1024);
      if (memoryMB > 100) {
        recommendations.push(`\u5E73\u5747\u5185\u5B58\u4F7F\u7528 ${memoryMB.toFixed(2)}MB\uFF0C\u5EFA\u8BAE\u4F18\u5316\u5185\u5B58\u4F7F\u7528`);
      } else if (memoryMB > 50) {
        recommendations.push(`\u5185\u5B58\u4F7F\u7528\u8F83\u9AD8 ${memoryMB.toFixed(2)}MB\uFF0C\u5EFA\u8BAE\u76D1\u63A7\u5185\u5B58\u4F7F\u7528\u60C5\u51B5`);
      }
    }
    const fpsMetrics = metrics.filter((m) => m.rendering?.fps);
    if (fpsMetrics.length > 0) {
      const avgFPS = fpsMetrics.reduce((sum, m) => sum + (m.rendering?.fps || 0), 0) / fpsMetrics.length;
      const minFPS = Math.min(...fpsMetrics.map((m) => m.rendering?.fps || 60));
      if (avgFPS < 30) {
        recommendations.push(`\u5E73\u5747FPS ${avgFPS.toFixed(1)}\uFF0C\u5EFA\u8BAE\u4F18\u5316\u6E32\u67D3\u6027\u80FD`);
      }
      if (minFPS < 20) {
        recommendations.push(`\u6700\u4F4EFPS ${minFPS}\uFF0C\u5B58\u5728\u4E25\u91CD\u5361\u987F`);
      }
      const droppedFrames = fpsMetrics.reduce((sum, m) => sum + (m.rendering?.droppedFrames || 0), 0);
      if (droppedFrames > fpsMetrics.length * 0.1) {
        recommendations.push(`\u6389\u5E27\u7387 ${(droppedFrames / fpsMetrics.length * 100).toFixed(1)}%\uFF0C\u5EFA\u8BAE\u4F18\u5316\u52A8\u753B`);
      }
    }
    const networkEvents = events.filter((e) => e.type === exports.PerformanceEventType.NETWORK);
    if (networkEvents.length > 0) {
      const avgResponseTime = networkEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / networkEvents.length;
      if (avgResponseTime > 2e3) {
        recommendations.push(`\u7F51\u7EDC\u8BF7\u6C42\u5E73\u5747\u54CD\u5E94\u65F6\u95F4 ${avgResponseTime.toFixed(0)}ms\uFF0C\u5EFA\u8BAE\u4F18\u5316\u7F51\u7EDC\u6027\u80FD`);
      }
    }
    const renderEvents = events.filter((e) => e.type === exports.PerformanceEventType.RENDER);
    if (renderEvents.length > 0) {
      const slowRenders = renderEvents.filter((e) => (e.duration || 0) > 16);
      if (slowRenders.length > renderEvents.length * 0.2) {
        recommendations.push(`${(slowRenders.length / renderEvents.length * 100).toFixed(1)}% \u7684\u6E32\u67D3\u8D85\u8FC716ms\uFF0C\u5EFA\u8BAE\u4F18\u5316\u7EC4\u4EF6`);
      }
    }
    return recommendations;
  }
  // 添加缺失的方法
  updateThresholds(thresholds) {
    this.setThresholds(thresholds);
  }
  generateReport(timeRange) {
    return this.getReport(timeRange);
  }
  mark(name) {
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.mark) {
      globalThis.performance.mark(name);
    }
  }
  measure(name, startMark, endMark) {
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.measure) {
      try {
        globalThis.performance.measure(name, startMark, endMark);
      } catch (error) {
        this.engine?.logger?.warn(`Performance measure failed: ${error}`);
      }
    }
  }
  getMarks() {
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.getEntriesByType) {
      return globalThis.performance.getEntriesByType("mark");
    }
    return [];
  }
  getMeasures() {
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.getEntriesByType) {
      return globalThis.performance.getEntriesByType("measure");
    }
    return [];
  }
  clearEvents() {
    this.events.clear();
  }
  clearMetrics() {
    this.metrics = [];
  }
  clearMarks() {
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.clearMarks) {
      globalThis.performance.clearMarks();
    }
  }
  clearMeasures() {
    if (typeof globalThis.performance !== "undefined" && globalThis.performance.clearMeasures) {
      globalThis.performance.clearMeasures();
    }
  }
  /**
   * 获取内存趋势分析
   */
  getMemoryTrend() {
    return this.memoryMonitor.getMemoryTrend();
  }
  /**
   * 获取内存信息（立即）
   */
  getMemoryInfo() {
    if (typeof globalThis !== "undefined" && typeof globalThis.performance !== "undefined" && "memory" in globalThis.performance) {
      const memory = globalThis.performance.memory;
      if (!memory)
        return void 0;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return void 0;
  }
  // 销毁方法 - 清理所有资源
  destroy() {
    if (this.destroyed)
      return;
    this.destroyed = true;
    this.stopMonitoring();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = void 0;
    }
    this.fpsMonitor.stop();
    this.memoryMonitor.stop();
    this.events.clear();
    this.metrics = [];
    this.violationCallbacks = [];
    this.metricsCallbacks = [];
    this.clearMarks();
    this.clearMeasures();
    this.engine?.logger?.info("Performance manager destroyed");
  }
}
function createPerformanceManager(thresholds, engine) {
  return new PerformanceManagerImpl(thresholds, engine);
}
function performance(name) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const ctorName = target.constructor?.name ?? "UnknownTarget";
    const eventName = name || `${ctorName}.${propertyKey}`;
    descriptor.value = async function(...args) {
      const manager = getGlobalPerformanceManager();
      const eventId = manager.startEvent(exports.PerformanceEventType.CUSTOM, eventName);
      try {
        const result = await originalMethod.apply(this, args);
        manager.endEvent(eventId);
        return result;
      } catch (error) {
        manager.endEvent(eventId, {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    };
    return descriptor;
  };
}
let globalPerformanceManager;
function getGlobalPerformanceManager() {
  if (!globalPerformanceManager) {
    globalPerformanceManager = createPerformanceManager();
  }
  return globalPerformanceManager;
}
function setGlobalPerformanceManager(manager) {
  globalPerformanceManager = manager;
}

exports.PerformanceManagerImpl = PerformanceManagerImpl;
exports.createPerformanceManager = createPerformanceManager;
exports.getGlobalPerformanceManager = getGlobalPerformanceManager;
exports.performance = performance;
exports.setGlobalPerformanceManager = setGlobalPerformanceManager;
//# sourceMappingURL=performance-manager.cjs.map
