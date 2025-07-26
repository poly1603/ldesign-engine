<template>
  <div class="di-page">
    <div class="page-header">
      <h1>
        <Package class="icon" />
        依赖注入演示
      </h1>
      <p>展示服务注册、依赖解析和生命周期管理功能</p>
    </div>

    <!-- 服务容器概览 -->
    <div class="section">
      <h2 class="section-title">
        <Box class="icon" />
        服务容器概览
      </h2>
      
      <div class="container-overview">
        <div class="overview-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <Package class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ containerStats.totalServices }}</div>
              <div class="stat-label">注册服务</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <Activity class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ containerStats.activeInstances }}</div>
              <div class="stat-label">活跃实例</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <GitBranch class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ containerStats.dependencies }}</div>
              <div class="stat-label">依赖关系</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <Clock class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ containerStats.avgResolutionTime }}ms</div>
              <div class="stat-label">平均解析时间</div>
            </div>
          </div>
        </div>
        
        <div class="container-actions">
          <button @click="refreshContainer" class="btn btn-primary">
            <RefreshCw class="btn-icon" />
            刷新容器
          </button>
          <button @click="clearContainer" class="btn btn-danger">
            <Trash2 class="btn-icon" />
            清空容器
          </button>
          <button @click="exportContainer" class="btn btn-secondary">
            <Download class="btn-icon" />
            导出配置
          </button>
        </div>
      </div>
    </div>

    <!-- 服务注册 -->
    <div class="section">
      <h2 class="section-title">
        <Plus class="icon" />
        服务注册
      </h2>
      
      <div class="service-registration">
        <div class="registration-form">
          <div class="form-row">
            <div class="form-group">
              <label>服务名称</label>
              <input 
                v-model="newService.name" 
                placeholder="输入服务名称" 
                class="form-input"
                list="service-suggestions"
              />
              <datalist id="service-suggestions">
                <option v-for="suggestion in serviceSuggestions" :key="suggestion" :value="suggestion" />
              </datalist>
            </div>
            
            <div class="form-group">
              <label>服务类型</label>
              <select v-model="newService.type" class="form-select">
                <option value="singleton">单例 (Singleton)</option>
                <option value="transient">瞬态 (Transient)</option>
                <option value="scoped">作用域 (Scoped)</option>
                <option value="factory">工厂 (Factory)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>生命周期</label>
              <select v-model="newService.lifecycle" class="form-select">
                <option value="application">应用级</option>
                <option value="session">会话级</option>
                <option value="request">请求级</option>
                <option value="custom">自定义</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>依赖项 (用逗号分隔)</label>
            <input 
              v-model="newService.dependencies" 
              placeholder="例如: logger, config, database" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>服务实现</label>
            <textarea 
              v-model="newService.implementation" 
              placeholder="输入服务实现代码..." 
              class="form-textarea"
              rows="8"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button @click="registerService" class="btn btn-primary" :disabled="!newService.name">
              <Plus class="btn-icon" />
              注册服务
            </button>
            <button @click="validateService" class="btn btn-secondary">
              <CheckCircle class="btn-icon" />
              验证服务
            </button>
            <button @click="resetForm" class="btn btn-secondary">
              <RotateCcw class="btn-icon" />
              重置表单
            </button>
          </div>
        </div>
        
        <!-- 预设服务模板 -->
        <div class="service-templates">
          <h3>服务模板</h3>
          <div class="template-list">
            <div 
              v-for="template in serviceTemplates" 
              :key="template.name"
              class="template-item"
              @click="loadTemplate(template)"
            >
              <div class="template-icon">
                <component :is="template.icon" class="icon" />
              </div>
              <div class="template-content">
                <div class="template-name">{{ template.name }}</div>
                <div class="template-description">{{ template.description }}</div>
                <div class="template-tags">
                  <span 
                    v-for="tag in template.tags" 
                    :key="tag"
                    class="template-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务列表 -->
    <div class="section">
      <h2 class="section-title">
        <List class="icon" />
        注册服务列表
      </h2>
      
      <div class="service-manager">
        <div class="manager-controls">
          <div class="search-filters">
            <input 
              v-model="serviceFilter.search" 
              placeholder="搜索服务..." 
              class="search-input"
            />
            <select v-model="serviceFilter.type" class="filter-select">
              <option value="">所有类型</option>
              <option value="singleton">单例</option>
              <option value="transient">瞬态</option>
              <option value="scoped">作用域</option>
              <option value="factory">工厂</option>
            </select>
            <select v-model="serviceFilter.status" class="filter-select">
              <option value="">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
              <option value="error">错误</option>
            </select>
          </div>
          
          <div class="view-options">
            <button 
              @click="viewMode = 'table'" 
              class="btn btn-sm" 
              :class="viewMode === 'table' ? 'btn-primary' : 'btn-secondary'"
            >
              <Grid class="btn-icon" />
              表格
            </button>
            <button 
              @click="viewMode = 'cards'" 
              class="btn btn-sm" 
              :class="viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'"
            >
              <Square class="btn-icon" />
              卡片
            </button>
          </div>
        </div>
        
        <!-- 表格视图 -->
        <div v-if="viewMode === 'table'" class="service-table">
          <table>
            <thead>
              <tr>
                <th>服务名称</th>
                <th>类型</th>
                <th>状态</th>
                <th>实例数</th>
                <th>依赖项</th>
                <th>最后访问</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="service in filteredServices" :key="service.id">
                <td>
                  <div class="service-name">
                    <div class="service-title">{{ service.name }}</div>
                    <div class="service-description">{{ service.description }}</div>
                  </div>
                </td>
                <td>
                  <span class="type-badge" :class="service.type">
                    {{ service.type }}
                  </span>
                </td>
                <td>
                  <span 
                    class="status-badge" 
                    :class="service.status"
                  >
                    <div class="status-indicator"></div>
                    {{ getStatusText(service.status) }}
                  </span>
                </td>
                <td>{{ service.instanceCount }}</td>
                <td>
                  <div class="dependencies">
                    <span 
                      v-for="dep in service.dependencies" 
                      :key="dep"
                      class="dependency-badge"
                    >
                      {{ dep }}
                    </span>
                  </div>
                </td>
                <td>{{ service.lastAccessed ? formatTime(service.lastAccessed) : '-' }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="resolveService(service)" class="btn btn-sm btn-primary">
                      <Play class="btn-icon" />
                      解析
                    </button>
                    <button @click="inspectService(service)" class="btn btn-sm btn-secondary">
                      <Eye class="btn-icon" />
                      检查
                    </button>
                    <button @click="unregisterService(service)" class="btn btn-sm btn-danger">
                      <Trash2 class="btn-icon" />
                      注销
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 卡片视图 -->
        <div v-else class="service-cards">
          <div 
            v-for="service in filteredServices" 
            :key="service.id"
            class="service-card"
            :class="service.status"
          >
            <div class="card-header">
              <div class="service-info">
                <h3>{{ service.name }}</h3>
                <p>{{ service.description }}</p>
              </div>
              <div class="service-status">
                <span class="status-badge" :class="service.status">
                  <div class="status-indicator"></div>
                  {{ getStatusText(service.status) }}
                </span>
              </div>
            </div>
            
            <div class="card-content">
              <div class="service-details">
                <div class="detail-item">
                  <span class="detail-label">类型:</span>
                  <span class="type-badge" :class="service.type">{{ service.type }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">实例数:</span>
                  <span class="detail-value">{{ service.instanceCount }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">生命周期:</span>
                  <span class="detail-value">{{ service.lifecycle }}</span>
                </div>
              </div>
              
              <div v-if="service.dependencies.length" class="service-dependencies">
                <div class="detail-label">依赖项:</div>
                <div class="dependencies">
                  <span 
                    v-for="dep in service.dependencies" 
                    :key="dep"
                    class="dependency-badge"
                  >
                    {{ dep }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="card-actions">
              <button @click="resolveService(service)" class="btn btn-sm btn-primary">
                <Play class="btn-icon" />
                解析
              </button>
              <button @click="inspectService(service)" class="btn btn-sm btn-secondary">
                <Eye class="btn-icon" />
                检查
              </button>
              <button @click="unregisterService(service)" class="btn btn-sm btn-danger">
                <Trash2 class="btn-icon" />
                注销
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 依赖关系图 -->
    <div class="section">
      <h2 class="section-title">
        <GitBranch class="icon" />
        依赖关系图
      </h2>
      
      <div class="dependency-graph">
        <div class="graph-controls">
          <button @click="layoutGraph" class="btn btn-primary">
            <Shuffle class="btn-icon" />
            重新布局
          </button>
          <button @click="centerGraph" class="btn btn-secondary">
            <Target class="btn-icon" />
            居中显示
          </button>
          <button @click="exportGraph" class="btn btn-secondary">
            <Download class="btn-icon" />
            导出图片
          </button>
        </div>
        
        <div class="graph-container">
          <svg class="dependency-svg" viewBox="0 0 800 600">
            <!-- 服务节点 -->
            <g 
              v-for="node in graphNodes" 
              :key="node.id"
              class="service-node"
              :transform="`translate(${node.x}, ${node.y})`"
              @click="selectNode(node)"
            >
              <circle 
                r="30" 
                :class="{ 
                  selected: selectedNode?.id === node.id,
                  [node.status]: true
                }"
              />
              <text x="0" y="5" text-anchor="middle" font-size="12">
                {{ node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name }}
              </text>
              
              <!-- 节点详情提示 -->
              <g v-if="selectedNode?.id === node.id" class="node-tooltip">
                <rect x="35" y="-20" width="120" height="40" rx="4" fill="white" stroke="#d1d5db" />
                <text x="45" y="-5" font-size="10" fill="#374151">{{ node.name }}</text>
                <text x="45" y="8" font-size="8" fill="#6b7280">{{ node.type }}</text>
                <text x="45" y="18" font-size="8" fill="#6b7280">实例: {{ node.instanceCount }}</text>
              </g>
            </g>
            
            <!-- 依赖连线 -->
            <g class="dependency-edges">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
              </defs>
              
              <line 
                v-for="edge in graphEdges" 
                :key="edge.id"
                :x1="edge.source.x" 
                :y1="edge.source.y"
                :x2="edge.target.x" 
                :y2="edge.target.y"
                stroke="#6b7280"
                stroke-width="2"
                marker-end="url(#arrowhead)"
                :class="{ 
                  highlighted: selectedNode && (edge.source.id === selectedNode.id || edge.target.id === selectedNode.id)
                }"
              />
            </g>
          </svg>
        </div>
        
        <div class="graph-legend">
          <div class="legend-item">
            <div class="legend-color active"></div>
            <span>活跃服务</span>
          </div>
          <div class="legend-item">
            <div class="legend-color inactive"></div>
            <span>非活跃服务</span>
          </div>
          <div class="legend-item">
            <div class="legend-color error"></div>
            <span>错误服务</span>
          </div>
          <div class="legend-item">
            <div class="legend-arrow"></div>
            <span>依赖关系</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务检查模态框 -->
    <div v-if="inspectedService" class="modal-overlay" @click="closeInspection">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>服务检查: {{ inspectedService.name }}</h3>
          <button @click="closeInspection" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <div class="inspection-tabs">
            <button 
              v-for="tab in inspectionTabs" 
              :key="tab.id"
              @click="activeInspectionTab = tab.id"
              class="tab-button"
              :class="{ active: activeInspectionTab === tab.id }"
            >
              <component :is="tab.icon" class="tab-icon" />
              {{ tab.label }}
            </button>
          </div>
          
          <div class="inspection-content">
            <!-- 基本信息 -->
            <div v-if="activeInspectionTab === 'info'" class="tab-panel">
              <div class="info-grid">
                <div class="info-item">
                  <label>服务名称</label>
                  <span>{{ inspectedService.name }}</span>
                </div>
                <div class="info-item">
                  <label>服务类型</label>
                  <span class="type-badge" :class="inspectedService.type">{{ inspectedService.type }}</span>
                </div>
                <div class="info-item">
                  <label>生命周期</label>
                  <span>{{ inspectedService.lifecycle }}</span>
                </div>
                <div class="info-item">
                  <label>状态</label>
                  <span class="status-badge" :class="inspectedService.status">
                    <div class="status-indicator"></div>
                    {{ getStatusText(inspectedService.status) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>实例数量</label>
                  <span>{{ inspectedService.instanceCount }}</span>
                </div>
                <div class="info-item">
                  <label>注册时间</label>
                  <span>{{ formatTime(inspectedService.registeredAt) }}</span>
                </div>
                <div class="info-item">
                  <label>最后访问</label>
                  <span>{{ inspectedService.lastAccessed ? formatTime(inspectedService.lastAccessed) : '从未访问' }}</span>
                </div>
                <div class="info-item">
                  <label>访问次数</label>
                  <span>{{ inspectedService.accessCount }}</span>
                </div>
              </div>
            </div>
            
            <!-- 依赖关系 -->
            <div v-if="activeInspectionTab === 'dependencies'" class="tab-panel">
              <div class="dependencies-section">
                <h4>直接依赖</h4>
                <div v-if="inspectedService.dependencies.length" class="dependency-list">
                  <div 
                    v-for="dep in inspectedService.dependencies" 
                    :key="dep"
                    class="dependency-item"
                  >
                    <span class="dependency-name">{{ dep }}</span>
                    <span class="dependency-status" :class="getDependencyStatus(dep)">
                      {{ getDependencyStatus(dep) }}
                    </span>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <Package class="empty-icon" />
                  <p>此服务没有依赖项</p>
                </div>
              </div>
              
              <div class="dependents-section">
                <h4>被依赖</h4>
                <div v-if="getServiceDependents(inspectedService).length" class="dependency-list">
                  <div 
                    v-for="dependent in getServiceDependents(inspectedService)" 
                    :key="dependent"
                    class="dependency-item"
                  >
                    <span class="dependency-name">{{ dependent }}</span>
                    <span class="dependency-status active">活跃</span>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <GitBranch class="empty-icon" />
                  <p>没有其他服务依赖此服务</p>
                </div>
              </div>
            </div>
            
            <!-- 实例信息 -->
            <div v-if="activeInspectionTab === 'instances'" class="tab-panel">
              <div class="instances-list">
                <div 
                  v-for="instance in getServiceInstances(inspectedService)" 
                  :key="instance.id"
                  class="instance-item"
                >
                  <div class="instance-header">
                    <span class="instance-id">实例 #{{ instance.id }}</span>
                    <span class="instance-status" :class="instance.status">{{ instance.status }}</span>
                  </div>
                  <div class="instance-details">
                    <div class="detail-row">
                      <span class="detail-label">创建时间:</span>
                      <span class="detail-value">{{ formatTime(instance.createdAt) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">内存使用:</span>
                      <span class="detail-value">{{ instance.memoryUsage }}KB</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">调用次数:</span>
                      <span class="detail-value">{{ instance.callCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 性能指标 -->
            <div v-if="activeInspectionTab === 'performance'" class="tab-panel">
              <div class="performance-metrics">
                <div class="metric-card">
                  <div class="metric-icon">
                    <Clock class="icon" />
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ inspectedService.avgResolutionTime }}ms</div>
                    <div class="metric-label">平均解析时间</div>
                  </div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-icon">
                    <Activity class="icon" />
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ inspectedService.accessCount }}</div>
                    <div class="metric-label">总访问次数</div>
                  </div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-icon">
                    <Zap class="icon" />
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ inspectedService.successRate }}%</div>
                    <div class="metric-label">成功率</div>
                  </div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-icon">
                    <AlertTriangle class="icon" />
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ inspectedService.errorCount }}</div>
                    <div class="metric-label">错误次数</div>
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

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import {
  Package,
  Box,
  Activity,
  GitBranch,
  Clock,
  RefreshCw,
  Trash2,
  Download,
  Plus,
  CheckCircle,
  RotateCcw,
  List,
  Grid,
  Square,
  Play,
  Eye,
  Shuffle,
  Target,
  X,
  Zap,
  AlertTriangle
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const viewMode = ref('table')
const selectedNode = ref<any>(null)
const inspectedService = ref<any>(null)
const activeInspectionTab = ref('info')

// 容器统计
const containerStats = ref({
  totalServices: 12,
  activeInstances: 8,
  dependencies: 15,
  avgResolutionTime: 8.5
})

// 服务过滤器
const serviceFilter = ref({
  search: '',
  type: '',
  status: ''
})

// 新服务表单
const newService = ref({
  name: '',
  type: 'singleton',
  lifecycle: 'application',
  dependencies: '',
  implementation: `class MyService {
  constructor(logger, config) {
    this.logger = logger
    this.config = config
    this.initialized = false
  }
  
  async initialize() {
    this.logger.info('Initializing service...')
    
    // 初始化逻辑
    await this.setupResources()
    
    this.initialized = true
    this.logger.info('Service initialized successfully')
  }
  
  async setupResources() {
    // 设置资源
    return new Promise(resolve => {
      setTimeout(resolve, 100)
    })
  }
  
  async execute(data) {
    if (!this.initialized) {
      await this.initialize()
    }
    
    this.logger.debug('Executing service with data:', data)
    
    // 业务逻辑
    const result = await this.processData(data)
    
    return result
  }
  
  async processData(data) {
    // 处理数据
    return {
      success: true,
      data: data,
      timestamp: Date.now()
    }
  }
  
  dispose() {
    this.logger.info('Disposing service...')
    this.initialized = false
  }
}`
})

// 服务建议
const serviceSuggestions = [
  'logger',
  'config',
  'database',
  'cache',
  'notification',
  'analytics',
  'authentication',
  'authorization',
  'fileStorage',
  'emailService'
]

// 服务模板
const serviceTemplates = [
  {
    name: 'Logger Service',
    description: '日志记录服务',
    icon: 'FileText',
    tags: ['logging', 'debugging'],
    type: 'singleton',
    dependencies: ['config'],
    implementation: `class LoggerService {
  constructor(config) {
    this.config = config
    this.level = config.get('log.level', 'info')
  }
  
  info(message, ...args) {
    this.log('info', message, ...args)
  }
  
  error(message, ...args) {
    this.log('error', message, ...args)
  }
  
  debug(message, ...args) {
    this.log('debug', message, ...args)
  }
  
  log(level, message, ...args) {
    if (this.shouldLog(level)) {
      console.log(\`[\${level.toUpperCase()}] \${message}\`, ...args)
    }
  }
  
  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }
}`
  },
  {
    name: 'HTTP Client',
    description: 'HTTP请求客户端',
    icon: 'Globe',
    tags: ['http', 'api'],
    type: 'singleton',
    dependencies: ['logger', 'config'],
    implementation: `class HttpClient {
  constructor(logger, config) {
    this.logger = logger
    this.config = config
    this.baseURL = config.get('api.baseURL')
    this.timeout = config.get('api.timeout', 5000)
  }
  
  async get(url, options = {}) {
    return this.request('GET', url, null, options)
  }
  
  async post(url, data, options = {}) {
    return this.request('POST', url, data, options)
  }
  
  async request(method, url, data, options) {
    const fullURL = this.baseURL + url
    this.logger.debug(\`\${method} \${fullURL}\`)
    
    try {
      const response = await fetch(fullURL, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.timeout)
      })
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
      }
      
      return await response.json()
    } catch (error) {
      this.logger.error('HTTP request failed:', error)
      throw error
    }
  }
}`
  },
  {
    name: 'Cache Service',
    description: '缓存服务',
    icon: 'Database',
    tags: ['cache', 'performance'],
    type: 'singleton',
    dependencies: ['logger'],
    implementation: `class CacheService {
  constructor(logger) {
    this.logger = logger
    this.cache = new Map()
    this.ttl = new Map()
  }
  
  set(key, value, ttlMs = 0) {
    this.cache.set(key, value)
    
    if (ttlMs > 0) {
      const expireAt = Date.now() + ttlMs
      this.ttl.set(key, expireAt)
      
      setTimeout(() => {
        this.delete(key)
      }, ttlMs)
    }
    
    this.logger.debug(\`Cache set: \${key}\`)
  }
  
  get(key) {
    if (this.isExpired(key)) {
      this.delete(key)
      return undefined
    }
    
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.logger.debug(\`Cache hit: \${key}\`)
    } else {
      this.logger.debug(\`Cache miss: \${key}\`)
    }
    
    return value
  }
  
  delete(key) {
    this.cache.delete(key)
    this.ttl.delete(key)
    this.logger.debug(\`Cache deleted: \${key}\`)
  }
  
  clear() {
    this.cache.clear()
    this.ttl.clear()
    this.logger.info('Cache cleared')
  }
  
  isExpired(key) {
    const expireAt = this.ttl.get(key)
    return expireAt && Date.now() > expireAt
  }
  
  size() {
    return this.cache.size
  }
}`
  }
]

// 注册服务列表
const services = ref([
  {
    id: 1,
    name: 'logger',
    description: '日志记录服务',
    type: 'singleton',
    lifecycle: 'application',
    status: 'active',
    instanceCount: 1,
    dependencies: ['config'],
    registeredAt: Date.now() - 3600000,
    lastAccessed: Date.now() - 300000,
    accessCount: 156,
    avgResolutionTime: 5,
    successRate: 99.2,
    errorCount: 1
  },
  {
    id: 2,
    name: 'config',
    description: '配置管理服务',
    type: 'singleton',
    lifecycle: 'application',
    status: 'active',
    instanceCount: 1,
    dependencies: [],
    registeredAt: Date.now() - 3600000,
    lastAccessed: Date.now() - 120000,
    accessCount: 89,
    avgResolutionTime: 3,
    successRate: 100,
    errorCount: 0
  },
  {
    id: 3,
    name: 'database',
    description: '数据库连接服务',
    type: 'singleton',
    lifecycle: 'application',
    status: 'active',
    instanceCount: 1,
    dependencies: ['logger', 'config'],
    registeredAt: Date.now() - 3500000,
    lastAccessed: Date.now() - 60000,
    accessCount: 234,
    avgResolutionTime: 12,
    successRate: 98.5,
    errorCount: 3
  },
  {
    id: 4,
    name: 'cache',
    description: '缓存服务',
    type: 'singleton',
    lifecycle: 'application',
    status: 'active',
    instanceCount: 1,
    dependencies: ['logger'],
    registeredAt: Date.now() - 3200000,
    lastAccessed: Date.now() - 30000,
    accessCount: 445,
    avgResolutionTime: 2,
    successRate: 99.8,
    errorCount: 1
  },
  {
    id: 5,
    name: 'notification',
    description: '通知服务',
    type: 'transient',
    lifecycle: 'request',
    status: 'inactive',
    instanceCount: 0,
    dependencies: ['logger', 'config'],
    registeredAt: Date.now() - 2800000,
    lastAccessed: Date.now() - 1800000,
    accessCount: 67,
    avgResolutionTime: 25,
    successRate: 95.5,
    errorCount: 3
  },
  {
    id: 6,
    name: 'analytics',
    description: '分析服务',
    type: 'scoped',
    lifecycle: 'session',
    status: 'error',
    instanceCount: 0,
    dependencies: ['database', 'cache'],
    registeredAt: Date.now() - 2400000,
    lastAccessed: Date.now() - 900000,
    accessCount: 23,
    avgResolutionTime: 45,
    successRate: 87.0,
    errorCount: 3
  }
])

// 检查标签页
const inspectionTabs = [
  { id: 'info', label: '基本信息', icon: 'Info' },
  { id: 'dependencies', label: '依赖关系', icon: 'GitBranch' },
  { id: 'instances', label: '实例信息', icon: 'Box' },
  { id: 'performance', label: '性能指标', icon: 'BarChart' }
]

// 依赖关系图数据
const graphNodes = ref([
  { id: 1, name: 'config', x: 100, y: 300, status: 'active', type: 'singleton', instanceCount: 1 },
  { id: 2, name: 'logger', x: 300, y: 200, status: 'active', type: 'singleton', instanceCount: 1 },
  { id: 3, name: 'database', x: 500, y: 150, status: 'active', type: 'singleton', instanceCount: 1 },
  { id: 4, name: 'cache', x: 300, y: 400, status: 'active', type: 'singleton', instanceCount: 1 },
  { id: 5, name: 'notification', x: 600, y: 300, status: 'inactive', type: 'transient', instanceCount: 0 },
  { id: 6, name: 'analytics', x: 700, y: 450, status: 'error', type: 'scoped', instanceCount: 0 }
])

const graphEdges = ref([
  { id: 1, source: graphNodes.value[1], target: graphNodes.value[0] }, // logger -> config
  { id: 2, source: graphNodes.value[2], target: graphNodes.value[1] }, // database -> logger
  { id: 3, source: graphNodes.value[2], target: graphNodes.value[0] }, // database -> config
  { id: 4, source: graphNodes.value[3], target: graphNodes.value[1] }, // cache -> logger
  { id: 5, source: graphNodes.value[4], target: graphNodes.value[1] }, // notification -> logger
  { id: 6, source: graphNodes.value[4], target: graphNodes.value[0] }, // notification -> config
  { id: 7, source: graphNodes.value[5], target: graphNodes.value[2] }, // analytics -> database
  { id: 8, source: graphNodes.value[5], target: graphNodes.value[3] }  // analytics -> cache
])

// 计算属性
const filteredServices = computed(() => {
  return services.value.filter(service => {
    if (serviceFilter.value.search && !service.name.toLowerCase().includes(serviceFilter.value.search.toLowerCase())) {
      return false
    }
    if (serviceFilter.value.type && service.type !== serviceFilter.value.type) {
      return false
    }
    if (serviceFilter.value.status && service.status !== serviceFilter.value.status) {
      return false
    }
    return true
  })
})

// 方法
const registerService = () => {
  if (!newService.value.name) return
  
  const service = {
    id: Date.now(),
    name: newService.value.name,
    description: `${newService.value.name} 服务`,
    type: newService.value.type,
    lifecycle: newService.value.lifecycle,
    status: 'active',
    instanceCount: newService.value.type === 'singleton' ? 1 : 0,
    dependencies: newService.value.dependencies ? newService.value.dependencies.split(',').map(d => d.trim()) : [],
    registeredAt: Date.now(),
    lastAccessed: null,
    accessCount: 0,
    avgResolutionTime: Math.floor(Math.random() * 20) + 5,
    successRate: 100,
    errorCount: 0
  }
  
  services.value.push(service)
  
  // 更新统计
  containerStats.value.totalServices++
  if (service.status === 'active') {
    containerStats.value.activeInstances++
  }
  containerStats.value.dependencies += service.dependencies.length
  
  // 重置表单
  resetForm()
  
  if (engine) {
    engine.emit('service:registered', service)
  }
}

const validateService = () => {
  // 验证服务配置
  const errors = []
  
  if (!newService.value.name) {
    errors.push('服务名称不能为空')
  }
  
  if (services.value.some(s => s.name === newService.value.name)) {
    errors.push('服务名称已存在')
  }
  
  try {
    new Function(newService.value.implementation)
  } catch (error) {
    errors.push('服务实现代码语法错误')
  }
  
  if (errors.length > 0) {
    alert('验证失败:\n' + errors.join('\n'))
  } else {
    alert('服务配置验证通过！')
  }
}

const resetForm = () => {
  newService.value = {
    name: '',
    type: 'singleton',
    lifecycle: 'application',
    dependencies: '',
    implementation: newService.value.implementation // 保留实现代码
  }
}

const loadTemplate = (template: any) => {
  newService.value.name = template.name.toLowerCase().replace(/\s+/g, '')
  newService.value.type = template.type
  newService.value.dependencies = template.dependencies.join(', ')
  newService.value.implementation = template.implementation
}

const resolveService = async (service: any) => {
  // 模拟服务解析
  service.lastAccessed = Date.now()
  service.accessCount++
  
  // 模拟解析时间
  const resolutionTime = Math.floor(Math.random() * 50) + 5
  
  if (engine) {
    engine.emit('service:resolved', {
      name: service.name,
      resolutionTime
    })
  }
  
  // 更新平均解析时间
  service.avgResolutionTime = Math.floor((service.avgResolutionTime + resolutionTime) / 2)
}

const inspectService = (service: any) => {
  inspectedService.value = service
  activeInspectionTab.value = 'info'
}

const unregisterService = (service: any) => {
  const index = services.value.findIndex(s => s.id === service.id)
  if (index > -1) {
    services.value.splice(index, 1)
    
    // 更新统计
    containerStats.value.totalServices--
    if (service.status === 'active') {
      containerStats.value.activeInstances--
    }
    containerStats.value.dependencies -= service.dependencies.length
    
    if (engine) {
      engine.emit('service:unregistered', { name: service.name })
    }
  }
}

const refreshContainer = () => {
  // 刷新容器状态
  services.value.forEach(service => {
    if (service.status === 'error' && Math.random() > 0.5) {
      service.status = 'active'
      containerStats.value.activeInstances++
    }
  })
  
  if (engine) {
    engine.emit('container:refreshed')
  }
}

const clearContainer = () => {
  if (confirm('确定要清空容器吗？这将注销所有服务。')) {
    services.value = []
    containerStats.value = {
      totalServices: 0,
      activeInstances: 0,
      dependencies: 0,
      avgResolutionTime: 0
    }
    
    if (engine) {
      engine.emit('container:cleared')
    }
  }
}

const exportContainer = () => {
  const data = {
    services: services.value,
    stats: containerStats.value,
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `di-container-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

const selectNode = (node: any) => {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
}

const layoutGraph = () => {
  // 重新布局图形
  graphNodes.value.forEach((node, index) => {
    const angle = (index / graphNodes.value.length) * 2 * Math.PI
    const radius = 200
    node.x = 400 + Math.cos(angle) * radius
    node.y = 300 + Math.sin(angle) * radius
  })
}

const centerGraph = () => {
  // 居中显示图形
  const centerX = 400
  const centerY = 300
  
  graphNodes.value.forEach(node => {
    node.x = centerX + (node.x - centerX) * 0.8
    node.y = centerY + (node.y - centerY) * 0.8
  })
}

const exportGraph = () => {
  // 导出图形为SVG
  const svg = document.querySelector('.dependency-svg')
  if (svg) {
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = 'dependency-graph.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }
}

const closeInspection = () => {
  inspectedService.value = null
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '非活跃',
    error: '错误'
  }
  return statusMap[status] || status
}

const getDependencyStatus = (depName: string) => {
  const service = services.value.find(s => s.name === depName)
  return service ? service.status : 'missing'
}

const getServiceDependents = (service: any) => {
  return services.value
    .filter(s => s.dependencies.includes(service.name))
    .map(s => s.name)
}

const getServiceInstances = (service: any) => {
  // 模拟服务实例
  const instances = []
  for (let i = 0; i < service.instanceCount; i++) {
    instances.push({
      id: i + 1,
      status: service.status,
      createdAt: service.registeredAt + i * 1000,
      memoryUsage: Math.floor(Math.random() * 1000) + 500,
      callCount: Math.floor(service.accessCount / service.instanceCount)
    })
  }
  return instances
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 生命周期
onMounted(() => {
  // 监听引擎事件
  if (engine) {
    engine.on('service:*', (eventName: string, data: any) => {
      console.log('DI Event:', eventName, data)
    })
  }
})
</script>

<style scoped>
/* 基础样式 */
.di-page {
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

/* 容器概览 */
.container-overview {
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

.container-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 服务注册 */
.service-registration {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.registration-form {
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

.service-templates {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
}

.service-templates h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-item {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.template-item:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.template-icon {
  width: 2rem;
  height: 2rem;
  background: #eff6ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.template-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.template-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.template-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.template-tag {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
}

/* 服务管理 */
.service-manager {
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

.search-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 200px;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.view-options {
  display: flex;
  gap: 0.25rem;
}

/* 服务表格 */
.service-table {
  overflow-x: auto;
}

.service-table table {
  width: 100%;
  border-collapse: collapse;
}

.service-table th,
.service-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.service-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.service-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.service-title {
  font-weight: 500;
  color: #1f2937;
}

.service-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.singleton {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-badge.transient {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.scoped {
  background: #d1fae5;
  color: #059669;
}

.type-badge.factory {
  background: #fce7f3;
  color: #be185d;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.error {
  background: #fee2e2;
  color: #dc2626;
}

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}

.dependencies {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.dependency-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* 服务卡片 */
.service-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.service-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.service-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.service-card.error {
  border-color: #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.service-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.service-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.card-content {
  margin-bottom: 1rem;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
}

.service-dependencies {
  margin-top: 1rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* 依赖关系图 */
.dependency-graph {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.graph-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.graph-container {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  min-height: 600px;
  position: relative;
}

.dependency-svg {
  width: 100%;
  height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
}

.service-node {
  cursor: pointer;
}

.service-node circle {
  fill: #f3f4f6;
  stroke: #d1d5db;
  stroke-width: 2;
  transition: all 0.2s ease;
}

.service-node circle.active {
  fill: #dbeafe;
  stroke: #3b82f6;
}

.service-node circle.inactive {
  fill: #f3f4f6;
  stroke: #9ca3af;
}

.service-node circle.error {
  fill: #fee2e2;
  stroke: #ef4444;
}

.service-node circle.selected {
  stroke-width: 3;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.service-node text {
  fill: #374151;
  font-weight: 500;
  pointer-events: none;
}

.node-tooltip {
  pointer-events: none;
}

.dependency-edges line {
  transition: all 0.2s ease;
}

.dependency-edges line.highlighted {
  stroke: #3b82f6;
  stroke-width: 3;
}

.graph-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
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

.legend-color.active {
  background: #dbeafe;
  border-color: #3b82f6;
}

.legend-color.inactive {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.legend-color.error {
  background: #fee2e2;
  border-color: #ef4444;
}

.legend-arrow {
  width: 1.5rem;
  height: 0.125rem;
  background: #6b7280;
  position: relative;
}

.legend-arrow::after {
  content: '';
  position: absolute;
  right: -0.25rem;
  top: -0.1875rem;
  width: 0;
  height: 0;
  border-left: 0.25rem solid #6b7280;
  border-top: 0.25rem solid transparent;
  border-bottom: 0.25rem solid transparent;
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
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
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
  flex: 1;
  overflow: auto;
}

.inspection-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-icon {
  width: 1rem;
  height: 1rem;
}

.inspection-content {
  padding: 1.5rem;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.info-item span {
  font-size: 0.875rem;
  color: #1f2937;
}

.dependencies-section,
.dependents-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
}

.dependencies-section h4,
.dependents-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.dependency-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dependency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.dependency-name {
  font-weight: 500;
  color: #1f2937;
}

.dependency-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.dependency-status.active {
  background: #d1fae5;
  color: #059669;
}

.dependency-status.missing {
  background: #fee2e2;
  color: #dc2626;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6b7280;
}

.empty-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.5;
}

.instances-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.instance-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.instance-id {
  font-weight: 500;
  color: #1f2937;
}

.instance-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #d1fae5;
  color: #059669;
}

.instance-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .di-page {
    padding: 1rem;
  }
  
  .container-overview {
    flex-direction: column;
  }
  
  .overview-stats {
    grid-template-columns: 1fr;
  }
  
  .service-registration {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .manager-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-filters {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .service-cards {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .inspection-tabs {
    overflow-x: auto;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-metrics {
    grid-template-columns: 1fr;
  }
}
</style>