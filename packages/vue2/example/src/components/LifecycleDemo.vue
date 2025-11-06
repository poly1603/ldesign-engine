<template>
  <div class="demo-card">
    <h2>🔄 生命周期演示</h2>
    <div class="demo-content">
      <div class="lifecycle-status">
        <div class="status-item">
          <strong>引擎状态:</strong>
          <span :class="['status-badge', engineInitialized ? 'active' : 'inactive']">
            {{ engineInitialized ? '已初始化' : '未初始化' }}
          </span>
        </div>
        <div class="status-item">
          <strong>触发次数:</strong>
          <span class="badge">{{ triggerCount }}</span>
        </div>
      </div>

      <div class="lifecycle-hooks">
        <strong>生命周期钩子:</strong>
        <div class="hooks-grid">
          <div 
            v-for="hook in lifecycleHooks" 
            :key="hook.name"
            :class="['hook-item', { triggered: hook.triggered }]"
          >
            <span class="hook-name">{{ hook.name }}</span>
            <span class="hook-count">{{ hook.count }}次</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="triggerCustomHook" class="btn btn-primary">
          触发自定义钩子
        </button>
        <button @click="resetCounts" class="btn btn-secondary">
          重置计数
        </button>
      </div>

      <div v-if="hookLog.length > 0" class="log">
        <strong>钩子日志:</strong>
        <div class="log-entries">
          <div v-for="(entry, index) in hookLog" :key="index" class="log-entry">
            <span class="timestamp">{{ entry.timestamp }}</span>
            <span class="hook-name">{{ entry.hook }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'LifecycleDemo',
  data() {
    return {
      engineInitialized: false,
      triggerCount: 0,
      lifecycleHooks: [
        { name: 'beforeInit', triggered: false, count: 0 },
        { name: 'init', triggered: false, count: 0 },
        { name: 'afterInit', triggered: false, count: 0 },
        { name: 'beforeMount', triggered: false, count: 0 },
        { name: 'mounted', triggered: false, count: 0 },
        { name: 'custom', triggered: false, count: 0 },
      ],
      hookLog: [] as any[],
    }
  },
  mounted() {
    const engine = (this as any).$engine
    if (engine) {
      this.engineInitialized = engine.isInitialized()

      // 注册生命周期钩子监听
      this.lifecycleHooks.forEach(hook => {
        engine.lifecycle.on(hook.name, () => {
          this.onHookTriggered(hook.name)
        })
      })

      // 注册自定义钩子
      engine.lifecycle.on('custom', () => {
        this.onHookTriggered('custom')
      })
    }
  },
  methods: {
    onHookTriggered(hookName: string) {
      const hook = this.lifecycleHooks.find(h => h.name === hookName)
      if (hook) {
        hook.triggered = true
        hook.count++
        this.triggerCount++
        
        const timestamp = new Date().toLocaleTimeString()
        this.hookLog.unshift({ timestamp, hook: hookName })
        
        // 限制日志数量
        if (this.hookLog.length > 15) {
          this.hookLog = this.hookLog.slice(0, 15)
        }
      }
    },
    async triggerCustomHook() {
      const engine = (this as any).$engine
      if (engine) {
        await engine.lifecycle.trigger('custom', { message: '自定义钩子触发' })
        alert('自定义钩子已触发!')
      }
    },
    resetCounts() {
      this.lifecycleHooks.forEach(hook => {
        hook.count = 0
        hook.triggered = false
      })
      this.triggerCount = 0
      this.hookLog = []
    },
  },
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

.lifecycle-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.status-item {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.status-item strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.2rem;
}

.lifecycle-hooks {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.lifecycle-hooks strong {
  display: block;
  margin-bottom: 0.75rem;
  color: #555;
}

.hooks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.hook-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.hook-item.triggered {
  background: #e8f5e9;
  border-color: #4caf50;
}

.hook-name {
  font-size: 0.85rem;
  color: #666;
}

.hook-item.triggered .hook-name {
  color: #2e7d32;
  font-weight: 500;
}

.hook-count {
  font-size: 0.75rem;
  color: #999;
  background: #f0f0f0;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
}

.hook-item.triggered .hook-count {
  background: #4caf50;
  color: white;
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
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.log {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #667eea;
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
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  background: white;
  border-radius: 3px;
  font-size: 0.85rem;
}

.timestamp {
  color: #999;
  font-family: 'Courier New', monospace;
}
</style>

