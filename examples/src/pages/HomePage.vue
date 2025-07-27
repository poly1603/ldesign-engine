<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  Activity,
  ArrowRight,
  Grid,
  Layers,
  Package,
  Puzzle,
  ScrollText,
  Settings,
  Terminal,
  Trash2,
  Users,
  Zap,
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const logLevel = ref('all')
const autoScroll = ref(true)
const logs = ref<Array<{ id: number, level: string, message: string, timestamp: number }>>([])
const logsContainer = ref<HTMLElement>()

// 功能导航配置
const features = [
  {
    name: 'plugins',
    title: '插件系统',
    description: '插件管理、动态加载、依赖关系展示',
    icon: Puzzle,
    path: '/plugins',
  },
  {
    name: 'middleware',
    title: '中间件系统',
    description: '生命周期钩子、中间件执行流程、性能监控',
    icon: Layers,
    path: '/middleware',
  },
  {
    name: 'di',
    title: '依赖注入',
    description: '服务注册、服务注入、服务管理',
    icon: Package,
    path: '/di',
  },
  {
    name: 'config',
    title: '配置管理',
    description: '配置设置、实时更新、配置监听',
    icon: Settings,
    path: '/config',
  },
  {
    name: 'events',
    title: '事件系统',
    description: '事件发射、事件监听、事件流可视化',
    icon: Zap,
    path: '/events',
  },
  {
    name: 'examples',
    title: '综合示例',
    description: '完整的业务场景演示、最佳实践展示',
    icon: Users,
    path: '/examples',
  },
]

// 计算属性
const engineStatus = computed(() => {
  if (!engine) {
    return {
      isRunning: false,
      state: '未连接',
      version: '未知',
      name: '未知',
    }
  }

  return {
    isRunning: engine.state === 'mounted',
    state: engine.state || '未知',
    version: engine.version || '1.0.0',
    name: engine.name || 'LDesign Engine',
  }
})

const pluginCount = computed(() => {
  if (!engine || !engine.plugins)
return 0
  return Object.keys(engine.plugins || {}).length
})

const performanceScore = computed(() => {
  // 模拟性能分数计算
  const baseScore = 85
  const pluginPenalty = Math.max(0, (pluginCount.value - 5) * 2)
  return Math.max(50, Math.min(100, baseScore - pluginPenalty))
})

const filteredLogs = computed(() => {
  if (logLevel.value === 'all')
return logs.value
  return logs.value.filter(log => log.level === logLevel.value)
})

// 方法
function addLog(level: string, message: string) {
  const log = {
    id: Date.now() + Math.random(),
    level,
    message,
    timestamp: Date.now(),
  }

  logs.value.push(log)

  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value.shift()
  }

  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  }
}

function clearLogs() {
  logs.value = []
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString()
}

// 生命周期
onMounted(() => {
  // 添加初始日志
  addLog('info', '引擎演示应用已启动')
  addLog('info', `引擎状态: ${engineStatus.value.state}`)
  addLog('info', `已安装插件数量: ${pluginCount.value}`)

  // 监听引擎事件
  if (engine) {
    const unsubscribers: Array<() => void> = []

    // 监听各种引擎事件
    const events = [
      'engine:mounted',
      'engine:unmounted',
      'plugin:installed',
      'plugin:uninstalled',
      'config:changed',
      'middleware:error',
      'engine:error',
    ]

    events.forEach((event) => {
      const unsubscribe = engine.on(event, (data: any) => {
        const level = event.includes('error') ? 'error' : 'info'
        addLog(level, `${event}: ${JSON.stringify(data)}`)
      })
      unsubscribers.push(unsubscribe)
    })

    // 清理函数
    onUnmounted(() => {
      unsubscribers.forEach(fn => fn())
    })
  }

  // 模拟一些日志
  setTimeout(() => addLog('info', '主题服务已初始化'), 1000)
  setTimeout(() => addLog('info', '通知服务已初始化'), 1500)
  setTimeout(() => addLog('warn', '这是一个警告消息'), 3000)
})
</script>

<template>
  <div class="home-page">
    <!-- 引擎状态面板 -->
    <div class="status-panel">
      <h2 class="panel-title">
        <Activity class="icon" />
        引擎状态面板
      </h2>
      <div class="status-grid">
        <div class="status-card">
          <div class="status-indicator" :class="{ active: engineStatus.isRunning }">
            <div class="status-dot" />
          </div>
          <div class="status-info">
            <h3>引擎状态</h3>
            <p>{{ engineStatus.state }}</p>
          </div>
        </div>
        <div class="status-card">
          <div class="status-badge">
            v{{ engineStatus.version }}
          </div>
          <div class="status-info">
            <h3>版本信息</h3>
            <p>{{ engineStatus.name }}</p>
          </div>
        </div>
        <div class="status-card">
          <div class="status-number">
            {{ pluginCount }}
          </div>
          <div class="status-info">
            <h3>已安装插件</h3>
            <p>{{ pluginCount }} 个插件</p>
          </div>
        </div>
        <div class="status-card">
          <div class="status-progress">
            <div class="progress-bar" :style="{ width: `${performanceScore}%` }" />
          </div>
          <div class="status-info">
            <h3>性能指标</h3>
            <p>{{ performanceScore }}% 健康度</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能导航卡片 -->
    <div class="navigation-panel">
      <h2 class="panel-title">
        <Grid class="icon" />
        功能导航
      </h2>
      <div class="nav-grid">
        <router-link
          v-for="feature in features"
          :key="feature.name"
          :to="feature.path"
          class="nav-card"
        >
          <div class="nav-icon">
            <component :is="feature.icon" />
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <div class="nav-arrow">
            <ArrowRight class="arrow-icon" />
          </div>
        </router-link>
      </div>
    </div>

    <!-- 实时日志面板 -->
    <div class="logs-panel">
      <div class="logs-header">
        <h2 class="panel-title">
          <Terminal class="icon" />
          实时日志
        </h2>
        <div class="logs-controls">
          <select v-model="logLevel" class="log-filter">
            <option value="all">
              所有级别
            </option>
            <option value="info">
              信息
            </option>
            <option value="warn">
              警告
            </option>
            <option value="error">
              错误
            </option>
          </select>
          <button class="btn btn-sm" @click="clearLogs">
            <Trash2 class="btn-icon" />
            清空
          </button>
          <button class="btn btn-sm" :class="{ active: autoScroll }" @click="toggleAutoScroll">
            <ScrollText class="btn-icon" />
            自动滚动
          </button>
        </div>
      </div>
      <div ref="logsContainer" class="logs-content">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="log-entry"
          :class="`log-${log.level}`"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="filteredLogs.length === 0" class="no-logs">
          暂无日志记录
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

/* 状态面板样式 */
.status-panel {
  margin-bottom: 2rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.status-indicator.active {
  background: #dcfce7;
}

.status-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #ef4444;
}

.status-indicator.active .status-dot {
  background: #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-badge {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-number {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
}

.status-progress {
  width: 3rem;
  height: 3rem;
  background: #f3f4f6;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
}

.status-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.status-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* 导航面板样式 */
.navigation-panel {
  margin-bottom: 2rem;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.nav-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.nav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.nav-icon {
  width: 3rem;
  height: 3rem;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.nav-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

.nav-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.nav-card p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.nav-arrow {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-card:hover .nav-arrow {
  opacity: 1;
}

.arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
}

/* 日志面板样式 */
.logs-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.log-filter {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #e5e7eb;
}

.btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.logs-content {
  height: 300px;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.log-time {
  color: #6b7280;
  min-width: 80px;
}

.log-level {
  min-width: 60px;
  font-weight: 600;
}

.log-info .log-level {
  color: #3b82f6;
}

.log-warn .log-level {
  color: #f59e0b;
}

.log-error .log-level {
  color: #ef4444;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.no-logs {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
  }

  .status-grid,
  .nav-grid {
    grid-template-columns: 1fr;
  }

  .logs-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .logs-controls {
    justify-content: center;
  }
}
</style>
