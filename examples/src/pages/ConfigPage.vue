<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import {
  Activity,
  AlertTriangle,
  BarChart,
  CheckCircle,
  Clock,
  Code,
  Download,
  Edit,
  Eye,
  FileText,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Upload,
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const activeEditorTab = ref('json')
const selectedEnv = ref('development')
const isMonitoring = ref(false)
const monitorDuration = ref(0)
let monitorInterval: number | null = null

// 配置统计
const configStats = ref({
  totalConfigs: 45,
  watchers: 8,
  updates: 127,
  validationRate: 98.5,
})

// 配置数据
const configJson = ref(`{
  "app": {
    "name": "LDesign Engine Demo",
    "version": "1.0.0",
    "theme": "light",
    "language": "zh-CN",
    "debug": true
  },
  "server": {
    "host": "localhost",
    "port": 3000,
    "ssl": false,
    "timeout": 30000
  },
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "name": "ldesign_demo",
    "pool": {
      "min": 2,
      "max": 10
    }
  },
  "cache": {
    "enabled": true,
    "type": "redis",
    "ttl": 3600,
    "prefix": "ldesign:"
  },
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": ["console", "file"]
  }
}`)

const configData = ref({
  'app.name': 'LDesign Engine Demo',
  'app.version': '1.0.0',
  'app.theme': 'light',
  'app.language': 'zh-CN',
  'app.debug': true,
  'server.host': 'localhost',
  'server.port': 3000,
  'server.ssl': false,
  'server.timeout': 30000,
  'database.type': 'mysql',
  'database.host': 'localhost',
  'database.port': 3306,
  'database.name': 'ldesign_demo',
  'cache.enabled': true,
  'cache.type': 'redis',
  'cache.ttl': 3600,
  'logging.level': 'info',
})

// 编辑器标签页
const editorTabs = [
  { id: 'json', label: 'JSON 编辑', icon: 'Code' },
  { id: 'form', label: '表单编辑', icon: 'Edit' },
  { id: 'env', label: '环境配置', icon: 'Settings' },
]

// 配置模板
const configTemplates = [
  {
    name: '基础应用配置',
    description: '包含应用基本信息和服务器配置',
    icon: 'Settings',
    config: {
      app: {
        name: 'My App',
        version: '1.0.0',
        debug: false,
      },
      server: {
        host: 'localhost',
        port: 3000,
      },
    },
  },
  {
    name: '数据库配置',
    description: '数据库连接和连接池配置',
    icon: 'Database',
    config: {
      database: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        name: 'myapp',
        pool: {
          min: 2,
          max: 10,
        },
      },
    },
  },
  {
    name: '缓存配置',
    description: 'Redis 缓存配置',
    icon: 'Zap',
    config: {
      cache: {
        enabled: true,
        type: 'redis',
        host: 'localhost',
        port: 6379,
        ttl: 3600,
      },
    },
  },
]

// 配置验证结果
const validationResults = ref([
  {
    id: 1,
    type: 'success',
    message: '配置格式正确',
    path: null,
  },
  {
    id: 2,
    type: 'warning',
    message: '建议设置数据库连接池最大值',
    path: 'database.pool.max',
  },
])

// 配置表单字段
const configSections = [
  {
    name: 'app',
    title: '应用配置',
    description: '应用的基本信息和行为设置',
    fields: [
      {
        key: 'app.name',
        label: '应用名称',
        type: 'string',
        required: true,
        placeholder: '输入应用名称',
      },
      {
        key: 'app.version',
        label: '版本号',
        type: 'string',
        required: true,
        placeholder: '例如: 1.0.0',
      },
      {
        key: 'app.theme',
        label: '主题',
        type: 'select',
        options: [
          { value: 'light', label: '浅色主题' },
          { value: 'dark', label: '深色主题' },
          { value: 'auto', label: '自动' },
        ],
      },
      {
        key: 'app.debug',
        label: '调试模式',
        type: 'boolean',
        checkboxText: '启用调试模式',
      },
    ],
  },
  {
    name: 'server',
    title: '服务器配置',
    description: '服务器连接和网络设置',
    fields: [
      {
        key: 'server.host',
        label: '主机地址',
        type: 'string',
        required: true,
        placeholder: 'localhost',
      },
      {
        key: 'server.port',
        label: '端口号',
        type: 'number',
        required: true,
        min: 1,
        max: 65535,
      },
      {
        key: 'server.timeout',
        label: '超时时间 (ms)',
        type: 'number',
        min: 1000,
        max: 300000,
        step: 1000,
      },
    ],
  },
  {
    name: 'logging',
    title: '日志配置',
    description: '日志记录级别和输出设置',
    fields: [
      {
        key: 'logging.level',
        label: '日志级别',
        type: 'select',
        options: [
          { value: 'debug', label: 'Debug' },
          { value: 'info', label: 'Info' },
          { value: 'warn', label: 'Warning' },
          { value: 'error', label: 'Error' },
        ],
      },
    ],
  },
]

// 环境配置
const environments = [
  { id: 'development', name: '开发环境' },
  { id: 'testing', name: '测试环境' },
  { id: 'staging', name: '预发布环境' },
  { id: 'production', name: '生产环境' },
]

const envVariables = ref([
  { key: 'NODE_ENV', value: 'development' },
  { key: 'API_URL', value: 'http://localhost:3000/api' },
  { key: 'DEBUG', value: 'true' },
])

const envOverrides = ref(`{
  "app": {
    "debug": true
  },
  "server": {
    "port": 3001
  }
}`)

// 配置监听器
const newWatcher = ref({
  path: '',
  type: 'change',
})

const watchers = ref([
  {
    id: 1,
    path: 'app.theme',
    type: 'change',
    active: true,
    triggerCount: 5,
    lastTriggered: Date.now() - 300000,
  },
  {
    id: 2,
    path: 'server.port',
    type: 'change',
    active: true,
    triggerCount: 2,
    lastTriggered: Date.now() - 1800000,
  },
  {
    id: 3,
    path: 'database.*',
    type: 'any',
    active: false,
    triggerCount: 0,
    lastTriggered: null,
  },
])

// 配置历史
const historyFilter = ref({
  search: '',
  action: '',
  timeRange: 'all',
})

const configHistory = ref([
  {
    id: 1,
    timestamp: Date.now() - 300000,
    action: 'update',
    path: 'app.theme',
    oldValue: 'dark',
    newValue: 'light',
  },
  {
    id: 2,
    timestamp: Date.now() - 600000,
    action: 'set',
    path: 'server.timeout',
    newValue: 30000,
  },
  {
    id: 3,
    timestamp: Date.now() - 900000,
    action: 'delete',
    path: 'cache.password',
    oldValue: '***',
  },
  {
    id: 4,
    timestamp: Date.now() - 1200000,
    action: 'update',
    path: 'database.port',
    oldValue: 3306,
    newValue: 3307,
  },
])

// 实时监控日志
const monitorLogs = ref([])

// 字段错误
const fieldErrors = ref({})

// 计算属性
const filteredHistory = computed(() => {
  return configHistory.value.filter((entry) => {
    if (historyFilter.value.search && !entry.path.toLowerCase().includes(historyFilter.value.search.toLowerCase())) {
      return false
    }
    if (historyFilter.value.action && entry.action !== historyFilter.value.action) {
      return false
    }
    if (historyFilter.value.timeRange !== 'all') {
      const now = Date.now()
      const timeRanges = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      }
      const range = timeRanges[historyFilter.value.timeRange]
      if (now - entry.timestamp > range) {
        return false
      }
    }
    return true
  })
})

// 方法
async function loadConfig() {
  // 模拟加载配置
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      const config = await response.json()
      configJson.value = JSON.stringify(config, null, 2)

      if (engine) {
        engine.emit('config:loaded', { config })
      }
    }
  }
 catch (error) {
    console.error('Failed to load config:', error)
  }
}

async function saveConfig() {
  try {
    const config = JSON.parse(configJson.value)

    // 验证配置
    const validation = validateConfigData(config)
    if (!validation.valid) {
      alert(`配置验证失败:\n${validation.errors.join('\n')}`)
      return
    }

    // 保存配置
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: configJson.value,
    })

    if (response.ok) {
      configStats.value.updates++

      if (engine) {
        engine.emit('config:saved', { config })
      }

      alert('配置保存成功！')
    }
  }
 catch (error) {
    alert(`配置格式错误：${error.message}`)
  }
}

function resetConfig() {
  if (confirm('确定要重置配置吗？这将恢复到默认设置。')) {
    configJson.value = `{
  "app": {
    "name": "LDesign Engine Demo",
    "version": "1.0.0",
    "theme": "light",
    "debug": false
  }
}`

    if (engine) {
      engine.emit('config:reset')
    }
  }
}

function exportConfig() {
  const blob = new Blob([configJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `config-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

function formatConfig() {
  try {
    const config = JSON.parse(configJson.value)
    configJson.value = JSON.stringify(config, null, 2)
  }
 catch (error) {
    alert('配置格式错误，无法格式化')
  }
}

function validateConfig() {
  try {
    const config = JSON.parse(configJson.value)
    const validation = validateConfigData(config)

    validationResults.value = validation.results

    if (validation.valid) {
      alert('配置验证通过！')
    }
 else {
      alert(`配置验证失败:\n${validation.errors.join('\n')}`)
    }
  }
 catch (error) {
    validationResults.value = [{
      id: Date.now(),
      type: 'error',
      message: `JSON 格式错误: ${error.message}`,
      path: null,
    }]
  }
}

function validateConfigData(config: any) {
  const results = []
  const errors = []
  let valid = true

  // 基本验证
  if (!config.app?.name) {
    results.push({
      id: Date.now() + Math.random(),
      type: 'error',
      message: '应用名称不能为空',
      path: 'app.name',
    })
    errors.push('应用名称不能为空')
    valid = false
  }

  if (config.server?.port && (config.server.port < 1 || config.server.port > 65535)) {
    results.push({
      id: Date.now() + Math.random(),
      type: 'error',
      message: '端口号必须在 1-65535 之间',
      path: 'server.port',
    })
    errors.push('端口号必须在 1-65535 之间')
    valid = false
  }

  // 警告
  if (config.app?.debug === true) {
    results.push({
      id: Date.now() + Math.random(),
      type: 'warning',
      message: '生产环境建议关闭调试模式',
      path: 'app.debug',
    })
  }

  if (valid) {
    results.push({
      id: Date.now() + Math.random(),
      type: 'success',
      message: '配置验证通过',
      path: null,
    })
  }

  return { valid, errors, results }
}

function previewConfig() {
  try {
    const config = JSON.parse(configJson.value)
    const preview = Object.keys(config).map((key) => {
      return `${key}: ${typeof config[key] === 'object' ? JSON.stringify(config[key]) : config[key]}`
    }).join('\n')

    alert(`配置预览:\n${preview}`)
  }
 catch (error) {
    alert('配置格式错误，无法预览')
  }
}

function loadTemplate(template: any) {
  configJson.value = JSON.stringify(template.config, null, 2)
  onConfigChange()
}

function onConfigChange() {
  try {
    const config = JSON.parse(configJson.value)

    // 更新表单数据
    Object.keys(configData.value).forEach((key) => {
      const value = getNestedValue(config, key)
      if (value !== undefined) {
        configData.value[key] = value
      }
    })

    // 清除字段错误
    fieldErrors.value = {}

    if (engine) {
      engine.emit('config:changed', { config })
    }
  }
 catch (error) {
    // JSON 格式错误
  }
}

function onFieldChange(key: string, value: any) {
  try {
    const config = JSON.parse(configJson.value)
    setNestedValue(config, key, value)
    configJson.value = JSON.stringify(config, null, 2)

    // 清除该字段的错误
    delete fieldErrors.value[key]

    if (engine) {
      engine.emit('config:field-changed', { key, value })
    }
  }
 catch (error) {
    fieldErrors.value[key] = '配置格式错误'
  }
}

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  const target = keys.reduce((current, key) => {
    if (!current[key])
current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

function getFieldError(key: string) {
  return fieldErrors.value[key]
}

function loadEnvConfig() {
  // 根据选择的环境加载配置
  const envConfigs = {
    development: {
      variables: [
        { key: 'NODE_ENV', value: 'development' },
        { key: 'API_URL', value: 'http://localhost:3000/api' },
        { key: 'DEBUG', value: 'true' },
      ],
      overrides: `{
  "app": {
    "debug": true
  },
  "server": {
    "port": 3001
  }
}`,
    },
    production: {
      variables: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'API_URL', value: 'https://api.example.com' },
        { key: 'DEBUG', value: 'false' },
      ],
      overrides: `{
  "app": {
    "debug": false
  },
  "server": {
    "port": 80
  }
}`,
    },
  }

  const envConfig = envConfigs[selectedEnv.value] || envConfigs.development
  envVariables.value = [...envConfig.variables]
  envOverrides.value = envConfig.overrides
}

function addEnvironment() {
  const name = prompt('请输入环境名称:')
  if (name) {
    const id = name.toLowerCase().replace(/\s+/g, '_')
    environments.push({ id, name })
    selectedEnv.value = id
    loadEnvConfig()
  }
}

function addVariable() {
  envVariables.value.push({ key: '', value: '' })
}

function removeVariable(index: number) {
  envVariables.value.splice(index, 1)
}

function addWatcher() {
  if (!newWatcher.value.path)
return

  const watcher = {
    id: Date.now(),
    path: newWatcher.value.path,
    type: newWatcher.value.type,
    active: true,
    triggerCount: 0,
    lastTriggered: null,
  }

  watchers.value.push(watcher)
  configStats.value.watchers++

  // 重置表单
  newWatcher.value = { path: '', type: 'change' }

  if (engine) {
    engine.emit('config:watcher-added', watcher)
  }
}

function toggleWatcher(watcher: any) {
  watcher.active = !watcher.active

  if (engine) {
    engine.emit('config:watcher-toggled', {
      id: watcher.id,
      active: watcher.active,
    })
  }
}

function removeWatcher(watcher: any) {
  const index = watchers.value.findIndex(w => w.id === watcher.id)
  if (index > -1) {
    watchers.value.splice(index, 1)
    configStats.value.watchers--

    if (engine) {
      engine.emit('config:watcher-removed', { id: watcher.id })
    }
  }
}

function clearWatchers() {
  if (confirm('确定要清空所有监听器吗？')) {
    watchers.value = []
    configStats.value.watchers = 0

    if (engine) {
      engine.emit('config:watchers-cleared')
    }
  }
}

function testWatchers() {
  // 模拟触发监听器
  watchers.value.forEach((watcher) => {
    if (watcher.active) {
      watcher.triggerCount++
      watcher.lastTriggered = Date.now()
    }
  })

  if (engine) {
    engine.emit('config:watchers-tested')
  }
}

function clearHistory() {
  if (confirm('确定要清空配置历史吗？')) {
    configHistory.value = []

    if (engine) {
      engine.emit('config:history-cleared')
    }
  }
}

function exportHistory() {
  const data = {
    history: configHistory.value,
    exportedAt: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `config-history-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

function revertChange(entry: any) {
  if (confirm(`确定要恢复 ${entry.path} 的配置吗？`)) {
    try {
      const config = JSON.parse(configJson.value)

      if (entry.action === 'delete') {
        setNestedValue(config, entry.path, entry.oldValue)
      }
 else if (entry.oldValue !== undefined) {
        setNestedValue(config, entry.path, entry.oldValue)
      }

      configJson.value = JSON.stringify(config, null, 2)
      onConfigChange()

      // 添加历史记录
      configHistory.value.unshift({
        id: Date.now(),
        timestamp: Date.now(),
        action: 'revert',
        path: entry.path,
        oldValue: entry.newValue,
        newValue: entry.oldValue,
      })

      if (engine) {
        engine.emit('config:reverted', {
          path: entry.path,
          value: entry.oldValue,
        })
      }
    }
 catch (error) {
      alert(`恢复配置失败：${error.message}`)
    }
  }
}

function viewChange(entry: any) {
  const details = [
    `路径: ${entry.path}`,
    `操作: ${getActionText(entry.action)}`,
    `时间: ${formatTime(entry.timestamp)}`,
  ]

  if (entry.oldValue !== undefined) {
    details.push(`旧值: ${formatValue(entry.oldValue)}`)
  }

  details.push(`新值: ${formatValue(entry.newValue)}`)

  alert(`配置变更详情:\n${details.join('\n')}`)
}

function toggleMonitoring() {
  isMonitoring.value = !isMonitoring.value

  if (isMonitoring.value) {
    monitorDuration.value = 0
    monitorInterval = setInterval(() => {
      monitorDuration.value++

      // 模拟配置变化
      if (Math.random() < 0.1) {
        const paths = ['app.theme', 'server.port', 'cache.ttl', 'logging.level']
        const actions = ['set', 'update', 'delete']
        const path = paths[Math.floor(Math.random() * paths.length)]
        const action = actions[Math.floor(Math.random() * actions.length)]

        monitorLogs.value.push({
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
          path,
          action,
          value: Math.random() > 0.5 ? 'new_value' : 123,
        })
      }
    }, 1000)
  }
 else {
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }
  }

  if (engine) {
    engine.emit('config:monitoring-toggled', {
      monitoring: isMonitoring.value,
    })
  }
}

function clearMonitorLogs() {
  monitorLogs.value = []
}

function getValidationIcon(type: string) {
  const icons = {
    success: 'CheckCircle',
    warning: 'AlertTriangle',
    error: 'XCircle',
    info: 'Info',
  }
  return icons[type] || 'Info'
}

function getWatcherTypeText(type: string) {
  const types = {
    change: '值变化',
    add: '添加配置',
    remove: '删除配置',
    any: '任何变化',
  }
  return types[type] || type
}

function getActionIcon(action: string) {
  const icons = {
    set: 'Plus',
    update: 'Edit',
    delete: 'Trash2',
    reset: 'RotateCcw',
    revert: 'RotateCcw',
  }
  return icons[action] || 'Edit'
}

function getActionText(action: string) {
  const actions = {
    set: '设置',
    update: '更新',
    delete: '删除',
    reset: '重置',
    revert: '恢复',
  }
  return actions[action] || action
}

function formatValue(value: any) {
  if (typeof value === 'string') {
    return value.length > 50 ? `${value.slice(0, 50)}...` : value
  }
  return JSON.stringify(value)
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
    engine.on('config:*', (eventName: string, data: any) => {
      console.log('Config Event:', eventName, data)
    })
  }

  // 初始化配置
  onConfigChange()
})

onUnmounted(() => {
  if (monitorInterval) {
    clearInterval(monitorInterval)
  }
})
</script>

<template>
  <div class="config-page">
    <div class="page-header">
      <h1>
        <Settings class="icon" />
        配置管理演示
      </h1>
      <p>展示配置加载、监听、验证和热更新功能</p>
    </div>

    <!-- 配置概览 -->
    <div class="section">
      <h2 class="section-title">
        <BarChart class="icon" />
        配置概览
      </h2>

      <div class="config-overview">
        <div class="overview-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <FileText class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ configStats.totalConfigs }}
              </div>
              <div class="stat-label">
                配置项数量
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <Eye class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ configStats.watchers }}
              </div>
              <div class="stat-label">
                监听器数量
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <RefreshCw class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ configStats.updates }}
              </div>
              <div class="stat-label">
                更新次数
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <CheckCircle class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ configStats.validationRate }}%
              </div>
              <div class="stat-label">
                验证通过率
              </div>
            </div>
          </div>
        </div>

        <div class="config-actions">
          <button class="btn btn-primary" @click="loadConfig">
            <Download class="btn-icon" />
            加载配置
          </button>
          <button class="btn btn-success" @click="saveConfig">
            <Save class="btn-icon" />
            保存配置
          </button>
          <button class="btn btn-warning" @click="resetConfig">
            <RotateCcw class="btn-icon" />
            重置配置
          </button>
          <button class="btn btn-secondary" @click="exportConfig">
            <Upload class="btn-icon" />
            导出配置
          </button>
        </div>
      </div>
    </div>

    <!-- 配置编辑器 -->
    <div class="section">
      <h2 class="section-title">
        <Edit class="icon" />
        配置编辑器
      </h2>

      <div class="config-editor">
        <div class="editor-toolbar">
          <div class="editor-tabs">
            <button
              v-for="tab in editorTabs"
              :key="tab.id"
              class="tab-button"
              :class="{ active: activeEditorTab === tab.id }"
              @click="activeEditorTab = tab.id"
            >
              <component :is="tab.icon" class="tab-icon" />
              {{ tab.label }}
            </button>
          </div>

          <div class="editor-actions">
            <button class="btn btn-sm btn-secondary" @click="formatConfig">
              <Code class="btn-icon" />
              格式化
            </button>
            <button class="btn btn-sm btn-primary" @click="validateConfig">
              <CheckCircle class="btn-icon" />
              验证
            </button>
            <button class="btn btn-sm btn-secondary" @click="previewConfig">
              <Eye class="btn-icon" />
              预览
            </button>
          </div>
        </div>

        <!-- JSON 编辑器 -->
        <div v-if="activeEditorTab === 'json'" class="editor-panel">
          <div class="editor-container">
            <textarea
              v-model="configJson"
              class="config-textarea"
              placeholder="输入 JSON 配置..."
              rows="20"
              @input="onConfigChange"
            />

            <div class="editor-sidebar">
              <div class="sidebar-section">
                <h4>配置模板</h4>
                <div class="template-list">
                  <div
                    v-for="template in configTemplates"
                    :key="template.name"
                    class="template-item"
                    @click="loadTemplate(template)"
                  >
                    <component :is="template.icon" class="template-icon" />
                    <div class="template-content">
                      <div class="template-name">
                        {{ template.name }}
                      </div>
                      <div class="template-description">
                        {{ template.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sidebar-section">
                <h4>配置验证</h4>
                <div class="validation-results">
                  <div
                    v-for="result in validationResults"
                    :key="result.id"
                    class="validation-item"
                    :class="result.type"
                  >
                    <component :is="getValidationIcon(result.type)" class="validation-icon" />
                    <div class="validation-content">
                      <div class="validation-message">
                        {{ result.message }}
                      </div>
                      <div v-if="result.path" class="validation-path">
                        {{ result.path }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 表单编辑器 -->
        <div v-if="activeEditorTab === 'form'" class="editor-panel">
          <div class="form-editor">
            <div class="form-sections">
              <div
                v-for="section in configSections"
                :key="section.name"
                class="form-section"
              >
                <div class="section-header">
                  <h3>{{ section.title }}</h3>
                  <p>{{ section.description }}</p>
                </div>

                <div class="section-fields">
                  <div
                    v-for="field in section.fields"
                    :key="field.key"
                    class="form-field"
                  >
                    <label class="field-label">
                      {{ field.label }}
                      <span v-if="field.required" class="required">*</span>
                    </label>

                    <div class="field-input">
                      <!-- 字符串输入 -->
                      <input
                        v-if="field.type === 'string'"
                        v-model="configData[field.key]"
                        :placeholder="field.placeholder"
                        class="form-input"
                        @input="onFieldChange(field.key, $event.target.value)"
                      >

                      <!-- 数字输入 -->
                      <input
                        v-else-if="field.type === 'number'"
                        v-model.number="configData[field.key]"
                        type="number"
                        :min="field.min"
                        :max="field.max"
                        :step="field.step"
                        class="form-input"
                        @input="onFieldChange(field.key, $event.target.value)"
                      >

                      <!-- 布尔值选择 -->
                      <label v-else-if="field.type === 'boolean'" class="checkbox-label">
                        <input
                          v-model="configData[field.key]"
                          type="checkbox"
                          class="form-checkbox"
                          @change="onFieldChange(field.key, $event.target.checked)"
                        >
                        <span class="checkbox-text">{{ field.checkboxText || '启用' }}</span>
                      </label>

                      <!-- 选择框 -->
                      <select
                        v-else-if="field.type === 'select'"
                        v-model="configData[field.key]"
                        class="form-select"
                        @change="onFieldChange(field.key, $event.target.value)"
                      >
                        <option
                          v-for="option in field.options"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>

                      <!-- 文本域 -->
                      <textarea
                        v-else-if="field.type === 'textarea'"
                        v-model="configData[field.key]"
                        :placeholder="field.placeholder"
                        class="form-textarea"
                        :rows="field.rows || 3"
                        @input="onFieldChange(field.key, $event.target.value)"
                      />
                    </div>

                    <div v-if="field.description" class="field-description">
                      {{ field.description }}
                    </div>

                    <div v-if="getFieldError(field.key)" class="field-error">
                      <AlertTriangle class="error-icon" />
                      {{ getFieldError(field.key) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 环境配置 -->
        <div v-if="activeEditorTab === 'env'" class="editor-panel">
          <div class="env-editor">
            <div class="env-selector">
              <label>选择环境:</label>
              <select v-model="selectedEnv" class="form-select" @change="loadEnvConfig">
                <option
                  v-for="env in environments"
                  :key="env.id"
                  :value="env.id"
                >
                  {{ env.name }}
                </option>
              </select>

              <button class="btn btn-sm btn-primary" @click="addEnvironment">
                <Plus class="btn-icon" />
                添加环境
              </button>
            </div>

            <div class="env-config">
              <div class="env-variables">
                <h4>环境变量</h4>
                <div class="variable-list">
                  <div
                    v-for="(variable, index) in envVariables"
                    :key="index"
                    class="variable-item"
                  >
                    <input
                      v-model="variable.key"
                      placeholder="变量名"
                      class="variable-key"
                    >
                    <input
                      v-model="variable.value"
                      placeholder="变量值"
                      class="variable-value"
                    >
                    <button class="btn btn-sm btn-danger" @click="removeVariable(index)">
                      <Trash2 class="btn-icon" />
                    </button>
                  </div>

                  <button class="btn btn-sm btn-secondary" @click="addVariable">
                    <Plus class="btn-icon" />
                    添加变量
                  </button>
                </div>
              </div>

              <div class="env-overrides">
                <h4>配置覆盖</h4>
                <textarea
                  v-model="envOverrides"
                  placeholder="输入环境特定的配置覆盖 (JSON 格式)..."
                  class="form-textarea"
                  rows="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置监听器 -->
    <div class="section">
      <h2 class="section-title">
        <Eye class="icon" />
        配置监听器
      </h2>

      <div class="config-watchers">
        <div class="watcher-controls">
          <div class="watcher-form">
            <input
              v-model="newWatcher.path"
              placeholder="配置路径 (例如: app.theme)"
              class="form-input"
            >
            <select v-model="newWatcher.type" class="form-select">
              <option value="change">
                值变化
              </option>
              <option value="add">
                添加配置
              </option>
              <option value="remove">
                删除配置
              </option>
              <option value="any">
                任何变化
              </option>
            </select>
            <button class="btn btn-primary" :disabled="!newWatcher.path" @click="addWatcher">
              <Plus class="btn-icon" />
              添加监听器
            </button>
          </div>

          <div class="watcher-actions">
            <button class="btn btn-danger" @click="clearWatchers">
              <Trash2 class="btn-icon" />
              清空监听器
            </button>
            <button class="btn btn-secondary" @click="testWatchers">
              <Play class="btn-icon" />
              测试监听器
            </button>
          </div>
        </div>

        <div class="watcher-list">
          <div
            v-for="watcher in watchers"
            :key="watcher.id"
            class="watcher-item"
            :class="{ active: watcher.active }"
          >
            <div class="watcher-info">
              <div class="watcher-path">
                {{ watcher.path }}
              </div>
              <div class="watcher-type">
                {{ getWatcherTypeText(watcher.type) }}
              </div>
              <div class="watcher-stats">
                <span>触发次数: {{ watcher.triggerCount }}</span>
                <span>最后触发: {{ watcher.lastTriggered ? formatTime(watcher.lastTriggered) : '从未' }}</span>
              </div>
            </div>

            <div class="watcher-controls">
              <button
                class="btn btn-sm"
                :class="watcher.active ? 'btn-warning' : 'btn-success'"
                @click="toggleWatcher(watcher)"
              >
                <component :is="watcher.active ? 'Pause' : 'Play'" class="btn-icon" />
                {{ watcher.active ? '暂停' : '启用' }}
              </button>
              <button class="btn btn-sm btn-danger" @click="removeWatcher(watcher)">
                <Trash2 class="btn-icon" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置历史 -->
    <div class="section">
      <h2 class="section-title">
        <Clock class="icon" />
        配置历史
      </h2>

      <div class="config-history">
        <div class="history-controls">
          <div class="history-filters">
            <input
              v-model="historyFilter.search"
              placeholder="搜索配置路径..."
              class="search-input"
            >
            <select v-model="historyFilter.action" class="filter-select">
              <option value="">
                所有操作
              </option>
              <option value="set">
                设置
              </option>
              <option value="update">
                更新
              </option>
              <option value="delete">
                删除
              </option>
              <option value="reset">
                重置
              </option>
            </select>
            <select v-model="historyFilter.timeRange" class="filter-select">
              <option value="all">
                全部时间
              </option>
              <option value="today">
                今天
              </option>
              <option value="week">
                本周
              </option>
              <option value="month">
                本月
              </option>
            </select>
          </div>

          <div class="history-actions">
            <button class="btn btn-danger" @click="clearHistory">
              <Trash2 class="btn-icon" />
              清空历史
            </button>
            <button class="btn btn-secondary" @click="exportHistory">
              <Download class="btn-icon" />
              导出历史
            </button>
          </div>
        </div>

        <div class="history-timeline">
          <div
            v-for="entry in filteredHistory"
            :key="entry.id"
            class="history-entry"
            :class="entry.action"
          >
            <div class="entry-time">
              {{ formatTime(entry.timestamp) }}
            </div>

            <div class="entry-content">
              <div class="entry-header">
                <span class="entry-action" :class="entry.action">
                  <component :is="getActionIcon(entry.action)" class="action-icon" />
                  {{ getActionText(entry.action) }}
                </span>
                <span class="entry-path">{{ entry.path }}</span>
              </div>

              <div class="entry-details">
                <div v-if="entry.oldValue !== undefined" class="value-change">
                  <div class="old-value">
                    <span class="value-label">旧值:</span>
                    <code>{{ formatValue(entry.oldValue) }}</code>
                  </div>
                  <div class="new-value">
                    <span class="value-label">新值:</span>
                    <code>{{ formatValue(entry.newValue) }}</code>
                  </div>
                </div>

                <div v-else class="single-value">
                  <span class="value-label">值:</span>
                  <code>{{ formatValue(entry.newValue) }}</code>
                </div>
              </div>

              <div class="entry-actions">
                <button class="btn btn-sm btn-secondary" @click="revertChange(entry)">
                  <RotateCcw class="btn-icon" />
                  恢复
                </button>
                <button class="btn btn-sm btn-primary" @click="viewChange(entry)">
                  <Eye class="btn-icon" />
                  查看
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时配置监控 -->
    <div class="section">
      <h2 class="section-title">
        <Activity class="icon" />
        实时配置监控
      </h2>

      <div class="config-monitor">
        <div class="monitor-controls">
          <button
            class="btn"
            :class="isMonitoring ? 'btn-warning' : 'btn-success'"
            @click="toggleMonitoring"
          >
            <component :is="isMonitoring ? 'Pause' : 'Play'" class="btn-icon" />
            {{ isMonitoring ? '停止监控' : '开始监控' }}
          </button>

          <button class="btn btn-secondary" @click="clearMonitorLogs">
            <Trash2 class="btn-icon" />
            清空日志
          </button>

          <div class="monitor-stats">
            <span>监控时长: {{ monitorDuration }}s</span>
            <span>配置变化: {{ monitorLogs.length }}</span>
          </div>
        </div>

        <div class="monitor-logs">
          <div class="log-header">
            <span>时间</span>
            <span>路径</span>
            <span>操作</span>
            <span>值</span>
          </div>

          <div class="log-entries">
            <div
              v-for="log in monitorLogs.slice(-50)"
              :key="log.id"
              class="log-entry"
              :class="log.action"
            >
              <span class="log-time">{{ formatTime(log.timestamp, true) }}</span>
              <span class="log-path">{{ log.path }}</span>
              <span class="log-action" :class="log.action">{{ getActionText(log.action) }}</span>
              <span class="log-value">
                <code>{{ formatValue(log.value) }}</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.config-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: #6b7280;
  font-size: 1.125rem;
  margin: 0;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

/* 按钮样式 */
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* 配置概览 */
.config-overview {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  flex: 1;
}

.stat-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.config-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 配置编辑器 */
.config-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

.editor-tabs {
  display: flex;
  gap: 0.25rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  border-radius: 6px;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  background: #eff6ff;
}

.tab-icon {
  width: 1rem;
  height: 1rem;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-panel {
  min-height: 500px;
}

.editor-container {
  display: flex;
  gap: 1rem;
  height: 500px;
}

.config-textarea {
  flex: 1;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  outline: none;
}

.config-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.editor-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-section {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
}

.sidebar-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.template-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.template-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  flex-shrink: 0;
}

.template-content {
  flex: 1;
}

.template-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.template-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.validation-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.validation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid;
}

.validation-item.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.validation-item.warning {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #92400e;
}

.validation-item.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.validation-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.validation-content {
  flex: 1;
}

.validation-message {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.validation-path {
  font-size: 0.75rem;
  opacity: 0.8;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* 表单编辑器 */
.form-editor {
  max-height: 500px;
  overflow-y: auto;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  background: #f9fafb;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.section-header p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.section-fields {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.field-input {
  display: flex;
  flex-direction: column;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
}

.field-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

.error-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* 环境编辑器 */
.env-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.env-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.env-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.env-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.env-variables h4,
.env-overrides h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.variable-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variable-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.variable-key,
.variable-value {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* 配置监听器 */
.config-watchers {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.watcher-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.watcher-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
}

.watcher-form .form-input,
.watcher-form .form-select {
  min-width: 150px;
}

.watcher-actions {
  display: flex;
  gap: 0.5rem;
}

.watcher-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.watcher-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.watcher-item.active {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.watcher-info {
  flex: 1;
}

.watcher-path {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.watcher-type {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.watcher-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.watcher-controls {
  display: flex;
  gap: 0.5rem;
}

/* 配置历史 */
.config-history {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.history-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
}

.search-input,
.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
}

.search-input {
  min-width: 200px;
}

.filter-select {
  min-width: 120px;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.history-entry {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
}

.history-entry.set {
  border-left-color: #22c55e;
}

.history-entry.update {
  border-left-color: #3b82f6;
}

.history-entry.delete {
  border-left-color: #ef4444;
}

.history-entry.reset {
  border-left-color: #f59e0b;
}

.entry-time {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  min-width: 120px;
}

.entry-content {
  flex: 1;
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.entry-action {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.entry-action.set {
  background: #dcfce7;
  color: #166534;
}

.entry-action.update {
  background: #dbeafe;
  color: #1e40af;
}

.entry-action.delete {
  background: #fee2e2;
  color: #dc2626;
}

.entry-action.reset {
  background: #fef3c7;
  color: #92400e;
}

.action-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.entry-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #374151;
}

.entry-details {
  margin-bottom: 0.75rem;
}

.value-change {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.old-value,
.new-value,
.single-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.value-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 40px;
}

.old-value code {
  background: #fee2e2;
  color: #dc2626;
}

.new-value code {
  background: #dcfce7;
  color: #166534;
}

.single-value code {
  background: #f3f4f6;
  color: #374151;
}

code {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
}

.entry-actions {
  display: flex;
  gap: 0.5rem;
}

/* 实时配置监控 */
.config-monitor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.monitor-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.monitor-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.monitor-logs {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: grid;
  grid-template-columns: 120px 1fr 80px 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #374151;
  color: #f9fafb;
  font-size: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid #4b5563;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
}

.log-entry {
  display: grid;
  grid-template-columns: 120px 1fr 80px 1fr;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #374151;
  font-size: 0.75rem;
  color: #d1d5db;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-entry:hover {
  background: #374151;
}

.log-time {
  color: #9ca3af;
}

.log-path {
  color: #60a5fa;
}

.log-action {
  font-weight: 600;
}

.log-action.set {
  color: #34d399;
}

.log-action.update {
  color: #60a5fa;
}

.log-action.delete {
  color: #f87171;
}

.log-value {
  color: #fbbf24;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-page {
    padding: 1rem;
  }

  .config-overview {
    flex-direction: column;
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }

  .editor-container {
    flex-direction: column;
    height: auto;
  }

  .editor-sidebar {
    width: 100%;
  }

  .env-config {
    grid-template-columns: 1fr;
  }

  .watcher-controls,
  .history-controls,
  .monitor-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .watcher-form,
  .history-filters {
    flex-direction: column;
  }

  .log-header,
  .log-entry {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .history-entry {
    flex-direction: column;
    gap: 0.5rem;
  }

  .entry-time {
    min-width: auto;
  }
}
</style>
