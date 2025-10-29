<template>
  <div class="state-demo">
    <h3>状态管理器演示</h3>
    
    <div class="demo-section">
      <h4>嵌套路径访问</h4>
      <div class="controls">
        <input 
          v-model="statePath" 
          placeholder="状态路径 (如: user.profile.name)"
          class="input"
        >
        <input 
          v-model="stateValue" 
          placeholder="状态值"
          class="input"
        >
        <button @click="setState" class="button button-primary">
          设置状态
        </button>
        <button @click="getState" class="button">
          获取状态
        </button>
      </div>
      
      <div v-if="getStateResult !== null" class="result">
        获取结果: {{ getStateResult || '(不存在)' }}
      </div>
    </div>

    <div class="demo-section">
      <h4>批量更新演示</h4>
      <div class="batch-controls">
        <button @click="batchUpdate" class="button button-primary">
          批量更新用户信息
        </button>
        <button @click="singleUpdate" class="button">
          单次更新用户信息
        </button>
      </div>
      <div class="info-box">
        <p>批量更新会在所有操作完成后统一通知，性能更好</p>
        <p>监听器触发次数: <strong>{{ watcherCallCount }}</strong></p>
      </div>
    </div>

    <div class="demo-section">
      <h4>当前状态快照</h4>
      <pre class="state-snapshot">{{ stateSnapshotFormatted }}</pre>
      <div class="controls">
        <button @click="saveSnapshot" class="button">
          保存快照
        </button>
        <button @click="restoreSnapshot" class="button button-secondary">
          恢复快照
        </button>
        <button @click="clearAllState" class="button button-danger">
          清空状态
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h4>状态监听日志</h4>
      <div class="log-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-path">{{ log.path }}</span>
          <span class="log-change">
            {{ log.oldValue }} → {{ log.newValue }}
          </span>
        </div>
        <div v-if="logs.length === 0" class="empty-message">
          暂无日志
        </div>
      </div>
      <button @click="clearLogs" class="button">
        清空日志
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEngine } from '@ldesign/engine-vue'

const engine = useEngine()
const state = engine.state

const statePath = ref('user.name')
const stateValue = ref('Alice')
const getStateResult = ref<string | null>(null)
const watcherCallCount = ref(0)
const savedSnapshot = ref<Record<string, any> | null>(null)

interface LogEntry {
  time: string
  path: string
  oldValue: any
  newValue: any
}

const logs = ref<LogEntry[]>([])

const stateSnapshotFormatted = computed(() => {
  return JSON.stringify(state.getState(), null, 2)
})

function setState() {
  if (!statePath.value) {
    alert('请输入状态路径')
    return
  }
  
  state.set(statePath.value, stateValue.value)
  getStateResult.value = null
}

function getState() {
  if (!statePath.value) {
    alert('请输入状态路径')
    return
  }
  
  const value = state.get(statePath.value)
  getStateResult.value = value !== undefined ? String(value) : null
}

function batchUpdate() {
  watcherCallCount.value = 0
  
  state.batch(() => {
    state.set('user.name', 'Bob')
    state.set('user.age', 35)
    state.set('user.email', 'bob@example.com')
  })
}

function singleUpdate() {
  watcherCallCount.value = 0
  
  state.set('user.name', 'Charlie')
  state.set('user.age', 28)
  state.set('user.email', 'charlie@example.com')
}

function saveSnapshot() {
  savedSnapshot.value = state.snapshot()
  alert('快照已保存')
}

function restoreSnapshot() {
  if (!savedSnapshot.value) {
    alert('没有保存的快照')
    return
  }
  
  state.restore(savedSnapshot.value)
  alert('状态已恢复')
}

function clearAllState() {
  if (confirm('确定要清空所有状态吗？')) {
    state.clear()
  }
}

function clearLogs() {
  logs.value = []
}

function addLog(path: string, newValue: any, oldValue: any) {
  const now = new Date()
  logs.value.unshift({
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
    path,
    oldValue: oldValue === undefined ? 'undefined' : JSON.stringify(oldValue),
    newValue: newValue === undefined ? 'undefined' : JSON.stringify(newValue),
  })
  
  // 限制日志数量
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 监听所有变化
let unwatchUser: (() => void) | undefined

onMounted(() => {
  unwatchUser = state.watch('user', (newValue, oldValue, path) => {
    watcherCallCount.value++
    addLog(path, newValue, oldValue)
  })
})

onUnmounted(() => {
  unwatchUser?.()
})
</script>

<style scoped>
.state-demo {
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

.controls, .batch-controls {
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
  min-width: 200px;
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
  color: var(--color-text-primary);
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
  background: var(--color-success-lighter);
  border-radius: var(--size-radius-md);
  color: var(--color-success-default);
  font-family: monospace;
}

.info-box {
  padding: var(--size-space-md);
  background: var(--color-info-lighter);
  border-radius: var(--size-radius-md);
  color: var(--color-text-secondary);
}

.info-box p {
  margin: var(--size-space-xs) 0;
}

.info-box strong {
  color: var(--color-primary-default);
  font-size: var(--size-font-lg);
}

.state-snapshot {
  padding: var(--size-space-md);
  background: var(--color-bg-page);
  border-radius: var(--size-radius-md);
  color: var(--color-text-primary);
  font-family: monospace;
  font-size: var(--size-font-sm);
  overflow-x: auto;
  margin-bottom: var(--size-space-md);
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  padding: var(--size-space-md);
  background: var(--color-bg-page);
  border-radius: var(--size-radius-md);
  margin-bottom: var(--size-space-md);
}

.log-item {
  display: flex;
  gap: var(--size-space-md);
  padding: var(--size-space-sm);
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--size-font-sm);
  font-family: monospace;
}

.log-time {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.log-path {
  color: var(--color-primary-default);
  flex-shrink: 0;
  font-weight: 600;
}

.log-change {
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
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

.keys-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-space-sm);
  min-height: 40px;
  padding: var(--size-space-md);
  background: var(--color-bg-page);
  border-radius: var(--size-radius-md);
}

.empty-message {
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>

