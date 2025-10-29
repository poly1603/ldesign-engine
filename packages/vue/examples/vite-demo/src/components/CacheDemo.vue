<template>
  <div class="cache-demo">
    <h3>缓存管理器演示</h3>
    
    <div class="demo-section">
      <h4>基础操作</h4>
      <div class="controls">
        <input 
          v-model="cacheKey" 
          placeholder="缓存键"
          class="input"
        >
        <input 
          v-model="cacheValue" 
          placeholder="缓存值"
          class="input"
        >
        <button @click="setCache" class="button button-primary">
          设置缓存
        </button>
        <button @click="getCache" class="button">
          获取缓存
        </button>
        <button @click="deleteCache" class="button button-danger">
          删除缓存
        </button>
      </div>
      
      <div v-if="getCacheResult !== null" class="result">
        获取结果: {{ getCacheResult || '(不存在)' }}
      </div>
    </div>

    <div class="demo-section">
      <h4>缓存统计</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">缓存大小</span>
          <span class="stat-value">{{ stats.size }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">命中率</span>
          <span class="stat-value">{{ (stats.hitRate * 100).toFixed(2) }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">命中次数</span>
          <span class="stat-value">{{ stats.hits }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未命中</span>
          <span class="stat-value">{{ stats.misses }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">淘汰次数</span>
          <span class="stat-value">{{ stats.evictions }}</span>
        </div>
        <div v-if="stats.memoryUsage" class="stat-item">
          <span class="stat-label">内存占用</span>
          <span class="stat-value">{{ formatBytes(stats.memoryUsage) }}</span>
        </div>
      </div>
      <button @click="refreshStats" class="button button-secondary">
        刷新统计
      </button>
    </div>

    <div class="demo-section">
      <h4>所有缓存键</h4>
      <div class="keys-list">
        <span v-for="key in allKeys" :key="key" class="key-item">
          {{ key }}
        </span>
        <span v-if="allKeys.length === 0" class="empty-message">
          暂无缓存
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEngine } from '@ldesign/engine-vue'

const engine = useEngine()
const cache = engine.cache

const cacheKey = ref('')
const cacheValue = ref('')
const getCacheResult = ref<string | null>(null)
const stats = ref(cache.getStats())
const allKeys = ref<string[]>([])

function setCache() {
  if (!cacheKey.value) {
    alert('请输入缓存键')
    return
  }
  
  cache.set(cacheKey.value, cacheValue.value, 60000) // 1分钟TTL
  refreshStats()
  getCacheResult.value = null
}

function getCache() {
  if (!cacheKey.value) {
    alert('请输入缓存键')
    return
  }
  
  const value = cache.get(cacheKey.value)
  getCacheResult.value = value !== undefined ? String(value) : null
  refreshStats()
}

function deleteCache() {
  if (!cacheKey.value) {
    alert('请输入缓存键')
    return
  }
  
  cache.delete(cacheKey.value)
  refreshStats()
  getCacheResult.value = null
}

function refreshStats() {
  stats.value = cache.getStats()
  allKeys.value = cache.keys()
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`
}

onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.cache-demo {
  padding: var(--size-space-lg);
}

h3 {
  font-size: var(--size-font-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--size-space-lg);
}

h4 {
  font-size: var(--size-font-md);
  color: var(--color-text-secondary);
  margin-bottom: var(--size-space-md);
}

.demo-section {
  margin-bottom: var(--size-space-xl);
  padding: var(--size-space-lg);
  background: var(--color-bg-container);
  border-radius: var(--size-radius-lg);
  box-shadow: var(--shadow-sm);
}

.controls {
  display: flex;
  gap: var(--size-space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--size-space-md);
}

.input {
  padding: var(--size-space-sm) var(--size-space-md);
  border: 1px solid var(--color-border-default);
  border-radius: var(--size-radius-md);
  font-size: var(--size-font-base);
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  flex: 1;
  min-width: 150px;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-default);
}

.button {
  padding: var(--size-space-sm) var(--size-space-lg);
  border: none;
  border-radius: var(--size-radius-md);
  font-size: var(--size-font-base);
  cursor: pointer;
  transition: all 0.3s;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button-primary {
  background: var(--color-primary-default);
  color: var(--color-text-inverse);
}

.button-primary:hover {
  background: var(--color-primary-hover);
}

.button-secondary {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
}

.button-danger {
  background: var(--color-danger-default);
  color: var(--color-text-inverse);
}

.button-danger:hover {
  background: var(--color-danger-hover);
}

.result {
  padding: var(--size-space-md);
  background: var(--color-primary-lighter);
  border-radius: var(--size-radius-md);
  color: var(--color-primary-default);
  font-family: monospace;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--size-space-md);
  margin-bottom: var(--size-space-md);
}

.stat-item {
  padding: var(--size-space-md);
  background: var(--color-bg-elevated);
  border-radius: var(--size-radius-md);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: var(--size-font-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--size-space-xs);
}

.stat-value {
  display: block;
  font-size: var(--size-font-2xl);
  font-weight: 600;
  color: var(--color-primary-default);
}

.keys-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-space-sm);
  min-height: 40px;
  padding: var(--size-space-md);
  background: var(--color-bg-page);
  border-radius: var(--size-radius-md);
}

.key-item {
  padding: var(--size-space-xs) var(--size-space-sm);
  background: var(--color-primary-lighter);
  color: var(--color-primary-default);
  border-radius: var(--size-radius-sm);
  font-size: var(--size-font-sm);
  font-family: monospace;
}

.empty-message {
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>

