import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { useEngine } from '@ldesign/engine-angular'
import type { Unsubscribe } from '@ldesign/engine-core'
import './demo-card.css'

@Component({
  selector: 'app-state-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-card">
      <h2>📦 状态管理演示</h2>
      <div class="demo-content">
        <div class="state-display">
          <div class="state-item">
            <strong>计数器:</strong>
            <div class="counter">
              <button (click)="decrement()" class="btn btn-small">-</button>
              <span class="count">{{ count }}</span>
              <button (click)="increment()" class="btn btn-small">+</button>
            </div>
          </div>

          <div class="state-item">
            <strong>用户信息:</strong>
            <div class="user-info">
              <p><strong>姓名:</strong> {{ user.name }}</p>
              <p><strong>角色:</strong> {{ user.role }}</p>
            </div>
          </div>

          <div class="state-item">
            <strong>主题:</strong>
            <div class="theme-switcher">
              <button
                (click)="setTheme('light')"
                [class.active]="theme === 'light'"
                class="btn btn-small"
              >
                ☀️ 浅色
              </button>
              <button
                (click)="setTheme('dark')"
                [class.active]="theme === 'dark'"
                class="btn btn-small"
              >
                🌙 深色
              </button>
            </div>
          </div>
        </div>

        <div class="actions">
          <button (click)="batchUpdate()" class="btn btn-primary">批量更新状态</button>
          <button (click)="resetAll()" class="btn btn-secondary">重置所有状态</button>
        </div>

        <div class="state-list">
          <strong>所有状态:</strong>
          <div class="state-entries">
            <div class="state-entry" *ngFor="let key of stateKeys">
              <code>{{ key }}</code>: {{ getStateValue(key) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StateDemoComponent implements OnInit, OnDestroy {
  count = 0
  user = { name: '', role: '' }
  theme = 'light'
  stateKeys: string[] = []
  private unsubscribers: Unsubscribe[] = []
  engine = useEngine()

  ngOnInit() {
    this.count = this.engine.state.get('count') || 0
    this.user = this.engine.state.get('user') || { name: '', role: '' }
    this.theme = this.engine.state.get('theme') || 'light'
    this.updateStateKeys()

    this.unsubscribers.push(
      this.engine.state.watch('count', (value: number) => {
        this.count = value
      })
    )

    this.unsubscribers.push(
      this.engine.state.watch('user', (value: any) => {
        this.user = value
      })
    )

    this.unsubscribers.push(
      this.engine.state.watch('theme', (value: string) => {
        this.theme = value
      })
    )
  }

  ngOnDestroy() {
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
      this.engine.state.set('user', { name: '批量更新用户', role: 'superadmin' })
      this.engine.state.set('theme', 'dark')
    })
    this.updateStateKeys()
    alert('批量更新完成!')
  }

  resetAll() {
    this.engine.state.set('count', 0)
    this.engine.state.set('user', { name: 'Angular 用户', role: 'admin' })
    this.engine.state.set('theme', 'light')
    this.updateStateKeys()
    alert('状态已重置!')
  }

  updateStateKeys() {
    this.stateKeys = this.engine.state.keys()
  }

  getStateValue(key: string): string {
    const value = this.engine.state.get(key)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
}

