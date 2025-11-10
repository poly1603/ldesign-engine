<template>
  <div v-if="showPanel && hasConfig" class="config-panel">
    <div class="config-panel-header">
      <h3>📋 应用配置信息</h3>
      <button class="toggle-btn" @click="collapsed = !collapsed">
        {{ collapsed ? '展开' : '收起' }}
      </button>
    </div>
    
    <div v-if="!collapsed" class="config-panel-content">
      <!-- 配置无效时显示错误信息 -->
      <div v-if="!isValidConfig" class="config-error">
        <h4>❌ 配置加载失败</h4>
        <pre style="font-size: 0.75rem; margin-top: 0.5rem; color: #999; white-space: pre-wrap;">配置对象: {{ JSON.stringify(config.value, null, 2) }}</pre>
        <pre style="font-size: 0.75rem; margin-top: 0.5rem; color: #999; white-space: pre-wrap;">环境信息: {{ JSON.stringify(environment.value, null, 2) }}</pre>
      </div>
      
      <!-- 应用信息 -->
      <div v-else-if="config.app" class="config-section">
        <h4>应用信息</h4>
        <div class="config-item">
          <span class="config-label">应用名称:</span>
          <span class="config-value">{{ config.app.name || 'N/A' }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">版本号:</span>
          <span class="config-value config-value-version">{{ config.app.version || 'N/A' }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">描述:</span>
          <span class="config-value">{{ config.app.description || 'N/A' }}</span>
        </div>
      </div>

      <!-- API 配置 -->
      <div v-if="config.api" class="config-section">
        <h4>API 配置</h4>
        <div class="config-item">
          <span class="config-label">API 地址:</span>
          <span class="config-value config-value-url">{{ config.api.baseUrl || 'N/A' }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">超时时间:</span>
          <span class="config-value">{{ config.api.timeout || 'N/A' }}ms</span>
        </div>
      </div>

      <!-- 功能特性 -->
      <div v-if="config.features" class="config-section">
        <h4>功能特性</h4>
        <div class="config-item">
          <span class="config-label">分析统计:</span>
          <span class="config-value config-toggle" :class="{ active: config.features.enableAnalytics }">
            {{ config.features.enableAnalytics ? '✅ 开启' : '❌ 关闭' }}
          </span>
        </div>
        <div class="config-item">
          <span class="config-label">调试模式:</span>
          <span class="config-value config-toggle" :class="{ active: config.features.enableDebug }">
            {{ config.features.enableDebug ? '✅ 开启' : '❌ 关闭' }}
          </span>
        </div>
      </div>

      <!-- 主题配置 -->
      <div v-if="config.theme" class="config-section">
        <h4>主题配置</h4>
        <div class="config-item">
          <span class="config-label">主色调:</span>
          <span class="config-value">
            <span v-if="config.theme.primaryColor" class="color-dot" :style="{ backgroundColor: config.theme.primaryColor }"></span>
            {{ config.theme.primaryColor || 'N/A' }}
          </span>
        </div>
        <div class="config-item">
          <span class="config-label">模式:</span>
          <span class="config-value">{{ config.theme.mode || 'N/A' }}</span>
        </div>
      </div>

      <!-- 开发配置（如果存在） -->
      <div v-if="config.dev" class="config-section">
        <h4>开发配置</h4>
        <div class="config-item">
          <span class="config-label">显示配置面板:</span>
          <span class="config-value config-toggle" :class="{ active: config.dev.showConfigPanel }">
            {{ config.dev.showConfigPanel ? '✅ 开启' : '❌ 关闭' }}
          </span>
        </div>
        <div class="config-item">
          <span class="config-label">日志级别:</span>
          <span class="config-value">{{ config.dev.logLevel || 'N/A' }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">热更新:</span>
          <span class="config-value config-toggle" :class="{ active: config.dev.enableHotReload }">
            {{ config.dev.enableHotReload ? '✅ 开启' : '❌ 关闭' }}
          </span>
        </div>
      </div>

      <!-- 环境信息 -->
      <div class="config-section">
        <h4>环境信息</h4>
        <div class="config-item">
          <span class="config-label">运行模式:</span>
          <span class="config-value config-value-env">{{ environment.mode || 'N/A' }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">开发环境:</span>
          <span class="config-value config-toggle" :class="{ active: environment.isDev }">
            {{ environment.isDev ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
        <div class="config-item">
          <span class="config-label">生产环境:</span>
          <span class="config-value config-toggle" :class="{ active: environment.isProd }">
            {{ environment.isProd ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
      </div>

      <!-- 更新提示 -->
      <div v-if="updateCount > 0" class="update-indicator">
        🔄 配置已更新 {{ updateCount }} 次（实时更新测试）
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppConfig } from '@ldesign/launcher/client/vue'

// 使用 useAppConfig 获取配置和环境信息（支持 HMR 热更新）
const { config, environment } = useAppConfig()

// 控制面板显示和折叠
const collapsed = ref(false)
const updateCount = ref(0)

// 检查配置是否已加载
const hasConfig = computed(() => {
  // 始终返回 true，即使配置为空也显示（会显示默认配置或错误信息）
  return true
})

// 检查配置是否有效（有实际内容）
const isValidConfig = computed(() => {
  if (!config.value || typeof config.value !== 'object') {
    return false
  }
  const keys = Object.keys(config.value)
  return keys.length > 0
})

// 根据配置决定是否显示面板
const showPanel = computed(() => {
  // 如果配置无效，也显示（显示错误信息）
  if (!isValidConfig.value) {
    return true
  }
  return config.value.dev?.showConfigPanel !== false
})

// 监听配置变化，用于测试实时更新
watch(
  () => config.value,
  (newConfig) => {
    if (newConfig && Object.keys(newConfig).length > 0) {
      updateCount.value++
      console.log('🔄 配置已更新:', newConfig)
    }
  },
  { deep: true }
)

// 初始化时输出配置信息（用于调试）
watch(
  () => config.value,
  (newConfig) => {
    console.log('🔍 ConfigPanel - config.value 变化:', {
      exists: !!newConfig,
      type: typeof newConfig,
      keys: newConfig ? Object.keys(newConfig) : [],
      config: newConfig
    })
  },
  { immediate: true, deep: true }
)

watch(
  () => hasConfig.value,
  (loaded) => {
    if (loaded) {
      console.log('✅ 配置已加载:', config.value)
    } else {
      console.warn('⚠️ 配置未加载', {
        configValue: config.value,
        configType: typeof config.value,
        configKeys: config.value ? Object.keys(config.value) : []
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.config-panel {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 2px solid #42b883;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.config-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.config-panel-header h3 {
  margin: 0;
  color: #35495e;
  font-size: 1.25rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #35a372;
  transform: translateY(-1px);
}

.config-panel-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.config-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.config-section h4 {
  margin: 0 0 0.75rem 0;
  color: #42b883;
  font-size: 1rem;
  border-bottom: 2px solid #42b883;
  padding-bottom: 0.5rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.config-item:last-child {
  border-bottom: none;
}

.config-label {
  font-weight: 500;
  color: #666;
  font-size: 0.875rem;
}

.config-value {
  color: #333;
  font-size: 0.875rem;
  font-family: 'Consolas', 'Monaco', monospace;
  word-break: break-all;
  text-align: right;
}

.config-value-version {
  color: #42b883;
  font-weight: 600;
}

.config-value-url {
  color: #2196f3;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-value-env {
  color: #ff9800;
  font-weight: 600;
  text-transform: uppercase;
}

.config-toggle {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f5f5f5;
  transition: all 0.2s;
}

.config-toggle.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 0.5rem;
  vertical-align: middle;
  border: 2px solid #ddd;
}

.update-indicator {
  grid-column: 1 / -1;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
  color: #856404;
  font-size: 0.875rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 768px) {
  .config-panel-content {
    grid-template-columns: 1fr;
  }
  
  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .config-value {
    text-align: left;
    width: 100%;
  }
}

.config-loading {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #856404;
}

.config-error {
  grid-column: 1 / -1;
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 6px;
  padding: 1rem;
  color: #c62828;
}

.config-error h4 {
  margin: 0 0 0.5rem 0;
  color: #c62828;
}

.config-error pre {
  margin: 0.5rem 0 0 0;
  font-family: 'Consolas', 'Monaco', monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>

