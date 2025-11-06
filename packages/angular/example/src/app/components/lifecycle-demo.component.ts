import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { useEngine } from '@ldesign/engine-angular'
import type { Unsubscribe } from '@ldesign/engine-core'
import './demo-card.css'

interface LifecycleHook {
  name: string
  triggered: boolean
  count: number
}

interface HookLogEntry {
  timestamp: string
  hook: string
}

@Component({
  selector: 'app-lifecycle-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-card">
      <h2>🔄 生命周期演示</h2>
      <div class="demo-content">
        <div class="lifecycle-status">
          <div class="status-item">
            <strong>引擎状态:</strong>
            <span [class]="'status-badge ' + (engineInitialized ? 'active' : 'inactive')">
              {{ engineInitialized ? '已初始化' : '未初始化' }}
            </span>
          </div>
          <div class="status-item">
            <strong>触发次数:</strong>
            <span class="badge">{{ triggerCount }}</span>
          </div>
        </div>

        <div class="lifecycle-hooks">
          <strong>生命周期钩子:</strong>
          <div class="hooks-grid">
            <div
              *ngFor="let hook of lifecycleHooks"
              [class]="'hook-item ' + (hook.triggered ? 'triggered' : '')"
            >
              <span class="hook-name">{{ hook.name }}</span>
              <span class="hook-count">{{ hook.count }}次</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button (click)="triggerCustomHook()" class="btn btn-primary">触发自定义钩子</button>
          <button (click)="resetCounts()" class="btn btn-secondary">重置计数</button>
        </div>

        <div class="log" *ngIf="hookLog.length > 0">
          <strong>钩子日志:</strong>
          <div class="log-entries">
            <div class="log-entry" *ngFor="let entry of hookLog">
              <span class="timestamp">{{ entry.timestamp }}</span>
              <span class="hook-name">{{ entry.hook }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LifecycleDemoComponent implements OnInit, OnDestroy {
  engineInitialized = false
  triggerCount = 0
  lifecycleHooks: LifecycleHook[] = [
    { name: 'beforeInit', triggered: false, count: 0 },
    { name: 'init', triggered: false, count: 0 },
    { name: 'afterInit', triggered: false, count: 0 },
    { name: 'beforeMount', triggered: false, count: 0 },
    { name: 'mounted', triggered: false, count: 0 },
    { name: 'custom', triggered: false, count: 0 },
  ]
  hookLog: HookLogEntry[] = []
  private unsubscribers: Unsubscribe[] = []
  engine = useEngine()

  ngOnInit() {
    this.engineInitialized = this.engine.isInitialized()

    const onHookTriggered = (hookName: string) => {
      this.lifecycleHooks = this.lifecycleHooks.map((hook) =>
        hook.name === hookName
          ? { ...hook, triggered: true, count: hook.count + 1 }
          : hook
      )
      this.triggerCount++

      const timestamp = new Date().toLocaleTimeString()
      this.hookLog = [{ timestamp, hook: hookName }, ...this.hookLog].slice(0, 15)
    }

    this.lifecycleHooks.forEach((hook) => {
      this.unsubscribers.push(
        this.engine.lifecycle.on(hook.name, () => {
          onHookTriggered(hook.name)
        })
      )
    })
  }

  ngOnDestroy() {
    this.unsubscribers.forEach((unsub) => unsub())
  }

  async triggerCustomHook() {
    await this.engine.lifecycle.trigger('custom', { message: '自定义钩子触发' })
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
  }
}

