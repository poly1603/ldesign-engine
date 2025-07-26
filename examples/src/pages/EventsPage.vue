<template>
  <div class="events-page">
    <div class="page-header">
      <h1>
        <Radio class="icon" />
        事件系统演示
      </h1>
      <p>展示事件发布订阅、事件监听和实时通信功能</p>
    </div>

    <!-- 事件监控面板 -->
    <div class="section">
      <h2 class="section-title">
        <Activity class="icon" />
        实时事件监控
      </h2>
      
      <div class="event-monitor">
        <div class="monitor-header">
          <div class="monitor-stats">
            <div class="stat-card">
              <div class="stat-icon">
                <Zap class="icon" />
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ eventStats.totalEvents }}</div>
                <div class="stat-label">总事件数</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <Users class="icon" />
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ eventStats.activeListeners }}</div>
                <div class="stat-label">活跃监听器</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <Clock class="icon" />
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ eventStats.avgResponseTime }}ms</div>
                <div class="stat-label">平均响应时间</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <AlertTriangle class="icon" />
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ eventStats.errorCount }}</div>
                <div class="stat-label">错误数量</div>
              </div>
            </div>
          </div>
          
          <div class="monitor-controls">
            <button @click="clearEventLog" class="btn btn-secondary">
              <Trash2 class="btn-icon" />
              清空日志
            </button>
            <button @click="toggleAutoScroll" class="btn" :class="autoScroll ? 'btn-primary' : 'btn-secondary'">
              <ArrowDown class="btn-icon" />
              {{ autoScroll ? '停止' : '开启' }}自动滚动
            </button>
            <button @click="exportEventLog" class="btn btn-secondary">
              <Download class="btn-icon" />
              导出日志
            </button>
          </div>
        </div>
        
        <div class="event-log" ref="eventLogRef">
          <div 
            v-for="event in filteredEventLog" 
            :key="event.id"
            class="event-item"
            :class="{
              'event-system': event.type === 'system',
              'event-user': event.type === 'user',
              'event-error': event.level === 'error',
              'event-warning': event.level === 'warning',
              'event-info': event.level === 'info'
            }"
          >
            <div class="event-time">{{ formatTime(event.timestamp) }}</div>
            <div class="event-type">
              <span class="type-badge" :class="event.type">{{ event.type }}</span>
            </div>
            <div class="event-name">{{ event.name }}</div>
            <div class="event-data">
              <pre v-if="event.data">{{ JSON.stringify(event.data, null, 2) }}</pre>
              <span v-else class="no-data">无数据</span>
            </div>
            <div class="event-listeners">{{ event.listenerCount }} 个监听器</div>
            <div class="event-duration">{{ event.duration }}ms</div>
          </div>
          
          <div v-if="filteredEventLog.length === 0" class="empty-log">
            <Radio class="empty-icon" />
            <p>暂无事件日志</p>
          </div>
        </div>
        
        <div class="log-filters">
          <div class="filter-group">
            <label>事件类型:</label>
            <select v-model="logFilter.type" class="filter-select">
              <option value="">全部</option>
              <option value="system">系统事件</option>
              <option value="user">用户事件</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>日志级别:</label>
            <select v-model="logFilter.level" class="filter-select">
              <option value="">全部</option>
              <option value="info">信息</option>
              <option value="warning">警告</option>
              <option value="error">错误</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>搜索:</label>
            <input 
              v-model="logFilter.search" 
              placeholder="搜索事件名称..." 
              class="filter-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 事件发布器 -->
    <div class="section">
      <h2 class="section-title">
        <Send class="icon" />
        事件发布器
      </h2>
      
      <div class="event-publisher">
        <div class="publisher-form">
          <div class="form-row">
            <div class="form-group">
              <label>事件名称</label>
              <input 
                v-model="newEvent.name" 
                placeholder="输入事件名称" 
                class="form-input"
                list="event-suggestions"
              />
              <datalist id="event-suggestions">
                <option v-for="suggestion in eventSuggestions" :key="suggestion" :value="suggestion" />
              </datalist>
            </div>
            
            <div class="form-group">
              <label>事件类型</label>
              <select v-model="newEvent.type" class="form-select">
                <option value="user">用户事件</option>
                <option value="system">系统事件</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>优先级</label>
              <select v-model="newEvent.priority" class="form-select">
                <option value="low">低</option>
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="critical">紧急</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>事件数据 (JSON)</label>
            <textarea 
              v-model="newEvent.data" 
              placeholder="输入事件数据 (JSON 格式)" 
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button @click="publishEvent" class="btn btn-primary" :disabled="!newEvent.name">
              <Send class="btn-icon" />
              发布事件
            </button>
            <button @click="publishBatchEvents" class="btn btn-secondary">
              <Layers class="btn-icon" />
              批量发布
            </button>
            <button @click="scheduleEvent" class="btn btn-secondary">
              <Clock class="btn-icon" />
              定时发布
            </button>
          </div>
        </div>
        
        <!-- 快速事件按钮 -->
        <div class="quick-events">
          <h3>快速事件</h3>
          <div class="quick-buttons">
            <button 
              v-for="quickEvent in quickEvents" 
              :key="quickEvent.name"
              @click="publishQuickEvent(quickEvent)"
              class="quick-btn"
              :class="quickEvent.type"
            >
              <component :is="quickEvent.icon" class="quick-icon" />
              {{ quickEvent.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件监听器管理 -->
    <div class="section">
      <h2 class="section-title">
        <Headphones class="icon" />
        事件监听器管理
      </h2>
      
      <div class="listener-manager">
        <div class="manager-header">
          <button @click="showAddListener = true" class="btn btn-primary">
            <Plus class="btn-icon" />
            添加监听器
          </button>
          
          <div class="listener-stats">
            <span class="stat-item">
              <Users class="stat-icon" />
              {{ listeners.length }} 个监听器
            </span>
            <span class="stat-item">
              <Activity class="stat-icon" />
              {{ activeListeners }} 个活跃
            </span>
          </div>
        </div>
        
        <div class="listener-table">
          <table>
            <thead>
              <tr>
                <th>监听器名称</th>
                <th>监听事件</th>
                <th>状态</th>
                <th>触发次数</th>
                <th>最后触发</th>
                <th>平均耗时</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="listener in listeners" :key="listener.id">
                <td>
                  <div class="listener-name">
                    <div class="listener-title">{{ listener.name }}</div>
                    <div class="listener-description">{{ listener.description }}</div>
                  </div>
                </td>
                <td>
                  <div class="event-patterns">
                    <span 
                      v-for="pattern in listener.eventPatterns" 
                      :key="pattern"
                      class="pattern-badge"
                    >
                      {{ pattern }}
                    </span>
                  </div>
                </td>
                <td>
                  <span 
                    class="status-badge"
                    :class="listener.active ? 'active' : 'inactive'"
                  >
                    {{ listener.active ? '活跃' : '停用' }}
                  </span>
                </td>
                <td>{{ listener.triggerCount }}</td>
                <td>{{ listener.lastTriggered ? formatTime(listener.lastTriggered) : '-' }}</td>
                <td>{{ listener.avgDuration }}ms</td>
                <td>
                  <div class="action-buttons">
                    <button 
                      @click="toggleListener(listener)"
                      class="btn btn-sm"
                      :class="listener.active ? 'btn-warning' : 'btn-success'"
                    >
                      {{ listener.active ? '停用' : '启用' }}
                    </button>
                    <button @click="testListener(listener)" class="btn btn-sm btn-primary">
                      <Play class="btn-icon" />
                      测试
                    </button>
                    <button @click="removeListener(listener)" class="btn btn-sm btn-danger">
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

    <!-- 事件流可视化 -->
    <div class="section">
      <h2 class="section-title">
        <GitBranch class="icon" />
        事件流可视化
      </h2>
      
      <div class="event-flow">
        <div class="flow-controls">
          <button @click="startEventFlow" class="btn btn-primary" :disabled="isFlowRunning">
            <Play class="btn-icon" />
            {{ isFlowRunning ? '运行中...' : '开始演示' }}
          </button>
          <button @click="stopEventFlow" class="btn btn-secondary" :disabled="!isFlowRunning">
            <Square class="btn-icon" />
            停止
          </button>
          <button @click="resetEventFlow" class="btn btn-secondary">
            <RotateCcw class="btn-icon" />
            重置
          </button>
        </div>
        
        <div class="flow-diagram">
          <svg class="flow-svg" viewBox="0 0 800 400">
            <!-- 事件发布者 -->
            <g class="publisher-node" transform="translate(50, 180)">
              <circle r="30" :class="{ active: flowState.publisherActive }" />
              <text x="0" y="5" text-anchor="middle">发布者</text>
            </g>
            
            <!-- 事件总线 -->
            <g class="event-bus" transform="translate(400, 180)">
              <rect x="-60" y="-30" width="120" height="60" rx="10" :class="{ active: flowState.busActive }" />
              <text x="0" y="5" text-anchor="middle">事件总线</text>
            </g>
            
            <!-- 监听器节点 -->
            <g 
              v-for="(listener, index) in flowListeners" 
              :key="listener.id"
              class="listener-node"
              :transform="`translate(650, ${100 + index * 80})`"
            >
              <circle r="25" :class="{ active: listener.active, triggered: listener.triggered }" />
              <text x="0" y="5" text-anchor="middle" font-size="12">{{ listener.name }}</text>
            </g>
            
            <!-- 连接线 -->
            <line x1="80" y1="180" x2="340" y2="180" class="flow-line" :class="{ active: flowState.publisherActive }" />
            
            <line 
              v-for="(listener, index) in flowListeners" 
              :key="`line-${listener.id}`"
              x1="460" 
              y1="180" 
              x2="625" 
              :y2="100 + index * 80"
              class="flow-line"
              :class="{ active: listener.triggered }"
            />
            
            <!-- 事件气泡 -->
            <g 
              v-for="bubble in eventBubbles" 
              :key="bubble.id"
              class="event-bubble"
              :transform="`translate(${bubble.x}, ${bubble.y})`"
            >
              <circle r="8" :fill="bubble.color" />
              <text x="0" y="-15" text-anchor="middle" font-size="10">{{ bubble.name }}</text>
            </g>
          </svg>
        </div>
        
        <div class="flow-legend">
          <div class="legend-item">
            <div class="legend-color publisher"></div>
            <span>事件发布者</span>
          </div>
          <div class="legend-item">
            <div class="legend-color bus"></div>
            <span>事件总线</span>
          </div>
          <div class="legend-item">
            <div class="legend-color listener"></div>
            <span>事件监听器</span>
          </div>
          <div class="legend-item">
            <div class="legend-color triggered"></div>
            <span>已触发</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加监听器模态框 -->
    <div v-if="showAddListener" class="modal-overlay" @click="closeAddListener">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加事件监听器</h3>
          <button @click="closeAddListener" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addListener">
            <div class="form-group">
              <label>监听器名称</label>
              <input v-model="newListener.name" required class="form-input" placeholder="输入监听器名称" />
            </div>
            
            <div class="form-group">
              <label>描述</label>
              <input v-model="newListener.description" class="form-input" placeholder="输入监听器描述" />
            </div>
            
            <div class="form-group">
              <label>监听事件模式 (用逗号分隔)</label>
              <input 
                v-model="newListener.eventPatterns" 
                required 
                class="form-input" 
                placeholder="例如: user.*, system.error, custom.event"
              />
            </div>
            
            <div class="form-group">
              <label>处理函数</label>
              <textarea 
                v-model="newListener.handler" 
                required 
                class="form-textarea" 
                rows="8"
                placeholder="输入事件处理函数代码..."
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeAddListener" class="btn btn-secondary">
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                添加监听器
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, nextTick } from 'vue'
import {
  Radio,
  Activity,
  Zap,
  Users,
  Clock,
  AlertTriangle,
  Trash2,
  ArrowDown,
  Download,
  Send,
  Layers,
  Headphones,
  Plus,
  Play,
  Square,
  RotateCcw,
  GitBranch,
  X
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const eventLog = ref<any[]>([])
const autoScroll = ref(true)
const eventLogRef = ref<HTMLElement>()
const showAddListener = ref(false)
const isFlowRunning = ref(false)

// 事件统计
const eventStats = ref({
  totalEvents: 0,
  activeListeners: 8,
  avgResponseTime: 12.5,
  errorCount: 2
})

// 日志过滤器
const logFilter = ref({
  type: '',
  level: '',
  search: ''
})

// 新事件表单
const newEvent = ref({
  name: '',
  type: 'user',
  priority: 'normal',
  data: '{}'
})

// 事件建议
const eventSuggestions = [
  'user.login',
  'user.logout',
  'user.register',
  'system.error',
  'system.warning',
  'data.updated',
  'notification.sent',
  'theme.changed'
]

// 快速事件
const quickEvents = [
  { name: 'user.login', label: '用户登录', type: 'success', icon: 'Users', data: { userId: 123 } },
  { name: 'system.error', label: '系统错误', type: 'error', icon: 'AlertTriangle', data: { error: 'Connection failed' } },
  { name: 'notification.sent', label: '发送通知', type: 'info', icon: 'Send', data: { message: 'Hello World' } },
  { name: 'theme.changed', label: '主题切换', type: 'warning', icon: 'Layers', data: { theme: 'dark' } }
]

// 监听器列表
const listeners = ref([
  {
    id: 1,
    name: 'userLogger',
    description: '记录用户操作日志',
    eventPatterns: ['user.*'],
    active: true,
    triggerCount: 45,
    lastTriggered: Date.now() - 300000,
    avgDuration: 8
  },
  {
    id: 2,
    name: 'errorHandler',
    description: '处理系统错误',
    eventPatterns: ['system.error', '*.error'],
    active: true,
    triggerCount: 12,
    lastTriggered: Date.now() - 600000,
    avgDuration: 15
  },
  {
    id: 3,
    name: 'notificationSender',
    description: '发送通知消息',
    eventPatterns: ['notification.*'],
    active: true,
    triggerCount: 78,
    lastTriggered: Date.now() - 120000,
    avgDuration: 25
  },
  {
    id: 4,
    name: 'analyticsTracker',
    description: '跟踪用户行为分析',
    eventPatterns: ['user.click', 'user.view', 'user.action'],
    active: false,
    triggerCount: 234,
    lastTriggered: Date.now() - 1800000,
    avgDuration: 5
  }
])

// 新监听器表单
const newListener = ref({
  name: '',
  description: '',
  eventPatterns: '',
  handler: `async function handleEvent(eventName, eventData) {
  console.log('Event received:', eventName, eventData)
  
  // 处理事件逻辑
  try {
    // 执行业务逻辑
    await processEvent(eventData)
    
    // 返回处理结果
    return {
      success: true,
      message: 'Event processed successfully'
    }
  } catch (error) {
    console.error('Event processing failed:', error)
    throw error
  }
}

function processEvent(data) {
  // 实现具体的事件处理逻辑
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data)
    }, Math.random() * 100)
  })
}`
})

// 事件流状态
const flowState = ref({
  publisherActive: false,
  busActive: false
})

const flowListeners = ref([
  { id: 1, name: 'L1', active: false, triggered: false },
  { id: 2, name: 'L2', active: false, triggered: false },
  { id: 3, name: 'L3', active: false, triggered: false }
])

const eventBubbles = ref<any[]>([])

// 计算属性
const filteredEventLog = computed(() => {
  return eventLog.value.filter(event => {
    if (logFilter.value.type && event.type !== logFilter.value.type) return false
    if (logFilter.value.level && event.level !== logFilter.value.level) return false
    if (logFilter.value.search && !event.name.toLowerCase().includes(logFilter.value.search.toLowerCase())) return false
    return true
  })
})

const activeListeners = computed(() => {
  return listeners.value.filter(l => l.active).length
})

// 方法
const addEventToLog = (event: any) => {
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    name: event.name,
    type: event.type || 'user',
    level: event.level || 'info',
    data: event.data,
    listenerCount: listeners.value.filter(l => 
      l.active && l.eventPatterns.some(pattern => 
        pattern === '*' || 
        pattern === event.name || 
        (pattern.endsWith('*') && event.name.startsWith(pattern.slice(0, -1)))
      )
    ).length,
    duration: Math.floor(Math.random() * 50) + 5
  }
  
  eventLog.value.unshift(logEntry)
  
  // 限制日志数量
  if (eventLog.value.length > 100) {
    eventLog.value = eventLog.value.slice(0, 100)
  }
  
  // 更新统计
  eventStats.value.totalEvents++
  
  // 自动滚动
  if (autoScroll.value) {
    nextTick(() => {
      if (eventLogRef.value) {
        eventLogRef.value.scrollTop = 0
      }
    })
  }
}

const publishEvent = () => {
  if (!newEvent.value.name) return
  
  let eventData
  try {
    eventData = JSON.parse(newEvent.value.data || '{}')
  } catch (error) {
    eventData = { raw: newEvent.value.data }
  }
  
  const event = {
    name: newEvent.value.name,
    type: newEvent.value.type,
    priority: newEvent.value.priority,
    data: eventData
  }
  
  // 添加到日志
  addEventToLog(event)
  
  // 触发引擎事件
  if (engine) {
    engine.emit(event.name, event.data)
  }
  
  // 重置表单
  newEvent.value = {
    name: '',
    type: 'user',
    priority: 'normal',
    data: '{}'
  }
}

const publishQuickEvent = (quickEvent: any) => {
  const event = {
    name: quickEvent.name,
    type: quickEvent.type === 'error' ? 'system' : 'user',
    level: quickEvent.type === 'error' ? 'error' : quickEvent.type === 'warning' ? 'warning' : 'info',
    data: quickEvent.data
  }
  
  addEventToLog(event)
  
  if (engine) {
    engine.emit(event.name, event.data)
  }
}

const publishBatchEvents = () => {
  const batchEvents = [
    { name: 'batch.start', data: { batchId: Date.now() } },
    { name: 'batch.process', data: { step: 1 } },
    { name: 'batch.process', data: { step: 2 } },
    { name: 'batch.complete', data: { success: true } }
  ]
  
  batchEvents.forEach((event, index) => {
    setTimeout(() => {
      addEventToLog(event)
      if (engine) {
        engine.emit(event.name, event.data)
      }
    }, index * 500)
  })
}

const scheduleEvent = () => {
  const scheduledEvent = {
    name: 'scheduled.task',
    type: 'system',
    data: { scheduledAt: new Date().toISOString() }
  }
  
  setTimeout(() => {
    addEventToLog(scheduledEvent)
    if (engine) {
      engine.emit(scheduledEvent.name, scheduledEvent.data)
    }
  }, 3000)
  
  // 添加调度日志
  addEventToLog({
    name: 'event.scheduled',
    type: 'system',
    level: 'info',
    data: { delay: '3秒后执行' }
  })
}

const addListener = () => {
  const listener = {
    id: Date.now(),
    name: newListener.value.name,
    description: newListener.value.description,
    eventPatterns: newListener.value.eventPatterns.split(',').map(p => p.trim()),
    active: true,
    triggerCount: 0,
    lastTriggered: null,
    avgDuration: 0
  }
  
  listeners.value.push(listener)
  
  // 重置表单
  newListener.value = {
    name: '',
    description: '',
    eventPatterns: '',
    handler: newListener.value.handler // 保留代码模板
  }
  
  showAddListener.value = false
  
  // 更新统计
  eventStats.value.activeListeners++
  
  if (engine) {
    engine.emit('listener:added', listener)
  }
}

const toggleListener = (listener: any) => {
  listener.active = !listener.active
  
  if (listener.active) {
    eventStats.value.activeListeners++
  } else {
    eventStats.value.activeListeners--
  }
  
  if (engine) {
    engine.emit('listener:toggled', {
      name: listener.name,
      active: listener.active
    })
  }
}

const testListener = (listener: any) => {
  const testEvent = {
    name: listener.eventPatterns[0].replace('*', 'test'),
    type: 'user',
    level: 'info',
    data: { test: true, listenerId: listener.id }
  }
  
  addEventToLog(testEvent)
  
  // 更新监听器统计
  listener.triggerCount++
  listener.lastTriggered = Date.now()
  listener.avgDuration = Math.floor(Math.random() * 30) + 5
  
  if (engine) {
    engine.emit(testEvent.name, testEvent.data)
  }
}

const removeListener = (listener: any) => {
  const index = listeners.value.findIndex(l => l.id === listener.id)
  if (index > -1) {
    listeners.value.splice(index, 1)
    
    if (listener.active) {
      eventStats.value.activeListeners--
    }
    
    if (engine) {
      engine.emit('listener:removed', { name: listener.name })
    }
  }
}

const clearEventLog = () => {
  eventLog.value = []
  eventStats.value.totalEvents = 0
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
}

const exportEventLog = () => {
  const data = JSON.stringify(eventLog.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `event-log-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

const closeAddListener = () => {
  showAddListener.value = false
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 事件流演示
const startEventFlow = async () => {
  if (isFlowRunning.value) return
  
  isFlowRunning.value = true
  resetEventFlow()
  
  // 激活发布者
  flowState.value.publisherActive = true
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 创建事件气泡
  const bubble = {
    id: Date.now(),
    name: 'test',
    x: 80,
    y: 180,
    color: '#3b82f6'
  }
  eventBubbles.value.push(bubble)
  
  // 移动到事件总线
  const moveToTarget = async (targetX: number, targetY: number, duration: number) => {
    const startX = bubble.x
    const startY = bubble.y
    const startTime = Date.now()
    
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        bubble.x = startX + (targetX - startX) * progress
        bubble.y = startY + (targetY - startY) * progress
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve(void 0)
        }
      }
      animate()
    })
  }
  
  await moveToTarget(400, 180, 1000)
  
  // 激活事件总线
  flowState.value.busActive = true
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 分发到监听器
  for (let i = 0; i < flowListeners.value.length; i++) {
    const listener = flowListeners.value[i]
    const targetY = 100 + i * 80
    
    // 创建新气泡
    const listenerBubble = {
      id: Date.now() + i,
      name: 'test',
      x: 460,
      y: 180,
      color: '#10b981'
    }
    eventBubbles.value.push(listenerBubble)
    
    // 移动到监听器
    moveToTarget.call({ bubble: listenerBubble }, 650, targetY, 800).then(() => {
      listener.triggered = true
      // 移除气泡
      const index = eventBubbles.value.findIndex(b => b.id === listenerBubble.id)
      if (index > -1) {
        eventBubbles.value.splice(index, 1)
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 移除原始气泡
  const index = eventBubbles.value.findIndex(b => b.id === bubble.id)
  if (index > -1) {
    eventBubbles.value.splice(index, 1)
  }
  
  isFlowRunning.value = false
}

const stopEventFlow = () => {
  isFlowRunning.value = false
  eventBubbles.value = []
}

const resetEventFlow = () => {
  flowState.value.publisherActive = false
  flowState.value.busActive = false
  flowListeners.value.forEach(listener => {
    listener.active = false
    listener.triggered = false
  })
  eventBubbles.value = []
}

// 生命周期
onMounted(() => {
  // 初始化一些示例事件
  const sampleEvents = [
    { name: 'app.started', type: 'system', level: 'info', data: { version: '1.0.0' } },
    { name: 'user.login', type: 'user', level: 'info', data: { userId: 123, username: 'demo' } },
    { name: 'theme.changed', type: 'user', level: 'info', data: { theme: 'dark' } }
  ]
  
  sampleEvents.forEach((event, index) => {
    setTimeout(() => addEventToLog(event), index * 1000)
  })
  
  // 监听引擎事件
  if (engine) {
    engine.on('*', (eventName: string, data: any) => {
      addEventToLog({
        name: eventName,
        type: 'system',
        level: 'info',
        data
      })
    })
  }
})
</script>

<style scoped>
.events-page {
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

/* 事件监控面板 */
.event-monitor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.monitor-stats {
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

.monitor-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

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

.event-log {
  background: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.event-item {
  display: grid;
  grid-template-columns: auto auto 1fr 2fr auto auto;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #374151;
  color: #e5e7eb;
  align-items: start;
}

.event-item:last-child {
  border-bottom: none;
}

.event-item.event-error {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
}

.event-item.event-warning {
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
}

.event-item.event-info {
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}

.event-time {
  color: #9ca3af;
  font-size: 0.75rem;
  white-space: nowrap;
}

.type-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.system {
  background: #1e40af;
  color: white;
}

.type-badge.user {
  background: #059669;
  color: white;
}

.event-name {
  font-weight: 500;
  color: #f3f4f6;
}

.event-data {
  color: #d1d5db;
  font-size: 0.75rem;
}

.event-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.no-data {
  color: #6b7280;
  font-style: italic;
}

.event-listeners,
.event-duration {
  color: #9ca3af;
  font-size: 0.75rem;
  text-align: right;
}

.empty-log {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.log-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.filter-select,
.filter-input {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* 事件发布器 */
.event-publisher {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.publisher-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select,
.form-textarea {
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
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-events {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
}

.quick-events h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.quick-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.quick-btn.success {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.quick-btn.error {
  background: #fecaca;
  color: #991b1b;
  border-color: #fca5a5;
}

.quick-btn.info {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

.quick-btn.warning {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.quick-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quick-icon {
  width: 1rem;
  height: 1rem;
}

/* 监听器管理 */
.listener-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.listener-stats {
  display: flex;
  gap: 1rem;
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

.listener-table {
  overflow-x: auto;
}

.listener-table table {
  width: 100%;
  border-collapse: collapse;
}

.listener-table th,
.listener-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.listener-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.listener-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.listener-title {
  font-weight: 500;
  color: #1f2937;
}

.listener-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.event-patterns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pattern-badge {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* 事件流可视化 */
.event-flow {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.flow-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.flow-diagram {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.flow-svg {
  width: 100%;
  height: 400px;
}

.publisher-node circle,
.listener-node circle {
  fill: #e5e7eb;
  stroke: #9ca3af;
  stroke-width: 2;
  transition: all 0.3s ease;
}

.publisher-node circle.active {
  fill: #dbeafe;
  stroke: #3b82f6;
}

.listener-node circle.active {
  fill: #fef3c7;
  stroke: #f59e0b;
}

.listener-node circle.triggered {
  fill: #dcfce7;
  stroke: #22c55e;
}

.event-bus rect {
  fill: #f3f4f6;
  stroke: #d1d5db;
  stroke-width: 2;
  transition: all 0.3s ease;
}

.event-bus rect.active {
  fill: #fef3c7;
  stroke: #f59e0b;
}

.flow-line {
  stroke: #d1d5db;
  stroke-width: 2;
  transition: all 0.3s ease;
}

.flow-line.active {
  stroke: #3b82f6;
  stroke-width: 3;
}

.event-bubble circle {
  opacity: 0.8;
}

.flow-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid;
}

.legend-color.publisher {
  background: #dbeafe;
  border-color: #3b82f6;
}

.legend-color.bus {
  background: #fef3c7;
  border-color: #f59e0b;
  border-radius: 4px;
}

.legend-color.listener {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.legend-color.triggered {
  background: #dcfce7;
  border-color: #22c55e;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .events-page {
    padding: 1rem;
  }
  
  .monitor-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .monitor-stats {
    grid-template-columns: 1fr;
  }
  
  .event-publisher {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .event-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .log-filters {
    flex-direction: column;
  }
}
</style>