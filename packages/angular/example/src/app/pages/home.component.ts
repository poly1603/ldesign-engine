/**
 * Angular Engine 示例 - 首页组件
 */
import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>🏠 首页</h2>
      <p>欢迎使用 Angular + LDesign Engine + Router 示例应用！</p>

      <div class="card">
        <h3>计数器演示</h3>
        <div class="counter">
          <button (click)="decrement()">-</button>
          <span class="count">{{ count }}</span>
          <button (click)="increment()">+</button>
        </div>
        <p class="hint">这个计数器使用 Engine 的状态管理</p>
      </div>

      <div class="card">
        <h3>✨ 特性</h3>
        <ul>
          <li>🅰️ Angular 18+ 支持</li>
          <li>🔧 强大的插件系统</li>
          <li>🎯 完整的 TypeScript 支持</li>
          <li>🛣️ 集成路由管理</li>
          <li>📦 状态管理</li>
          <li>🎪 事件系统</li>
        </ul>
      </div>

      <div class="card">
        <h3>🧭 导航</h3>
        <p>使用顶部导航栏访问不同页面：</p>
        <ul>
          <li><strong>首页</strong> - 当前页面</li>
          <li><strong>关于</strong> - 了解更多信息</li>
          <li><strong>用户</strong> - 查看用户详情（带参数）</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .page {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }

    .counter {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
    }

    .counter button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .counter button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(221, 0, 49, 0.3);
    }

    .counter button:active {
      transform: scale(0.95);
    }

    .count {
      font-size: 2rem;
      font-weight: bold;
      color: #dd0031;
      min-width: 60px;
      text-align: center;
    }

    .hint {
      color: #666;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    ul {
      line-height: 1.8;
    }

    li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class HomeComponent implements OnInit {
  count = 0

  ngOnInit() {
    // 从 engine 获取初始计数
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      this.count = engine.state.get('count') || 0

      // 监听状态变化
      engine.state.subscribe('count', (value: number) => {
        this.count = value
      })
    }
  }

  increment() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      engine.state.set('count', this.count + 1)
    }
  }

  decrement() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      engine.state.set('count', Math.max(0, this.count - 1))
    }
  }
}

