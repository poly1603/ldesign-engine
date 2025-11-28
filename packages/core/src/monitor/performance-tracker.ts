/**
 * 性能监控跟踪器
 * @module monitor/performance-tracker
 */

import type {
  PerformanceMetric,
  PerformanceConfig,
  PerformanceTracker,
  ModuleStats,
} from '../types/monitoring';
import { logger } from '../utils/logger';

/**
 * 默认性能配置
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  slowThreshold: 100, // 100ms
  autoLogSlowOps: true,
  collectMemory: true,
  samplingRate: 1.0,
  maxMetrics: 1000,
};

/**
 * 性能跟踪器实现
 */
class PerformanceTrackerImpl implements PerformanceTracker {
  private config: PerformanceConfig;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private moduleStats: Map<string, ModuleStats> = new Map();
  private idCounter = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 开始跟踪性能
   */
  start(name: string, module: string, metadata?: Record<string, any>): string {
    if (!this.config.enabled) {
      return '';
    }

    // 采样检查
    if (Math.random() > this.config.samplingRate) {
      return '';
    }

    const id = `${module}-${name}-${++this.idCounter}`;
    const metric: PerformanceMetric = {
      name,
      operation: name,
      startTime: this.getTime(),
      module,
      metadata,
    };

    this.metrics.set(id, metric);

    logger.debug(module, name, 'Performance tracking started', {
      id,
      ...metadata,
    });

    return id;
  }

  /**
   * 结束跟踪性能
   */
  end(id: string): PerformanceMetric | undefined {
    if (!id || !this.metrics.has(id)) {
      return undefined;
    }

    const metric = this.metrics.get(id)!;
    metric.endTime = this.getTime();
    metric.duration = metric.endTime - metric.startTime;
    metric.isSlow = metric.duration > this.config.slowThreshold;

    // 从活跃跟踪中移除
    this.metrics.delete(id);

    // 添加到已完成指标
    this.addCompletedMetric(metric);

    // 更新模块统计
    this.updateModuleStats(metric);

    // 自动记录慢操作
    if (this.config.autoLogSlowOps && metric.isSlow) {
      logger.warn(
        metric.module,
        metric.operation,
        `Slow operation detected: ${metric.duration.toFixed(2)}ms`,
        {
          threshold: this.config.slowThreshold,
          duration: metric.duration,
          ...metric.metadata,
        }
      );
    } else {
      logger.debug(
        metric.module,
        metric.operation,
        `Operation completed in ${metric.duration.toFixed(2)}ms`,
        {
          duration: metric.duration,
          ...metric.metadata,
        }
      );
    }

    return metric;
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.completedMetrics];
  }

  /**
   * 清除指标
   */
  clearMetrics(): void {
    this.completedMetrics = [];
    this.moduleStats.clear();
    logger.info('PerformanceTracker', 'clearMetrics', 'All metrics cleared');
  }

  /**
   * 获取慢操作
   */
  getSlowOperations(): PerformanceMetric[] {
    return this.completedMetrics.filter((m) => m.isSlow);
  }

  /**
   * 导出指标
   */
  exportMetrics(): string {
    const data = {
      timestamp: Date.now(),
      config: this.config,
      metrics: this.completedMetrics,
      moduleStats: Array.from(this.moduleStats.values()),
      summary: this.getSummary(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 获取模块统计
   */
  getModuleStats(module?: string): ModuleStats | ModuleStats[] {
    if (module) {
      return this.moduleStats.get(module) || this.createEmptyStats(module);
    }
    return Array.from(this.moduleStats.values());
  }

  /**
   * 获取性能摘要
   */
  getSummary(): {
    totalOperations: number;
    slowOperations: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
  } {
    if (this.completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        slowOperations: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }

    const durations = this.completedMetrics
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!);

    return {
      totalOperations: this.completedMetrics.length,
      slowOperations: this.getSlowOperations().length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('PerformanceTracker', 'updateConfig', 'Configuration updated', config);
  }

  /**
   * 获取当前时间（高精度）
   */
  private getTime(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * 添加已完成的指标
   */
  private addCompletedMetric(metric: PerformanceMetric): void {
    this.completedMetrics.push(metric);

    // 限制指标数量
    if (this.completedMetrics.length > this.config.maxMetrics) {
      this.completedMetrics.shift();
    }
  }

  /**
   * 更新模块统计
   */
  private updateModuleStats(metric: PerformanceMetric): void {
    if (!metric.duration) {
      return;
    }

    let stats = this.moduleStats.get(metric.module);
    if (!stats) {
      stats = this.createEmptyStats(metric.module);
      this.moduleStats.set(metric.module, stats);
    }

    stats.operationCount++;
    stats.totalDuration += metric.duration;
    stats.averageDuration = stats.totalDuration / stats.operationCount;
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
    stats.minDuration = Math.min(stats.minDuration, metric.duration);

    if (metric.isSlow) {
      stats.slowOperationCount++;
    }
  }

  /**
   * 创建空统计对象
   */
  private createEmptyStats(module: string): ModuleStats {
    return {
      module,
      operationCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Number.MAX_SAFE_INTEGER,
      errorCount: 0,
      slowOperationCount: 0,
    };
  }

  /**
   * 记录错误
   */
  recordError(module: string): void {
    let stats = this.moduleStats.get(module);
    if (!stats) {
      stats = this.createEmptyStats(module);
      this.moduleStats.set(module, stats);
    }
    stats.errorCount++;
  }

  /**
   * 获取内存使用信息
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if (!this.config.collectMemory) {
      return null;
    }

    // Node.js 环境
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        used: mem.heapUsed,
        total: mem.heapTotal,
        percentage: (mem.heapUsed / mem.heapTotal) * 100,
      };
    }

    // 浏览器环境
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        percentage: (mem.usedJSHeapSize / mem.totalJSHeapSize) * 100,
      };
    }

    return null;
  }
}

/**
 * 全局性能跟踪器实例
 */
let globalTracker: PerformanceTracker | null = null;

/**
 * 创建性能跟踪器
 */
export function createPerformanceTracker(config?: Partial<PerformanceConfig>): PerformanceTracker {
  return new PerformanceTrackerImpl(config);
}

/**
 * 获取全局性能跟踪器
 */
export function getPerformanceTracker(): PerformanceTracker {
  if (!globalTracker) {
    globalTracker = createPerformanceTracker();
  }
  return globalTracker;
}

/**
 * 设置全局性能跟踪器
 */
export function setPerformanceTracker(tracker: PerformanceTracker): void {
  globalTracker = tracker;
}

/**
 * 便捷的性能跟踪装饰器
 */
export function trackPerformance(module: string, operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const opName = operation || propertyKey;

    descriptor.value = async function (this: any, ...args: any[]) {
      const tracker = getPerformanceTracker();
      const id = tracker.start(opName, module);

      try {
        const result = await originalMethod.apply(this, args);
        tracker.end(id);
        return result;
      } catch (error) {
        tracker.end(id);
        if (tracker instanceof PerformanceTrackerImpl) {
          (tracker as any).recordError(module);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 便捷的性能跟踪函数包装器
 */
export async function withPerformanceTracking<T>(
  module: string,
  operation: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const tracker = getPerformanceTracker();
  const id = tracker.start(operation, module, metadata);

  try {
    const result = await fn();
    tracker.end(id);
    return result;
  } catch (error) {
    tracker.end(id);
    if (tracker instanceof PerformanceTrackerImpl) {
      (tracker as any).recordError(module);
    }
    throw error;
  }
}

/**
 * 导出性能跟踪器实现（用于类型检查）
 */
export { PerformanceTrackerImpl };