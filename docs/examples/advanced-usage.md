# 高级用法示例

本文档展示了 @ldesign/engine 的高级使用场景，包括复杂的插件架构、性能优化、错误恢复、动态配置等企业级应用场景。

## 微服务架构引擎

### 分布式服务管理

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 服务注册中心
class ServiceRegistry {
  private services: Map<string, ServiceInfo> = new Map()
  private healthChecks: Map<string, NodeJS.Timeout> = new Map()

  register(service: ServiceInfo) {
    this.services.set(service.id, service)
    this.startHealthCheck(service)
    console.log(`🔗 服务注册: ${service.name} (${service.id})`)
  }

  unregister(serviceId: string) {
    const service = this.services.get(serviceId)
    if (service) {
      this.stopHealthCheck(serviceId)
      this.services.delete(serviceId)
      console.log(`🔌 服务注销: ${service.name} (${serviceId})`)
    }
  }

  getService(serviceId: string): ServiceInfo | undefined {
    return this.services.get(serviceId)
  }

  getServicesByType(type: string): ServiceInfo[] {
    return Array.from(this.services.values()).filter(s => s.type === type)
  }

  getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values())
  }

  private startHealthCheck(service: ServiceInfo) {
    if (service.healthCheck) {
      const interval = setInterval(async () => {
        try {
          const isHealthy = await service.healthCheck!()
          if (!isHealthy) {
            console.warn(`⚠️ 服务健康检查失败: ${service.name}`)
            service.status = 'unhealthy'
          }
 else {
            service.status = 'healthy'
          }
        }
 catch (error) {
          console.error(`❌ 服务健康检查错误: ${service.name}`, error)
          service.status = 'error'
        }
      }, service.healthCheckInterval || 30000)

      this.healthChecks.set(service.id, interval)
    }
  }

  private stopHealthCheck(serviceId: string) {
    const interval = this.healthChecks.get(serviceId)
    if (interval) {
      clearInterval(interval)
      this.healthChecks.delete(serviceId)
    }
  }
}

interface ServiceInfo {
  id: string
  name: string
  type: string
  version: string
  endpoint: string
  status: 'healthy' | 'unhealthy' | 'error'
  metadata: Record<string, any>
  healthCheck?: () => Promise<boolean>
  healthCheckInterval?: number
}

// 负载均衡器
class LoadBalancer {
  private strategies: Map<string, LoadBalanceStrategy> = new Map()

  constructor() {
    // 注册默认策略
    this.strategies.set('round-robin', new RoundRobinStrategy())
    this.strategies.set('random', new RandomStrategy())
    this.strategies.set('least-connections', new LeastConnectionsStrategy())
  }

  selectService(services: ServiceInfo[], strategy: string = 'round-robin'): ServiceInfo | null {
    const healthyServices = services.filter(s => s.status === 'healthy')

    if (healthyServices.length === 0) {
      return null
    }

    const strategyImpl = this.strategies.get(strategy)
    if (!strategyImpl) {
      throw new Error(`未知的负载均衡策略: ${strategy}`)
    }

    return strategyImpl.select(healthyServices)
  }

  addStrategy(name: string, strategy: LoadBalanceStrategy) {
    this.strategies.set(name, strategy)
  }
}

interface LoadBalanceStrategy {
  select: (services: ServiceInfo[]) => ServiceInfo
}

class RoundRobinStrategy implements LoadBalanceStrategy {
  private currentIndex = 0

  select(services: ServiceInfo[]): ServiceInfo {
    const service = services[this.currentIndex % services.length]
    this.currentIndex++
    return service
  }
}

class RandomStrategy implements LoadBalanceStrategy {
  select(services: ServiceInfo[]): ServiceInfo {
    const index = Math.floor(Math.random() * services.length)
    return services[index]
  }
}

class LeastConnectionsStrategy implements LoadBalanceStrategy {
  private connections: Map<string, number> = new Map()

  select(services: ServiceInfo[]): ServiceInfo {
    let selectedService = services[0]
    let minConnections = this.connections.get(selectedService.id) || 0

    for (const service of services) {
      const connections = this.connections.get(service.id) || 0
      if (connections < minConnections) {
        selectedService = service
        minConnections = connections
      }
    }

    return selectedService
  }

  incrementConnections(serviceId: string) {
    const current = this.connections.get(serviceId) || 0
    this.connections.set(serviceId, current + 1)
  }

  decrementConnections(serviceId: string) {
    const current = this.connections.get(serviceId) || 0
    this.connections.set(serviceId, Math.max(0, current - 1))
  }
}

// 服务网关插件
const ServiceGatewayPlugin: Plugin = {
  name: 'ServiceGateway',
  version: '1.0.0',

  install(engine) {
    const registry = new ServiceRegistry()
    const loadBalancer = new LoadBalancer()

    // 注册服务到引擎状态
    engine.setState('serviceRegistry', registry)
    engine.setState('loadBalancer', loadBalancer)

    // 服务发现中间件
    engine.middleware('serviceDiscovery', async (context, next) => {
      const { request } = context

      if (request.serviceType) {
        const services = registry.getServicesByType(request.serviceType)
        const selectedService = loadBalancer.selectService(services, request.loadBalanceStrategy)

        if (!selectedService) {
          context.response = {
            status: 503,
            error: `没有可用的 ${request.serviceType} 服务`
          }
          return
        }

        context.state.selectedService = selectedService
        console.log(`🎯 选择服务: ${selectedService.name} (${selectedService.endpoint})`)
      }

      await next()
    })

    // 服务代理中间件
    engine.middleware('serviceProxy', async (context, next) => {
      const { selectedService } = context.state

      if (selectedService) {
        try {
          // 模拟服务调用
          const response = await this.callService(selectedService, context.request)
          context.response = response
        }
 catch (error) {
          console.error(`❌ 服务调用失败: ${selectedService.name}`, error)
          context.response = {
            status: 502,
            error: '服务调用失败'
          }
        }
      }

      await next()
    })

    // 注册服务管理 API
    engine.on('service:register', (serviceInfo: ServiceInfo) => {
      registry.register(serviceInfo)
    })

    engine.on('service:unregister', (serviceId: string) => {
      registry.unregister(serviceId)
    })

    console.log('🌐 服务网关插件已安装')
  },

  async callService(service: ServiceInfo, request: any): Promise<any> {
    // 模拟 HTTP 调用
    console.log(`📡 调用服务: ${service.endpoint}${request.path || ''}`)

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))

    // 模拟响应
    return {
      status: 200,
      data: {
        service: service.name,
        timestamp: Date.now(),
        result: `来自 ${service.name} 的响应`
      },
      headers: {
        'X-Service-ID': service.id,
        'X-Service-Version': service.version
      }
    }
  },

  uninstall(engine) {
    const registry = engine.getState('serviceRegistry') as ServiceRegistry
    if (registry) {
      // 清理所有服务
      registry.getAllServices().forEach((service) => {
        registry.unregister(service.id)
      })
    }

    engine.removeState('serviceRegistry')
    engine.removeState('loadBalancer')

    console.log('🌐 服务网关插件已卸载')
  }
}

// 使用微服务架构
const gatewayEngine = new Engine({
  name: 'ServiceGateway',
  debug: true
})

gatewayEngine.use(ServiceGatewayPlugin)

gatewayEngine.start().then(() => {
  console.log('=== 微服务架构示例 ===')

  const registry = gatewayEngine.getState('serviceRegistry') as ServiceRegistry

  // 注册模拟服务
  const services: ServiceInfo[] = [
    {
      id: 'user-service-1',
      name: 'UserService',
      type: 'user',
      version: '1.0.0',
      endpoint: 'http://user-service-1:8080',
      status: 'healthy',
      metadata: { region: 'us-east-1' },
      healthCheck: async () => Math.random() > 0.1, // 90% 健康率
      healthCheckInterval: 5000
    },
    {
      id: 'user-service-2',
      name: 'UserService',
      type: 'user',
      version: '1.0.0',
      endpoint: 'http://user-service-2:8080',
      status: 'healthy',
      metadata: { region: 'us-west-1' },
      healthCheck: async () => Math.random() > 0.2, // 80% 健康率
      healthCheckInterval: 5000
    },
    {
      id: 'order-service-1',
      name: 'OrderService',
      type: 'order',
      version: '1.1.0',
      endpoint: 'http://order-service-1:8080',
      status: 'healthy',
      metadata: { region: 'us-east-1' },
      healthCheck: async () => Math.random() > 0.05, // 95% 健康率
      healthCheckInterval: 5000
    }
  ]

  services.forEach((service) => {
    gatewayEngine.emit('service:register', service)
  })

  // 模拟服务请求
  async function makeRequest(serviceType: string, path: string, strategy?: string) {
    const context = {
      request: {
        serviceType,
        path,
        loadBalanceStrategy: strategy,
        method: 'GET'
      },
      response: null,
      state: {},
      requestId: `req_${Date.now()}`
    }

    try {
      await gatewayEngine.executeMiddleware(context)
      return context.response
    }
 catch (error) {
      return {
        status: 500,
        error: error.message
      }
    }
  }

  // 测试负载均衡
  setTimeout(async () => {
    console.log('\n=== 测试负载均衡 ===')

    // 测试轮询策略
    console.log('\n轮询策略:')
    for (let i = 0; i < 5; i++) {
      const response = await makeRequest('user', '/api/users', 'round-robin')
      console.log(`请求 ${i + 1}:`, response?.data?.service)
    }

    // 测试随机策略
    console.log('\n随机策略:')
    for (let i = 0; i < 5; i++) {
      const response = await makeRequest('user', '/api/users', 'random')
      console.log(`请求 ${i + 1}:`, response?.data?.service)
    }

    // 测试订单服务
    console.log('\n订单服务:')
    const orderResponse = await makeRequest('order', '/api/orders')
    console.log('订单响应:', orderResponse)
  }, 2000)

  // 模拟服务故障
  setTimeout(() => {
    console.log('\n=== 模拟服务故障 ===')

    // 注销一个用户服务
    gatewayEngine.emit('service:unregister', 'user-service-1')

    setTimeout(async () => {
      console.log('\n故障后的请求:')
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest('user', '/api/users')
        console.log(`请求 ${i + 1}:`, response?.data?.service || response?.error)
      }
    }, 1000)
  }, 8000)
})
```

## 性能监控和优化

### 性能监控插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 性能指标收集器
class PerformanceCollector {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private aggregatedMetrics: Map<string, AggregatedMetric> = new Map()
  private maxMetricsPerType = 1000

  record(type: string, metric: PerformanceMetric) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, [])
    }

    const typeMetrics = this.metrics.get(type)!
    typeMetrics.push(metric)

    // 限制内存使用
    if (typeMetrics.length > this.maxMetricsPerType) {
      typeMetrics.shift()
    }

    this.updateAggregatedMetrics(type)
  }

  private updateAggregatedMetrics(type: string) {
    const typeMetrics = this.metrics.get(type) || []
    if (typeMetrics.length === 0)
return

    const durations = typeMetrics.map(m => m.duration)
    const memoryUsages = typeMetrics.map(m => m.memoryUsage || 0)

    const aggregated: AggregatedMetric = {
      type,
      count: typeMetrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99)
      },
      memoryUsage: {
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
        avg: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      },
      errorRate: typeMetrics.filter(m => m.error).length / typeMetrics.length,
      lastUpdated: Date.now()
    }

    this.aggregatedMetrics.set(type, aggregated)
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[Math.max(0, index)]
  }

  getMetrics(type?: string): AggregatedMetric[] {
    if (type) {
      const metric = this.aggregatedMetrics.get(type)
      return metric ? [metric] : []
    }

    return Array.from(this.aggregatedMetrics.values())
  }

  getDetailedMetrics(type: string, limit = 100): PerformanceMetric[] {
    const typeMetrics = this.metrics.get(type) || []
    return typeMetrics.slice(-limit)
  }

  clear(type?: string) {
    if (type) {
      this.metrics.delete(type)
      this.aggregatedMetrics.delete(type)
    }
 else {
      this.metrics.clear()
      this.aggregatedMetrics.clear()
    }
  }
}

interface PerformanceMetric {
  timestamp: number
  duration: number
  memoryUsage?: number
  error?: boolean
  metadata?: Record<string, any>
}

interface AggregatedMetric {
  type: string
  count: number
  duration: {
    min: number
    max: number
    avg: number
    p95: number
    p99: number
  }
  memoryUsage: {
    min: number
    max: number
    avg: number
  }
  errorRate: number
  lastUpdated: number
}

// 性能警报管理器
class PerformanceAlertManager {
  private rules: AlertRule[] = []
  private alerts: Alert[] = []
  private maxAlerts = 100

  addRule(rule: AlertRule) {
    this.rules.push(rule)
    console.log(`🚨 添加性能警报规则: ${rule.name}`)
  }

  removeRule(ruleName: string) {
    const index = this.rules.findIndex(r => r.name === ruleName)
    if (index > -1) {
      this.rules.splice(index, 1)
      console.log(`🗑️ 移除性能警报规则: ${ruleName}`)
    }
  }

  checkMetrics(metrics: AggregatedMetric[]) {
    metrics.forEach((metric) => {
      this.rules.forEach((rule) => {
        if (rule.condition(metric)) {
          this.triggerAlert(rule, metric)
        }
      })
    })
  }

  private triggerAlert(rule: AlertRule, metric: AggregatedMetric) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleName: rule.name,
      severity: rule.severity,
      message: rule.message(metric),
      metric,
      timestamp: Date.now(),
      acknowledged: false
    }

    this.alerts.push(alert)

    // 限制警报数量
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift()
    }

    console.log(`🚨 性能警报 [${rule.severity}]: ${alert.message}`)

    // 触发警报事件
    if (rule.action) {
      rule.action(alert)
    }
  }

  getAlerts(severity?: AlertSeverity): Alert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity)
    }
    return [...this.alerts]
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      console.log(`✅ 警报已确认: ${alertId}`)
    }
  }

  clearAlerts() {
    this.alerts = []
    console.log('🗑️ 所有警报已清除')
  }
}

interface AlertRule {
  name: string
  severity: AlertSeverity
  condition: (metric: AggregatedMetric) => boolean
  message: (metric: AggregatedMetric) => string
  action?: (alert: Alert) => void
}

interface Alert {
  id: string
  ruleName: string
  severity: AlertSeverity
  message: string
  metric: AggregatedMetric
  timestamp: number
  acknowledged: boolean
}

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

// 性能优化建议器
class PerformanceOptimizer {
  generateRecommendations(metrics: AggregatedMetric[]): Recommendation[] {
    const recommendations: Recommendation[] = []

    metrics.forEach((metric) => {
      // 检查响应时间
      if (metric.duration.avg > 1000) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          title: `${metric.type} 响应时间过长`,
          description: `平均响应时间 ${metric.duration.avg.toFixed(2)}ms，建议优化`,
          suggestions: [
            '检查数据库查询性能',
            '添加缓存层',
            '优化算法复杂度',
            '考虑异步处理'
          ]
        })
      }

      // 检查错误率
      if (metric.errorRate > 0.05) {
        recommendations.push({
          type: 'reliability',
          priority: metric.errorRate > 0.1 ? 'critical' : 'high',
          title: `${metric.type} 错误率过高`,
          description: `错误率 ${(metric.errorRate * 100).toFixed(2)}%，需要立即处理`,
          suggestions: [
            '检查错误日志',
            '增加错误处理',
            '添加重试机制',
            '改进输入验证'
          ]
        })
      }

      // 检查内存使用
      if (metric.memoryUsage.avg > 100 * 1024 * 1024) { // 100MB
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          title: `${metric.type} 内存使用过高`,
          description: `平均内存使用 ${(metric.memoryUsage.avg / 1024 / 1024).toFixed(2)}MB`,
          suggestions: [
            '检查内存泄漏',
            '优化数据结构',
            '实现对象池',
            '增加垃圾回收'
          ]
        })
      }

      // 检查 P95 响应时间
      if (metric.duration.p95 > 2000) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          title: `${metric.type} P95 响应时间过长`,
          description: `P95 响应时间 ${metric.duration.p95.toFixed(2)}ms，影响用户体验`,
          suggestions: [
            '分析慢查询',
            '优化热点代码',
            '增加监控粒度',
            '考虑负载均衡'
          ]
        })
      }
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
}

interface Recommendation {
  type: 'performance' | 'reliability' | 'memory' | 'security'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  suggestions: string[]
}

// 性能监控插件
const PerformanceMonitorPlugin: Plugin = {
  name: 'PerformanceMonitor',
  version: '1.0.0',

  install(engine) {
    const collector = new PerformanceCollector()
    const alertManager = new PerformanceAlertManager()
    const optimizer = new PerformanceOptimizer()

    engine.setState('performanceCollector', collector)
    engine.setState('performanceAlertManager', alertManager)
    engine.setState('performanceOptimizer', optimizer)

    // 性能监控中间件
    engine.middleware('performanceMonitor', async (context, next) => {
      const startTime = Date.now()
      const startMemory = process.memoryUsage?.().heapUsed || 0

      let error = false

      try {
        await next()
      }
 catch (err) {
        error = true
        throw err
      }
 finally {
        const endTime = Date.now()
        const endMemory = process.memoryUsage?.().heapUsed || 0

        const metric: PerformanceMetric = {
          timestamp: startTime,
          duration: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          error,
          metadata: {
            action: context.request.action,
            method: context.request.method,
            url: context.request.url
          }
        }

        const metricType = context.request.action || 'unknown'
        collector.record(metricType, metric)
      }
    })

    // 设置默认警报规则
    alertManager.addRule({
      name: 'high-response-time',
      severity: 'high',
      condition: metric => metric.duration.avg > 2000,
      message: metric => `${metric.type} 平均响应时间过长: ${metric.duration.avg.toFixed(2)}ms`,
      action: (alert) => {
        engine.emit('performance:alert', alert)
      }
    })

    alertManager.addRule({
      name: 'high-error-rate',
      severity: 'critical',
      condition: metric => metric.errorRate > 0.1,
      message: metric => `${metric.type} 错误率过高: ${(metric.errorRate * 100).toFixed(2)}%`,
      action: (alert) => {
        engine.emit('performance:alert', alert)
      }
    })

    // 定期检查性能指标
    const checkInterval = setInterval(() => {
      const metrics = collector.getMetrics()
      alertManager.checkMetrics(metrics)

      // 生成优化建议
      const recommendations = optimizer.generateRecommendations(metrics)
      if (recommendations.length > 0) {
        engine.emit('performance:recommendations', recommendations)
      }
    }, 10000) // 每10秒检查一次

    engine.setState('performanceCheckInterval', checkInterval)

    // 性能报告 API
    engine.on('performance:getReport', () => {
      const metrics = collector.getMetrics()
      const alerts = alertManager.getAlerts()
      const recommendations = optimizer.generateRecommendations(metrics)

      const report = {
        timestamp: Date.now(),
        metrics,
        alerts: alerts.filter(a => !a.acknowledged),
        recommendations,
        summary: {
          totalMetrics: metrics.length,
          activeAlerts: alerts.filter(a => !a.acknowledged).length,
          criticalRecommendations: recommendations.filter(r => r.priority === 'critical').length
        }
      }

      engine.emit('performance:report', report)
    })

    console.log('📊 性能监控插件已安装')
  },

  uninstall(engine) {
    const checkInterval = engine.getState('performanceCheckInterval')
    if (checkInterval) {
      clearInterval(checkInterval)
    }

    engine.removeState('performanceCollector')
    engine.removeState('performanceAlertManager')
    engine.removeState('performanceOptimizer')
    engine.removeState('performanceCheckInterval')

    console.log('📊 性能监控插件已卸载')
  }
}

// 使用性能监控
const performanceEngine = new Engine({
  name: 'PerformanceExample',
  debug: true
})

performanceEngine.use(PerformanceMonitorPlugin)

// 模拟业务逻辑中间件
performanceEngine.middleware('businessLogic', async (context, next) => {
  const { request } = context

  switch (request.action) {
    case 'fastOperation':
      // 快速操作
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50))
      context.response = { status: 200, data: 'Fast operation completed' }
      break

    case 'slowOperation':
      // 慢操作
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      context.response = { status: 200, data: 'Slow operation completed' }
      break

    case 'errorProneOperation':
      // 容易出错的操作
      if (Math.random() < 0.3) {
        throw new Error('Random error occurred')
      }
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      context.response = { status: 200, data: 'Error prone operation completed' }
      break

    case 'memoryIntensiveOperation':
      // 内存密集型操作
      const largeArray = Array.from({ length: 1000000 }).fill(0).map(() => Math.random())
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
      context.response = {
        status: 200,
        data: `Memory intensive operation completed, array length: ${largeArray.length}`
      }
      break

    default:
      context.response = { status: 400, error: 'Unknown operation' }
  }

  await next()
})

performanceEngine.start().then(() => {
  console.log('=== 性能监控示例 ===')

  // 监听性能事件
  performanceEngine.on('performance:alert', (alert) => {
    console.log(`🚨 性能警报: ${alert.message}`)
  })

  performanceEngine.on('performance:recommendations', (recommendations) => {
    console.log('\n💡 性能优化建议:')
    recommendations.slice(0, 3).forEach((rec) => {
      console.log(`- [${rec.priority.toUpperCase()}] ${rec.title}`)
      console.log(`  ${rec.description}`)
    })
  })

  performanceEngine.on('performance:report', (report) => {
    console.log('\n📊 性能报告:')
    console.log(`- 监控指标: ${report.summary.totalMetrics} 个`)
    console.log(`- 活跃警报: ${report.summary.activeAlerts} 个`)
    console.log(`- 关键建议: ${report.summary.criticalRecommendations} 个`)

    if (report.metrics.length > 0) {
      console.log('\n主要指标:')
      report.metrics.forEach((metric) => {
        console.log(`- ${metric.type}: 平均 ${metric.duration.avg.toFixed(2)}ms, P95 ${metric.duration.p95.toFixed(2)}ms, 错误率 ${(metric.errorRate * 100).toFixed(2)}%`)
      })
    }
  })

  // 模拟各种操作
  async function simulateOperations() {
    const operations = [
      'fastOperation',
      'slowOperation',
      'errorProneOperation',
      'memoryIntensiveOperation'
    ]

    for (let i = 0; i < 50; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)]

      const context = {
        request: {
          action: operation,
          method: 'POST',
          url: `/api/${operation}`
        },
        response: null,
        state: {},
        requestId: `req_${i}`
      }

      try {
        await performanceEngine.executeMiddleware(context)
        console.log(`✅ ${operation} 完成`)
      }
 catch (error) {
        console.log(`❌ ${operation} 失败: ${error.message}`)
      }

      // 随机延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    }
  }

  // 开始模拟
  setTimeout(() => {
    console.log('\n开始性能测试...')
    simulateOperations()
  }, 1000)

  // 定期生成报告
  setInterval(() => {
    performanceEngine.emit('performance:getReport')
  }, 15000)
})
```

## 错误恢复和容错机制

### 自动恢复插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 断路器模式实现
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000,
    private successThreshold: number = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN'
        this.successCount = 0
        console.log('🔄 断路器进入半开状态')
      }
 else {
        throw new Error('断路器开启，操作被拒绝')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    }
 catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED'
        console.log('✅ 断路器关闭，服务恢复正常')
      }
    }
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      console.log('🚫 断路器开启，服务暂时不可用')
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    console.log('🔄 断路器已重置')
  }
}

// 重试机制
class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      jitter = true,
      retryCondition = () => true
    } = options

    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation()
        if (attempt > 1) {
          console.log(`✅ 重试成功，第 ${attempt} 次尝试`)
        }
        return result
      }
 catch (error) {
        lastError = error as Error

        if (attempt === maxAttempts || !retryCondition(error as Error, attempt)) {
          console.log(`❌ 重试失败，已达到最大尝试次数 (${maxAttempts})`)
          throw lastError
        }

        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffFactor, jitter)
        console.log(`⏳ 第 ${attempt} 次尝试失败，${delay}ms 后重试: ${lastError.message}`)

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffFactor: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * backoffFactor ** (attempt - 1)
    delay = Math.min(delay, maxDelay)

    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.floor(delay)
  }
}

interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  jitter?: boolean
  retryCondition?: (error: Error, attempt: number) => boolean
}

// 健康检查管理器
class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map()
  private results: Map<string, HealthCheckResult> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  register(name: string, check: HealthCheck) {
    this.checks.set(name, check)
    this.startCheck(name)
    console.log(`💓 注册健康检查: ${name}`)
  }

  unregister(name: string) {
    this.stopCheck(name)
    this.checks.delete(name)
    this.results.delete(name)
    console.log(`🗑️ 注销健康检查: ${name}`)
  }

  private startCheck(name: string) {
    const check = this.checks.get(name)!

    const runCheck = async () => {
      try {
        const startTime = Date.now()
        const isHealthy = await check.check()
        const duration = Date.now() - startTime

        const result: HealthCheckResult = {
          name,
          healthy: isHealthy,
          timestamp: Date.now(),
          duration,
          message: isHealthy ? 'OK' : 'Health check failed'
        }

        this.results.set(name, result)

        if (!isHealthy) {
          console.log(`❌ 健康检查失败: ${name}`)
          if (check.onUnhealthy) {
            check.onUnhealthy(result)
          }
        }
      }
 catch (error) {
        const result: HealthCheckResult = {
          name,
          healthy: false,
          timestamp: Date.now(),
          duration: 0,
          message: error.message,
          error: error as Error
        }

        this.results.set(name, result)
        console.log(`❌ 健康检查错误: ${name} - ${error.message}`)

        if (check.onError) {
          check.onError(result)
        }
      }
    }

    // 立即执行一次
    runCheck()

    // 设置定期检查
    const interval = setInterval(runCheck, check.interval || 30000)
    this.intervals.set(name, interval)
  }

  private stopCheck(name: string) {
    const interval = this.intervals.get(name)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(name)
    }
  }

  getResult(name: string): HealthCheckResult | undefined {
    return this.results.get(name)
  }

  getAllResults(): HealthCheckResult[] {
    return Array.from(this.results.values())
  }

  getOverallHealth(): { healthy: boolean, details: HealthCheckResult[] } {
    const results = this.getAllResults()
    const healthy = results.length > 0 && results.every(r => r.healthy)

    return { healthy, details: results }
  }
}

interface HealthCheck {
  check: () => Promise<boolean>
  interval?: number
  onUnhealthy?: (result: HealthCheckResult) => void
  onError?: (result: HealthCheckResult) => void
}

interface HealthCheckResult {
  name: string
  healthy: boolean
  timestamp: number
  duration: number
  message: string
  error?: Error
}

// 故障恢复插件
const FaultTolerancePlugin: Plugin = {
  name: 'FaultTolerance',
  version: '1.0.0',

  install(engine) {
    const circuitBreakers: Map<string, CircuitBreaker> = new Map()
    const retryManager = new RetryManager()
    const healthCheckManager = new HealthCheckManager()

    engine.setState('circuitBreakers', circuitBreakers)
    engine.setState('retryManager', retryManager)
    engine.setState('healthCheckManager', healthCheckManager)

    // 断路器中间件
    engine.middleware('circuitBreaker', async (context, next) => {
      const { request } = context
      const breakerKey = request.action || 'default'

      if (!circuitBreakers.has(breakerKey)) {
        circuitBreakers.set(breakerKey, new CircuitBreaker())
      }

      const breaker = circuitBreakers.get(breakerKey)!

      try {
        await breaker.execute(async () => {
          await next()
        })
      }
 catch (error) {
        if (error.message.includes('断路器开启')) {
          context.response = {
            status: 503,
            error: '服务暂时不可用，请稍后重试'
          }
        }
 else {
          throw error
        }
      }
    })

    // 重试中间件
    engine.middleware('retry', async (context, next) => {
      const { request } = context
      const retryOptions = request.retryOptions || {}

      await retryManager.executeWithRetry(async () => {
        await next()

        // 检查响应状态，决定是否需要重试
        if (context.response?.status >= 500) {
          throw new Error(`服务器错误: ${context.response.status}`)
        }
      }, {
        maxAttempts: 3,
        baseDelay: 1000,
        retryCondition: (error, attempt) => {
          // 只重试服务器错误，不重试客户端错误
          return error.message.includes('服务器错误') || error.message.includes('网络错误')
        },
        ...retryOptions
      })
    })

    // 降级处理中间件
    engine.middleware('fallback', async (context, next) => {
      try {
        await next()
      }
 catch (error) {
        const { request } = context

        // 提供降级响应
        if (request.fallback) {
          console.log(`🔄 执行降级处理: ${request.action}`)
          context.response = request.fallback
        }
 else {
          // 默认降级响应
          context.response = {
            status: 200,
            data: null,
            message: '服务暂时不可用，返回默认响应',
            fallback: true
          }
        }
      }
    })

    // 注册基本健康检查
    healthCheckManager.register('engine', {
      check: async () => {
        return engine.isRunning()
      },
      interval: 10000,
      onUnhealthy: (result) => {
        console.log('🚨 引擎健康检查失败，尝试重启')
        engine.restart().catch(console.error)
      }
    })

    healthCheckManager.register('memory', {
      check: async () => {
        if (typeof process !== 'undefined' && process.memoryUsage) {
          const usage = process.memoryUsage()
          const heapUsedMB = usage.heapUsed / 1024 / 1024
          return heapUsedMB < 500 // 内存使用小于 500MB 认为健康
        }
        return true
      },
      interval: 15000,
      onUnhealthy: (result) => {
        console.log('🚨 内存使用过高，建议进行垃圾回收')
        if (global.gc) {
          global.gc()
        }
      }
    })

    // 故障恢复 API
    engine.on('fault:reset', (breakerKey?: string) => {
      if (breakerKey) {
        const breaker = circuitBreakers.get(breakerKey)
        if (breaker) {
          breaker.reset()
        }
      }
 else {
        circuitBreakers.forEach(breaker => breaker.reset())
      }
    })

    engine.on('fault:status', () => {
      const status = {
        circuitBreakers: Array.from(circuitBreakers.entries()).map(([key, breaker]) => ({
          key,
          ...breaker.getState()
        })),
        healthChecks: healthCheckManager.getAllResults(),
        overallHealth: healthCheckManager.getOverallHealth()
      }

      engine.emit('fault:statusReport', status)
    })

    console.log('🛡️ 故障容错插件已安装')
  },

  uninstall(engine) {
    const healthCheckManager = engine.getState('healthCheckManager') as HealthCheckManager
    if (healthCheckManager) {
      // 清理所有健康检查
      healthCheckManager.getAllResults().forEach((result) => {
        healthCheckManager.unregister(result.name)
      })
    }

    engine.removeState('circuitBreakers')
    engine.removeState('retryManager')
    engine.removeState('healthCheckManager')

    console.log('🛡️ 故障容错插件已卸载')
  }
}

// 使用故障容错
const faultTolerantEngine = new Engine({
  name: 'FaultTolerantExample',
  debug: true
})

faultTolerantEngine.use(FaultTolerancePlugin)

// 模拟不稳定的服务
let serviceFailureRate = 0.3 // 30% 失败率
let serviceDown = false

faultTolerantEngine.middleware('unstableService', async (context, next) => {
  const { request } = context

  if (serviceDown) {
    throw new Error('服务器错误: 服务不可用')
  }

  if (Math.random() < serviceFailureRate) {
    throw new Error('网络错误: 连接超时')
  }

  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

  context.response = {
    status: 200,
    data: {
      message: `${request.action} 执行成功`,
      timestamp: Date.now()
    }
  }

  await next()
})

faultTolerantEngine.start().then(() => {
  console.log('=== 故障容错示例 ===')

  // 监听故障状态
  faultTolerantEngine.on('fault:statusReport', (status) => {
    console.log('\n🛡️ 故障容错状态报告:')
    console.log(`- 整体健康状态: ${status.overallHealth.healthy ? '健康' : '不健康'}`)

    if (status.circuitBreakers.length > 0) {
      console.log('- 断路器状态:')
      status.circuitBreakers.forEach((cb) => {
        console.log(`  ${cb.key}: ${cb.state} (失败次数: ${cb.failureCount})`)
      })
    }

    if (status.healthChecks.length > 0) {
      console.log('- 健康检查:')
      status.healthChecks.forEach((hc) => {
        console.log(`  ${hc.name}: ${hc.healthy ? '✅' : '❌'} (${hc.duration}ms)`)
      })
    }
  })

  // 模拟请求
  async function makeRequest(action: string, options: any = {}) {
    const context = {
      request: {
        action,
        method: 'POST',
        url: `/api/${action}`,
        fallback: {
          status: 200,
          data: { message: `${action} 降级响应`, fallback: true },
          message: '使用降级数据'
        },
        ...options
      },
      response: null,
      state: {},
      requestId: `req_${Date.now()}`
    }

    try {
      await faultTolerantEngine.executeMiddleware(context)
      return context.response
    }
 catch (error) {
      return {
        status: 500,
        error: error.message
      }
    }
  }

  // 测试正常情况
  setTimeout(async () => {
    console.log('\n=== 测试正常情况 ===')

    for (let i = 0; i < 5; i++) {
      const response = await makeRequest('normalOperation')
      console.log(`请求 ${i + 1}:`, response.data?.message || response.error)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, 2000)

  // 增加失败率，触发断路器
  setTimeout(() => {
    console.log('\n=== 增加失败率，测试断路器 ===')
    serviceFailureRate = 0.8 // 80% 失败率

    const testCircuitBreaker = async () => {
      for (let i = 0; i < 10; i++) {
        const response = await makeRequest('circuitBreakerTest')
        console.log(`请求 ${i + 1}:`, response.data?.message || response.error)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    testCircuitBreaker()
  }, 8000)

  // 模拟服务完全宕机
  setTimeout(() => {
    console.log('\n=== 模拟服务宕机，测试降级 ===')
    serviceDown = true

    const testFallback = async () => {
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest('fallbackTest')
        console.log(`降级请求 ${i + 1}:`, response.data?.message || response.error)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    testFallback()
  }, 15000)

  // 恢复服务
  setTimeout(() => {
    console.log('\n=== 恢复服务 ===')
    serviceDown = false
    serviceFailureRate = 0.1 // 降低失败率

    // 重置断路器
    faultTolerantEngine.emit('fault:reset')

    const testRecovery = async () => {
      for (let i = 0; i < 5; i++) {
        const response = await makeRequest('recoveryTest')
        console.log(`恢复请求 ${i + 1}:`, response.data?.message || response.error)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setTimeout(testRecovery, 2000)
  }, 20000)

  // 定期获取状态报告
  setInterval(() => {
    faultTolerantEngine.emit('fault:status')
  }, 10000)
})
```

## 总结

这些高级用法示例展示了 @ldesign/engine 在企业级应用中的强大能力：

1. **微服务架构** - 服务注册、发现、负载均衡
2. **性能监控** - 指标收集、警报管理、优化建议
3. **故障容错** - 断路器、重试机制、健康检查、降级处理

高级特性的优势：
- **可扩展性** - 支持大规模分布式系统
- **可观测性** - 全面的监控和诊断能力
- **可靠性** - 多层次的故障处理机制
- **可维护性** - 模块化的架构设计
- **高性能** - 优化的执行路径和资源管理

通过这些示例，您可以学习如何构建生产级的、高可用的应用系统。
