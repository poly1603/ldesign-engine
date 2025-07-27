<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import {
  Activity,
  AlertTriangle,
  BarChart,
  CheckCircle,
  Circle,
  Clock,
  Layers,
  Loader,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Timer,
  Trash2,
  TrendingUp,
  X,
  XCircle,
  Zap,
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const currentPhase = ref('')
const isSimulating = ref(false)
const selectedHook = ref('beforeMount')
const showAddMiddleware = ref(false)

// 可用的生命周期钩子
const availableHooks = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeUnmount',
  'unmounted',
]

// 生命周期阶段
const lifecyclePhases = ref([
  {
    name: 'beforeCreate',
    title: '创建前',
    description: '实例初始化之后，数据观测和事件配置之前',
    duration: 0,
    middlewareCount: 2,
    completed: false,
    executing: false,
    middlewares: [
      { name: 'logger', duration: 5, executing: false, completed: false, error: false },
      { name: 'validator', duration: 8, executing: false, completed: false, error: false },
    ],
  },
  {
    name: 'created',
    title: '创建完成',
    description: '实例创建完成，数据观测已完成',
    duration: 0,
    middlewareCount: 1,
    completed: false,
    executing: false,
    middlewares: [
      { name: 'initializer', duration: 12, executing: false, completed: false, error: false },
    ],
  },
  {
    name: 'beforeMount',
    title: '挂载前',
    description: '模板编译完成，即将挂载到DOM',
    duration: 0,
    middlewareCount: 3,
    completed: false,
    executing: false,
    middlewares: [
      { name: 'preloader', duration: 15, executing: false, completed: false, error: false },
      { name: 'theme', duration: 7, executing: false, completed: false, error: false },
      { name: 'router', duration: 10, executing: false, completed: false, error: false },
    ],
  },
  {
    name: 'mounted',
    title: '挂载完成',
    description: '实例挂载完成，可以访问DOM元素',
    duration: 0,
    middlewareCount: 2,
    completed: false,
    executing: false,
    middlewares: [
      { name: 'analytics', duration: 6, executing: false, completed: false, error: false },
      { name: 'notification', duration: 4, executing: false, completed: false, error: false },
    ],
  },
])

// 注册的中间件
const registeredMiddlewares = ref([
  {
    id: 1,
    name: 'logger',
    hook: 'beforeCreate',
    priority: 1,
    enabled: true,
    lastDuration: 5,
  },
  {
    id: 2,
    name: 'validator',
    hook: 'beforeCreate',
    priority: 2,
    enabled: true,
    lastDuration: 8,
  },
  {
    id: 3,
    name: 'theme',
    hook: 'beforeMount',
    priority: 1,
    enabled: true,
    lastDuration: 7,
  },
  {
    id: 4,
    name: 'analytics',
    hook: 'mounted',
    priority: 1,
    enabled: false,
    lastDuration: 6,
  },
])

// 新中间件表单
const newMiddleware = ref({
  name: '',
  hook: 'beforeMount',
  priority: 1,
  code: `async function middleware(context, next) {
  console.log('Middleware executing:', context.hook)
  
  // 执行前置逻辑
  const startTime = Date.now()
  
  try {
    // 调用下一个中间件
    await next()
    
    // 执行后置逻辑
    const duration = Date.now() - startTime
    console.log('Middleware completed in:', duration + 'ms')
  } catch (error) {
    console.error('Middleware error:', error)
    throw error
  }
}`,
})

// 性能指标
const performanceMetrics = ref({
  avgExecutionTime: 12.5,
  timeChange: -2.3,
  memoryUsage: 8.7,
  memoryChange: 1.2,
  executionCount: 1247,
  executionIncrease: 23,
  errorRate: 0.8,
  errorRateChange: -0.2,
})

// 性能图表数据
const executionTimeData = ref([15, 12, 18, 10, 14, 16, 11, 13, 9, 12])
const memoryUsageData = ref([8, 9, 7, 10, 8, 11, 9, 8, 10, 9])

// 计算属性
const executionTimePoints = computed(() => {
  return executionTimeData.value
    .map((point, index) => `${index * 40 + 20},${200 - point * 2}`)
    .join(' ')
})

const memoryUsagePoints = computed(() => {
  return memoryUsageData.value
    .map((point, index) => `${index * 40 + 20},${200 - point * 4}`)
    .join(' ')
})

// 方法
async function simulateLifecycle() {
  if (isSimulating.value)
return

  isSimulating.value = true
  resetLifecycle()

  for (const phase of lifecyclePhases.value) {
    currentPhase.value = phase.name
    phase.executing = true

    // 执行该阶段的中间件
    for (const middleware of phase.middlewares || []) {
      middleware.executing = true
      await new Promise(resolve => setTimeout(resolve, middleware.duration * 10))
      middleware.executing = false
      middleware.completed = true
    }

    // 计算阶段总时间
    phase.duration = (phase.middlewares || []).reduce((sum, m) => sum + m.duration, 0)

    await new Promise(resolve => setTimeout(resolve, 200))

    phase.executing = false
    phase.completed = true
  }

  currentPhase.value = ''
  isSimulating.value = false

  // 更新性能指标
  updatePerformanceMetrics()
}

function resetLifecycle() {
  lifecyclePhases.value.forEach((phase) => {
    phase.completed = false
    phase.executing = false
    phase.duration = 0

    if (phase.middlewares) {
      phase.middlewares.forEach((middleware) => {
        middleware.executing = false
        middleware.completed = false
        middleware.error = false
      })
    }
  })
  currentPhase.value = ''
}

function addMiddleware() {
  const middleware = {
    id: Date.now(),
    name: newMiddleware.value.name,
    hook: newMiddleware.value.hook,
    priority: newMiddleware.value.priority,
    enabled: true,
    lastDuration: null,
  }

  registeredMiddlewares.value.push(middleware)

  // 重置表单
  newMiddleware.value = {
    name: '',
    hook: 'beforeMount',
    priority: 1,
    code: newMiddleware.value.code, // 保留代码模板
  }

  showAddMiddleware.value = false

  // 触发引擎事件
  if (engine) {
    engine.emit('middleware:added', middleware)
  }
}

function toggleMiddleware(middleware: any) {
  middleware.enabled = !middleware.enabled

  if (engine) {
    engine.emit('middleware:toggled', {
      name: middleware.name,
      enabled: middleware.enabled,
    })
  }
}

async function executeMiddleware(middleware: any) {
  const startTime = Date.now()

  try {
    // 模拟中间件执行
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

    middleware.lastDuration = Date.now() - startTime

    if (engine) {
      engine.emit('middleware:executed', {
        name: middleware.name,
        duration: middleware.lastDuration,
      })
    }
  }
 catch (error) {
    if (engine) {
      engine.emit('middleware:error', {
        name: middleware.name,
        error,
      })
    }
  }
}

function removeMiddleware(middleware: any) {
  const index = registeredMiddlewares.value.findIndex(m => m.id === middleware.id)
  if (index > -1) {
    registeredMiddlewares.value.splice(index, 1)

    if (engine) {
      engine.emit('middleware:removed', { name: middleware.name })
    }
  }
}

function closeAddMiddleware() {
  showAddMiddleware.value = false
}

function updatePerformanceMetrics() {
  // 模拟性能指标更新
  performanceMetrics.value.executionCount += Math.floor(Math.random() * 10) + 1
  performanceMetrics.value.executionIncrease = Math.floor(Math.random() * 20) + 10

  // 更新图表数据
  executionTimeData.value.push(Math.floor(Math.random() * 10) + 8)
  executionTimeData.value.shift()

  memoryUsageData.value.push(Math.floor(Math.random() * 5) + 7)
  memoryUsageData.value.shift()
}

// 生命周期
onMounted(() => {
  // 模拟实时性能数据更新
  setInterval(updatePerformanceMetrics, 5000)
})
</script>

<template>
  <div class="middleware-page">
    <div class="page-header">
      <h1>
        <Layers class="icon" />
        中间件系统演示
      </h1>
      <p>展示生命周期钩子、中间件执行流程和性能监控</p>
    </div>

    <!-- 生命周期可视化 -->
    <div class="section">
      <h2 class="section-title">
        <Clock class="icon" />
        生命周期可视化
      </h2>

      <div class="lifecycle-container">
        <div class="lifecycle-timeline">
          <div
            v-for="(phase, index) in lifecyclePhases"
            :key="phase.name"
            class="timeline-item"
            :class="{
              active: currentPhase === phase.name,
              completed: phase.completed,
              executing: phase.executing,
            }"
          >
            <div class="timeline-marker">
              <div class="marker-dot">
                <CheckCircle v-if="phase.completed" class="marker-icon completed" />
                <Loader v-else-if="phase.executing" class="marker-icon executing spinning" />
                <Circle v-else class="marker-icon pending" />
              </div>
              <div v-if="index < lifecyclePhases.length - 1" class="marker-line" />
            </div>

            <div class="timeline-content">
              <h3>{{ phase.title }}</h3>
              <p>{{ phase.description }}</p>
              <div class="phase-stats">
                <span class="stat-item">
                  <Timer class="stat-icon" />
                  {{ phase.duration }}ms
                </span>
                <span class="stat-item">
                  <Layers class="stat-icon" />
                  {{ phase.middlewareCount }} 中间件
                </span>
              </div>

              <!-- 中间件列表 -->
              <div v-if="phase.middlewares?.length" class="middleware-list">
                <div
                  v-for="middleware in phase.middlewares"
                  :key="middleware.name"
                  class="middleware-item"
                  :class="{
                    executing: middleware.executing,
                    completed: middleware.completed,
                    error: middleware.error,
                  }"
                >
                  <div class="middleware-status">
                    <CheckCircle v-if="middleware.completed" class="status-icon success" />
                    <XCircle v-else-if="middleware.error" class="status-icon error" />
                    <Loader v-else-if="middleware.executing" class="status-icon executing spinning" />
                    <Circle v-else class="status-icon pending" />
                  </div>
                  <div class="middleware-info">
                    <span class="middleware-name">{{ middleware.name }}</span>
                    <span class="middleware-time">{{ middleware.duration }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lifecycle-controls">
          <button class="btn btn-primary" :disabled="isSimulating" @click="simulateLifecycle">
            <Play class="btn-icon" />
            {{ isSimulating ? '执行中...' : '模拟生命周期' }}
          </button>
          <button class="btn btn-secondary" @click="resetLifecycle">
            <RotateCcw class="btn-icon" />
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 中间件管理器 -->
    <div class="section">
      <h2 class="section-title">
        <Settings class="icon" />
        中间件管理器
      </h2>

      <div class="middleware-manager">
        <div class="manager-controls">
          <div class="hook-selector">
            <label>选择生命周期钩子:</label>
            <select v-model="selectedHook" class="hook-select">
              <option v-for="hook in availableHooks" :key="hook" :value="hook">
                {{ hook }}
              </option>
            </select>
          </div>

          <button class="btn btn-primary" @click="showAddMiddleware = true">
            <Plus class="btn-icon" />
            添加中间件
          </button>
        </div>

        <div class="middleware-table">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>钩子</th>
                <th>优先级</th>
                <th>状态</th>
                <th>执行时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="middleware in registeredMiddlewares" :key="middleware.id">
                <td>{{ middleware.name }}</td>
                <td>
                  <span class="hook-badge">{{ middleware.hook }}</span>
                </td>
                <td>{{ middleware.priority }}</td>
                <td>
                  <span
                    class="status-badge"
                    :class="middleware.enabled ? 'enabled' : 'disabled'"
                  >
                    {{ middleware.enabled ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ middleware.lastDuration || '-' }}ms</td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="btn btn-sm"
                      :class="middleware.enabled ? 'btn-warning' : 'btn-success'"
                      @click="toggleMiddleware(middleware)"
                    >
                      {{ middleware.enabled ? '禁用' : '启用' }}
                    </button>
                    <button class="btn btn-sm btn-primary" @click="executeMiddleware(middleware)">
                      <Play class="btn-icon" />
                      执行
                    </button>
                    <button class="btn btn-sm btn-danger" @click="removeMiddleware(middleware)">
                      <Trash2 class="btn-icon" />
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 性能监控面板 -->
    <div class="section">
      <h2 class="section-title">
        <BarChart class="icon" />
        性能监控面板
      </h2>

      <div class="performance-dashboard">
        <div class="performance-cards">
          <div class="perf-card">
            <div class="perf-icon">
              <Zap class="icon" />
            </div>
            <div class="perf-content">
              <h3>平均执行时间</h3>
              <div class="perf-value">
                {{ performanceMetrics.avgExecutionTime }}ms
              </div>
              <div class="perf-change" :class="performanceMetrics.timeChange >= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.timeChange >= 0 ? '+' : '' }}{{ performanceMetrics.timeChange }}%
              </div>
            </div>
          </div>

          <div class="perf-card">
            <div class="perf-icon">
              <Activity class="icon" />
            </div>
            <div class="perf-content">
              <h3>内存使用</h3>
              <div class="perf-value">
                {{ performanceMetrics.memoryUsage }}MB
              </div>
              <div class="perf-change" :class="performanceMetrics.memoryChange >= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.memoryChange >= 0 ? '+' : '' }}{{ performanceMetrics.memoryChange }}%
              </div>
            </div>
          </div>

          <div class="perf-card">
            <div class="perf-icon">
              <TrendingUp class="icon" />
            </div>
            <div class="perf-content">
              <h3>执行次数</h3>
              <div class="perf-value">
                {{ performanceMetrics.executionCount }}
              </div>
              <div class="perf-change positive">
                +{{ performanceMetrics.executionIncrease }}
              </div>
            </div>
          </div>

          <div class="perf-card">
            <div class="perf-icon">
              <AlertTriangle class="icon" />
            </div>
            <div class="perf-content">
              <h3>错误率</h3>
              <div class="perf-value">
                {{ performanceMetrics.errorRate }}%
              </div>
              <div class="perf-change" :class="performanceMetrics.errorRateChange >= 0 ? 'positive' : 'negative'">
                {{ performanceMetrics.errorRateChange >= 0 ? '+' : '' }}{{ performanceMetrics.errorRateChange }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 性能图表 -->
        <div class="performance-charts">
          <div class="chart-container">
            <h3>执行时间趋势</h3>
            <div class="chart-placeholder">
              <svg class="performance-chart" viewBox="0 0 400 200">
                <polyline
                  :points="executionTimePoints"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                />
                <circle
                  v-for="(point, index) in executionTimeData"
                  :key="index"
                  :cx="index * 40 + 20"
                  :cy="200 - point * 2"
                  r="3"
                  fill="#3b82f6"
                />
              </svg>
            </div>
          </div>

          <div class="chart-container">
            <h3>内存使用趋势</h3>
            <div class="chart-placeholder">
              <svg class="performance-chart" viewBox="0 0 400 200">
                <polyline
                  :points="memoryUsagePoints"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="2"
                />
                <circle
                  v-for="(point, index) in memoryUsageData"
                  :key="index"
                  :cx="index * 40 + 20"
                  :cy="200 - point * 4"
                  r="3"
                  fill="#10b981"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加中间件模态框 -->
    <div v-if="showAddMiddleware" class="modal-overlay" @click="closeAddMiddleware">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加中间件</h3>
          <button class="modal-close" @click="closeAddMiddleware">
            <X class="close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addMiddleware">
            <div class="form-group">
              <label>中间件名称</label>
              <input v-model="newMiddleware.name" required class="form-input" placeholder="输入中间件名称">
            </div>

            <div class="form-group">
              <label>生命周期钩子</label>
              <select v-model="newMiddleware.hook" required class="form-select">
                <option v-for="hook in availableHooks" :key="hook" :value="hook">
                  {{ hook }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>优先级</label>
              <input v-model.number="newMiddleware.priority" type="number" class="form-input" placeholder="数字越小优先级越高">
            </div>

            <div class="form-group">
              <label>中间件代码</label>
              <textarea
                v-model="newMiddleware.code"
                required
                class="form-textarea"
                rows="8"
                placeholder="输入中间件函数代码..."
              />
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeAddMiddleware">
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                添加中间件
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.middleware-page {
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

/* 生命周期时间轴 */
.lifecycle-container {
  display: flex;
  gap: 2rem;
}

.lifecycle-timeline {
  flex: 1;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-dot {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.timeline-item.active .marker-dot {
  background: #dbeafe;
  border-color: #3b82f6;
}

.timeline-item.completed .marker-dot {
  background: #dcfce7;
  border-color: #22c55e;
}

.timeline-item.executing .marker-dot {
  background: #fef3c7;
  border-color: #f59e0b;
}

.marker-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.marker-icon.pending {
  color: #9ca3af;
}

.marker-icon.executing {
  color: #f59e0b;
}

.marker-icon.completed {
  color: #22c55e;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.marker-line {
  width: 2px;
  height: 2rem;
  background: #e5e7eb;
  margin-top: 0.5rem;
}

.timeline-item.completed .marker-line {
  background: #22c55e;
}

.timeline-content {
  flex: 1;
  padding-top: 0.5rem;
}

.timeline-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.timeline-content p {
  margin: 0 0 1rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.phase-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
}

.middleware-list {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
}

.middleware-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.middleware-item:last-child {
  margin-bottom: 0;
}

.middleware-item.executing {
  background: #fef3c7;
}

.middleware-item.completed {
  background: #dcfce7;
}

.middleware-item.error {
  background: #fecaca;
}

.status-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.status-icon.success {
  color: #22c55e;
}

.status-icon.error {
  color: #ef4444;
}

.status-icon.executing {
  color: #f59e0b;
}

.status-icon.pending {
  color: #9ca3af;
}

.middleware-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.middleware-name {
  font-weight: 500;
  color: #374151;
}

.middleware-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.lifecycle-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: flex-start;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
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

/* 中间件管理器 */
.middleware-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.manager-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.hook-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hook-selector label {
  font-weight: 500;
  color: #374151;
}

.hook-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.middleware-table {
  overflow-x: auto;
}

.middleware-table table {
  width: 100%;
  border-collapse: collapse;
}

.middleware-table th,
.middleware-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.middleware-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.hook-badge {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.enabled {
  background: #dcfce7;
  color: #166534;
}

.status-badge.disabled {
  background: #f3f4f6;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* 性能监控 */
.performance-dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.performance-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.perf-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.perf-icon {
  width: 3rem;
  height: 3rem;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perf-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.perf-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.perf-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.perf-change.positive {
  color: #059669;
}

.perf-change.negative {
  color: #dc2626;
}

.performance-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.chart-container {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
}

.chart-container h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-placeholder {
  background: white;
  border-radius: 6px;
  padding: 1rem;
}

.performance-chart {
  width: 100%;
  height: 200px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f3f4f6;
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-textarea {
  font-family: 'Courier New', monospace;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .middleware-page {
    padding: 1rem;
  }

  .lifecycle-container {
    flex-direction: column;
  }

  .performance-cards {
    grid-template-columns: 1fr;
  }

  .performance-charts {
    grid-template-columns: 1fr;
  }

  .manager-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
