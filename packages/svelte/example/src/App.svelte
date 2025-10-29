<script lang="ts">
  import { onMount } from 'svelte'

  let appName = 'Svelte Engine Example'
  let version = '0.2.0'
  let counter = 0
  let logs: string[] = []

  function addLog(message: string) {
    logs = [`[${new Date().toLocaleTimeString()}] ${message}`, ...logs].slice(0, 10)
  }

  function testPlugin() {
    const engine = (window as any).__ENGINE__
    if (engine) {
      engine.events.emit('test:plugin', { data: 'Plugin test' })
      addLog('✅ Plugin event emitted')
    }
  }

  async function testMiddleware() {
    const engine = (window as any).__ENGINE__
    if (engine) {
      await engine.middleware.execute({ action: 'test' })
      addLog('✅ Middleware executed')
    }
  }

  async function testLifecycle() {
    const engine = (window as any).__ENGINE__
    if (engine) {
      await engine.lifecycle.execute('custom', engine, { test: true })
      addLog('✅ Lifecycle hook executed')
    }
  }

  function incrementCounter() {
    counter++
    const engine = (window as any).__ENGINE__
    if (engine) {
      engine.state.set('counter', counter)
      addLog(`Counter updated to ${counter}`)
    }
  }

  onMount(() => {
    const engine = (window as any).__ENGINE__
    if (engine) {
      // 监听引擎事件
      engine.events.on('test:plugin', (data: any) => {
        addLog(`📨 Received plugin event: ${JSON.stringify(data)}`)
      })
      
      // 从引擎状态读取
      const engineAppName = engine.state.get('appName')
      const engineVersion = engine.state.get('version')
      if (engineAppName) appName = engineAppName
      if (engineVersion) version = engineVersion
      
      addLog('🎉 App component mounted')
    }
  })
</script>

<div class="app">
  <header class="header">
    <h1>🚀 Svelte Engine Example</h1>
    <p class="subtitle">演示 createEngineApp 统一 API</p>
  </header>

  <main class="main">
    <section class="section">
      <h2>📦 核心特性</h2>
      <div class="features">
        <div class="feature-card">
          <h3>🔌 Plugin System</h3>
          <p>插件系统已激活</p>
          <button on:click={testPlugin}>测试插件</button>
        </div>
        
        <div class="feature-card">
          <h3>🔄 Middleware</h3>
          <p>中间件已注册</p>
          <button on:click={testMiddleware}>测试中间件</button>
        </div>
        
        <div class="feature-card">
          <h3>♻️ Lifecycle</h3>
          <p>生命周期管理</p>
          <button on:click={testLifecycle}>测试生命周期</button>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>📊 Engine State</h2>
      <div class="state-display">
        <div class="state-item">
          <strong>App Name:</strong> {appName}
        </div>
        <div class="state-item">
          <strong>Version:</strong> {version}
        </div>
        <div class="state-item">
          <strong>Counter:</strong> {counter}
          <button on:click={incrementCounter}>+1</button>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>📝 Event Log</h2>
      <div class="log-container">
        {#each logs as log}
          <div class="log-item">{log}</div>
        {/each}
      </div>
    </section>
  </main>

  <footer class="footer">
    <p>Powered by @ldesign/engine-svelte</p>
  </footer>
</div>

<style>
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
    background: linear-gradient(135deg, #ff3e00 0%, #ff8a00 100%);
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
    color: #333;
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
    color: #ff3e00;
  }

  .feature-card button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
    font-weight: 600;
  }

  .feature-card button:hover {
    background: #ff8a00;
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
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
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

