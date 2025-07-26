#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import { createEngine } from '../src/index.js'

interface BenchmarkResult {
  name: string
  duration: number
  operations: number
  opsPerSecond: number
  memoryUsage: {
    before: NodeJS.MemoryUsage
    after: NodeJS.MemoryUsage
    delta: NodeJS.MemoryUsage
  }
}

interface BenchmarkReport {
  timestamp: string
  nodeVersion: string
  platform: string
  results: BenchmarkResult[]
  summary: {
    totalDuration: number
    averageOpsPerSecond: number
    memoryEfficiency: number
  }
}

// 模拟引擎类用于基准测试
class MockEngine {
  private plugins: any[] = []
  private middleware: any[] = []
  private events: Map<string, Function[]> = new Map()
  private state: any = {}

  use(plugin: any) {
    this.plugins.push(plugin)
  }

  addMiddleware(middleware: any) {
    this.middleware.push(middleware)
  }

  on(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)
  }

  emit(event: string, data?: any) {
    const handlers = this.events.get(event) || []
    handlers.forEach(handler => handler(data))
  }

  setState(key: string, value: any) {
    this.state[key] = value
  }

  getState(key: string) {
    return this.state[key]
  }
}

class EngineBenchmark {
  private results: BenchmarkResult[] = []

  // 运行单个基准测试
  private async runBenchmark(
    name: string,
    operations: number,
    testFn: () => void | Promise<void>
  ): Promise<BenchmarkResult> {
    console.log(chalk.blue(`🏃 运行基准测试: ${name}`))

    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
    }

    const memoryBefore = process.memoryUsage()
    const startTime = performance.now()

    // 执行测试
    for (let i = 0; i < operations; i++) {
      await testFn()
    }

    const endTime = performance.now()
    const memoryAfter = process.memoryUsage()

    const duration = endTime - startTime
    const opsPerSecond = Math.round((operations / duration) * 1000)

    const result: BenchmarkResult = {
      name,
      duration,
      operations,
      opsPerSecond,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        delta: {
          rss: memoryAfter.rss - memoryBefore.rss,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          external: memoryAfter.external - memoryBefore.external,
          arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
        },
      },
    }

    console.log(chalk.green(`✅ ${name}: ${opsPerSecond.toLocaleString()} ops/sec`))
    return result
  }

  // 引擎创建基准测试
  private async benchmarkEngineCreation(): Promise<void> {
    const result = await this.runBenchmark(
      '引擎创建',
      1000,
      () => {
        const engine = createEngine({
          name: 'benchmark-engine',
          version: '1.0.0',
        })
        // 模拟一些基本操作
        engine.use({ name: 'test-plugin' })
      }
    )
    this.results.push(result)
  }

  // 插件注册基准测试
  private async benchmarkPluginRegistration(): Promise<void> {
    const engine = new MockEngine()
    const result = await this.runBenchmark(
      '插件注册',
      5000,
      () => {
        engine.use({
          name: `plugin-${Math.random()}`,
          install: () => {},
        })
      }
    )
    this.results.push(result)
  }

  // 事件系统基准测试
  private async benchmarkEventSystem(): Promise<void> {
    const engine = new MockEngine()
    
    // 注册事件监听器
    for (let i = 0; i < 100; i++) {
      engine.on('test-event', () => {})
    }

    const result = await this.runBenchmark(
      '事件触发',
      10000,
      () => {
        engine.emit('test-event', { data: 'test' })
      }
    )
    this.results.push(result)
  }

  // 中间件执行基准测试
  private async benchmarkMiddleware(): Promise<void> {
    const engine = new MockEngine()
    
    // 添加中间件
    for (let i = 0; i < 10; i++) {
      engine.addMiddleware({
        name: `middleware-${i}`,
        execute: (context: any, next: Function) => next(),
      })
    }

    const result = await this.runBenchmark(
      '中间件执行',
      5000,
      () => {
        // 模拟中间件链执行
        const context = { data: 'test' }
        engine.middleware.forEach(mw => {
          if (mw.execute) {
            mw.execute(context, () => {})
          }
        })
      }
    )
    this.results.push(result)
  }

  // 状态管理基准测试
  private async benchmarkStateManagement(): Promise<void> {
    const engine = new MockEngine()
    
    const result = await this.runBenchmark(
      '状态管理',
      10000,
      () => {
        const key = `state-${Math.random()}`
        engine.setState(key, { value: Math.random() })
        engine.getState(key)
      }
    )
    this.results.push(result)
  }

  // 大数据集处理基准测试
  private async benchmarkLargeDataset(): Promise<void> {
    const engine = new MockEngine()
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
      data: new Array(100).fill(Math.random()),
    }))

    const result = await this.runBenchmark(
      '大数据集处理',
      100,
      () => {
        largeData.forEach((item, index) => {
          engine.setState(`item-${index}`, item)
          engine.emit('data-processed', item)
        })
      }
    )
    this.results.push(result)
  }

  // 内存使用测试
  private async benchmarkMemoryUsage(): Promise<void> {
    console.log(chalk.blue('\n🧠 内存使用测试...'))
    
    const engines: any[] = []
    const memoryBefore = process.memoryUsage()

    // 创建多个引擎实例
    for (let i = 0; i < 100; i++) {
      const engine = new MockEngine()
      
      // 添加一些数据
      for (let j = 0; j < 50; j++) {
        engine.setState(`key-${j}`, { data: new Array(100).fill(i) })
        engine.on(`event-${j}`, () => {})
      }
      
      engines.push(engine)
    }

    const memoryAfter = process.memoryUsage()
    const memoryDelta = {
      rss: memoryAfter.rss - memoryBefore.rss,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      external: memoryAfter.external - memoryBefore.external,
      arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
    }

    console.log(chalk.green('✅ 内存使用统计:'))
    console.log(chalk.white(`   RSS: ${this.formatBytes(memoryDelta.rss)}`))
    console.log(chalk.white(`   Heap Total: ${this.formatBytes(memoryDelta.heapTotal)}`))
    console.log(chalk.white(`   Heap Used: ${this.formatBytes(memoryDelta.heapUsed)}`))
    console.log(chalk.white(`   External: ${this.formatBytes(memoryDelta.external)}`))
  }

  // 格式化字节数
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
    const value = bytes / Math.pow(k, i)
    const sign = bytes < 0 ? '-' : '+'
    return `${sign}${Number.parseFloat(value.toFixed(2))} ${sizes[i]}`
  }

  // 生成报告
  private generateReport(): BenchmarkReport {
    const totalDuration = this.results.reduce((sum, result) => sum + result.duration, 0)
    const averageOpsPerSecond = Math.round(
      this.results.reduce((sum, result) => sum + result.opsPerSecond, 0) / this.results.length
    )
    
    // 计算内存效率（操作数 / 内存使用）
    const totalOps = this.results.reduce((sum, result) => sum + result.operations, 0)
    const totalMemoryUsed = this.results.reduce(
      (sum, result) => sum + Math.max(0, result.memoryUsage.delta.heapUsed),
      0
    )
    const memoryEfficiency = totalMemoryUsed > 0 ? Math.round(totalOps / (totalMemoryUsed / 1024 / 1024)) : 0

    return {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: `${process.platform} ${process.arch}`,
      results: this.results,
      summary: {
        totalDuration,
        averageOpsPerSecond,
        memoryEfficiency,
      },
    }
  }

  // 显示结果
  private displayResults(report: BenchmarkReport): void {
    console.log(chalk.blue.bold('\n📊 基准测试报告'))
    console.log(chalk.gray(`时间: ${new Date(report.timestamp).toLocaleString()}`))
    console.log(chalk.gray(`Node.js: ${report.nodeVersion}`))
    console.log(chalk.gray(`平台: ${report.platform}`))
    console.log()

    console.log(chalk.yellow.bold('🏆 测试结果:'))
    report.results.forEach((result) => {
      console.log(chalk.white(`📈 ${result.name}:`))
      console.log(chalk.green(`   性能: ${result.opsPerSecond.toLocaleString()} ops/sec`))
      console.log(chalk.blue(`   耗时: ${result.duration.toFixed(2)}ms`))
      console.log(chalk.cyan(`   内存: ${this.formatBytes(result.memoryUsage.delta.heapUsed)}`))
      console.log()
    })

    console.log(chalk.yellow.bold('📋 总结:'))
    console.log(chalk.white(`⏱️  总耗时: ${report.summary.totalDuration.toFixed(2)}ms`))
    console.log(chalk.white(`⚡ 平均性能: ${report.summary.averageOpsPerSecond.toLocaleString()} ops/sec`))
    console.log(chalk.white(`🧠 内存效率: ${report.summary.memoryEfficiency} ops/MB`))
  }

  // 保存报告到文件
  private saveReport(report: BenchmarkReport): void {
    const reportPath = path.join(process.cwd(), 'benchmark-results.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(chalk.green(`\n💾 报告已保存到: ${reportPath}`))
  }

  // 运行所有基准测试
  async run(): Promise<void> {
    console.log(chalk.blue.bold('🚀 开始 @ldesign/engine 基准测试\n'))

    try {
      await this.benchmarkEngineCreation()
      await this.benchmarkPluginRegistration()
      await this.benchmarkEventSystem()
      await this.benchmarkMiddleware()
      await this.benchmarkStateManagement()
      await this.benchmarkLargeDataset()
      await this.benchmarkMemoryUsage()

      const report = this.generateReport()
      this.displayResults(report)
      this.saveReport(report)

      console.log(chalk.green.bold('\n✅ 基准测试完成!'))
    } catch (error) {
      console.error(chalk.red('❌ 基准测试失败:'), error)
      process.exit(1)
    }
  }
}

// 运行基准测试
if (import.meta.url.includes('benchmark.ts') || process.argv[1]?.includes('benchmark.ts')) {
  const benchmark = new EngineBenchmark()
  benchmark.run().catch(console.error)
}

export { EngineBenchmark }