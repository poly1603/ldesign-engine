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

class MemoryMonitor {
  constructor(config = {}) {
    this.intervalId = null;
    this.memoryHistory = [];
    this.thresholds = {
      warning: 50 * 1024 * 1024,
      // 50MB
      error: 100 * 1024 * 1024,
      // 100MB
      growth: 0.5
      // 50% 增长率
    };
    this.isRunning = false;
    this.destroyed = false;
    this.checkInterval = config.checkInterval ?? 3e4;
    this.maxHistorySize = config.maxHistorySize ?? 20;
    this.onWarning = config.onWarning;
    this.onError = config.onError;
    if (config.thresholds) {
      this.thresholds = { ...this.thresholds, ...config.thresholds };
    }
    if (config.autoStart) {
      this.start();
    }
  }
  /**
   * 开始监控
   */
  start() {
    if (this.destroyed) {
      throw new Error("MemoryMonitor has been destroyed");
    }
    if (this.isRunning) {
      return;
    }
    this.check();
    this.intervalId = window.setInterval(() => {
      this.check();
    }, this.checkInterval);
    this.isRunning = true;
  }
  /**
   * 停止监控
   */
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
  /**
   * 立即执行一次检查
   */
  check() {
    const memory = this.getMemoryUsage();
    if (memory === null) {
      return;
    }
    this.memoryHistory.push(memory);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
    this.checkThresholds(memory);
    if (this.memoryHistory.length >= 3) {
      this.checkGrowthRate(memory);
    }
    if (this.memoryHistory.length >= 10) {
      this.checkPotentialLeak();
    }
  }
  /**
   * 检查阈值
   */
  checkThresholds(memory) {
    const now = Date.now();
    if (memory > this.thresholds.error) {
      this.onError?.({
        type: "threshold",
        current: memory,
        threshold: this.thresholds.error,
        message: `Memory usage (${this.formatBytes(memory)}) exceeds error threshold (${this.formatBytes(this.thresholds.error)})`,
        timestamp: now
      });
    } else if (memory > this.thresholds.warning) {
      this.onWarning?.({
        type: "threshold",
        current: memory,
        threshold: this.thresholds.warning,
        message: `Memory usage (${this.formatBytes(memory)}) exceeds warning threshold (${this.formatBytes(this.thresholds.warning)})`,
        timestamp: now
      });
    }
  }
  /**
   * 检查增长率
   */
  checkGrowthRate(memory) {
    const growthRate = this.calculateGrowthRate();
    if (growthRate > this.thresholds.growth) {
      this.onWarning?.({
        type: "growth",
        current: memory,
        growthRate,
        message: `Memory growth rate (${(growthRate * 100).toFixed(1)}%) exceeds threshold (${(this.thresholds.growth * 100).toFixed(1)}%)`,
        timestamp: Date.now()
      });
    }
  }
  /**
   * 检查潜在内存泄漏
   * 如果内存持续增长且没有下降，可能存在泄漏
   */
  checkPotentialLeak() {
    if (this.memoryHistory.length < 10) {
      return;
    }
    const recent = this.memoryHistory.slice(-10);
    let increasingCount = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i - 1]) {
        increasingCount++;
      }
    }
    if (increasingCount >= 8) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const increase = last - first;
      const rate = increase / first;
      this.onWarning?.({
        type: "leak",
        current: last,
        growthRate: rate,
        message: `Potential memory leak detected: consistent growth over 10 checks (${this.formatBytes(increase)} increase, ${(rate * 100).toFixed(1)}% growth)`,
        timestamp: Date.now()
      });
    }
  }
  /**
   * 获取当前内存使用（字节）
   */
  getMemoryUsage() {
    if (typeof performance === "undefined") {
      return null;
    }
    const memory = performance.memory;
    if (!memory || typeof memory.usedJSHeapSize !== "number") {
      return null;
    }
    return memory.usedJSHeapSize;
  }
  /**
   * 计算内存增长率
   * 返回从第一个记录到最后一个记录的增长率
   */
  calculateGrowthRate() {
    if (this.memoryHistory.length < 2) {
      return 0;
    }
    const first = this.memoryHistory[0];
    const last = this.memoryHistory[this.memoryHistory.length - 1];
    if (first === 0) {
      return 0;
    }
    return (last - first) / first;
  }
  /**
   * 格式化字节数为可读字符串
   */
  formatBytes(bytes) {
    if (bytes === 0)
      return "0 B";
    if (bytes < 1024)
      return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  /**
   * 获取内存统计信息
   */
  getStats() {
    const current = this.getMemoryUsage();
    const history = [...this.memoryHistory];
    if (history.length === 0) {
      return {
        current,
        history: [],
        average: 0,
        peak: 0,
        minimum: 0,
        growthRate: 0,
        trend: "stable"
      };
    }
    const sum = history.reduce((a, b) => a + b, 0);
    const average = sum / history.length;
    const peak = Math.max(...history);
    const minimum = Math.min(...history);
    const growthRate = this.calculateGrowthRate();
    let trend = "stable";
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const overall = history.slice(0, -3);
      const overallAvg = overall.reduce((a, b) => a + b, 0) / overall.length;
      if (recentAvg > overallAvg * 1.1) {
        trend = "increasing";
      } else if (recentAvg < overallAvg * 0.9) {
        trend = "decreasing";
      }
    }
    return {
      current,
      history,
      average,
      peak,
      minimum,
      growthRate,
      trend
    };
  }
  /**
   * 重置历史记录
   */
  resetHistory() {
    this.memoryHistory = [];
  }
  /**
   * 更新配置
   */
  updateConfig(config) {
    if (config.checkInterval !== void 0) {
      this.checkInterval = config.checkInterval;
      if (this.isRunning) {
        this.stop();
        this.start();
      }
    }
    if (config.thresholds) {
      this.thresholds = { ...this.thresholds, ...config.thresholds };
    }
    if (config.onWarning !== void 0) {
      this.onWarning = config.onWarning;
    }
    if (config.onError !== void 0) {
      this.onError = config.onError;
    }
    if (config.maxHistorySize !== void 0) {
      this.maxHistorySize = config.maxHistorySize;
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize);
      }
    }
  }
  /**
   * 清理资源
   */
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.stop();
    this.memoryHistory = [];
    this.onWarning = void 0;
    this.onError = void 0;
    this.destroyed = true;
  }
  /**
   * 检查是否已销毁
   */
  isDestroyed() {
    return this.destroyed;
  }
  /**
   * 检查是否正在运行
   */
  isMonitoring() {
    return this.isRunning;
  }
}
function createMemoryMonitor(config) {
  return new MemoryMonitor(config);
}

exports.MemoryMonitor = MemoryMonitor;
exports.createMemoryMonitor = createMemoryMonitor;
//# sourceMappingURL=memory-monitor.cjs.map
