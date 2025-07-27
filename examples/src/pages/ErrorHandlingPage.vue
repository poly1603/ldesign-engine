<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  AlertTriangle,
  ArrowDown,
  BarChart,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  Square,
  TestTube,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const isBatchRunning = ref(false)
const batchProgress = ref(0)
const autoScroll = ref(true)
const logContainer = ref<HTMLElement>()
let batchInterval: number | null = null

// 错误统计
const errorStats = ref({
  totalErrors: 127,
  warnings: 45,
  recovered: 98,
  avgRecoveryTime: 1250,
})

// 图表数据
const chartData = ref([
  { time: '00:00', errors: 5 },
  { time: '04:00', errors: 12 },
  { time: '08:00', errors: 8 },
  { time: '12:00', errors: 15 },
  { time: '16:00', errors: 22 },
  { time: '20:00', errors: 18 },
])

// 错误类型
const errorTypes = [
  {
    id: 'runtime',
    name: '运行时错误',
    icon: 'XCircle',
    severity: 'error',
    message: '未捕获的运行时异常',
  },
  {
    id: 'network',
    name: '网络错误',
    icon: 'AlertTriangle',
    severity: 'warning',
    message: '网络请求失败',
  },
  {
    id: 'validation',
    name: '验证错误',
    icon: 'AlertTriangle',
    severity: 'warning',
    message: '数据验证失败',
  },
  {
    id: 'permission',
    name: '权限错误',
    icon: 'XCircle',
    severity: 'error',
    message: '权限不足，无法执行操作',
  },
  {
    id: 'timeout',
    name: '超时错误',
    icon: 'Clock',
    severity: 'warning',
    message: '操作超时',
  },
]

// 自定义错误
const customError = ref({
  message: '',
  severity: 'error',
  category: 'runtime',
})

// 批量模拟设置
const batchSettings = ref({
  count: 10,
  interval: 1000,
  randomTypes: true,
})

// 新处理器
const newHandler = ref({
  name: '',
  type: 'logger',
  priority: 'medium',
})

// 错误处理器
const errorHandlers = ref([
  {
    id: 1,
    name: '控制台日志记录器',
    type: 'logger',
    priority: 'high',
    enabled: true,
    processedCount: 156,
    successRate: 100,
    avgProcessTime: 5,
  },
  {
    id: 2,
    name: '错误报告服务',
    type: 'reporter',
    priority: 'medium',
    enabled: true,
    processedCount: 89,
    successRate: 95,
    avgProcessTime: 250,
  },
  {
    id: 3,
    name: '自动恢复处理器',
    type: 'recovery',
    priority: 'high',
    enabled: true,
    processedCount: 67,
    successRate: 78,
    avgProcessTime: 1200,
  },
  {
    id: 4,
    name: '用户通知处理器',
    type: 'notification',
    priority: 'low',
    enabled: false,
    processedCount: 23,
    successRate: 100,
    avgProcessTime: 150,
  },
])

// 日志过滤
const logFilter = ref({
  search: '',
  severity: '',
  category: '',
  timeRange: 'all',
})

// 错误日志
const errorLogs = ref([
  {
    id: 1,
    timestamp: Date.now() - 300000,
    severity: 'error',
    category: 'runtime',
    source: 'PluginManager',
    message: '插件加载失败: plugin-auth',
    stack: 'Error: Plugin not found\n    at PluginManager.load (plugin-manager.js:45)\n    at Engine.start (engine.js:123)',
    context: {
      pluginName: 'plugin-auth',
      version: '1.0.0',
      dependencies: ['core'],
    },
    showStack: false,
    showContext: false,
    resolved: false,
  },
  {
    id: 2,
    timestamp: Date.now() - 600000,
    severity: 'warning',
    category: 'network',
    source: 'HttpClient',
    message: '网络请求超时: GET /api/users',
    context: {
      url: '/api/users',
      method: 'GET',
      timeout: 5000,
    },
    showContext: false,
    resolved: true,
  },
  {
    id: 3,
    timestamp: Date.now() - 900000,
    severity: 'error',
    category: 'validation',
    source: 'ConfigManager',
    message: '配置验证失败: 缺少必需字段 "database.host"',
    context: {
      field: 'database.host',
      value: undefined,
      required: true,
    },
    showContext: false,
    resolved: false,
  },
])

// 恢复策略
const recoveryStrategies = ref([
  {
    id: 1,
    name: '自动重试策略',
    type: 'retry',
    description: '自动重试失败的操作，支持指数退避',
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 5000,
    successCount: 45,
    failureCount: 8,
    successRate: 85,
  },
  {
    id: 2,
    name: '降级策略',
    type: 'fallback',
    description: '当主要功能失败时，切换到备用功能',
    enabled: true,
    maxRetries: 1,
    retryDelay: 500,
    timeout: 3000,
    successCount: 23,
    failureCount: 2,
    successRate: 92,
  },
  {
    id: 3,
    name: '断路器策略',
    type: 'circuit-breaker',
    description: '当错误率过高时，暂时停止调用以防止级联失败',
    enabled: false,
    maxRetries: 0,
    retryDelay: 0,
    timeout: 10000,
    successCount: 12,
    failureCount: 15,
    successRate: 44,
  },
])

// 恢复统计
const recoveryStats = ref({
  totalRecoveries: 80,
  avgRecoveryTime: 1150,
  successRate: 87,
})

// 最近恢复记录
const recentRecoveries = ref([
  {
    id: 1,
    timestamp: Date.now() - 120000,
    strategy: '自动重试策略',
    error: '网络请求失败',
    success: true,
  },
  {
    id: 2,
    timestamp: Date.now() - 300000,
    strategy: '降级策略',
    error: '主数据库连接失败',
    success: true,
  },
  {
    id: 3,
    timestamp: Date.now() - 450000,
    strategy: '自动重试策略',
    error: '插件加载超时',
    success: false,
  },
])

// 计算属性
const filteredLogs = computed(() => {
  return errorLogs.value.filter((log) => {
    if (logFilter.value.search && !log.message.toLowerCase().includes(logFilter.value.search.toLowerCase())) {
      return false
    }
    if (logFilter.value.severity && log.severity !== logFilter.value.severity) {
      return false
    }
    if (logFilter.value.category && log.category !== logFilter.value.category) {
      return false
    }
    if (logFilter.value.timeRange !== 'all') {
      const now = Date.now()
      const timeRanges = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
      }
      const range = timeRanges[logFilter.value.timeRange]
      if (now - log.timestamp > range) {
        return false
      }
    }
    return true
  })
})

// 方法
function simulateError(type: any) {
  const error = {
    id: Date.now(),
    timestamp: Date.now(),
    severity: type.severity,
    category: type.id,
    source: 'ErrorSimulator',
    message: type.message,
    showStack: false,
    showContext: false,
    resolved: false,
  }

  errorLogs.value.unshift(error)
  errorStats.value.totalErrors++

  if (type.severity === 'warning') {
    errorStats.value.warnings++
  }

  if (engine) {
    engine.emit('error:simulated', {
      type: type.id,
      severity: type.severity,
      message: type.message,
    })
  }

  // 自动滚动到顶部
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = 0
      }
    })
  }
}

function simulateCustomError() {
  if (!customError.value.message)
return

  const error = {
    id: Date.now(),
    timestamp: Date.now(),
    severity: customError.value.severity,
    category: customError.value.category,
    source: 'CustomErrorSimulator',
    message: customError.value.message,
    showStack: false,
    showContext: false,
    resolved: false,
  }

  errorLogs.value.unshift(error)
  errorStats.value.totalErrors++

  if (customError.value.severity === 'warning') {
    errorStats.value.warnings++
  }

  // 重置表单
  customError.value.message = ''

  if (engine) {
    engine.emit('error:custom-simulated', error)
  }

  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = 0
      }
    })
  }
}

function startBatchSimulation() {
  isBatchRunning.value = true
  batchProgress.value = 0

  batchInterval = setInterval(() => {
    if (batchProgress.value >= batchSettings.value.count) {
      stopBatchSimulation()
      return
    }

    const type = batchSettings.value.randomTypes
      ? errorTypes[Math.floor(Math.random() * errorTypes.length)]
      : errorTypes[0]

    simulateError(type)
    batchProgress.value++
  }, batchSettings.value.interval)

  if (engine) {
    engine.emit('error:batch-simulation-started', {
      count: batchSettings.value.count,
      interval: batchSettings.value.interval,
    })
  }
}

function stopBatchSimulation() {
  isBatchRunning.value = false

  if (batchInterval) {
    clearInterval(batchInterval)
    batchInterval = null
  }

  if (engine) {
    engine.emit('error:batch-simulation-stopped', {
      completed: batchProgress.value,
      total: batchSettings.value.count,
    })
  }
}

function addHandler() {
  if (!newHandler.value.name)
return

  const handler = {
    id: Date.now(),
    name: newHandler.value.name,
    type: newHandler.value.type,
    priority: newHandler.value.priority,
    enabled: true,
    processedCount: 0,
    successRate: 100,
    avgProcessTime: 0,
  }

  errorHandlers.value.push(handler)

  // 重置表单
  newHandler.value = {
    name: '',
    type: 'logger',
    priority: 'medium',
  }

  if (engine) {
    engine.emit('error:handler-added', handler)
  }
}

function toggleHandler(handler: any) {
  handler.enabled = !handler.enabled

  if (engine) {
    engine.emit('error:handler-toggled', {
      id: handler.id,
      enabled: handler.enabled,
    })
  }
}

function testHandler(handler: any) {
  // 模拟测试处理器
  const testError = {
    id: Date.now(),
    timestamp: Date.now(),
    severity: 'info',
    category: 'test',
    source: 'HandlerTester',
    message: `测试处理器: ${handler.name}`,
    showStack: false,
    showContext: false,
    resolved: false,
  }

  errorLogs.value.unshift(testError)
  handler.processedCount++

  if (engine) {
    engine.emit('error:handler-tested', {
      handler: handler.name,
      testError,
    })
  }
}

function configureHandler(handler: any) {
  alert(`配置处理器: ${handler.name}\n类型: ${getHandlerTypeText(handler.type)}\n优先级: ${getPriorityText(handler.priority)}`)
}

function removeHandler(handler: any) {
  if (confirm(`确定要删除处理器 "${handler.name}" 吗？`)) {
    const index = errorHandlers.value.findIndex(h => h.id === handler.id)
    if (index > -1) {
      errorHandlers.value.splice(index, 1)

      if (engine) {
        engine.emit('error:handler-removed', { id: handler.id })
      }
    }
  }
}

function testAllHandlers() {
  errorHandlers.value.forEach((handler) => {
    if (handler.enabled) {
      testHandler(handler)
    }
  })
}

function clearHandlers() {
  if (confirm('确定要清空所有错误处理器吗？')) {
    errorHandlers.value = []

    if (engine) {
      engine.emit('error:handlers-cleared')
    }
  }
}

function clearLogs() {
  if (confirm('确定要清空所有错误日志吗？')) {
    errorLogs.value = []

    if (engine) {
      engine.emit('error:logs-cleared')
    }
  }
}

function exportLogs() {
  const data = {
    logs: filteredLogs.value,
    exportedAt: new Date().toISOString(),
    filters: logFilter.value,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `error-logs-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
}

function toggleStack(log: any) {
  log.showStack = !log.showStack
}

function toggleContext(log: any) {
  log.showContext = !log.showContext
}

function retryOperation(log: any) {
  // 模拟重试操作
  const retryLog = {
    id: Date.now(),
    timestamp: Date.now(),
    severity: 'info',
    category: 'retry',
    source: 'RetryManager',
    message: `重试操作: ${log.message}`,
    showStack: false,
    showContext: false,
    resolved: false,
  }

  errorLogs.value.unshift(retryLog)

  if (engine) {
    engine.emit('error:operation-retried', {
      originalError: log.id,
      retryLog,
    })
  }
}

function markAsResolved(log: any) {
  log.resolved = true
  errorStats.value.recovered++

  if (engine) {
    engine.emit('error:marked-resolved', { id: log.id })
  }
}

function reportError(log: any) {
  alert(`错误已报告:\n时间: ${formatTime(log.timestamp)}\n级别: ${getSeverityText(log.severity)}\n消息: ${log.message}`)

  if (engine) {
    engine.emit('error:reported', { id: log.id })
  }
}

function toggleStrategy(strategy: any) {
  strategy.enabled = !strategy.enabled

  if (engine) {
    engine.emit('error:strategy-toggled', {
      id: strategy.id,
      enabled: strategy.enabled,
    })
  }
}

function testStrategy(strategy: any) {
  // 模拟测试恢复策略
  const success = Math.random() > 0.3

  const record = {
    id: Date.now(),
    timestamp: Date.now(),
    strategy: strategy.name,
    error: '模拟错误',
    success,
  }

  recentRecoveries.value.unshift(record)

  if (success) {
    strategy.successCount++
  }
 else {
    strategy.failureCount++
  }

  strategy.successRate = Math.round((strategy.successCount / (strategy.successCount + strategy.failureCount)) * 100)

  if (engine) {
    engine.emit('error:strategy-tested', {
      strategy: strategy.name,
      success,
      record,
    })
  }
}

function resetStrategy(strategy: any) {
  if (confirm(`确定要重置策略 "${strategy.name}" 的统计数据吗？`)) {
    strategy.successCount = 0
    strategy.failureCount = 0
    strategy.successRate = 0

    if (engine) {
      engine.emit('error:strategy-reset', { id: strategy.id })
    }
  }
}

function getHandlerTypeText(type: string) {
  const types = {
    logger: '日志记录器',
    reporter: '错误报告器',
    recovery: '恢复处理器',
    notification: '通知处理器',
  }
  return types[type] || type
}

function getPriorityText(priority: string) {
  const priorities = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  }
  return priorities[priority] || priority
}

function getSeverityIcon(severity: string) {
  const icons = {
    error: 'XCircle',
    warning: 'AlertTriangle',
    info: 'CheckCircle',
  }
  return icons[severity] || 'AlertTriangle'
}

function getSeverityText(severity: string) {
  const severities = {
    error: '错误',
    warning: '警告',
    info: '信息',
  }
  return severities[severity] || severity
}

function formatTime(timestamp: number, includeSeconds = false) {
  const date = new Date(timestamp)
  if (includeSeconds) {
    return date.toLocaleTimeString()
  }
  return date.toLocaleString()
}

// 生命周期
onMounted(() => {
  // 监听引擎事件
  if (engine) {
    engine.on('error:*', (eventName: string, data: any) => {
      console.log('Error Event:', eventName, data)
    })
  }

  // 模拟实时错误数据更新
  setInterval(() => {
    // 更新图表数据
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:00`

    chartData.value.shift()
    chartData.value.push({
      time: timeStr,
      errors: Math.floor(Math.random() * 25) + 5,
    })
  }, 10000)
})

onUnmounted(() => {
  if (batchInterval) {
    clearInterval(batchInterval)
  }
})
</script>

<template>
  <div class="error-page">
    <div class="page-header">
      <h1>
        <AlertTriangle class="icon" />
        错误处理演示
      </h1>
      <p>展示错误捕获、处理、恢复和监控功能</p>
    </div>

    <!-- 错误统计概览 -->
    <div class="section">
      <h2 class="section-title">
        <BarChart class="icon" />
        错误统计概览
      </h2>

      <div class="error-overview">
        <div class="overview-stats">
          <div class="stat-card error">
            <div class="stat-icon">
              <XCircle class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ errorStats.totalErrors }}
              </div>
              <div class="stat-label">
                总错误数
              </div>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">
              <AlertTriangle class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ errorStats.warnings }}
              </div>
              <div class="stat-label">
                警告数
              </div>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">
              <CheckCircle class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ errorStats.recovered }}
              </div>
              <div class="stat-label">
                已恢复
              </div>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">
              <Clock class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ errorStats.avgRecoveryTime }}ms
              </div>
              <div class="stat-label">
                平均恢复时间
              </div>
            </div>
          </div>
        </div>

        <div class="error-chart">
          <h3>错误趋势图</h3>
          <div class="chart-container">
            <div class="chart-bars">
              <div
                v-for="(data, index) in chartData"
                :key="index"
                class="chart-bar"
                :style="{ height: `${(data.errors / Math.max(...chartData.map(d => d.errors))) * 100}%` }"
                :title="`${data.time}: ${data.errors} 错误`"
              />
            </div>
            <div class="chart-labels">
              <span v-for="(data, index) in chartData" :key="index" class="chart-label">
                {{ data.time }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误模拟器 -->
    <div class="section">
      <h2 class="section-title">
        <Zap class="icon" />
        错误模拟器
      </h2>

      <div class="error-simulator">
        <div class="simulator-controls">
          <div class="error-types">
            <h3>错误类型</h3>
            <div class="type-buttons">
              <button
                v-for="type in errorTypes"
                :key="type.id"
                class="btn error-type-btn"
                :class="type.severity"
                @click="simulateError(type)"
              >
                <component :is="type.icon" class="btn-icon" />
                {{ type.name }}
              </button>
            </div>
          </div>

          <div class="custom-error">
            <h3>自定义错误</h3>
            <div class="custom-form">
              <input
                v-model="customError.message"
                placeholder="错误消息"
                class="form-input"
              >
              <select v-model="customError.severity" class="form-select">
                <option value="error">
                  错误
                </option>
                <option value="warning">
                  警告
                </option>
                <option value="info">
                  信息
                </option>
              </select>
              <select v-model="customError.category" class="form-select">
                <option value="runtime">
                  运行时错误
                </option>
                <option value="network">
                  网络错误
                </option>
                <option value="validation">
                  验证错误
                </option>
                <option value="permission">
                  权限错误
                </option>
              </select>
              <button class="btn btn-primary" @click="simulateCustomError">
                <Play class="btn-icon" />
                触发错误
              </button>
            </div>
          </div>
        </div>

        <div class="batch-simulator">
          <h3>批量错误模拟</h3>
          <div class="batch-controls">
            <div class="batch-settings">
              <label>
                错误数量:
                <input
                  v-model.number="batchSettings.count"
                  type="number"
                  min="1"
                  max="100"
                  class="form-input small"
                >
              </label>
              <label>
                间隔时间 (ms):
                <input
                  v-model.number="batchSettings.interval"
                  type="number"
                  min="100"
                  max="5000"
                  step="100"
                  class="form-input small"
                >
              </label>
              <label>
                <input
                  v-model="batchSettings.randomTypes"
                  type="checkbox"
                  class="form-checkbox"
                >
                随机错误类型
              </label>
            </div>

            <div class="batch-actions">
              <button
                :disabled="isBatchRunning"
                class="btn btn-warning"
                @click="startBatchSimulation"
              >
                <Play class="btn-icon" />
                开始批量模拟
              </button>
              <button
                :disabled="!isBatchRunning"
                class="btn btn-danger"
                @click="stopBatchSimulation"
              >
                <Square class="btn-icon" />
                停止模拟
              </button>
            </div>
          </div>

          <div v-if="isBatchRunning" class="batch-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(batchProgress / batchSettings.count) * 100}%` }"
              />
            </div>
            <div class="progress-text">
              {{ batchProgress }} / {{ batchSettings.count }} 错误已触发
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误处理器管理 -->
    <div class="section">
      <h2 class="section-title">
        <Settings class="icon" />
        错误处理器管理
      </h2>

      <div class="error-handlers">
        <div class="handler-controls">
          <div class="add-handler">
            <input
              v-model="newHandler.name"
              placeholder="处理器名称"
              class="form-input"
            >
            <select v-model="newHandler.type" class="form-select">
              <option value="logger">
                日志记录器
              </option>
              <option value="reporter">
                错误报告器
              </option>
              <option value="recovery">
                恢复处理器
              </option>
              <option value="notification">
                通知处理器
              </option>
            </select>
            <select v-model="newHandler.priority" class="form-select">
              <option value="high">
                高优先级
              </option>
              <option value="medium">
                中优先级
              </option>
              <option value="low">
                低优先级
              </option>
            </select>
            <button class="btn btn-primary" :disabled="!newHandler.name" @click="addHandler">
              <Plus class="btn-icon" />
              添加处理器
            </button>
          </div>

          <div class="handler-actions">
            <button class="btn btn-secondary" @click="testAllHandlers">
              <TestTube class="btn-icon" />
              测试所有处理器
            </button>
            <button class="btn btn-danger" @click="clearHandlers">
              <Trash2 class="btn-icon" />
              清空处理器
            </button>
          </div>
        </div>

        <div class="handler-list">
          <div
            v-for="handler in errorHandlers"
            :key="handler.id"
            class="handler-item"
            :class="{ active: handler.enabled, [handler.priority]: true }"
          >
            <div class="handler-info">
              <div class="handler-header">
                <div class="handler-name">
                  {{ handler.name }}
                </div>
                <div class="handler-type">
                  {{ getHandlerTypeText(handler.type) }}
                </div>
                <div class="handler-priority" :class="handler.priority">
                  {{ getPriorityText(handler.priority) }}
                </div>
              </div>

              <div class="handler-stats">
                <span>处理次数: {{ handler.processedCount }}</span>
                <span>成功率: {{ handler.successRate }}%</span>
                <span>平均处理时间: {{ handler.avgProcessTime }}ms</span>
              </div>
            </div>

            <div class="handler-controls">
              <button
                class="btn btn-sm"
                :class="handler.enabled ? 'btn-warning' : 'btn-success'"
                @click="toggleHandler(handler)"
              >
                <component :is="handler.enabled ? 'Pause' : 'Play'" class="btn-icon" />
                {{ handler.enabled ? '禁用' : '启用' }}
              </button>
              <button class="btn btn-sm btn-secondary" @click="testHandler(handler)">
                <TestTube class="btn-icon" />
                测试
              </button>
              <button class="btn btn-sm btn-primary" @click="configureHandler(handler)">
                <Settings class="btn-icon" />
                配置
              </button>
              <button class="btn btn-sm btn-danger" @click="removeHandler(handler)">
                <Trash2 class="btn-icon" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误日志 -->
    <div class="section">
      <h2 class="section-title">
        <FileText class="icon" />
        错误日志
      </h2>

      <div class="error-logs">
        <div class="log-controls">
          <div class="log-filters">
            <input
              v-model="logFilter.search"
              placeholder="搜索错误消息..."
              class="search-input"
            >
            <select v-model="logFilter.severity" class="filter-select">
              <option value="">
                所有级别
              </option>
              <option value="error">
                错误
              </option>
              <option value="warning">
                警告
              </option>
              <option value="info">
                信息
              </option>
            </select>
            <select v-model="logFilter.category" class="filter-select">
              <option value="">
                所有分类
              </option>
              <option value="runtime">
                运行时
              </option>
              <option value="network">
                网络
              </option>
              <option value="validation">
                验证
              </option>
              <option value="permission">
                权限
              </option>
            </select>
            <select v-model="logFilter.timeRange" class="filter-select">
              <option value="all">
                全部时间
              </option>
              <option value="hour">
                最近1小时
              </option>
              <option value="day">
                最近1天
              </option>
              <option value="week">
                最近1周
              </option>
            </select>
          </div>

          <div class="log-actions">
            <button class="btn btn-danger" @click="clearLogs">
              <Trash2 class="btn-icon" />
              清空日志
            </button>
            <button class="btn btn-secondary" @click="exportLogs">
              <Download class="btn-icon" />
              导出日志
            </button>
            <button
              class="btn btn-secondary"
              :class="{ active: autoScroll }"
              @click="toggleAutoScroll"
            >
              <ArrowDown class="btn-icon" />
              自动滚动
            </button>
          </div>
        </div>

        <div ref="logContainer" class="log-list">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="log-entry"
            :class="log.severity"
          >
            <div class="log-time">
              {{ formatTime(log.timestamp) }}
            </div>

            <div class="log-content">
              <div class="log-header">
                <div class="log-severity" :class="log.severity">
                  <component :is="getSeverityIcon(log.severity)" class="severity-icon" />
                  {{ getSeverityText(log.severity) }}
                </div>
                <div class="log-category">
                  {{ log.category }}
                </div>
                <div v-if="log.source" class="log-source">
                  {{ log.source }}
                </div>
              </div>

              <div class="log-message">
                {{ log.message }}
              </div>

              <div v-if="log.stack" class="log-stack">
                <button
                  class="stack-toggle"
                  @click="toggleStack(log)"
                >
                  <ChevronDown
                    class="toggle-icon"
                    :class="{ rotated: log.showStack }"
                  />
                  堆栈跟踪
                </button>
                <pre v-if="log.showStack" class="stack-trace">{{ log.stack }}</pre>
              </div>

              <div v-if="log.context" class="log-context">
                <button
                  class="context-toggle"
                  @click="toggleContext(log)"
                >
                  <ChevronDown
                    class="toggle-icon"
                    :class="{ rotated: log.showContext }"
                  />
                  上下文信息
                </button>
                <div v-if="log.showContext" class="context-data">
                  <pre>{{ JSON.stringify(log.context, null, 2) }}</pre>
                </div>
              </div>
            </div>

            <div class="log-actions">
              <button class="btn btn-sm btn-secondary" @click="retryOperation(log)">
                <RefreshCw class="btn-icon" />
                重试
              </button>
              <button class="btn btn-sm btn-success" @click="markAsResolved(log)">
                <CheckCircle class="btn-icon" />
                标记已解决
              </button>
              <button class="btn btn-sm btn-primary" @click="reportError(log)">
                <Send class="btn-icon" />
                报告
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误恢复策略 -->
    <div class="section">
      <h2 class="section-title">
        <RotateCcw class="icon" />
        错误恢复策略
      </h2>

      <div class="recovery-strategies">
        <div class="strategy-list">
          <div
            v-for="strategy in recoveryStrategies"
            :key="strategy.id"
            class="strategy-item"
            :class="{ active: strategy.enabled }"
          >
            <div class="strategy-info">
              <div class="strategy-header">
                <div class="strategy-name">
                  {{ strategy.name }}
                </div>
                <div class="strategy-type">
                  {{ strategy.type }}
                </div>
              </div>

              <div class="strategy-description">
                {{ strategy.description }}
              </div>

              <div class="strategy-config">
                <div class="config-item">
                  <label>最大重试次数:</label>
                  <input
                    v-model.number="strategy.maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    class="form-input small"
                  >
                </div>
                <div class="config-item">
                  <label>重试间隔 (ms):</label>
                  <input
                    v-model.number="strategy.retryDelay"
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    class="form-input small"
                  >
                </div>
                <div class="config-item">
                  <label>超时时间 (ms):</label>
                  <input
                    v-model.number="strategy.timeout"
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    class="form-input small"
                  >
                </div>
              </div>

              <div class="strategy-stats">
                <span>成功恢复: {{ strategy.successCount }}</span>
                <span>失败次数: {{ strategy.failureCount }}</span>
                <span>成功率: {{ strategy.successRate }}%</span>
              </div>
            </div>

            <div class="strategy-controls">
              <button
                class="btn btn-sm"
                :class="strategy.enabled ? 'btn-warning' : 'btn-success'"
                @click="toggleStrategy(strategy)"
              >
                <component :is="strategy.enabled ? 'Pause' : 'Play'" class="btn-icon" />
                {{ strategy.enabled ? '禁用' : '启用' }}
              </button>
              <button class="btn btn-sm btn-secondary" @click="testStrategy(strategy)">
                <TestTube class="btn-icon" />
                测试
              </button>
              <button class="btn btn-sm btn-warning" @click="resetStrategy(strategy)">
                <RotateCcw class="btn-icon" />
                重置
              </button>
            </div>
          </div>
        </div>

        <div class="recovery-monitor">
          <h3>恢复监控</h3>
          <div class="monitor-stats">
            <div class="monitor-item">
              <div class="monitor-label">
                总恢复次数
              </div>
              <div class="monitor-value">
                {{ recoveryStats.totalRecoveries }}
              </div>
            </div>
            <div class="monitor-item">
              <div class="monitor-label">
                平均恢复时间
              </div>
              <div class="monitor-value">
                {{ recoveryStats.avgRecoveryTime }}ms
              </div>
            </div>
            <div class="monitor-item">
              <div class="monitor-label">
                恢复成功率
              </div>
              <div class="monitor-value">
                {{ recoveryStats.successRate }}%
              </div>
            </div>
          </div>

          <div class="recovery-timeline">
            <h4>最近恢复记录</h4>
            <div class="timeline-list">
              <div
                v-for="record in recentRecoveries"
                :key="record.id"
                class="timeline-item"
                :class="record.success ? 'success' : 'failure'"
              >
                <div class="timeline-time">
                  {{ formatTime(record.timestamp, true) }}
                </div>
                <div class="timeline-content">
                  <div class="timeline-strategy">
                    {{ record.strategy }}
                  </div>
                  <div class="timeline-error">
                    {{ record.error }}
                  </div>
                  <div class="timeline-result" :class="record.success ? 'success' : 'failure'">
                    {{ record.success ? '恢复成功' : '恢复失败' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
