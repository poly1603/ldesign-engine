<template>
  <div class="plugins-page">
    <div class="page-header">
      <h1>
        <Puzzle class="icon" />
        插件系统演示
      </h1>
      <p>展示插件管理、动态加载和依赖关系</p>
    </div>

    <!-- 插件列表管理 -->
    <div class="section">
      <h2 class="section-title">
        <Package class="icon" />
        插件列表管理
      </h2>
      
      <div class="plugins-controls">
        <div class="search-box">
          <Search class="search-icon" />
          <input 
            v-model="searchQuery" 
            placeholder="搜索插件..."
            class="search-input"
          />
        </div>
        <select v-model="filterStatus" class="filter-select">
          <option value="all">所有状态</option>
          <option value="installed">已安装</option>
          <option value="available">可用</option>
        </select>
      </div>

      <div class="plugins-grid">
        <div 
          v-for="plugin in filteredPlugins" 
          :key="plugin.name"
          class="plugin-card"
          :class="{ installed: plugin.installed }"
        >
          <div class="plugin-header">
            <div class="plugin-icon">
              <component :is="plugin.icon" />
            </div>
            <div class="plugin-info">
              <h3>{{ plugin.name }}</h3>
              <p>{{ plugin.description }}</p>
            </div>
            <div class="plugin-status">
              <span 
                class="status-badge" 
                :class="plugin.installed ? 'installed' : 'available'"
              >
                {{ plugin.installed ? '已安装' : '可用' }}
              </span>
            </div>
          </div>
          
          <div class="plugin-details">
            <div class="plugin-meta">
              <span class="meta-item">
                <Clock class="meta-icon" />
                v{{ plugin.version }}
              </span>
              <span class="meta-item">
                <User class="meta-icon" />
                {{ plugin.author }}
              </span>
              <span v-if="plugin.dependencies?.length" class="meta-item">
                <Link class="meta-icon" />
                {{ plugin.dependencies.length }} 依赖
              </span>
            </div>
            
            <div class="plugin-actions">
              <button 
                v-if="!plugin.installed"
                @click="installPlugin(plugin)"
                class="btn btn-primary"
                :disabled="installing === plugin.name"
              >
                <Download class="btn-icon" />
                {{ installing === plugin.name ? '安装中...' : '安装' }}
              </button>
              <button 
                v-else
                @click="uninstallPlugin(plugin)"
                class="btn btn-danger"
                :disabled="uninstalling === plugin.name"
              >
                <Trash2 class="btn-icon" />
                {{ uninstalling === plugin.name ? '卸载中...' : '卸载' }}
              </button>
              <button @click="showPluginDetails(plugin)" class="btn btn-secondary">
                <Info class="btn-icon" />
                详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件依赖图 -->
    <div class="section">
      <h2 class="section-title">
        <GitBranch class="icon" />
        插件依赖关系图
      </h2>
      
      <div class="dependency-graph">
        <svg ref="dependencyGraph" class="graph-svg">
          <!-- 依赖关系线 -->
          <g class="links">
            <line 
              v-for="link in dependencyLinks" 
              :key="`${link.source}-${link.target}`"
              :x1="link.x1" 
              :y1="link.y1" 
              :x2="link.x2" 
              :y2="link.y2"
              class="dependency-link"
            />
          </g>
          
          <!-- 插件节点 -->
          <g class="nodes">
            <g 
              v-for="node in dependencyNodes" 
              :key="node.name"
              :transform="`translate(${node.x}, ${node.y})`"
              class="plugin-node"
              :class="{ installed: node.installed }"
            >
              <circle 
                :r="node.radius" 
                :class="node.installed ? 'node-installed' : 'node-available'"
              />
              <text 
                :dy="node.radius + 20"
                text-anchor="middle"
                class="node-label"
              >
                {{ node.name }}
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>

    <!-- 动态插件加载 -->
    <div class="section">
      <h2 class="section-title">
        <Zap class="icon" />
        动态插件加载
      </h2>
      
      <div class="dynamic-loading">
        <div class="loading-demo">
          <h3>创建自定义插件</h3>
          <div class="plugin-creator">
            <div class="form-group">
              <label>插件名称</label>
              <input v-model="newPlugin.name" placeholder="输入插件名称" class="form-input" />
            </div>
            <div class="form-group">
              <label>插件描述</label>
              <input v-model="newPlugin.description" placeholder="输入插件描述" class="form-input" />
            </div>
            <div class="form-group">
              <label>插件代码</label>
              <textarea 
                v-model="newPlugin.code" 
                placeholder="输入插件代码..."
                class="form-textarea"
                rows="8"
              ></textarea>
            </div>
            <button @click="createDynamicPlugin" class="btn btn-primary">
              <Plus class="btn-icon" />
              创建并安装插件
            </button>
          </div>
        </div>
        
        <div class="loading-status">
          <h3>加载状态</h3>
          <div class="status-list">
            <div 
              v-for="status in loadingStatuses" 
              :key="status.id"
              class="status-item"
              :class="status.type"
            >
              <div class="status-icon">
                <CheckCircle v-if="status.type === 'success'" />
                <XCircle v-if="status.type === 'error'" />
                <Loader v-if="status.type === 'loading'" class="spinning" />
                <Info v-if="status.type === 'info'" />
              </div>
              <div class="status-content">
                <span class="status-time">{{ formatTime(status.timestamp) }}</span>
                <span class="status-message">{{ status.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件详情模态框 -->
    <div v-if="selectedPlugin" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedPlugin.name }}</h3>
          <button @click="closeModal" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <div class="plugin-detail">
            <p><strong>描述:</strong> {{ selectedPlugin.description }}</p>
            <p><strong>版本:</strong> {{ selectedPlugin.version }}</p>
            <p><strong>作者:</strong> {{ selectedPlugin.author }}</p>
            <p><strong>状态:</strong> {{ selectedPlugin.installed ? '已安装' : '未安装' }}</p>
            
            <div v-if="selectedPlugin.dependencies?.length" class="dependencies">
              <h4>依赖项:</h4>
              <ul>
                <li v-for="dep in selectedPlugin.dependencies" :key="dep">
                  {{ dep }}
                </li>
              </ul>
            </div>
            
            <div v-if="selectedPlugin.config" class="config">
              <h4>配置选项:</h4>
              <pre>{{ JSON.stringify(selectedPlugin.config, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import {
  Puzzle,
  Package,
  Search,
  Clock,
  User,
  Link,
  Download,
  Trash2,
  Info,
  GitBranch,
  Zap,
  Plus,
  CheckCircle,
  XCircle,
  Loader,
  X
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const searchQuery = ref('')
const filterStatus = ref('all')
const installing = ref('')
const uninstalling = ref('')
const selectedPlugin = ref(null)
const dependencyGraph = ref<SVGElement>()

// 新插件创建
const newPlugin = ref({
  name: '',
  description: '',
  code: `{
  name: 'my-plugin',
  install(engine, options) {
    console.log('Plugin installed:', options)
    
    // 注册服务
    engine.provide('myService', {
      hello: () => 'Hello from my plugin!'
    })
    
    // 监听事件
    engine.on('test:event', (data) => {
      console.log('Received event:', data)
    })
  },
  uninstall(engine) {
    console.log('Plugin uninstalled')
  }
}`
})

// 加载状态
const loadingStatuses = ref<Array<{
  id: number
  type: 'info' | 'success' | 'error' | 'loading'
  message: string
  timestamp: number
}>>([])

// 可用插件列表
const availablePlugins = ref([
  {
    name: 'theme',
    description: '主题管理插件，支持动态切换主题',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: 'Palette',
    installed: true,
    dependencies: [],
    config: { defaultTheme: 'light' }
  },
  {
    name: 'notification',
    description: '通知系统插件，提供消息通知功能',
    version: '1.0.0',
    author: 'LDesign Team',
    icon: 'Bell',
    installed: true,
    dependencies: [],
    config: { position: 'top-right' }
  },
  {
    name: 'router',
    description: '路由管理插件，提供页面导航功能',
    version: '2.0.0',
    author: 'Vue Team',
    icon: 'Navigation',
    installed: false,
    dependencies: [],
    config: { mode: 'history' }
  },
  {
    name: 'http',
    description: 'HTTP客户端插件，提供API请求功能',
    version: '1.2.0',
    author: 'LDesign Team',
    icon: 'Globe',
    installed: false,
    dependencies: [],
    config: { baseURL: '/api' }
  },
  {
    name: 'logger',
    description: '日志记录插件，提供结构化日志功能',
    version: '1.1.0',
    author: 'LDesign Team',
    icon: 'FileText',
    installed: false,
    dependencies: [],
    config: { level: 'info' }
  },
  {
    name: 'analytics',
    description: '数据分析插件，提供用户行为追踪',
    version: '1.0.0',
    author: 'Analytics Team',
    icon: 'BarChart',
    installed: false,
    dependencies: ['logger'],
    config: { trackingId: 'GA-XXXXX' }
  }
])

// 计算属性
const filteredPlugins = computed(() => {
  let plugins = availablePlugins.value
  
  // 状态过滤
  if (filterStatus.value === 'installed') {
    plugins = plugins.filter(p => p.installed)
  } else if (filterStatus.value === 'available') {
    plugins = plugins.filter(p => !p.installed)
  }
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    plugins = plugins.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }
  
  return plugins
})

// 依赖关系图数据
const dependencyNodes = computed(() => {
  const nodes = availablePlugins.value.map((plugin, index) => {
    const angle = (index / availablePlugins.value.length) * 2 * Math.PI
    const radius = 150
    const centerX = 300
    const centerY = 200
    
    return {
      name: plugin.name,
      installed: plugin.installed,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: plugin.installed ? 25 : 20
    }
  })
  
  return nodes
})

const dependencyLinks = computed(() => {
  const links: Array<{ source: string; target: string; x1: number; y1: number; x2: number; y2: number }> = []
  
  availablePlugins.value.forEach(plugin => {
    if (plugin.dependencies?.length) {
      plugin.dependencies.forEach(dep => {
        const sourceNode = dependencyNodes.value.find(n => n.name === dep)
        const targetNode = dependencyNodes.value.find(n => n.name === plugin.name)
        
        if (sourceNode && targetNode) {
          links.push({
            source: dep,
            target: plugin.name,
            x1: sourceNode.x,
            y1: sourceNode.y,
            x2: targetNode.x,
            y2: targetNode.y
          })
        }
      })
    }
  })
  
  return links
})

// 方法
const addStatus = (type: string, message: string) => {
  loadingStatuses.value.unshift({
    id: Date.now(),
    type: type as any,
    message,
    timestamp: Date.now()
  })
  
  // 限制状态数量
  if (loadingStatuses.value.length > 10) {
    loadingStatuses.value.pop()
  }
}

const installPlugin = async (plugin: any) => {
  installing.value = plugin.name
  addStatus('loading', `开始安装插件: ${plugin.name}`)
  
  try {
    // 模拟安装过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    plugin.installed = true
    addStatus('success', `插件 ${plugin.name} 安装成功`)
    
    // 触发引擎事件
    if (engine) {
      engine.emit('plugin:installed', { name: plugin.name })
    }
  } catch (error) {
    addStatus('error', `插件 ${plugin.name} 安装失败: ${error}`)
  } finally {
    installing.value = ''
  }
}

const uninstallPlugin = async (plugin: any) => {
  uninstalling.value = plugin.name
  addStatus('loading', `开始卸载插件: ${plugin.name}`)
  
  try {
    // 模拟卸载过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    plugin.installed = false
    addStatus('success', `插件 ${plugin.name} 卸载成功`)
    
    // 触发引擎事件
    if (engine) {
      engine.emit('plugin:uninstalled', { name: plugin.name })
    }
  } catch (error) {
    addStatus('error', `插件 ${plugin.name} 卸载失败: ${error}`)
  } finally {
    uninstalling.value = ''
  }
}

const showPluginDetails = (plugin: any) => {
  selectedPlugin.value = plugin
}

const closeModal = () => {
  selectedPlugin.value = null
}

const createDynamicPlugin = async () => {
  if (!newPlugin.value.name || !newPlugin.value.code) {
    addStatus('error', '请填写插件名称和代码')
    return
  }
  
  addStatus('loading', `创建动态插件: ${newPlugin.value.name}`)
  
  try {
    // 模拟动态插件创建
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const plugin = {
      name: newPlugin.value.name,
      description: newPlugin.value.description || '动态创建的插件',
      version: '1.0.0',
      author: '用户',
      icon: 'Code',
      installed: true,
      dependencies: [],
      config: {}
    }
    
    availablePlugins.value.push(plugin)
    addStatus('success', `动态插件 ${plugin.name} 创建并安装成功`)
    
    // 重置表单
    newPlugin.value = {
      name: '',
      description: '',
      code: newPlugin.value.code // 保留代码模板
    }
  } catch (error) {
    addStatus('error', `动态插件创建失败: ${error}`)
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 生命周期
onMounted(() => {
  addStatus('info', '插件系统演示页面已加载')
})
</script>

<style scoped>
.plugins-page {
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

/* 插件控制区域 */
.plugins-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

/* 插件网格 */
.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.plugin-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.plugin-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plugin-card.installed {
  background: #f0f9ff;
  border-color: #0ea5e9;
}

.plugin-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.plugin-icon {
  width: 3rem;
  height: 3rem;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plugin-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
}

.plugin-info {
  flex: 1;
}

.plugin-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.plugin-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.installed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.available {
  background: #f3f4f6;
  color: #374151;
}

.plugin-details {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.plugin-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.meta-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.plugin-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
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

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* 依赖关系图 */
.dependency-graph {
  background: #f9fafb;
  border-radius: 8px;
  padding: 2rem;
  overflow: auto;
}

.graph-svg {
  width: 600px;
  height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
}

.dependency-link {
  stroke: #6b7280;
  stroke-width: 2;
  marker-end: url(#arrowhead);
}

.plugin-node {
  cursor: pointer;
}

.node-installed {
  fill: #3b82f6;
  stroke: #1d4ed8;
  stroke-width: 2;
}

.node-available {
  fill: #f3f4f6;
  stroke: #d1d5db;
  stroke-width: 2;
}

.node-label {
  font-size: 0.75rem;
  fill: #374151;
  font-weight: 500;
}

/* 动态加载区域 */
.dynamic-loading {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.loading-demo h3,
.loading-status h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.plugin-creator {
  background: #f9fafb;
  border-radius: 8px;
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

.status-list {
  max-height: 300px;
  overflow-y: auto;
}

.status-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.status-item.info {
  background: #eff6ff;
}

.status-item.success {
  background: #f0fdf4;
}

.status-item.error {
  background: #fef2f2;
}

.status-item.loading {
  background: #fefce8;
}

.status-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.status-icon.info svg {
  color: #3b82f6;
}

.status-icon.success svg {
  color: #22c55e;
}

.status-icon.error svg {
  color: #ef4444;
}

.status-icon.loading svg {
  color: #f59e0b;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-content {
  flex: 1;
}

.status-time {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.status-message {
  font-size: 0.875rem;
  color: #374151;
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

.plugin-detail p {
  margin: 0.5rem 0;
}

.dependencies,
.config {
  margin-top: 1rem;
}

.dependencies h4,
.config h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.dependencies ul {
  margin: 0;
  padding-left: 1.5rem;
}

.config pre {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugins-page {
    padding: 1rem;
  }
  
  .plugins-grid {
    grid-template-columns: 1fr;
  }
  
  .dynamic-loading {
    grid-template-columns: 1fr;
  }
  
  .plugins-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
}
</style>