import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { useEngine } from '@ldesign/engine-lit'
import type { CoreEngine } from '@ldesign/engine-core'
import demoCardStyles from './demo-card.css?inline'

@customElement('middleware-demo')
export class MiddlewareDemo extends LitElement {
  static styles = [unsafeCSS(demoCardStyles)]

  @state()
  private middlewares!: any[]

  @state()
  private middlewareCount!: number

  @state()
  private executionLog!: string[]

  private engine: CoreEngine = useEngine()

  constructor() {
    super()
    this.middlewares = []
    this.middlewareCount = 0
    this.executionLog = []
  }

  connectedCallback() {
    super.connectedCallback()
    this.updateMiddlewareInfo()
  }

  updateMiddlewareInfo() {
    this.middlewareCount = this.engine.middleware.size()
    this.middlewares = Array.from(this.engine.middleware.getAll().values())
    this.requestUpdate()
  }

  async executeMiddleware() {
    this.executionLog = []
    const context = {
      data: { action: 'test', timestamp: Date.now() },
      cancelled: false,
    }

    try {
      await this.engine.middleware.execute(context)
      this.executionLog = [
        '✅ 中间件链执行完成',
        `📦 上下文数据: ${JSON.stringify(context.data)}`,
      ]
      this.requestUpdate()
    } catch (error: any) {
      this.executionLog = [`❌ 执行失败: ${error.message}`]
      this.requestUpdate()
    }
  }

  addMiddleware() {
    const newMiddleware = {
      name: `middleware-${Date.now()}`,
      priority: Math.floor(Math.random() * 100),
      async execute(context: any, next: () => Promise<void>) {
        console.log(`🔄 ${newMiddleware.name} 执行前`)
        await next()
        console.log(`🔄 ${newMiddleware.name} 执行后`)
      },
    }

    this.engine.middleware.use(newMiddleware)
    this.updateMiddlewareInfo()
    alert(`中间件 ${newMiddleware.name} 添加成功!`)
  }

  render() {
    return html`
      <div class="demo-card">
        <h2>⚙️ 中间件系统演示</h2>
        <div class="demo-content">
          <div class="info-grid">
            <div class="info-item">
              <strong>已注册中间件:</strong>
              ${this.middlewares.length > 0
                ? html`
                    <ul>
                      ${this.middlewares.map(
                        (mw) => html`
                          <li>${mw.name} (优先级: ${mw.priority || 0})</li>
                        `
                      )}
                    </ul>
                  `
                : html`<p class="empty">暂无中间件</p>`}
            </div>
            <div class="info-item">
              <strong>中间件数量:</strong>
              <span class="badge">${this.middlewareCount}</span>
            </div>
          </div>

          <div class="actions">
            <button @click=${this.executeMiddleware} class="btn btn-primary">
              执行中间件链
            </button>
            <button @click=${this.addMiddleware} class="btn btn-secondary">
              添加中间件
            </button>
          </div>

          ${this.executionLog.length > 0
            ? html`
                <div class="log">
                  <strong>执行日志:</strong>
                  <div class="log-entries">
                    ${this.executionLog.map(
                      (entry) => html`<div class="log-entry">${entry}</div>`
                    )}
                  </div>
                </div>
              `
            : ''}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'middleware-demo': MiddlewareDemo
  }
}

