<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <router-link to="/" class="brand-link">
            <Zap class="brand-icon" />
            <span class="brand-text">LDesign Engine</span>
          </router-link>
          <span class="brand-subtitle">演示应用</span>
        </div>
        
        <div class="nav-menu">
          <router-link 
            v-for="route in navigationRoutes" 
            :key="route.path"
            :to="route.path"
            class="nav-link"
            :class="{ active: $route.path === route.path }"
          >
            <component :is="route.icon" class="nav-icon" />
            <span class="nav-text">{{ route.meta.title }}</span>
          </router-link>
        </div>
        
        <div class="nav-actions">
          <!-- 引擎状态指示器 -->
          <div class="engine-status" :class="engineStatus">
            <div class="status-dot"></div>
            <span class="status-text">{{ getStatusText(engineStatus) }}</span>
          </div>
          
          <!-- 主题切换 -->
          <button @click="toggleTheme" class="theme-toggle" :title="`切换到${isDark ? '浅色' : '深色'}主题`">
            <component :is="isDark ? 'Sun' : 'Moon'" class="theme-icon" />
          </button>
          
          <!-- 设置按钮 -->
          <button @click="openSettings" class="settings-btn" title="设置">
            <Settings class="settings-icon" />
          </button>
        </div>
      </div>
    </nav>
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 全局通知 -->
    <div v-if="notifications.length > 0" class="notifications">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <component :is="getNotificationIcon(notification.type)" class="notification-icon" />
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button @click="dismissNotification(notification.id)" class="notification-close">
          <X class="close-icon" />
        </button>
      </div>
    </div>
    
    <!-- 设置模态框 -->
    <div v-if="showSettings" class="modal-overlay" @click="closeSettings">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>应用设置</h2>
          <button @click="closeSettings" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="setting-group">
            <h3>外观设置</h3>
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="isDark"
                  type="checkbox"
                  class="setting-checkbox"
                  @change="toggleTheme"
                />
                深色主题
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="settings.animations"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用动画效果
              </label>
            </div>
          </div>
          
          <div class="setting-group">
            <h3>性能设置</h3>
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="settings.autoRefresh"
                  type="checkbox"
                  class="setting-checkbox"
                />
                自动刷新数据
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">刷新间隔 (秒)</label>
              <input 
                v-model.number="settings.refreshInterval"
                type="number"
                min="1"
                max="60"
                class="setting-input"
              />
            </div>
          </div>
          
          <div class="setting-group">
            <h3>开发者选项</h3>
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="settings.debugMode"
                  type="checkbox"
                  class="setting-checkbox"
                />
                调试模式
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="settings.showPerformanceMetrics"
                  type="checkbox"
                  class="setting-checkbox"
                />
                显示性能指标
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="resetSettings" class="btn btn-secondary">
            重置设置
          </button>
          <button @click="saveSettings" class="btn btn-primary">
            保存设置
          </button>
        </div>
      </div>
    </div>
    
    <!-- 性能指标悬浮窗 -->
    <div v-if="settings.showPerformanceMetrics" class="performance-overlay">
      <div class="performance-metrics">
        <div class="metric-item">
          <span class="metric-label">FPS:</span>
          <span class="metric-value">{{ performanceMetrics.fps }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">内存:</span>
          <span class="metric-value">{{ performanceMetrics.memory }}MB</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">CPU:</span>
          <span class="metric-value">{{ performanceMetrics.cpu }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Zap,
  Home,
  Puzzle,
  Layers,
  Radio,
  GitBranch,
  Settings as SettingsIcon,
  AlertTriangle,
  Activity,
  Sun,
  Moon,
  Settings,
  X,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-vue-next'

// 注入引擎和服务
const engine = inject('engine') as any
const theme = inject('theme') as any
const notification = inject('notification') as any

// 路由
const route = useRoute()

// 响应式数据
const engineStatus = ref('running')
const isDark = ref(false)
const showSettings = ref(false)
const notifications = ref([])
let performanceInterval: number | null = null

// 导航路由配置
const navigationRoutes = [
  { path: '/', icon: 'Home', meta: { title: '首页' } },
  { path: '/plugins', icon: 'Puzzle', meta: { title: '插件系统' } },
  { path: '/middleware', icon: 'Layers', meta: { title: '中间件' } },
  { path: '/events', icon: 'Radio', meta: { title: '事件系统' } },
  { path: '/di', icon: 'GitBranch', meta: { title: '依赖注入' } },
  { path: '/config', icon: 'SettingsIcon', meta: { title: '配置管理' } },
  { path: '/error-handling', icon: 'AlertTriangle', meta: { title: '错误处理' } },
  { path: '/performance', icon: 'Activity', meta: { title: '性能监控' } }
]

// 应用设置
const settings = ref({
  animations: true,
  autoRefresh: true,
  refreshInterval: 5,
  debugMode: false,
  showPerformanceMetrics: false
})

// 性能指标
const performanceMetrics = ref({
  fps: 60,
  memory: 128,
  cpu: 45
})

// 计算属性
const currentPageTitle = computed(() => {
  const currentRoute = navigationRoutes.find(r => r.path === route.path)
  return currentRoute?.meta.title || '未知页面'
})

// 方法
const getStatusText = (status: string) => {
  const statusMap = {
    running: '运行中',
    stopped: '已停止',
    error: '错误',
    loading: '加载中'
  }
  return statusMap[status] || status
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  
  if (theme) {
    theme.setTheme(isDark.value ? 'dark' : 'light')
  }
  
  // 更新 CSS 变量
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = () => {
  // 保存设置到本地存储
  localStorage.setItem('app-settings', JSON.stringify(settings.value))
  
  // 应用设置
  if (settings.value.showPerformanceMetrics && !performanceInterval) {
    startPerformanceMonitoring()
  } else if (!settings.value.showPerformanceMetrics && performanceInterval) {
    stopPerformanceMonitoring()
  }
  
  showNotification({
    type: 'success',
    title: '设置已保存',
    message: '您的设置已成功保存'
  })
  
  closeSettings()
}

const resetSettings = () => {
  settings.value = {
    animations: true,
    autoRefresh: true,
    refreshInterval: 5,
    debugMode: false,
    showPerformanceMetrics: false
  }
  
  showNotification({
    type: 'info',
    title: '设置已重置',
    message: '所有设置已恢复为默认值'
  })
}

const showNotification = (notificationData: any) => {
  const id = Date.now()
  const newNotification = {
    id,
    ...notificationData,
    timestamp: Date.now()
  }
  
  notifications.value.push(newNotification)
  
  // 自动移除通知
  setTimeout(() => {
    dismissNotification(id)
  }, 5000)
}

const dismissNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    success: 'CheckCircle',
    error: 'AlertCircle',
    warning: 'AlertTriangle',
    info: 'Info'
  }
  return iconMap[type] || 'Info'
}

const startPerformanceMonitoring = () => {
  performanceInterval = setInterval(() => {
    // 模拟性能指标更新
    performanceMetrics.value.fps = Math.floor(Math.random() * 10) + 55
    performanceMetrics.value.memory = Math.floor(Math.random() * 50) + 100
    performanceMetrics.value.cpu = Math.floor(Math.random() * 30) + 30
  }, 1000)
}

const stopPerformanceMonitoring = () => {
  if (performanceInterval) {
    clearInterval(performanceInterval)
    performanceInterval = null
  }
}

const loadSettings = () => {
  const savedSettings = localStorage.getItem('app-settings')
  if (savedSettings) {
    try {
      settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
  }
}

const updateEngineStatus = () => {
  if (engine) {
    const state = engine.state
    engineStatus.value = state === 'mounted' ? 'running' : state
  }
}

// 监听设置变化
watch(() => settings.value.showPerformanceMetrics, (newValue) => {
  if (newValue) {
    startPerformanceMonitoring()
  } else {
    stopPerformanceMonitoring()
  }
})

// 生命周期
onMounted(() => {
  // 加载设置
  loadSettings()
  
  // 初始化主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
  
  // 监听引擎事件
  if (engine) {
    engine.on('*', (eventName: string, data: any) => {
      if (settings.value.debugMode) {
        console.log('Engine Event:', eventName, data)
      }
      
      // 更新引擎状态
      updateEngineStatus()
    })
    
    // 初始状态更新
    updateEngineStatus()
  }
  
  // 监听通知服务
  if (notification) {
    notification.on('notification', (data: any) => {
      showNotification(data)
    })
  }
  
  // 启动性能监控（如果启用）
  if (settings.value.showPerformanceMetrics) {
    startPerformanceMonitoring()
  }
})

onUnmounted(() => {
  stopPerformanceMonitoring()
})
</script>

<style scoped>
/* 全局样式变量 */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #dc2626;
  --background-color: #ffffff;
  --surface-color: #f9fafb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --background-color: #111827;
  --surface-color: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #374151;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

#app {
  min-height: 100vh;
  background: var(--background-color);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* 导航栏 */
.navbar {
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.25rem;
}

.brand-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

.brand-text {
  color: var(--text-primary);
}

.brand-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.nav-menu {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--primary-color);
  color: white;
}

.nav-link.active {
  background: var(--primary-color);
  color: white;
}

.nav-icon {
  width: 16px;
  height: 16px;
}

.nav-text {
  white-space: nowrap;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.engine-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.engine-status.running {
  background: #f0fdf4;
  color: #16a34a;
}

.engine-status.stopped {
  background: #fef2f2;
  color: #dc2626;
}

.engine-status.error {
  background: #fef2f2;
  color: #dc2626;
}

.engine-status.loading {
  background: #fffbeb;
  color: #f59e0b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-text {
  white-space: nowrap;
}

.theme-toggle,
.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover,
.settings-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.theme-icon,
.settings-icon {
  width: 18px;
  height: 18px;
}

/* 主要内容 */
.main-content {
  min-height: calc(100vh - 64px);
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 通知 */
.notifications {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #f0fdf4;
  border: 1px solid #16a34a;
  color: #15803d;
}

.notification.error {
  background: #fef2f2;
  border: 1px solid #dc2626;
  color: #dc2626;
}

.notification.warning {
  background: #fffbeb;
  border: 1px solid #f59e0b;
  color: #d97706;
}

.notification.info {
  background: #eff6ff;
  border: 1px solid #3b82f6;
  color: #2563eb;
}

.notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 0.875rem;
  opacity: 0.9;
}

.notification-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

.close-icon {
  width: 16px;
  height: 16px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: var(--surface-color);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
}

.setting-input {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  width: 80px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 性能指标悬浮窗 */
.performance-overlay {
  position: fixed;
  top: 80px;
  left: 24px;
  z-index: 999;
}

.performance-metrics {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.metric-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.metric-value {
  color: var(--text-primary);
  font-weight: 600;
  font-family: monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 16px;
  }
  
  .nav-menu {
    display: none;
  }
  
  .nav-text {
    display: none;
  }
  
  .brand-subtitle {
    display: none;
  }
  
  .notifications {
    right: 16px;
    left: 16px;
    max-width: none;
  }
  
  .modal-content {
    margin: 16px;
    width: calc(100% - 32px);
  }
  
  .performance-overlay {
    left: 16px;
  }
}
</style>