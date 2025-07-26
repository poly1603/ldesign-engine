<template>
  <div class="simple-app">
    <h1>🎨 LDesign App 测试</h1>
    <p>如果你能看到这个页面，说明基础功能正常！</p>
    
    <div class="info">
      <h2>📊 引擎状态</h2>
      <p>引擎: {{ engine ? '✅ 已连接' : '❌ 未连接' }}</p>
      <p>状态: {{ engineState }}</p>
    </div>
    
    <div class="services">
      <h2>🔧 服务状态</h2>
      <p>主题服务: {{ theme ? '✅ 可用' : '❌ 不可用' }}</p>
      <p>通知服务: {{ notification ? '✅ 可用' : '❌ 不可用' }}</p>
    </div>
    
    <div class="actions">
      <h2>🎯 功能测试</h2>
      <button @click="testTheme" class="btn">测试主题切换</button>
      <button @click="testNotification" class="btn">测试通知</button>
    </div>
    
    <div class="debug">
      <h2>🔍 调试信息</h2>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, onMounted } from 'vue'

// 注入服务
const engine = inject('engine')
const theme = inject('theme')
const notification = inject('notification')

// 计算属性
const engineState = computed(() => {
  if (!engine) return 'unknown'
  return (engine as any).state || 'unknown'
})

const debugInfo = computed(() => {
  return {
    hasEngine: !!engine,
    hasTheme: !!theme,
    hasNotification: !!notification,
    engineState: engineState.value,
    timestamp: new Date().toLocaleTimeString()
  }
})

// 方法
const testTheme = () => {
  if (theme && typeof (theme as any).setTheme === 'function') {
    const currentTheme = (theme as any).getTheme()
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    ;(theme as any).setTheme(newTheme)
    console.log('主题已切换到:', newTheme)
  } else {
    console.error('主题服务不可用')
  }
}

const testNotification = () => {
  if (notification && typeof (notification as any).show === 'function') {
    ;(notification as any).show('测试通知消息', 'info', 3000)
    console.log('通知已发送')
  } else {
    console.error('通知服务不可用')
  }
}

// 生命周期
onMounted(() => {
  console.log('🎯 SimpleApp 组件已挂载')
  console.log('📊 Engine:', engine)
  console.log('🎨 Theme:', theme)
  console.log('📢 Notification:', notification)
})
</script>

<style scoped>
.simple-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

h1 {
  color: #007bff;
  text-align: center;
  margin-bottom: 2rem;
}

h2 {
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.info, .services, .actions, .debug {
  background: white;
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 0.5rem;
  font-size: 14px;
}

.btn:hover {
  background: #0056b3;
}

pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

p {
  margin: 0.5rem 0;
}
</style>
