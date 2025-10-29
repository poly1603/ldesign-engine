/**
 * Event Demo Component
 * 
 * 展示 EngineEventsService 的使用
 */

import { Component, OnInit, OnDestroy } from '@angular/core'
import { EngineEventsService } from '@ldesign/engine-angular'
import { Subscription } from 'rxjs'

interface EventLogItem {
  id: number
  event: string
  payload: any
  timestamp: string
}

@Component({
  selector: 'app-event-demo',
  template: `
    <div class="event-demo">
      <h2>事件系统示例</h2>
      <div class="event-buttons">
        <button (click)="handleEmitEvent()">发送自定义事件</button>
        <button (click)="handleButtonClick()">按钮点击事件</button>
        <button (click)="clearLogs()">清空日志</button>
      </div>
      <div class="event-log">
        <div *ngIf="logs.length === 0" class="event-log-empty">
          暂无事件日志
        </div>
        <div *ngFor="let log of logs" class="event-log-item">
          <strong>{{ log.event }}</strong> @ {{ log.timestamp }}<br>
          <code>{{ log.payload | json }}</code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-demo {
      padding: 2rem;
    }
    .event-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      background-color: #dd0031;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background-color: #c3002f;
    }
    .event-log {
      padding: 1rem;
      background: white;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 0.875rem;
      border: 1px solid #ddd;
    }
    .event-log-item {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: #f0f0f0;
      border-radius: 4px;
    }
    .event-log-empty {
      color: #999;
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class EventDemoComponent implements OnInit, OnDestroy {
  logs: EventLogItem[] = []
  private subscriptions: Subscription[] = []

  constructor(private eventsService: EngineEventsService) { }

  ngOnInit() {
    // 监听自定义事件
    this.subscriptions.push(
      this.eventsService.listen('custom:event', (payload) => {
        this.addLog('custom:event', payload)
      })
    )

    this.subscriptions.push(
      this.eventsService.listen('button:clicked', (payload) => {
        this.addLog('button:clicked', payload)
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  addLog(event: string, payload: any) {
    const logItem: EventLogItem = {
      id: Date.now(),
      event,
      payload,
      timestamp: new Date().toLocaleTimeString()
    }
    this.logs = [logItem, ...this.logs].slice(0, 10)
  }

  handleEmitEvent() {
    this.eventsService.emit('custom:event', {
      message: 'Hello from Angular!',
      timestamp: Date.now()
    })
  }

  handleButtonClick() {
    this.eventsService.emit('button:clicked', {
      button: 'demo-button',
      timestamp: Date.now()
    })
  }

  clearLogs() {
    this.logs = []
  }
}


