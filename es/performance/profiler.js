/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class Profiler {
  constructor(config = {}, engine, logger) {
    this.engine = engine;
    this.logger = logger;
    this.functionCalls = /* @__PURE__ */ new Map();
    this.componentRenders = /* @__PURE__ */ new Map();
    this.enabled = false;
    this.startTimestamp = 0;
    this.currentCallId = 0;
    this.config = {
      enableFunctionProfiling: config.enableFunctionProfiling ?? true,
      enableComponentProfiling: config.enableComponentProfiling ?? true,
      enableMemoryProfiling: config.enableMemoryProfiling ?? true,
      sampleRate: config.sampleRate ?? 1,
      // 默认100%采样
      slowThreshold: config.slowThreshold || 100,
      maxRecords: config.maxRecords || 1e3,
      autoReport: config.autoReport ?? false,
      reportInterval: config.reportInterval || 6e4
      // 1分钟
    };
  }
  /**
   * 开始分析
   */
  start() {
    if (this.enabled) {
      this.logger?.warn("Profiler already started");
      return;
    }
    this.enabled = true;
    this.startTimestamp = Date.now();
    if (this.config.autoReport) {
      this.startAutoReporting();
    }
    this.logger?.info("Performance profiler started");
  }
  /**
   * 停止分析
   */
  stop() {
    if (!this.enabled) {
      return;
    }
    this.enabled = false;
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = void 0;
    }
    this.logger?.info("Performance profiler stopped");
  }
  /**
   * 是否正在分析
   */
  isEnabled() {
    return this.enabled;
  }
  /**
   * 记录函数调用开始
   */
  startFunctionCall(functionName, args) {
    if (!this.enabled || !this.config.enableFunctionProfiling) {
      return -1;
    }
    if (Math.random() > this.config.sampleRate) {
      return -1;
    }
    const callId = ++this.currentCallId;
    const record = {
      name: functionName,
      startTime: performance.now(),
      args,
      callStack: this.captureCallStack()
    };
    if (this.config.enableMemoryProfiling) {
      record.memoryBefore = this.getMemoryUsage();
    }
    const calls = this.functionCalls.get(functionName) || [];
    calls.push(record);
    this.functionCalls.set(functionName, calls);
    if (calls.length > this.config.maxRecords) {
      calls.shift();
    }
    return callId;
  }
  /**
   * 记录函数调用结束
   */
  endFunctionCall(functionName, callId, result, error) {
    if (callId === -1) {
      return;
    }
    const calls = this.functionCalls.get(functionName);
    if (!calls) {
      return;
    }
    const record = calls[calls.length - 1];
    if (!record) {
      return;
    }
    record.endTime = performance.now();
    record.duration = record.endTime - record.startTime;
    record.result = result;
    record.error = error;
    if (this.config.enableMemoryProfiling) {
      record.memoryAfter = this.getMemoryUsage();
    }
    if (record.duration > this.config.slowThreshold) {
      this.logger?.warn(`Slow function detected: ${functionName}`, {
        duration: `${record.duration.toFixed(2)}ms`,
        threshold: `${this.config.slowThreshold}ms`
      });
    }
  }
  /**
   * 记录组件渲染
   */
  recordComponentRender(componentName, renderTime, props) {
    if (!this.enabled || !this.config.enableComponentProfiling) {
      return;
    }
    let record = this.componentRenders.get(componentName);
    if (!record) {
      record = {
        componentName,
        renderCount: 0,
        totalTime: 0,
        averageTime: 0,
        slowRenders: 0,
        lastRenderTime: Date.now()
      };
      this.componentRenders.set(componentName, record);
    }
    record.renderCount++;
    record.totalTime += renderTime;
    record.averageTime = record.totalTime / record.renderCount;
    record.lastRenderTime = Date.now();
    if (props) {
      record.props = props;
    }
    if (renderTime > 16) {
      record.slowRenders++;
      this.logger?.warn(`Slow component render: ${componentName}`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        slowRenderRate: `${(record.slowRenders / record.renderCount * 100).toFixed(1)}%`
      });
    }
  }
  /**
   * 生成性能报告
   */
  generateReport() {
    const now = Date.now();
    const duration = now - this.startTimestamp;
    const functionStats = /* @__PURE__ */ new Map();
    for (const [name, calls] of this.functionCalls) {
      const completedCalls = calls.filter((c) => c.duration !== void 0);
      const totalTime = completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
      const slowCalls = completedCalls.filter((c) => (c.duration || 0) > this.config.slowThreshold).length;
      functionStats.set(name, {
        totalTime,
        calls: completedCalls.length,
        slowCalls
      });
    }
    const totalFunctionCalls = Array.from(functionStats.values()).reduce((sum, s) => sum + s.calls, 0);
    const slowFunctions = Array.from(functionStats.values()).filter((s) => s.slowCalls > 0).length;
    const avgFunctionTime = totalFunctionCalls > 0 ? Array.from(functionStats.values()).reduce((sum, s) => sum + s.totalTime, 0) / totalFunctionCalls : 0;
    const components = Array.from(this.componentRenders.values());
    const totalComponentRenders = components.reduce((sum, c) => sum + c.renderCount, 0);
    const totalSlowRenders = components.reduce((sum, c) => sum + c.slowRenders, 0);
    const avgRenderTime = totalComponentRenders > 0 ? components.reduce((sum, c) => sum + c.totalTime, 0) / totalComponentRenders : 0;
    const memoryGrowth = this.calculateMemoryGrowth();
    const topSlowFunctions = Array.from(functionStats.entries()).map(([name, stats]) => ({
      name,
      avgTime: stats.totalTime / stats.calls,
      calls: stats.calls
    })).sort((a, b) => b.avgTime - a.avgTime).slice(0, 10);
    const topSlowComponents = components.map((c) => ({
      name: c.componentName,
      avgTime: c.averageTime,
      renders: c.renderCount
    })).sort((a, b) => b.avgTime - a.avgTime).slice(0, 10);
    const recommendations = this.generateRecommendations(functionStats, components, memoryGrowth);
    return {
      timestamp: now,
      duration,
      summary: {
        totalFunctionCalls,
        slowFunctions,
        averageFunctionTime: avgFunctionTime,
        totalComponentRenders,
        slowRenders: totalSlowRenders,
        averageRenderTime: avgRenderTime,
        memoryGrowth
      },
      topSlowFunctions,
      topSlowComponents,
      recommendations
    };
  }
  /**
   * 生成优化建议
   */
  generateRecommendations(functionStats, components, memoryGrowth) {
    const recommendations = [];
    const slowFunctions = Array.from(functionStats.entries()).filter(([, stats]) => stats.slowCalls > stats.calls * 0.1);
    if (slowFunctions.length > 0) {
      recommendations.push(`\u53D1\u73B0 ${slowFunctions.length} \u4E2A\u6027\u80FD\u74F6\u9888\u51FD\u6570\uFF0C\u5EFA\u8BAE\u4F18\u5316`);
      const slowest = slowFunctions.sort((a, b) => b[1].totalTime - a[1].totalTime)[0];
      if (slowest) {
        recommendations.push(`\u6700\u6162\u51FD\u6570: ${slowest[0]} (\u5E73\u5747 ${(slowest[1].totalTime / slowest[1].calls).toFixed(2)}ms)`);
      }
    }
    const slowComponents = components.filter((c) => c.averageTime > 16);
    if (slowComponents.length > 0) {
      recommendations.push(`\u53D1\u73B0 ${slowComponents.length} \u4E2A\u6E32\u67D3\u6162\u7684\u7EC4\u4EF6\uFF0C\u5EFA\u8BAE\u4F18\u5316`);
      const slowest = slowComponents.sort((a, b) => b.averageTime - a.averageTime)[0];
      if (slowest) {
        recommendations.push(`\u6700\u6162\u7EC4\u4EF6: ${slowest.componentName} (\u5E73\u5747 ${slowest.averageTime.toFixed(2)}ms, ${slowest.slowRenders}/${slowest.renderCount} \u6B21\u6162\u6E32\u67D3)`);
      }
    }
    if (memoryGrowth > 10 * 1024 * 1024) {
      recommendations.push(`\u5185\u5B58\u589E\u957F ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB\uFF0C\u68C0\u67E5\u662F\u5426\u6709\u5185\u5B58\u6CC4\u6F0F`);
    }
    if (recommendations.length === 0) {
      recommendations.push("\u6027\u80FD\u8868\u73B0\u826F\u597D\uFF0C\u7EE7\u7EED\u4FDD\u6301");
    }
    return recommendations;
  }
  /**
   * 计算内存增长
   */
  calculateMemoryGrowth() {
    if (!this.config.enableMemoryProfiling) {
      return 0;
    }
    const memoryDiffs = [];
    for (const calls of this.functionCalls.values()) {
      for (const call of calls) {
        if (call.memoryBefore !== void 0 && call.memoryAfter !== void 0) {
          memoryDiffs.push(call.memoryAfter - call.memoryBefore);
        }
      }
    }
    if (memoryDiffs.length === 0) {
      return 0;
    }
    return memoryDiffs.reduce((sum, diff) => sum + diff, 0) / memoryDiffs.length;
  }
  /**
   * 获取当前内存使用
   */
  getMemoryUsage() {
    if (typeof performance !== "undefined" && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }
  /**
   * 捕获调用栈
   */
  captureCallStack() {
    try {
      const stack = new Error().stack || "";
      const lines = stack.split("\n").slice(3);
      return lines.join("\n");
    } catch {
      return "";
    }
  }
  /**
   * 启动自动报告
   */
  startAutoReporting() {
    this.reportTimer = setInterval(() => {
      const report = this.generateReport();
      this.logger?.info("Performance Profile Report", report.summary);
      if (this.engine?.events) {
        this.engine.events.emit("profiler:report", report);
      }
    }, this.config.reportInterval);
  }
  /**
   * 清除记录
   */
  clearRecords() {
    this.functionCalls.clear();
    this.componentRenders.clear();
    this.logger?.debug("Profiler records cleared");
  }
  /**
   * 获取函数调用统计
   */
  getFunctionStats() {
    const stats = /* @__PURE__ */ new Map();
    for (const [name, calls] of this.functionCalls) {
      const completedCalls = calls.filter((c) => c.duration !== void 0);
      const totalTime = completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
      const avgTime = completedCalls.length > 0 ? totalTime / completedCalls.length : 0;
      stats.set(name, {
        calls: completedCalls.length,
        totalTime,
        avgTime
      });
    }
    return stats;
  }
  /**
   * 获取组件统计
   */
  getComponentStats() {
    return Array.from(this.componentRenders.values());
  }
  /**
   * 导出数据
   */
  exportData() {
    return JSON.stringify({
      functionCalls: Array.from(this.functionCalls.entries()),
      componentRenders: Array.from(this.componentRenders.entries()),
      startTimestamp: this.startTimestamp,
      config: this.config
    });
  }
  /**
   * 导入数据
   */
  importData(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.functionCalls) {
        this.functionCalls = new Map(parsed.functionCalls);
      }
      if (parsed.componentRenders) {
        this.componentRenders = new Map(parsed.componentRenders);
      }
      if (parsed.startTimestamp) {
        this.startTimestamp = parsed.startTimestamp;
      }
      this.logger?.info("Profiler data imported");
    } catch (error) {
      this.logger?.error("Failed to import profiler data", error);
    }
  }
  /**
   * 销毁分析器
   */
  destroy() {
    this.stop();
    this.clearRecords();
  }
}
function createProfiler(config, engine, logger) {
  return new Profiler(config, engine, logger);
}
function Profile(profiler) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const functionName = `${target.constructor?.name || "Unknown"}.${propertyKey}`;
    descriptor.value = async function(...args) {
      const prof = profiler || getGlobalProfiler();
      const callId = prof.startFunctionCall(functionName, args);
      try {
        const result = await originalMethod.apply(this, args);
        prof.endFunctionCall(functionName, callId, result);
        return result;
      } catch (error) {
        prof.endFunctionCall(functionName, callId, void 0, error);
        throw error;
      }
    };
    return descriptor;
  };
}
let globalProfiler;
function getGlobalProfiler() {
  if (!globalProfiler) {
    globalProfiler = createProfiler();
  }
  return globalProfiler;
}
function setGlobalProfiler(profiler) {
  globalProfiler = profiler;
}

export { Profile, Profiler, createProfiler, getGlobalProfiler, setGlobalProfiler };
//# sourceMappingURL=profiler.js.map
