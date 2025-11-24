/**
 * 高级性能监控系统
 * 实时监控应用性能指标，自动识别性能问题
 */

/**
 * 性能指标类型
 */
export enum MetricType {
  TIMING = 'timing',
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}

/**
 * 性能指标
 */
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * 性能阈值配置
 */
export interface ThresholdConfig {
  warning: number;
  critical: number;
}

/**
 * 性能警报
 */
export interface PerformanceAlert {
  metric: string;
  level: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

/**
 * 性能监控系统
 */
export class PerformanceMonitorSystem {
  private static instance: PerformanceMonitorSystem;

  private metrics = new Map<string, PerformanceMetric[]>();
  private thresholds = new Map<string, ThresholdConfig>();
  private alerts: PerformanceAlert[] = [];
  private maxMetricsPerType = 1000;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  // 实时性能数据
  private realtimeData = {
    fps: 0,
    memory: 0,
    cpu: 0,
    networkLatency: 0
  };

  private constructor() {
    this.setupDefaultThresholds();
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitorSystem {
    if (!PerformanceMonitorSystem.instance) {
      PerformanceMonitorSystem.instance = new PerformanceMonitorSystem();
    }
    return PerformanceMonitorSystem.instance;
  }

  /**
   * 记录时间指标
   */
  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      type: MetricType.TIMING,
      value: duration,
      timestamp: Date.now(),
      tags
    });

    this.checkThreshold(name, duration);
  }

  /**
   * 记录计数器
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const existing = this.getLatestMetric(name);
    const newValue = existing ? existing.value + value : value;

    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value: newValue,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * 记录仪表值
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: Date.now(),
      tags
    });

    this.checkThreshold(name, value);
  }

  /**
   * 记录直方图
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordTiming(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordTiming(name, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * 设置阈值
   */
  setThreshold(metric: string, config: ThresholdConfig): void {
    this.thresholds.set(metric, config);
  }

  /**
   * 注册警报回调
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * 获取实时性能数据
   */
  getRealtimeData(): typeof this.realtimeData {
    return { ...this.realtimeData };
  }

  /**
   * 获取指标统计
   */
  getMetricStats(name: string, timeWindow?: number): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    // 过滤时间窗口
    let filtered = metrics;
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filtered = metrics.filter(m => m.timestamp >= cutoff);
    }

    if (filtered.length === 0) return null;

    const values = filtered.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    };
  }

  /**
   * 获取所有警报
   */
  getAlerts(limit?: number): PerformanceAlert[] {
    if (limit) {
      return this.alerts.slice(-limit);
    }
    return [...this.alerts];
  }

  /**
   * 清除警报
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * 生成性能报告
   */
  generateReport(timeWindow?: number): {
    summary: {
      totalMetrics: number;
      totalAlerts: number;
      avgResponseTime: number;
      errorRate: number;
    };
    metrics: Record<string, any>;
    alerts: PerformanceAlert[];
    realtime: {
      fps: number;
      memory: number;
      cpu: number;
      networkLatency: number;
    };
  } {
    const metricNames = Array.from(this.metrics.keys());
    const metricsReport: Record<string, any> = {};

    for (const name of metricNames) {
      const stats = this.getMetricStats(name, timeWindow);
      if (stats) {
        metricsReport[name] = stats;
      }
    }

    // 计算平均响应时间
    const timingMetrics = metricNames.filter(name =>
      this.metrics.get(name)?.[0]?.type === MetricType.TIMING
    );
    const avgResponseTime = timingMetrics.length > 0
      ? timingMetrics.reduce((sum, name) => {
        const stats = this.getMetricStats(name, timeWindow);
        return sum + (stats?.avg || 0);
      }, 0) / timingMetrics.length
      : 0;

    // 计算错误率
    const errorMetrics = this.metrics.get('errors');
    const totalRequests = this.metrics.get('requests');
    const errorRate = errorMetrics && totalRequests
      ? (errorMetrics[errorMetrics.length - 1]?.value || 0) /
      (totalRequests[totalRequests.length - 1]?.value || 1)
      : 0;

    return {
      summary: {
        totalMetrics: metricNames.length,
        totalAlerts: this.alerts.length,
        avgResponseTime,
        errorRate
      },
      metrics: metricsReport,
      alerts: this.getAlerts(10),
      realtime: this.getRealtimeData()
    };
  }

  /**
   * 记录指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metrics = this.metrics.get(metric.name)!;
    metrics.push(metric);

    // 限制存储数量
    if (metrics.length > this.maxMetricsPerType) {
      metrics.shift();
    }
  }

  /**
   * 获取最新指标
   */
  private getLatestMetric(name: string): PerformanceMetric | undefined {
    const metrics = this.metrics.get(name);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
  }

  /**
   * 检查阈值
   */
  private checkThreshold(metric: string, value: number): void {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;

    let alert: PerformanceAlert | null = null;

    if (value >= threshold.critical) {
      alert = {
        metric,
        level: 'critical',
        value,
        threshold: threshold.critical,
        timestamp: Date.now(),
        message: `${metric} reached critical level: ${value} >= ${threshold.critical}`
      };
    } else if (value >= threshold.warning) {
      alert = {
        metric,
        level: 'warning',
        value,
        threshold: threshold.warning,
        timestamp: Date.now(),
        message: `${metric} reached warning level: ${value} >= ${threshold.warning}`
      };
    }

    if (alert) {
      this.alerts.push(alert);
      this.triggerAlertCallbacks(alert);
    }
  }

  /**
   * 触发警报回调
   */
  private triggerAlertCallbacks(alert: PerformanceAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    }
  }

  /**
   * 计算百分位数
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * 设置默认阈值
   */
  private setupDefaultThresholds(): void {
    this.setThreshold('response_time', { warning: 1000, critical: 3000 });
    this.setThreshold('memory_usage', { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 });
    this.setThreshold('error_rate', { warning: 0.05, critical: 0.1 });
    this.setThreshold('cpu_usage', { warning: 0.7, critical: 0.9 });
  }

  /**
   * 开始监控
   */
  private startMonitoring(): void {
    // 监控 FPS
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      this.monitorFPS();
    }

    // 监控内存
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      this.monitorMemory();
    }
  }

  /**
   * 监控 FPS
   */
  private monitorFPS(): void {
    let lastTime = performance.now();
    let frames = 0;

    const updateFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        this.realtimeData.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.recordGauge('fps', this.realtimeData.fps);

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  /**
   * 监控内存
   */
  private monitorMemory(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.realtimeData.memory = memory.usedJSHeapSize;
        this.recordGauge('memory_used', memory.usedJSHeapSize);
        this.recordGauge('memory_total', memory.totalJSHeapSize);
      }
    }, 5000); // 每5秒检查一次
  }
}

/**
 * 获取性能监控系统实例
 */
export function getPerformanceMonitor(): PerformanceMonitorSystem {
  return PerformanceMonitorSystem.getInstance();
}

/**
 * 性能装饰器
 */
export function measurePerformance(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const monitor = getPerformanceMonitor();
      return monitor.measure(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}