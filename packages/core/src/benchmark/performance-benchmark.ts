/**
 * 性能基准测试工具
 * 用于对比优化前后的性能差异
 */

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryUsed?: number;
}

export interface ComparisonResult {
  baseline: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: {
    timeReduction: number;
    speedup: number;
    memoryReduction?: number;
  };
}

/**
 * 性能基准测试类
 */
export class PerformanceBenchmark {
  private results: Map<string, BenchmarkResult> = new Map();

  /**
   * 运行基准测试
   */
  async run(
    name: string,
    fn: () => void | Promise<void>,
    options: {
      iterations?: number;
      warmup?: number;
      measureMemory?: boolean;
    } = {}
  ): Promise<BenchmarkResult> {
    const iterations = options.iterations || 10000;
    const warmup = options.warmup || 100;
    const measureMemory = options.measureMemory ?? false;

    // 预热
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // 垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }

    const times: number[] = [];
    let memoryBefore = 0;
    let memoryAfter = 0;

    if (measureMemory && typeof process !== 'undefined') {
      memoryBefore = process.memoryUsage().heapUsed;
    }

    // 执行测试
    const startTotal = performance.now();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const endTotal = performance.now();
    const totalTime = endTotal - startTotal;

    if (measureMemory && typeof process !== 'undefined') {
      memoryAfter = process.memoryUsage().heapUsed;
    }

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      opsPerSecond: (iterations / totalTime) * 1000,
      memoryUsed: measureMemory ? memoryAfter - memoryBefore : undefined
    };

    this.results.set(name, result);
    return result;
  }

  /**
   * 对比两个实现
   */
  async compare(
    baselineName: string,
    baselineFn: () => void | Promise<void>,
    optimizedName: string,
    optimizedFn: () => void | Promise<void>,
    options?: Parameters<typeof this.run>[2]
  ): Promise<ComparisonResult> {
    console.log(`\n🔍 Running baseline: ${baselineName}...`);
    const baseline = await this.run(baselineName, baselineFn, options);

    console.log(`🚀 Running optimized: ${optimizedName}...`);
    const optimized = await this.run(optimizedName, optimizedFn, options);

    const timeReduction = ((baseline.averageTime - optimized.averageTime) / baseline.averageTime) * 100;
    const speedup = baseline.averageTime / optimized.averageTime;

    const comparison: ComparisonResult = {
      baseline,
      optimized,
      improvement: {
        timeReduction,
        speedup,
        memoryReduction: baseline.memoryUsed && optimized.memoryUsed
          ? ((baseline.memoryUsed - optimized.memoryUsed) / baseline.memoryUsed) * 100
          : undefined
      }
    };

    this.printComparison(comparison);
    return comparison;
  }

  /**
   * 获取结果
   */
  getResult(name: string): BenchmarkResult | undefined {
    return this.results.get(name);
  }

  /**
   * 获取所有结果
   */
  getAllResults(): Map<string, BenchmarkResult> {
    return new Map(this.results);
  }

  /**
   * 清空结果
   */
  clear(): void {
    this.results.clear();
  }

  /**
   * 打印单个结果
   */
  printResult(result: BenchmarkResult): void {
    console.log(`\n📊 ${result.name}`);
    console.log(`   迭代次数: ${result.iterations.toLocaleString()}`);
    console.log(`   总时间: ${result.totalTime.toFixed(2)}ms`);
    console.log(`   平均时间: ${result.averageTime.toFixed(4)}ms`);
    console.log(`   最小时间: ${result.minTime.toFixed(4)}ms`);
    console.log(`   最大时间: ${result.maxTime.toFixed(4)}ms`);
    console.log(`   操作/秒: ${result.opsPerSecond.toFixed(0)}`);
    if (result.memoryUsed !== undefined) {
      console.log(`   内存使用: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  /**
   * 打印对比结果
   */
  printComparison(comparison: ComparisonResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📈 性能对比结果');
    console.log('='.repeat(60));

    this.printResult(comparison.baseline);
    this.printResult(comparison.optimized);

    console.log('\n💡 性能提升:');
    console.log(`   时间减少: ${comparison.improvement.timeReduction.toFixed(2)}%`);
    console.log(`   速度提升: ${comparison.improvement.speedup.toFixed(2)}x`);

    if (comparison.improvement.memoryReduction !== undefined) {
      console.log(`   内存减少: ${comparison.improvement.memoryReduction.toFixed(2)}%`);
    }

    if (comparison.improvement.speedup >= 2) {
      console.log('   🎉 优化效果显著！');
    } else if (comparison.improvement.speedup >= 1.2) {
      console.log('   ✅ 优化效果良好');
    } else if (comparison.improvement.speedup >= 1) {
      console.log('   ⚠️  优化效果一般');
    } else {
      console.log('   ❌ 性能反而下降');
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * 导出结果为 JSON
   */
  exportJSON(): string {
    const data = Array.from(this.results.entries()).map(([name, result]) => ({
      name,
      ...result
    }));
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出结果为 Markdown 表格
   */
  exportMarkdown(): string {
    const results = Array.from(this.results.values());
    if (results.length === 0) return '';

    let md = '| 测试名称 | 迭代次数 | 平均时间(ms) | 操作/秒 | 内存(MB) |\n';
    md += '|---------|---------|-------------|---------|----------|\n';

    for (const result of results) {
      const memory = result.memoryUsed !== undefined
        ? (result.memoryUsed / 1024 / 1024).toFixed(2)
        : '-';

      md += `| ${result.name} | ${result.iterations.toLocaleString()} | `;
      md += `${result.averageTime.toFixed(4)} | ${result.opsPerSecond.toFixed(0)} | ${memory} |\n`;
    }

    return md;
  }
}

/**
 * 创建基准测试实例
 */
export function createBenchmark(): PerformanceBenchmark {
  return new PerformanceBenchmark();
}

/**
 * 快速基准测试（单次运行）
 */
export async function quickBenchmark(
  name: string,
  fn: () => void | Promise<void>,
  iterations = 10000
): Promise<BenchmarkResult> {
  const benchmark = createBenchmark();
  return benchmark.run(name, fn, { iterations });
}

/**
 * 快速对比测试
 */
export async function quickCompare(
  baselineName: string,
  baselineFn: () => void | Promise<void>,
  optimizedName: string,
  optimizedFn: () => void | Promise<void>,
  iterations = 10000
): Promise<ComparisonResult> {
  const benchmark = createBenchmark();
  return benchmark.compare(
    baselineName,
    baselineFn,
    optimizedName,
    optimizedFn,
    { iterations }
  );
}