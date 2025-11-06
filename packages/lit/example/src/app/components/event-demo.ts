import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { useEngine } from '@ldesign/engine-lit'
import type { CoreEngine, Unsubscribe } from '@ldesign/engine-core'
import demoCardStyles from './demo-card.css?inline'

interface EventLogEntry {
  timestamp: string
  event: string
  data: string
}

@customElement('event-demo')
export class EventDemo extends LitElement {
  static styles = [unsafeCSS(demoCardStyles)]

  @state()
  private eventName!: string

  @state()
  private eventData!: string

  @state()
  private eventLog!: EventLogEntry[]

  private engine: CoreEngine = useEngine()
  private unsubscribers: Unsubscribe[] = []

  constructor() {
    super()
    this.eventName = 'custom:event'
    this.eventData = 'Hello from Lit!'
    this.eventLog = []
  }

  connectedCallback() {
    super.connectedCallback()

    const addLog = (event: string, data: any) => {
      const timestamp = new Date().toLocaleTimeString()
      this.eventLog = [
        {
          timestamp,
          event,
          data: typeof data === 'object' ? JSON.stringify(data) : String(data),
        },
        ...this.eventLog,
      ].slice(0, 20)
      this.requestUpdate()
    }

    this.unsubscribers.push(
      this.engine.events.on('custom:event', (data: any) =>
        addLog('custom:event', data)
      )
    )

    this.unsubscribers.push(
      this.engine.events.on('app:welcome', (data: any) =>
        addLog('app:welcome', data)
      )
    )

    this.unsubscribers.push(
      this.engine.events.on('user:login', (data: any) =>
        addLog('user:login', data)
      )
    )

    this.unsubscribers.push(
      this.engine.events.on('user:logout', (data: any) =>
        addLog('user:logout', data)
      )
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubscribers.forEach((unsub) => unsub())
  }

  emitEvent() {
    if (this.eventName) {
      this.engine.events.emit(this.eventName, this.eventData)
    }
  }

  async emitAsyncEvent() {
    if (this.eventName) {
      await this.engine.events.emitAsync(this.eventName, this.eventData)
      alert('异步事件触发完成!')
    }
  }

  clearLog() {
    this.eventLog = []
    this.requestUpdate()
  }

  private handleEventNameInput(e: Event) {
    const target = e.target as HTMLInputElement
    this.eventName = target.value
  }

  private handleEventDataInput(e: Event) {
    const target = e.target as HTMLInputElement
    this.eventData = target.value
  }

  render() {
    return html`
      <div class="demo-card">
        <h2>📡 事件系统演示</h2>
        <div class="demo-content">
          <div class="event-controls">
            <div class="input-group">
              <label>事件名称:</label>
              <input
                type="text"
                placeholder="输入事件名称"
                class="input"
                .value=${this.eventName}
                @input=${this.handleEventNameInput}
              />
            </div>
            <div class="input-group">
              <label>事件数据:</label>
              <input
                type="text"
                placeholder="输入事件数据"
                class="input"
                .value=${this.eventData}
                @input=${this.handleEventDataInput}
              />
            </div>
          </div>

          <div class="actions">
            <button @click=${this.emitEvent} class="btn btn-primary">
              触发事件
            </button>
            <button @click=${this.emitAsyncEvent} class="btn btn-secondary">
              触发异步事件
            </button>
            <button @click=${this.clearLog} class="btn btn-secondary">
              清空日志
            </button>
          </div>

          ${this.eventLog.length > 0
            ? html`
                <div class="log">
                  <strong>事件日志:</strong>
                  <div class="log-entries">
                    ${this.eventLog.map(
                      (entry) => html`
                        <div class="log-entry">
                          <span class="timestamp">${entry.timestamp}</span>
                          <span class="event-name">${entry.event}</span>
                          <span class="event-data">${entry.data}</span>
                        </div>
                      `
                    )}
                  </div>
                </div>
              `
            : ''}

          <div class="info">
            <p>💡 提示: 所有事件都会被 logger 插件记录到控制台</p>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'event-demo': EventDemo
  }
}

