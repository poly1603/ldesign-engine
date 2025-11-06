import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { getEngine } from '@ldesign/engine-lit'

@customElement('about-page')
export class AboutPage extends LitElement {
  static styles = css`
    .about {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h1 {
      margin: 0 0 1rem;
      font-size: 2.5rem;
      color: #333;
    }

    .header p {
      margin: 0;
      font-size: 1.2rem;
      color: #666;
    }

    .info-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .info-card h2 {
      margin: 0 0 1rem;
      color: #667eea;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #333;
    }

    .info-value {
      color: #666;
    }

    .event-demo {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .event-demo h2 {
      margin: 0 0 1rem;
      color: #667eea;
    }

    .event-log {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 1rem;
    }

    .event-item {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: white;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: #667eea;
      color: white;
      transition: all 0.3s;
    }

    button:hover {
      background: #5568d3;
    }
  `

  @state()
  private events: string[] = []

  private engine = getEngine()
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this.unsubscribe = this.engine.events.on('*', (event: string, data: any) => {
      const eventStr = `[${new Date().toLocaleTimeString()}] ${event}: ${JSON.stringify(data)}`
      this.events = [eventStr, ...this.events].slice(0, 10)
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  private triggerEvent() {
    this.engine.events.emit('custom:test', {
      message: 'Hello from About page!',
      timestamp: Date.now(),
    })
  }

  render() {
    const engineInfo = {
      name: this.engine.config.name || 'LDesign Engine',
      version: this.engine.config.version || '1.0.0',
      debug: this.engine.config.debug ? '开启' : '关闭',
      plugins: this.engine.plugins.getAll().length,
      middleware: this.engine.middleware.getAll().length,
    }

    return html`
      <div class="about">
        <div class="header">
          <h1>ℹ️ 关于</h1>
          <p>了解 LDesign Engine 的详细信息</p>
        </div>

        <div class="info-card">
          <h2>引擎信息</h2>
          <div class="info-item">
            <span class="info-label">名称</span>
            <span class="info-value">${engineInfo.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">版本</span>
            <span class="info-value">${engineInfo.version}</span>
          </div>
          <div class="info-item">
            <span class="info-label">调试模式</span>
            <span class="info-value">${engineInfo.debug}</span>
          </div>
          <div class="info-item">
            <span class="info-label">已加载插件</span>
            <span class="info-value">${engineInfo.plugins} 个</span>
          </div>
          <div class="info-item">
            <span class="info-label">已注册中间件</span>
            <span class="info-value">${engineInfo.middleware} 个</span>
          </div>
        </div>

        <div class="event-demo">
          <h2>事件系统演示</h2>
          <div class="event-log">
            ${this.events.length === 0
              ? html`<div class="event-item">暂无事件...</div>`
              : this.events.map(
                  (event) => html`<div class="event-item">${event}</div>`
                )}
          </div>
          <button @click=${this.triggerEvent}>触发测试事件</button>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'about-page': AboutPage
  }
}

