<template>
  <div class="app">
    <header class="header">
      <h1>@ldesign/engine Vue Example</h1>
      <p>演示所有引擎功能</p>
    </header>

    <main class="main">
      <!-- i18n 插件示例 -->
      <section class="section">
        <h2>🌍 i18n 插件</h2>
        <div class="content">
          <p>{{ engine.t('hello') }}</p>
          <p>{{ engine.t('welcome', { name: 'Tom' }) }}</p>
          <p>当前语言: {{ currentLocale }}</p>
          <div class="buttons">
            <button @click="changeLocale('zh-CN')">中文</button>
            <button @click="changeLocale('en-US')">English</button>
          </div>
        </div>
      </section>

      <!-- 主题插件示例 -->
      <section class="section">
        <h2>🎨 主题插件</h2>
        <div class="content">
          <p>当前主题: {{ currentTheme }}</p>
          <div class="buttons">
            <button @click="changeTheme('light')">浅色</button>
            <button @click="changeTheme('dark')">深色</button>
          </div>
        </div>
      </section>

      <!-- 尺寸插件示例 -->
      <section class="section">
        <h2>📏 尺寸插件</h2>
        <div class="content">
          <p>当前尺寸: {{ currentSize }}</p>
          <div class="buttons">
            <button @click="changeSize('small')">小</button>
            <button @click="changeSize('medium')">中</button>
            <button @click="changeSize('large')">大</button>
          </div>
        </div>
      </section>

      <!-- 状态管理示例 -->
      <section class="section">
        <h2>📦 状态管理</h2>
        <div class="content">
          <p>计数: {{ count }}</p>
          <div class="buttons">
            <button @click="increment">+1</button>
            <button @click="decrement">-1</button>
            <button @click="reset">重置</button>
          </div>
        </div>
      </section>

      <!-- 事件系统示例 -->
      <section class="section">
        <h2>📡 事件系统</h2>
        <div class="content">
          <p>事件日志:</p>
          <ul class="event-log">
            <li v-for="(event, index) in eventLog" :key="index">
              {{ event }}
            </li>
          </ul>
          <button @click="emitCustomEvent">触发自定义事件</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEngine } from '@ldesign/engine-vue'

const engine = useEngine()

// i18n 状态
const currentLocale = ref(engine.getLocale())

// 主题状态
const currentTheme = ref(engine.getTheme())

// 尺寸状态
const currentSize = ref(engine.getSize())

// 计数器状态
const count = ref(0)

// 事件日志
const eventLog = ref<string[]>([])

// 切换语言
const changeLocale = (locale: string) => {
  engine.setLocale(locale)
  currentLocale.value = locale
}

// 切换主题
const changeTheme = (theme: string) => {
  engine.setTheme(theme)
  currentTheme.value = theme
}

// 切换尺寸
const changeSize = (size: any) => {
  engine.setSize(size)
  currentSize.value = size
}

// 计数器操作
const increment = () => {
  count.value++
  engine.state.setState('counter', count.value)
}

const decrement = () => {
  count.value--
  engine.state.setState('counter', count.value)
}

const reset = () => {
  count.value = 0
  engine.state.setState('counter', 0)
}

// 触发自定义事件
const emitCustomEvent = () => {
  engine.events.emit('custom:event', {
    message: 'Hello from custom event!',
    timestamp: new Date().toISOString()
  })
}

// 监听事件
const unsubscribeLocale = engine.events.on('locale:changed', (data: any) => {
  eventLog.value.unshift(`语言切换: ${data.from} → ${data.to}`)
  if (eventLog.value.length > 5) eventLog.value.pop()
})

const unsubscribeTheme = engine.events.on('theme:changed', (data: any) => {
  eventLog.value.unshift(`主题切换: ${data.from} → ${data.to}`)
  if (eventLog.value.length > 5) eventLog.value.pop()
})

const unsubscribeSize = engine.events.on('size:changed', (data: any) => {
  eventLog.value.unshift(`尺寸切换: ${data.from} → ${data.to}`)
  if (eventLog.value.length > 5) eventLog.value.pop()
})

const unsubscribeCustom = engine.events.on('custom:event', (data: any) => {
  eventLog.value.unshift(`自定义事件: ${data.message}`)
  if (eventLog.value.length > 5) eventLog.value.pop()
})

// 初始化
onMounted(() => {
  engine.logger.info('[App] Component mounted')
  
  // 从状态恢复计数
  const savedCount = engine.state.getState('counter')
  if (typeof savedCount === 'number') {
    count.value = savedCount
  }
})

// 清理
onUnmounted(() => {
  unsubscribeLocale()
  unsubscribeTheme()
  unsubscribeSize()
  unsubscribeCustom()
  engine.logger.info('[App] Component unmounted')
})
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: var(--background-color-secondary, #f5f5f5);
  border-radius: 8px;
}

.header h1 {
  margin: 0 0 10px 0;
  color: var(--primary-color, #1890ff);
}

.header p {
  margin: 0;
  color: var(--text-color-secondary, #666);
}

.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.section {
  padding: 20px;
  background: var(--background-color, #fff);
  border: 1px solid var(--border-color, #d9d9d9);
  border-radius: 8px;
  box-shadow: var(--shadow-color, rgba(0, 0, 0, 0.1)) 0 2px 8px;
}

.section h2 {
  margin: 0 0 15px 0;
  font-size: 1.2em;
  color: var(--text-color, #333);
}

.content {
  color: var(--text-color, #333);
}

.content p {
  margin: 10px 0;
}

.buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
}

button {
  padding: var(--padding, 8px 16px);
  font-size: var(--font-size, 14px);
  background: var(--primary-color, #1890ff);
  color: white;
  border: none;
  border-radius: var(--border-radius, 4px);
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

.event-log {
  list-style: none;
  padding: 0;
  margin: 10px 0;
  max-height: 150px;
  overflow-y: auto;
}

.event-log li {
  padding: 8px;
  margin: 5px 0;
  background: var(--background-color-secondary, #f5f5f5);
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--text-color-secondary, #666);
}

/* 响应式 */
@media (max-width: 768px) {
  .main {
    grid-template-columns: 1fr;
  }
}
</style>
