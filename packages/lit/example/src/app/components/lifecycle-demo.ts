import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { useEngine } from '@ldesign/engine-lit'
import type { CoreEngine, Unsubscribe } from '@ldesign/engine-core'
import demoCardStyles from './demo-card.css?inline'

interface LifecycleHook {
  name: string
  triggered: boolean
  count: number
}

interface HookLogEntry {
  timestamp: string
  hook: string
}

@customElement('lifecycle-demo')
export class LifecycleDemo extends LitElement {
  static styles = [unsafeCSS(demoCardStyles)]

  @state()
  private engineInitialized!: boolean

  @state()
  private triggerCount!: number

  @state()
  private lifecycleHooks!: LifecycleHook[]

  @state()
  private hookLog!: HookLogEntry[]

  private engine: CoreEngine = useEngine()
  private unsubscribers: Unsubscribe[] = []

  constructor() {
    super()
    this.engineInitialized = false
    this.triggerCount = 0
    this.lifecycleHooks = [
      { name: 'beforeInit', triggered: false, count: 0 },
      { name: 'init', triggered: false, count: 0 },
      { name: 'afterInit', triggered: false, count: 0 },
      { name: 'beforeMount', triggered: false, count: 0 },
      { name: 'mounted', triggered: false, count: 0 },
      { name: 'custom', triggered: false, count: 0 },
    ]
    this.hookLog = []
  }

  connectedCallback() {
    super.connectedCallback()
    this.engineInitialized = this.engine.isInitialized()

    const onHookTriggered = (hookName: string) => {
      this.lifecycleHooks = this.lifecycleHooks.map((hook) =>
        hook.name === hookName
          ? { ...hook, triggered: true, count: hook.count + 1 }
          : hook
      )
      this.triggerCount++

      const timestamp = new Date().toLocaleTimeString()
      this.hookLog = [{ timestamp, hook: hookName }, ...this.hookLog].slice(
        0,
        15
      )
      this.requestUpdate()
    }

    this.lifecycleHooks.forEach((hook) => {
      this.unsubscribers.push(
        this.engine.lifecycle.on(hook.name, () => {
          onHookTriggered(hook.name)
        })
      )
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubscribers.forEach((unsub) => unsub())
  }

  async triggerCustomHook() {
    await this.engine.lifecycle.trigger('custom', {
      message: '自定义钩子触发',
    })
    alert('自定义钩子已触发!')
  }

  resetCounts() {
    this.lifecycleHooks = this.lifecycleHooks.map((hook) => ({
      ...hook,
      count: 0,
      triggered: false,
    }))
    this.triggerCount = 0
    this.hookLog = []
    this.requestUpdate()
  }

  render() {
    return html`
      <div class="demo-card">
        <h2>🔄 生命周期演示</h2>
        <div class="demo-content">
          <div class="lifecycle-status">
            <div class="status-item">
              <strong>引擎状态:</strong>
              <span
                class="status-badge ${this.engineInitialized ? 'active' : 'inactive'}"
              >
                ${this.engineInitialized ? '已初始化' : '未初始化'}
              </span>
            </div>
            <div class="status-item">
              <strong>触发次数:</strong>
              <span class="badge">${this.triggerCount}</span>
            </div>
          </div>

          <div class="lifecycle-hooks">
            <strong>生命周期钩子:</strong>
            <div class="hooks-grid">
              ${this.lifecycleHooks.map(
                (hook) => html`
                  <div class="hook-item ${hook.triggered ? 'triggered' : ''}">
                    <span class="hook-name">${hook.name}</span>
                    <span class="hook-count">${hook.count}次</span>
                  </div>
                `
              )}
            </div>
          </div>

          <div class="actions">
            <button @click=${this.triggerCustomHook} class="btn btn-primary">
              触发自定义钩子
            </button>
            <button @click=${this.resetCounts} class="btn btn-secondary">
              重置计数
            </button>
          </div>

          ${this.hookLog.length > 0
            ? html`
                <div class="log">
                  <strong>钩子日志:</strong>
                  <div class="log-entries">
                    ${this.hookLog.map(
                      (entry) => html`
                        <div class="log-entry">
                          <span class="timestamp">${entry.timestamp}</span>
                          <span class="hook-name">${entry.hook}</span>
                        </div>
                      `
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
    'lifecycle-demo': LifecycleDemo
  }
}

