<template>
  <div class="demo-card">
    <h2>⚙️ 中间件系统演示</h2>
    <div class="demo-content">
      <div class="info-grid">
        <div class="info-item">
          <strong>已注册中间件:</strong>
          <ul v-if="middlewares.length > 0">
            <li v-for="mw in middlewares" :key="mw.name">
              {{ mw.name }} (优先级: {{ mw.priority || 0 }})
            </li>
          </ul>
          <p v-else class="empty">暂无中间件</p>
        </div>
        <div class="info-item">
          <strong>中间件数量:</strong>
          <span class="badge">{{ middlewareCount }}</span>
        </div>
      </div>

      <div class="actions">
        <button @click="executeMiddleware" class="btn btn-primary">
          执行中间件链
        </button>
        <button @click="addMiddleware" class="btn btn-secondary">
          添加中间件
        </button>
      </div>

      <div v-if="executionLog.length > 0" class="log">
        <strong>执行日志:</strong>
        <div class="log-entries">
          <div v-for="(entry, index) in executionLog" :key="index" class="log-entry">
            {{ entry }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()
const middlewares = ref<any[]>([])
const middlewareCount = ref(0)
const executionLog = ref<string[]>([])

const updateMiddlewareInfo = () => {
  middlewareCount.value = engine.middleware.size()
  middlewares.value = Array.from(engine.middleware.getAll().values())
}

const executeMiddleware = async () => {
  executionLog.value = []
  const context = {
    data: { action: 'test', timestamp: Date.now() },
    cancelled: false,
  }

  try {
    await engine.middleware.execute(context)
    executionLog.value.push('✅ 中间件链执行完成')
    executionLog.value.push(`📦 上下文数据: ${JSON.stringify(context.data)}`)
  } catch (error: any) {
    executionLog.value.push(`❌ 执行失败: ${error.message}`)
  }
}

const addMiddleware = () => {
  const newMiddleware = {
    name: `middleware-${Date.now()}`,
    priority: Math.floor(Math.random() * 100),
    async execute(context: any, next: () => Promise<void>) {
      console.log(`🔄 ${newMiddleware.name} 执行前`)
      await next()
      console.log(`🔄 ${newMiddleware.name} 执行后`)
    },
  }

  engine.middleware.use(newMiddleware)
  updateMiddlewareInfo()
  alert(`中间件 ${newMiddleware.name} 添加成功!`)
}

onMounted(() => {
  updateMiddlewareInfo()
})
</script>

<style scoped>
.demo-card {
  padding: 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.5rem;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.info-item {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.info-item strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.info-item ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-item li {
  margin: 0.25rem 0;
  color: #666;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #42b883;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.2rem;
}

.empty {
  color: #999;
  font-style: italic;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
  background: #35a372;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.log {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #42b883;
}

.log strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  padding: 0.25rem 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #666;
}
</style>

