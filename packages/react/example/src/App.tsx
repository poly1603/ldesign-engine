import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [appName, setAppName] = useState('React Engine Example')
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
    <div className="app">
      <header className="header">
        <h1>🚀 React Engine Example</h1>
        <p className="subtitle">演示 createEngineApp 统一 API</p>
      </header>

      <main className="main">
        <section className="section">
          <h2>📦 核心特性</h2>
          <div className="features">
            <div className="feature-card">
              <h3>🔌 Plugin System</h3>
              <p>插件系统已激活</p>
              <button onClick={testPlugin}>测试插件</button>
            </div>
            
            <div className="feature-card">
              <h3>🔄 Middleware</h3>
              <p>中间件已注册</p>
              <button onClick={testMiddleware}>测试中间件</button>
            </div>
            
            <div className="feature-card">
              <h3>♻️ Lifecycle</h3>
              <p>生命周期管理</p>
              <button onClick={testLifecycle}>测试生命周期</button>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>📊 Engine State</h2>
          <div className="state-display">
            <div className="state-item">
              <strong>App Name:</strong> {appName}
            </div>
            <div className="state-item">
              <strong>Version:</strong> {version}
            </div>
            <div className="state-item">
              <strong>Counter:</strong> {counter}
              <button onClick={incrementCounter}>+1</button>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>📝 Event Log</h2>
          <div className="log-container">
            {logs.map((log, index) => (
              <div key={index} className="log-item">
                {log}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Powered by @ldesign/engine-react</p>
      </footer>
    </div>
  )
}

export default App

