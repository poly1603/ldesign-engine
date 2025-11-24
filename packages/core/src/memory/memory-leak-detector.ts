/**
 * 内存泄漏检测工具
 * 
 * 功能特性：
 * 1. 自动检测常见内存泄漏模式
 * 2. 实时监控内存使用趋势
 * 3. 检测未清理的事件监听器
 * 4. 检测未清理的定时器
 * 5. 检测DOM引用泄漏
 * 6. 生成详细的泄漏报告
 * 
 * 使用场景：
 * - 开发环境实时监控
 * - 测试环境自动化检测
 * - 生产环境采样分析
 * 
 * @author LDesign优化团队
 * @version 2.0.0
 */

/**
 * 内存快照
 */
interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

/**
 * 泄漏检测结果
 */
export interface LeakDetectionResult {
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  leakType: string;
  description: string;
  memoryGrowth: number;
  affectedObjects: string[];
  recommendations: string[];
}

/**
 * 资源追踪项
 */
interface TrackedResource {
  id: string;
  type: 'event' | 'timer' | 'dom' | 'custom';
  createdAt: number;
  stackTrace?: string;
  metadata?: any;
}

/**
 * 检测器配置
 */
export interface MemoryLeakDetectorConfig {
  /** 采样间隔（毫秒） */
  samplingInterval?: number;
  /** 快照数量限制 */
  snapshotLimit?: number;
  /** 内存增长阈值（MB） */
  growthThreshold?: number;
  /** 是否启用详细日志 */
  verbose?: boolean;
  /** 是否自动检测 */
  autoDetect?: boolean;
  /** 检测间隔（毫秒） */
  detectionInterval?: number;
}

/**
 * 内存泄漏检测器
 * 
 * 使用示例：
 * ```typescript
 * const detector = MemoryLeakDetector.getInstance({
 *   samplingInterval: 5000,
 *   growthThreshold: 50,
 *   autoDetect: true
 * });
 * 
 * // 手动检测
 * const results = await detector.detect();
 * 
 * // 监听泄漏事件
 * detector.onLeakDetected((result) => {
 *   console.error('检测到内存泄漏:', result);
 * });
 * 
 * // 追踪资源
 * const resourceId = detector.trackResource('event', listener);
 * detector.untrackResource(resourceId);
 * ```
 */
export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;

  /** 配置 */
  private config: Required<MemoryLeakDetectorConfig>;

  /** 内存快照历史 */
  private snapshots: MemorySnapshot[] = [];

  /** 追踪的资源 */
  private trackedResources: Map<string, TrackedResource> = new Map();

  /** 泄漏检测回调 */
  private leakCallbacks: Array<(result: LeakDetectionResult) => void> = [];

  /** 采样定时器 */
  private samplingTimer?: NodeJS.Timeout;

  /** 检测定时器 */
  private detectionTimer?: NodeJS.Timeout;

  /** 是否正在运行 */
  private isRunning = false;

  private constructor(config: MemoryLeakDetectorConfig = {}) {
    this.config = {
      samplingInterval: config.samplingInterval ?? 5000,
      snapshotLimit: config.snapshotLimit ?? 100,
      growthThreshold: config.growthThreshold ?? 50,
      verbose: config.verbose ?? false,
      autoDetect: config.autoDetect ?? false,
      detectionInterval: config.detectionInterval ?? 30000,
    };
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: MemoryLeakDetectorConfig): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector(config);
    }
    return MemoryLeakDetector.instance;
  }

  /**
   * 开始监控
   */
  public start(): void {
    if (this.isRunning) {
      this.log('检测器已在运行');
      return;
    }

    this.isRunning = true;
    this.log('开始内存泄漏检测');

    // 启动采样
    this.samplingTimer = setInterval(() => {
      this.takeSnapshot();
    }, this.config.samplingInterval);

    // 自动检测
    if (this.config.autoDetect) {
      this.detectionTimer = setInterval(() => {
        this.detect();
      }, this.config.detectionInterval);
    }

    // 初始快照
    this.takeSnapshot();
  }

  /**
   * 停止监控
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.log('停止内存泄漏检测');

    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = undefined;
    }

    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = undefined;
    }
  }

  /**
   * 执行泄漏检测
   */
  public async detect(): Promise<LeakDetectionResult[]> {
    const results: LeakDetectionResult[] = [];

    // 1. 检测内存持续增长
    const memoryGrowthResult = this.detectMemoryGrowth();
    if (memoryGrowthResult) {
      results.push(memoryGrowthResult);
    }

    // 2. 检测未清理的资源
    const resourceLeakResult = this.detectResourceLeaks();
    if (resourceLeakResult) {
      results.push(resourceLeakResult);
    }

    // 3. 检测DOM泄漏
    const domLeakResult = this.detectDOMLeaks();
    if (domLeakResult) {
      results.push(domLeakResult);
    }

    // 4. 检测定时器泄漏
    const timerLeakResult = this.detectTimerLeaks();
    if (timerLeakResult) {
      results.push(timerLeakResult);
    }

    // 触发回调
    results.forEach((result) => {
      this.leakCallbacks.forEach((callback) => callback(result));
    });

    return results;
  }

  /**
   * 追踪资源
   */
  public trackResource(
    type: TrackedResource['type'],
    metadata?: any
  ): string {
    const id = this.generateResourceId();
    const resource: TrackedResource = {
      id,
      type,
      createdAt: Date.now(),
      stackTrace: this.captureStackTrace(),
      metadata,
    };

    this.trackedResources.set(id, resource);
    this.log(`追踪资源: ${type} (${id})`);

    return id;
  }

  /**
   * 取消追踪资源
   */
  public untrackResource(id: string): void {
    if (this.trackedResources.delete(id)) {
      this.log(`取消追踪资源: ${id}`);
    }
  }

  /**
   * 监听泄漏检测事件
   */
  public onLeakDetected(callback: (result: LeakDetectionResult) => void): () => void {
    this.leakCallbacks.push(callback);
    return () => {
      const index = this.leakCallbacks.indexOf(callback);
      if (index > -1) {
        this.leakCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 获取内存使用情况
   */
  public getMemoryUsage(): MemorySnapshot | null {
    if (this.snapshots.length === 0) {
      return null;
    }
    return this.snapshots[this.snapshots.length - 1];
  }

  /**
   * 获取内存趋势
   */
  public getMemoryTrend(): {
    growth: number;
    growthRate: number;
    isGrowing: boolean;
  } {
    if (this.snapshots.length < 2) {
      return { growth: 0, growthRate: 0, isGrowing: false };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const growth = last.heapUsed - first.heapUsed;
    const timeDiff = last.timestamp - first.timestamp;
    const growthRate = (growth / timeDiff) * 1000; // bytes per second

    return {
      growth: growth / (1024 * 1024), // MB
      growthRate: growthRate / (1024 * 1024), // MB/s
      isGrowing: growth > 0,
    };
  }

  /**
   * 生成检测报告
   */
  public generateReport(): string {
    const trend = this.getMemoryTrend();
    const current = this.getMemoryUsage();
    const resourceCount = this.trackedResources.size;

    let report = '=== 内存泄漏检测报告 ===\n\n';
    report += `检测时间: ${new Date().toISOString()}\n`;
    report += `快照数量: ${this.snapshots.length}\n\n`;

    if (current) {
      report += '当前内存使用:\n';
      report += `  堆已使用: ${(current.heapUsed / (1024 * 1024)).toFixed(2)} MB\n`;
      report += `  堆总量: ${(current.heapTotal / (1024 * 1024)).toFixed(2)} MB\n`;
      report += `  外部内存: ${(current.external / (1024 * 1024)).toFixed(2)} MB\n\n`;
    }

    report += '内存趋势:\n';
    report += `  增长量: ${trend.growth.toFixed(2)} MB\n`;
    report += `  增长率: ${trend.growthRate.toFixed(4)} MB/s\n`;
    report += `  是否增长: ${trend.isGrowing ? '是' : '否'}\n\n`;

    report += `未清理资源: ${resourceCount}\n`;
    if (resourceCount > 0) {
      const byType: Record<string, number> = {};
      this.trackedResources.forEach((resource) => {
        byType[resource.type] = (byType[resource.type] || 0) + 1;
      });
      Object.entries(byType).forEach(([type, count]) => {
        report += `  ${type}: ${count}\n`;
      });
    }

    return report;
  }

  /**
   * 清除历史数据
   */
  public clear(): void {
    this.snapshots = [];
    this.trackedResources.clear();
    this.log('清除历史数据');
  }

  // ============ 私有方法 ============

  /**
   * 拍摄内存快照
   */
  private takeSnapshot(): void {
    const memory = this.getCurrentMemory();
    this.snapshots.push(memory);

    // 限制快照数量
    if (this.snapshots.length > this.config.snapshotLimit) {
      this.snapshots.shift();
    }

    this.log(`拍摄快照: 堆使用 ${(memory.heapUsed / (1024 * 1024)).toFixed(2)} MB`);
  }

  /**
   * 获取当前内存使用
   */
  private getCurrentMemory(): MemorySnapshot {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        timestamp: Date.now(),
        heapUsed: mem.usedJSHeapSize || 0,
        heapTotal: mem.totalJSHeapSize || 0,
        external: 0,
        arrayBuffers: 0,
      };
    }

    // Node.js环境
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        timestamp: Date.now(),
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        arrayBuffers: mem.arrayBuffers || 0,
      };
    }

    // 降级方案
    return {
      timestamp: Date.now(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
    };
  }

  /**
   * 检测内存持续增长
   */
  private detectMemoryGrowth(): LeakDetectionResult | null {
    if (this.snapshots.length < 10) {
      return null;
    }

    const trend = this.getMemoryTrend();
    const thresholdBytes = this.config.growthThreshold * 1024 * 1024;

    if (trend.growth * 1024 * 1024 > thresholdBytes && trend.isGrowing) {
      const severity = this.calculateSeverity(trend.growth);

      return {
        detected: true,
        severity,
        leakType: 'memory-growth',
        description: `检测到持续的内存增长: ${trend.growth.toFixed(2)} MB`,
        memoryGrowth: trend.growth,
        affectedObjects: [],
        recommendations: [
          '检查是否有未清理的缓存',
          '检查是否有循环引用',
          '使用Chrome DevTools进行详细分析',
          '检查是否有持续创建但不释放的对象',
        ],
      };
    }

    return null;
  }

  /**
   * 检测资源泄漏
   */
  private detectResourceLeaks(): LeakDetectionResult | null {
    const longLivedResources = Array.from(this.trackedResources.values()).filter(
      (resource) => Date.now() - resource.createdAt > 5 * 60 * 1000 // 5分钟
    );

    if (longLivedResources.length > 10) {
      return {
        detected: true,
        severity: longLivedResources.length > 50 ? 'high' : 'medium',
        leakType: 'resource-leak',
        description: `检测到 ${longLivedResources.length} 个长期存活的资源`,
        memoryGrowth: 0,
        affectedObjects: longLivedResources.map((r) => `${r.type}:${r.id}`),
        recommendations: [
          '确保在组件卸载时清理资源',
          '使用资源追踪器自动管理生命周期',
          '检查事件监听器是否正确移除',
        ],
      };
    }

    return null;
  }

  /**
   * 检测DOM泄漏
   */
  private detectDOMLeaks(): LeakDetectionResult | null {
    const domResources = Array.from(this.trackedResources.values()).filter(
      (r) => r.type === 'dom'
    );

    if (domResources.length > 100) {
      return {
        detected: true,
        severity: 'medium',
        leakType: 'dom-leak',
        description: `检测到 ${domResources.length} 个可能的DOM引用泄漏`,
        memoryGrowth: 0,
        affectedObjects: domResources.map((r) => r.id),
        recommendations: [
          '移除对已删除DOM元素的引用',
          '使用WeakMap存储DOM相关数据',
          '在元素移除时清理相关事件监听器',
        ],
      };
    }

    return null;
  }

  /**
   * 检测定时器泄漏
   */
  private detectTimerLeaks(): LeakDetectionResult | null {
    const timerResources = Array.from(this.trackedResources.values()).filter(
      (r) => r.type === 'timer'
    );

    if (timerResources.length > 50) {
      return {
        detected: true,
        severity: 'high',
        leakType: 'timer-leak',
        description: `检测到 ${timerResources.length} 个未清理的定时器`,
        memoryGrowth: 0,
        affectedObjects: timerResources.map((r) => r.id),
        recommendations: [
          '确保清理所有setTimeout/setInterval',
          '在组件卸载时取消定时器',
          '使用资源追踪器自动管理定时器',
        ],
      };
    }

    return null;
  }

  /**
   * 计算严重程度
   */
  private calculateSeverity(growthMB: number): LeakDetectionResult['severity'] {
    if (growthMB > 200) return 'critical';
    if (growthMB > 100) return 'high';
    if (growthMB > 50) return 'medium';
    return 'low';
  }

  /**
   * 生成资源ID
   */
  private generateResourceId(): string {
    return `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 捕获堆栈跟踪
   */
  private captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3, 6).join('\n') : '';
  }

  /**
   * 日志输出
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[MemoryLeakDetector] ${message}`);
    }
  }
}

/**
 * 创建内存泄漏检测器
 */
export function createMemoryLeakDetector(
  config?: MemoryLeakDetectorConfig
): MemoryLeakDetector {
  return MemoryLeakDetector.getInstance(config);
}