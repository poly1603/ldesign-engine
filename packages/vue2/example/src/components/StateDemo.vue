<template>
  <div class="demo-card">
    <h2>📦 状态管理演示</h2>
    <div class="demo-content">
      <div class="state-display">
        <div class="state-item">
          <strong>计数器:</strong>
          <div class="counter">
            <button @click="decrement" class="btn btn-small">-</button>
            <span class="count">{{ count }}</span>
            <button @click="increment" class="btn btn-small">+</button>
          </div>
        </div>

        <div class="state-item">
          <strong>用户信息:</strong>
          <div class="user-info">
            <p><strong>姓名:</strong> {{ user.name }}</p>
            <p><strong>角色:</strong> {{ user.role }}</p>
          </div>
        </div>

        <div class="state-item">
          <strong>主题:</strong>
          <div class="theme-switcher">
            <button 
              @click="setTheme('light')" 
              :class="['btn', 'btn-small', { active: theme === 'light' }]"
            >
              ☀️ 浅色
            </button>
            <button 
              @click="setTheme('dark')" 
              :class="['btn', 'btn-small', { active: theme === 'dark' }]"
            >
              🌙 深色
            </button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="batchUpdate" class="btn btn-primary">
          批量更新状态
        </button>
        <button @click="resetAll" class="btn btn-secondary">
          重置所有状态
        </button>
      </div>

      <div class="state-list">
        <strong>所有状态:</strong>
        <div class="state-entries">
          <div v-for="key in stateKeys" :key="key" class="state-entry">
            <code>{{ key }}</code>: {{ getStateValue(key) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'StateDemo',
  data() {
    return {
      count: 0,
      user: { name: '', role: '' },
      theme: 'light',
      stateKeys: [] as string[],
    }
  },
  mounted() {
    const engine = (this as any).$engine
    if (engine) {
      // 监听状态变化
      engine.state.watch('count', (value: number) => {
        this.count = value
      })

      engine.state.watch('user', (value: any) => {
        this.user = value
      })

      engine.state.watch('theme', (value: string) => {
        this.theme = value
      })

      // 初始化状态
      this.count = engine.state.get('count') || 0
      this.user = engine.state.get('user') || { name: '', role: '' }
      this.theme = engine.state.get('theme') || 'light'
      
      this.updateStateKeys()
    }
  },
  methods: {
    increment() {
      const engine = (this as any).$engine
      if (engine) {
        engine.state.set('count', this.count + 1)
      }
    },
    decrement() {
      const engine = (this as any).$engine
      if (engine) {
        engine.state.set('count', this.count - 1)
      }
    },
    setTheme(theme: string) {
      const engine = (this as any).$engine
      if (engine) {
        engine.state.set('theme', theme)
      }
    },
    batchUpdate() {
      const engine = (this as any).$engine
      if (engine) {
        engine.state.batch(() => {
          engine.state.set('count', 100)
          engine.state.set('user', { name: '批量更新用户', role: 'superadmin' })
          engine.state.set('theme', 'dark')
        })
        this.updateStateKeys()
        alert('批量更新完成!')
      }
    },
    resetAll() {
      const engine = (this as any).$engine
      if (engine) {
        engine.state.set('count', 0)
        engine.state.set('user', { name: 'Vue 2 用户', role: 'admin' })
        engine.state.set('theme', 'light')
        this.updateStateKeys()
        alert('状态已重置!')
      }
    },
    updateStateKeys() {
      const engine = (this as any).$engine
      if (engine) {
        this.stateKeys = engine.state.keys()
      }
    },
    getStateValue(key: string) {
      const engine = (this as any).$engine
      if (engine) {
        const value = engine.state.get(key)
        return typeof value === 'object' ? JSON.stringify(value) : String(value)
      }
      return ''
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

.state-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.state-item {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.state-item strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  min-width: 3rem;
  text-align: center;
}

.user-info p {
  margin: 0.25rem 0;
  color: #666;
}

.theme-switcher {
  display: flex;
  gap: 0.5rem;
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

.btn-small {
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
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

.btn.active {
  background: #667eea;
  color: white;
}

.state-list {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.state-list strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.state-entries {
  max-height: 150px;
  overflow-y: auto;
}

.state-entry {
  padding: 0.25rem 0;
  font-size: 0.9rem;
  color: #666;
}

.state-entry code {
  background: #e0e0e0;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #667eea;
}
</style>

