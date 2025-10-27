/**
 * 高级使用示例
 * 
 * 展示引擎的高级功能：
 * - 依赖注入
 * - 插件系统
 * - 性能监控
 * - 错误处理
 * - 批量操作
 */

import {
  createEngine,
  createDIContainer,
  createAdvancedLogger,
  ConsoleTransport,
  PrettyFormatter,
  createFlamegraph,
  createMemoryTimeline,
  createEventFlowVisualizer
} from '@ldesign/engine'
import { createApp } from 'vue'
import App from './App.vue'

// ============ 1. 依赖注入示例 ============

const container = createDIContainer()

// 注册服务
class Logger {
  log(msg: string) {
    console.log(`[Logger] ${msg}`)
  }
}

class ApiService {
  constructor(private logger: Logger) { }

  async fetchData() {
    this.logger.log('Fetching data...')
    return { data: 'example' }
  }
}

container.register('Logger', Logger, 'singleton')
container.register('ApiService', ApiService, 'transient', ['Logger'])

// 解析服务
const apiService = container.resolve<ApiService>('ApiService')

// ============ 2. 增强日志系统 ============

const logger = createAdvancedLogger()
logger.addTransport(new ConsoleTransport(new PrettyFormatter()))

logger.info('应用启动', { version: '1.0.0' }, 'App')

// ============ 3. 创建引擎（带高级配置） ============

const engine = createEngine({
  debug: true,
  logger: { level: 'debug' },
  cache: {
    maxSize: 200,
    strategy: 'lru',
    defaultTTL: 300000, // 5分钟
    enableStats: true
  },
  performance: {
    enabled: true
  }
})

// ============ 4. 注册插件 ============

const analyticsPlugin = {
  name: 'analytics',
  version: '1.0.0',
  install: async (context) => {
    context.logger.info('Analytics plugin installed')

    // 监听所有事件
    context.events.on('*', (data) => {
      console.log('[Analytics] Event:', data)
    })

    // 页面访问追踪
    context.events.on('route:changed', (route) => {
      console.log('[Analytics] Page view:', route)
    })
  }
}

const performancePlugin = {
  name: 'performance-monitor',
  version: '1.0.0',
  dependencies: ['analytics'],
  install: async (context) => {
    context.logger.info('Performance monitor installed')

    // 监控关键操作
    context.events.on('api:call', async (data: any) => {
      const startTime = performance.now()

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 100))

      const duration = performance.now() - startTime
      context.logger.info(`API调用耗时: ${duration.toFixed(2)}ms`)
    })
  }
}

engine.use(analyticsPlugin)
engine.use(performancePlugin)

// ============ 5. 性能监控 ============

const flamegraph = createFlamegraph()
const memoryTimeline = createMemoryTimeline()
const eventVisualizer = createEventFlowVisualizer()

// 开始监控
flamegraph.start()
memoryTimeline.start(1000) // 每秒采样
eventVisualizer.start()

// ============ 6. 批量操作示例 ============

async function loadUserData() {
  // 批量设置状态
  engine.state.batchSet({
    'app.loading': true,
    'app.status': 'fetching',
    'app.lastUpdate': Date.now()
  })

  try {
    // 使用缓存预热
    await engine.cache.warmup([
      { key: 'config', loader: () => fetchConfig() },
      { key: 'permissions', loader: () => fetchPermissions() },
      { key: 'theme', loader: () => fetchTheme() }
    ])

    // 批量获取缓存
    const cached = await Promise.all([
      engine.cache.get('config'),
      engine.cache.get('permissions'),
      engine.cache.get('theme')
    ])

    console.log('预热完成:', cached)

  } finally {
    engine.state.batchSet({
      'app.loading': false,
      'app.status': 'ready'
    })
  }
}

// ============ 7. 事务操作示例 ============

function transferBalance(fromUser: string, toUser: string, amount: number) {
  engine.state.transaction(() => {
    const fromBalance = engine.state.get<number>(`users.${fromUser}.balance`) || 0
    const toBalance = engine.state.get<number>(`users.${toUser}.balance`) || 0

    if (fromBalance < amount) {
      throw new Error('余额不足')
    }

    engine.state.set(`users.${fromUser}.balance`, fromBalance - amount)
    engine.state.set(`users.${toUser}.balance`, toBalance + amount)

    // 如果发生错误，会自动回滚
  })
}

// ============ 8. 性能分析 ============

async function performanceDemo() {
  // 标记开始
  engine.performance.mark('demo-start')

  // 执行操作
  await loadUserData()

  // 标记结束
  engine.performance.mark('demo-end')

  // 测量性能
  const duration = engine.performance.measure('demo', 'demo-start', 'demo-end')
  console.log(`操作耗时: ${duration}ms`)

  // 获取性能指标
  const metrics = engine.performance.getMetrics()
  console.log('性能指标:', metrics)
}

// ============ 9. 创建Vue应用 ============

const app = createApp(App)
engine.install(app)
app.mount('#app')

// ============ 10. 初始化数据 ============

async function initialize() {
  try {
    await loadUserData()
    await performanceDemo()

    // 10秒后生成性能报告
    setTimeout(() => {
      generatePerformanceReport()
    }, 10000)

  } catch (error) {
    console.error('初始化失败:', error)
  }
}

initialize()

// ============ 11. 性能报告 ============

function generatePerformanceReport() {
  // 停止监控
  const flamegraphData = flamegraph.stop()
  memoryTimeline.stop()
  eventVisualizer.stop()

  // 生成报告
  console.log('=== 性能火焰图 ===')
  console.log(flamegraph.generateReport())

  console.log('\n=== 内存趋势 ===')
  const trend = memoryTimeline.analyzeTrend()
  console.log('增长率:', trend.growthRate.toFixed(2), '%/s')
  console.log('预警级别:', trend.warning)

  console.log('\n=== 事件统计 ===')
  const eventStats = eventVisualizer.getStats()
  console.log('总事件数:', eventStats.totalEvents)
  console.log('平均耗时:', eventStats.averageDuration.toFixed(2), 'ms')

  console.log('\n=== 缓存统计 ===')
  const cacheStats = engine.cache.getStats()
  console.log('命中率:', cacheStats.hitRate.toFixed(2), '%')
  console.log('内存使用:', (cacheStats.memoryUsage / 1024).toFixed(2), 'KB')

  // 导出数据
  flamegraph.exportJSON('flamegraph.json')
  const memoryData = memoryTimeline.export()
  const eventData = eventVisualizer.exportJSON()

  console.log('性能数据已导出')
}

// ============ 辅助函数 ============

async function fetchConfig() {
  await new Promise(resolve => setTimeout(resolve, 50))
  return {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  }
}

async function fetchPermissions() {
  await new Promise(resolve => setTimeout(resolve, 30))
  return ['read', 'write', 'delete']
}

async function fetchTheme() {
  await new Promise(resolve => setTimeout(resolve, 20))
  return {
    primary: '#42b983',
    secondary: '#2c3e50'
  }
}

