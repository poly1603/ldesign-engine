<template>
  <div class="app">
    <header class="header">
      <h1>🚀 Vue Engine Example</h1>
      <p class="subtitle">演示 createEngineApp 统一 API</p>
    </header>

    <main class="main">
      <section class="section">
        <h2>📦 核心特性</h2>
        <div class="features">
          <div class="feature-card">
            <h3>🔌 Plugin System</h3>
            <p>插件系统已激活</p>
            <button @click="testPlugin">测试插件</button>
          </div>
          
          <div class="feature-card">
            <h3>🔄 Middleware</h3>
            <p>中间件已注册</p>
            <button @click="testMiddleware">测试中间件</button>
          </div>
          
          <div class="feature-card">
            <h3>♻️ Lifecycle</h3>
            <p>生命周期管理</p>
            <button @click="testLifecycle">测试生命周期</button>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>📊 Engine State</h2>
        <div class="state-display">
          <div class="state-item">
            <strong>App Name:</strong> {{ appName }}
          </div>
          <div class="state-item">
            <strong>Version:</strong> {{ version }}
          </div>
          <div class="state-item">
            <strong>Counter:</strong> {{ counter }}
            <button @click="incrementCounter">+1</button>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>📝 Event Log</h2>
        <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>Powered by @ldesign/engine-vue</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const appName = ref('Vue Engine Example')
const version = ref('0.2.0')
const counter = ref(0)
const logs = ref<string[]>([])

const addLog = (message: string) => {
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`)
  if (logs.value.length > 10) {
    logs.value.pop()
  }
}

const testPlugin = () => {
  const engine = (window as any).__ENGINE__
  if (engine) {
    engine.events.emit('test:plugin', { data: 'Plugin test' })
    addLog('✅ Plugin event emitted')
  }
}

const testMiddleware = async () => {
  const engine = (window as any).__ENGINE__
  if (engine) {
    await engine.middleware.execute({ action: 'test' })
    addLog('✅ Middleware executed')
  }
}

const testLifecycle = async () => {
  const engine = (window as any).__ENGINE__
  if (engine) {
    await engine.lifecycle.execute('custom', engine, { test: true })
    addLog('✅ Lifecycle hook executed')
  }
}

const incrementCounter = () => {
  counter.value++
  const engine = (window as any).__ENGINE__
  if (engine) {
    engine.state.set('counter', counter.value)
    addLog(`Counter updated to ${counter.value}`)
  }
}

onMounted(() => {
  const engine = (window as any).__ENGINE__
  if (engine) {
    // 监听引擎事件
    engine.events.on('test:plugin', (data: any) => {
      addLog(`📨 Received plugin event: ${JSON.stringify(data)}`)
    })
    
    // 从引擎状态读取
    const engineAppName = engine.state.get('appName')
    const engineVersion = engine.state.get('version')
    if (engineAppName) appName.value = engineAppName
    if (engineVersion) version.value = engineVersion
    
    addLog('🎉 App component mounted')
  }
})
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.section h2 {
  margin-bottom: 1rem;
  color: #35495e;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.feature-card {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: #42b883;
}

.feature-card button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.feature-card button:hover {
  background: #35495e;
}

.state-display {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.state-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.state-item button {
  padding: 0.25rem 0.75rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.log-container {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.log-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid #333;
}

.footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
  color: #666;
}
</style>

