<template>
  <div class="demo-card">
    <h2>📡 事件系统演示</h2>
    <div class="demo-content">
      <div class="event-controls">
        <div class="input-group">
          <label>事件名称:</label>
          <input v-model="eventName" type="text" placeholder="输入事件名称" class="input" />
        </div>
        <div class="input-group">
          <label>事件数据:</label>
          <input v-model="eventData" type="text" placeholder="输入事件数据" class="input" />
        </div>
      </div>

      <div class="actions">
        <button @click="emitEvent" class="btn btn-primary">
          触发事件
        </button>
        <button @click="emitAsyncEvent" class="btn btn-secondary">
          触发异步事件
        </button>
        <button @click="clearLog" class="btn btn-secondary">
          清空日志
        </button>
      </div>

      <div v-if="eventLog.length > 0" class="log">
        <strong>事件日志:</strong>
        <div class="log-entries">
          <div v-for="(entry, index) in eventLog" :key="index" class="log-entry">
            <span class="timestamp">{{ entry.timestamp }}</span>
            <span class="event-name">{{ entry.event }}</span>
            <span class="event-data">{{ entry.data }}</span>
          </div>
        </div>
      </div>

      <div class="info">
        <p>💡 提示: 所有事件都会被 logger 插件记录到控制台</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'EventDemo',
  data() {
    return {
      eventName: 'custom:event',
      eventData: 'Hello from Vue 2!',
      eventLog: [] as any[],
    }
  },
  mounted() {
    const engine = (this as any).$engine
    if (engine) {
      // 监听自定义事件
      engine.events.on('custom:event', (data: any) => {
        this.addLog('custom:event', data)
      })

      // 监听欢迎事件
      engine.events.on('app:welcome', (data: any) => {
        this.addLog('app:welcome', data)
      })

      // 监听用户事件
      engine.events.on('user:login', (data: any) => {
        this.addLog('user:login', data)
      })

      engine.events.on('user:logout', (data: any) => {
        this.addLog('user:logout', data)
      })
    }
  },
  methods: {
    emitEvent() {
      const engine = (this as any).$engine
      if (engine && this.eventName) {
        engine.events.emit(this.eventName, this.eventData)
      }
    },
    async emitAsyncEvent() {
      const engine = (this as any).$engine
      if (engine && this.eventName) {
        await engine.events.emitAsync(this.eventName, this.eventData)
        alert('异步事件触发完成!')
      }
    },
    addLog(event: string, data: any) {
      const timestamp = new Date().toLocaleTimeString()
      this.eventLog.unshift({
        timestamp,
        event,
        data: typeof data === 'object' ? JSON.stringify(data) : String(data),
      })
      
      // 限制日志数量
      if (this.eventLog.length > 20) {
        this.eventLog = this.eventLog.slice(0, 20)
      }
    },
    clearLog() {
      this.eventLog = []
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

.event-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: #555;
}

.input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.input:focus {
  outline: none;
  border-color: #667eea;
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
  max-height: 250px;
  overflow-y: auto;
}

.log-entry {
  display: grid;
  grid-template-columns: 80px 150px 1fr;
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

.event-name {
  color: #667eea;
  font-weight: 500;
}

.event-data {
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info {
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 3px solid #ffc107;
  border-radius: 4px;
}

.info p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}
</style>

