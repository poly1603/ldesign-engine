<template>
  <div class="todo-app">
    <header class="app-header">
      <h1>📝 Todo 应用</h1>
      <p class="subtitle">使用 LDesign Engine 构建</p>
    </header>

    <div class="container">
      <!-- 输入区 -->
      <div class="input-section">
        <input
          v-model="newTaskTitle"
          class="task-input"
          placeholder="添加新任务..."
          @keyup.enter="addTask"
        >
        <button class="btn btn-primary" @click="addTask">
          添加
        </button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="🔍 搜索任务..."
          >
        </div>

        <div class="filters">
          <button
            :class="['filter-btn', { active: filter === 'all' }]"
            @click="setFilter('all')"
          >
            全部 ({{ stats.total }})
          </button>
          <button
            :class="['filter-btn', { active: filter === 'active' }]"
            @click="setFilter('active')"
          >
            进行中 ({{ stats.active }})
          </button>
          <button
            :class="['filter-btn', { active: filter === 'completed' }]"
            @click="setFilter('completed')"
          >
            已完成 ({{ stats.completed }})
          </button>
        </div>

        <div class="actions">
          <button
            class="btn btn-secondary"
            :disabled="!canUndo"
            @click="undo"
            title="撤销 (Ctrl+Z)"
          >
            ↶ 撤销
          </button>
          <button
            class="btn btn-secondary"
            :disabled="!canRedo"
            @click="redo"
            title="重做 (Ctrl+Shift+Z)"
          >
            ↷ 重做
          </button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">完成率</span>
          <span class="stat-value">{{ stats.completionRate.toFixed(1) }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总任务</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ stats.completed }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">进行中</span>
          <span class="stat-value">{{ stats.active }}</span>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="task-list">
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <p v-if="tasks.length === 0">还没有任务，开始添加吧！</p>
          <p v-else>没有找到匹配的任务</p>
        </div>

        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.completed }"
        >
          <div class="task-content">
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task.id)"
            >
            <span class="task-title">{{ task.title }}</span>
            <span class="task-date">
              {{ formatDate(task.createdAt) }}
            </span>
          </div>
          <div class="task-actions">
            <button
              class="btn-icon"
              @click="deleteTask(task.id)"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="footer-actions" v-if="stats.completed > 0">
        <button class="btn btn-danger" @click="clearCompleted">
          清除已完成任务 ({{ stats.completed }})
        </button>
        <button class="btn btn-secondary" @click="completeAll">
          全部标记为完成
        </button>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div class="shortcuts">
      <p><kbd>Ctrl</kbd> + <kbd>Z</kbd> 撤销</p>
      <p><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> 重做</p>
      <p><kbd>Enter</kbd> 添加任务</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { useEngine } from '@ldesign/engine/vue'
import type { TodoState, Task } from './main'

const engine = useEngine()
const todoManager = inject<any>('todoManager')

// 响应式数据
const newTaskTitle = ref('')
const todoState = computed(() => engine.state.get<TodoState>('todos')!)
const tasks = computed(() => todoState.value?.tasks || [])
const filter = computed(() => todoState.value?.filter || 'all')
const searchQuery = computed({
  get: () => todoState.value?.searchQuery || '',
  set: (value: string) => todoManager.setSearchQuery(value)
})

// 计算属性
const filteredTasks = computed(() => todoManager.getFilteredTasks())
const stats = computed(() => todoManager.getStats())
const canUndo = computed(() => engine.state.canUndo())
const canRedo = computed(() => engine.state.canRedo())

// 方法
function addTask() {
  if (!newTaskTitle.value.trim()) {
    engine.notifications.warning('请输入任务内容')
    return
  }
  
  todoManager.addTask(newTaskTitle.value.trim())
  newTaskTitle.value = ''
}

function toggleTask(id: string) {
  todoManager.toggleTask(id)
}

function deleteTask(id: string) {
  todoManager.deleteTask(id)
}

function setFilter(newFilter: 'all' | 'active' | 'completed') {
  todoManager.setFilter(newFilter)
}

function clearCompleted() {
  todoManager.clearCompleted()
}

function completeAll() {
  todoManager.completeAll()
}

function undo() {
  todoManager.undo()
}

function redo() {
  todoManager.redo()
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  
  return date.toLocaleDateString('zh-CN')
}

// 事件监听
engine.events.on('todo:completed', (task: Task) => {
  console.log('任务完成:', task)
})

// 自动保存提示
watch(
  () => tasks.value.length,
  () => {
    engine.logger.debug('任务列表已更新')
  }
)
</script>

<style scoped>
.todo-app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2.5em;
  margin: 0;
  color: #2c3e50;
}

.subtitle {
  color: #7f8c8d;
  margin-top: 5px;
}

.container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;
}

.task-input:focus {
  outline: none;
  border-color: #42b983;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filters {
  display: flex;
  gap: 5px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.actions {
  display: flex;
  gap: 5px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85em;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: #2c3e50;
}

.task-list {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.task-item:hover {
  background: #f8f9fa;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #95a5a6;
}

.task-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.task-title {
  font-size: 16px;
  color: #2c3e50;
  flex: 1;
}

.task-date {
  font-size: 0.85em;
  color: #95a5a6;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #35a372;
}

.btn-secondary {
  background: #e0e0e0;
  color: #2c3e50;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.footer-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.shortcuts {
  margin-top: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;
  color: #7f8c8d;
}

.shortcuts p {
  margin: 5px 0;
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>


