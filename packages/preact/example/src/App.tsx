import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import './App.css'

function App() {
  const [appName, setAppName] = useState('Preact Engine Example')
  const [version, setVersion] = useState('0.2.0')
  const [counter, setCounter] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => {
      const newLogs = [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]
      return newLogs.slice(0, 10)
    })
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
    const newCounter = counter + 1
    setCounter(newCounter)
    const engine = (window as any).__ENGINE__
    if (engine) {
      engine.state.set('counter', newCounter)
      addLog(`Counter updated to ${newCounter}`)
    }
  }

  useEffect(() => {
    const engine = (window as any).__ENGINE__
    if (engine) {
      // 监听引擎事件
      engine.events.on('test:plugin', (data: any) => {
        addLog(`📨 Received plugin event: ${JSON.stringify(data)}`)
      })
      
      // 从引擎状态读取
      const engineAppName = engine.state.get('appName')
      const engineVersion = engine.state.get('version')
      if (engineAppName) setAppName(engineAppName)
      if (engineVersion) setVersion(engineVersion)
      
      addLog('🎉 App component mounted')
    }
  }, [])

  return (
    <div class="app">
      <header class="header">
        <h1>🚀 Preact Engine Example</h1>
        <p class="subtitle">演示 createEngineApp 统一 API</p>
      </header>

      <main class="main">
        <section class="section">
          <h2>📦 核心特性</h2>
          <div class="features">
            <div class="feature-card">
              <h3>🔌 Plugin System</h3>
              <p>插件系统已激活</p>
              <button onClick={testPlugin}>测试插件</button>
            </div>
            
            <div class="feature-card">
              <h3>🔄 Middleware</h3>
              <p>中间件已注册</p>
              <button onClick={testMiddleware}>测试中间件</button>
            </div>
            
            <div class="feature-card">
              <h3>♻️ Lifecycle</h3>
              <p>生命周期管理</p>
              <button onClick={testLifecycle}>测试生命周期</button>
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
              <button onClick={incrementCounter}>+1</button>
            </div>
          </div>
        </section>

        <section class="section">
          <h2>📝 Event Log</h2>
          <div class="log-container">
            {logs.map((log, index) => (
              <div key={index} class="log-item">
                {log}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer class="footer">
        <p>Powered by @ldesign/engine-preact</p>
      </footer>
    </div>
  )
}

export default App

