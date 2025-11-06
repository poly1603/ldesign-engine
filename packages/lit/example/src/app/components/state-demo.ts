import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { useEngine } from '@ldesign/engine-lit'
import type { CoreEngine, Unsubscribe } from '@ldesign/engine-core'
import demoCardStyles from './demo-card.css?inline'

@customElement('state-demo')
export class StateDemo extends LitElement {
  static styles = [unsafeCSS(demoCardStyles)]

  @state()
  private count!: number

  @state()
  private user!: { name: string; role: string }

  @state()
  private theme!: string

  @state()
  private stateKeys!: string[]

  private engine: CoreEngine = useEngine()
  private unsubscribers: Unsubscribe[] = []

  constructor() {
    super()
    this.count = 0
    this.user = { name: '', role: '' }
    this.theme = 'light'
    this.stateKeys = []
  }

  connectedCallback() {
    super.connectedCallback()
    this.count = this.engine.state.get('count') || 0
    this.user = this.engine.state.get('user') || { name: '', role: '' }
    this.theme = this.engine.state.get('theme') || 'light'
    this.updateStateKeys()

    this.unsubscribers.push(
      this.engine.state.watch('count', (value: number) => {
        this.count = value
        this.requestUpdate()
      })
    )

    this.unsubscribers.push(
      this.engine.state.watch('user', (value: any) => {
        this.user = value
        this.requestUpdate()
      })
    )

    this.unsubscribers.push(
      this.engine.state.watch('theme', (value: string) => {
        this.theme = value
        this.requestUpdate()
      })
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubscribers.forEach((unsub) => unsub())
  }

  increment() {
    this.engine.state.set('count', this.count + 1)
  }

  decrement() {
    this.engine.state.set('count', this.count - 1)
  }

  setTheme(newTheme: string) {
    this.engine.state.set('theme', newTheme)
  }

  batchUpdate() {
    this.engine.state.batch(() => {
      this.engine.state.set('count', 100)
      this.engine.state.set('user', {
        name: '批量更新用户',
        role: 'superadmin',
      })
      this.engine.state.set('theme', 'dark')
    })
    this.updateStateKeys()
    alert('批量更新完成!')
  }

  resetAll() {
    this.engine.state.set('count', 0)
    this.engine.state.set('user', { name: 'Lit 用户', role: 'admin' })
    this.engine.state.set('theme', 'light')
    this.updateStateKeys()
    alert('状态已重置!')
  }

  updateStateKeys() {
    this.stateKeys = this.engine.state.keys()
    this.requestUpdate()
  }

  getStateValue(key: string): string {
    const value = this.engine.state.get(key)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }

  render() {
    return html`
      <div class="demo-card">
        <h2>📦 状态管理演示</h2>
        <div class="demo-content">
          <div class="state-display">
            <div class="state-item">
              <strong>计数器:</strong>
              <div class="counter">
                <button @click=${this.decrement} class="btn btn-small">-</button>
                <span class="count">${this.count}</span>
                <button @click=${this.increment} class="btn btn-small">+</button>
              </div>
            </div>

            <div class="state-item">
              <strong>用户信息:</strong>
              <div class="user-info">
                <p><strong>姓名:</strong> ${this.user.name}</p>
                <p><strong>角色:</strong> ${this.user.role}</p>
              </div>
            </div>

            <div class="state-item">
              <strong>主题:</strong>
              <div class="theme-switcher">
                <button
                  @click=${() => this.setTheme('light')}
                  class="btn btn-small ${this.theme === 'light' ? 'active' : ''}"
                >
                  ☀️ 浅色
                </button>
                <button
                  @click=${() => this.setTheme('dark')}
                  class="btn btn-small ${this.theme === 'dark' ? 'active' : ''}"
                >
                  🌙 深色
                </button>
              </div>
            </div>
          </div>

          <div class="actions">
            <button @click=${this.batchUpdate} class="btn btn-primary">
              批量更新状态
            </button>
            <button @click=${this.resetAll} class="btn btn-secondary">
              重置所有状态
            </button>
          </div>

          <div class="state-list">
            <strong>所有状态:</strong>
            <div class="state-entries">
              ${this.stateKeys.map(
                (key) => html`
                  <div class="state-entry">
                    <code>${key}</code>: ${this.getStateValue(key)}
                  </div>
                `
              )}
            </div>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'state-demo': StateDemo
  }
}

