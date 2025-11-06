import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { useEngine } from '@ldesign/engine-angular'
import type { Unsubscribe } from '@ldesign/engine-core'
import './demo-card.css'

interface EventLogEntry {
  timestamp: string
  event: string
  data: string
}

@Component({
  selector: 'app-event-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-card">
      <h2>📡 事件系统演示</h2>
      <div class="demo-content">
        <div class="event-controls">
          <div class="input-group">
            <label>事件名称:</label>
            <input
              [(ngModel)]="eventName"
              type="text"
              placeholder="输入事件名称"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>事件数据:</label>
            <input
              [(ngModel)]="eventData"
              type="text"
              placeholder="输入事件数据"
              class="input"
            />
          </div>
        </div>

        <div class="actions">
          <button (click)="emitEvent()" class="btn btn-primary">触发事件</button>
          <button (click)="emitAsyncEvent()" class="btn btn-secondary">触发异步事件</button>
          <button (click)="clearLog()" class="btn btn-secondary">清空日志</button>
        </div>

        <div class="log" *ngIf="eventLog.length > 0">
          <strong>事件日志:</strong>
          <div class="log-entries">
            <div class="log-entry" *ngFor="let entry of eventLog">
              <span class="timestamp">{{ entry.timestamp }}</span>
              <span class="event-name">{{ entry.event }}</span>
              <span class="event-data">{{ entry.data }}</span>
            </div>
          </div>
        </div>

        <div class="info">
          <p>💡 提示: 所有事件都会被 logger 插件记录到控制台</p>
        </div>
      </div>
    </div>
  `,
})
export class EventDemoComponent implements OnInit, OnDestroy {
  eventName = 'custom:event'
  eventData = 'Hello from Angular!'
  eventLog: EventLogEntry[] = []
  private unsubscribers: Unsubscribe[] = []
  engine = useEngine()

  ngOnInit() {
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
    }

    this.unsubscribers.push(
      this.engine.events.on('custom:event', (data: any) => addLog('custom:event', data))
    )

    this.unsubscribers.push(
      this.engine.events.on('app:welcome', (data: any) => addLog('app:welcome', data))
    )

    this.unsubscribers.push(
      this.engine.events.on('user:login', (data: any) => addLog('user:login', data))
    )

    this.unsubscribers.push(
      this.engine.events.on('user:logout', (data: any) => addLog('user:logout', data))
    )
  }

  ngOnDestroy() {
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
  }
}

