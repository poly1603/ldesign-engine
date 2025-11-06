import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { useEngine } from '@ldesign/engine-angular'
import './demo-card.css'

@Component({
  selector: 'app-middleware-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-card">
      <h2>⚙️ 中间件系统演示</h2>
      <div class="demo-content">
        <div class="info-grid">
          <div class="info-item">
            <strong>已注册中间件:</strong>
            <ul *ngIf="middlewares.length > 0; else noMiddlewares">
              <li *ngFor="let mw of middlewares">{{ mw.name }} (优先级: {{ mw.priority || 0 }})</li>
            </ul>
            <ng-template #noMiddlewares>
              <p class="empty">暂无中间件</p>
            </ng-template>
          </div>
          <div class="info-item">
            <strong>中间件数量:</strong>
            <span class="badge">{{ middlewareCount }}</span>
          </div>
        </div>

        <div class="actions">
          <button (click)="executeMiddleware()" class="btn btn-primary">执行中间件链</button>
          <button (click)="addMiddleware()" class="btn btn-secondary">添加中间件</button>
        </div>

        <div class="log" *ngIf="executionLog.length > 0">
          <strong>执行日志:</strong>
          <div class="log-entries">
            <div class="log-entry" *ngFor="let entry of executionLog">{{ entry }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MiddlewareDemoComponent implements OnInit {
  middlewares: any[] = []
  middlewareCount = 0
  executionLog: string[] = []
  engine = useEngine()

  ngOnInit() {
    this.updateMiddlewareInfo()
  }

  updateMiddlewareInfo() {
    this.middlewareCount = this.engine.middleware.size()
    this.middlewares = Array.from(this.engine.middleware.getAll().values())
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
    } catch (error: any) {
      this.executionLog = [`❌ 执行失败: ${error.message}`]
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
}

