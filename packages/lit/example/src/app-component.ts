import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('engine-app')
export class EngineApp extends LitElement {
  static styles = css`
    :host {
      display: block;
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
      background: linear-gradient(135deg, #324fff 0%, #00e8ff 100%);
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
      color: #324fff;
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
      color: #324fff;
    }

    .feature-card button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #324fff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
      font-weight: 600;
    }

    .feature-card button:hover {
      background: #00e8ff;
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
      background: #324fff;
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
  `

  @state()
  private appName = 'Lit Engine Example'

  @state()
  private version = '0.2.0'

  @state()
  private counter = 0

  @state()
  private logs: string[] = []

  connectedCallback() {
    super.connectedCallback()
    
    const engine = (window as any).__ENGINE__
    if (engine) {
      // 监听引擎事件
      engine.events.on('test:plugin', (data: any) => {
        this.addLog(`📨 Received plugin event: ${JSON.stringify(data)}`)
      })
      
      // 从引擎状态读取
      const engineAppName = engine.state.get('appName')
      const engineVersion = engine.state.get('version')
      if (engineAppName) this.appName = engineAppName
      if (engineVersion) this.version = engineVersion
      
      this.addLog('🎉 App component mounted')
    }
  }

  private addLog(message: string) {
    this.logs = [`[${new Date().toLocaleTimeString()}] ${message}`, ...this.logs].slice(0, 10)
  }

  private testPlugin() {
    const engine = (window as any).__ENGINE__
    if (engine) {
      engine.events.emit('test:plugin', { data: 'Plugin test' })
      this.addLog('✅ Plugin event emitted')
    }
  }

  private async testMiddleware() {
    const engine = (window as any).__ENGINE__
    if (engine) {
      await engine.middleware.execute({ action: 'test' })
      this.addLog('✅ Middleware executed')
    }
  }

  private async testLifecycle() {
    const engine = (window as any).__ENGINE__
    if (engine) {
      await engine.lifecycle.execute('custom', engine, { test: true })
      this.addLog('✅ Lifecycle hook executed')
    }
  }

  private incrementCounter() {
    this.counter++
    const engine = (window as any).__ENGINE__
    if (engine) {
      engine.state.set('counter', this.counter)
      this.addLog(`Counter updated to ${this.counter}`)
    }
  }

  render() {
    return html`
      <div class="app">
        <header class="header">
          <h1>🚀 Lit Engine Example</h1>
          <p class="subtitle">演示 createEngineApp 统一 API</p>
        </header>

        <main class="main">
          <section class="section">
            <h2>📦 核心特性</h2>
            <div class="features">
              <div class="feature-card">
                <h3>🔌 Plugin System</h3>
                <p>插件系统已激活</p>
                <button @click=${this.testPlugin}>测试插件</button>
              </div>
              
              <div class="feature-card">
                <h3>🔄 Middleware</h3>
                <p>中间件已注册</p>
                <button @click=${this.testMiddleware}>测试中间件</button>
              </div>
              
              <div class="feature-card">
                <h3>♻️ Lifecycle</h3>
                <p>生命周期管理</p>
                <button @click=${this.testLifecycle}>测试生命周期</button>
              </div>
            </div>
          </section>

          <section class="section">
            <h2>📊 Engine State</h2>
            <div class="state-display">
              <div class="state-item">
                <strong>App Name:</strong> ${this.appName}
              </div>
              <div class="state-item">
                <strong>Version:</strong> ${this.version}
              </div>
              <div class="state-item">
                <strong>Counter:</strong> ${this.counter}
                <button @click=${this.incrementCounter}>+1</button>
              </div>
            </div>
          </section>

          <section class="section">
            <h2>📝 Event Log</h2>
            <div class="log-container">
              ${this.logs.map(log => html`<div class="log-item">${log}</div>`)}
            </div>
          </section>
        </main>

        <footer class="footer">
          <p>Powered by @ldesign/engine-lit</p>
        </footer>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'engine-app': EngineApp
  }
}

