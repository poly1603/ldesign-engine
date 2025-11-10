/**
 * Angular Engine 示例 - 关于页面组件
 */
import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>ℹ️ 关于</h2>
      <p>了解 Angular + LDesign Engine + Router 的架构和特性</p>

      <div class="card">
        <h3>🏗️ 架构</h3>
        <p>本应用采用以下技术栈构建：</p>
        <ul>
          <li><strong>Angular 18+</strong> - 现代化的前端框架</li>
          <li><strong>&#64;ldesign/engine-angular</strong> - 引擎核心</li>
          <li><strong>&#64;ldesign/router</strong> - 统一路由系统</li>
          <li><strong>TypeScript</strong> - 类型安全</li>
        </ul>
      </div>

      <div class="card">
        <h3>🎪 事件系统演示</h3>
        <button class="btn-primary" (click)="triggerEvent()">触发自定义事件</button>
        <p class="hint">打开控制台查看事件日志</p>
      </div>

      <div class="card">
        <h3>📊 引擎信息</h3>
        <table class="info-table">
          <tr>
            <td><strong>引擎名称:</strong></td>
            <td>{{ engineInfo.name }}</td>
          </tr>
          <tr>
            <td><strong>调试模式:</strong></td>
            <td>{{ engineInfo.debug ? '开启' : '关闭' }}</td>
          </tr>
          <tr>
            <td><strong>插件数量:</strong></td>
            <td>{{ engineInfo.pluginCount }}</td>
          </tr>
          <tr>
            <td><strong>中间件数量:</strong></td>
            <td>{{ engineInfo.middlewareCount }}</td>
          </tr>
          <tr>
            <td><strong>路由器:</strong></td>
            <td>{{ engineInfo.hasRouter ? '已启用' : '未启用' }}</td>
          </tr>
        </table>
      </div>

      <div class="card">
        <h3>🔗 相关链接</h3>
        <ul>
          <li><a href="https://angular.io" target="_blank">Angular 官网</a></li>
          <li><a href="https://github.com/ldesign/ldesign" target="_blank">LDesign GitHub</a></li>
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

    .btn-primary {
      background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(221, 0, 49, 0.3);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .hint {
      color: #666;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
    }

    .info-table tr {
      border-bottom: 1px solid #eee;
    }

    .info-table td {
      padding: 0.75rem 0;
    }

    .info-table td:first-child {
      width: 40%;
      color: #666;
    }

    ul {
      line-height: 1.8;
    }

    li {
      margin-bottom: 0.5rem;
    }

    a {
      color: #dd0031;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  `]
})
export class AboutComponent implements OnInit {
  engineInfo = {
    name: 'Angular Engine Demo',
    debug: false,
    pluginCount: 0,
    middlewareCount: 0,
    hasRouter: false,
  }

  ngOnInit() {
    // 从 engine 获取信息
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      this.engineInfo = {
        name: engine.name || 'Angular Engine Demo',
        debug: engine.debug || false,
        pluginCount: engine.plugins?.size || 0,
        middlewareCount: engine.middleware?.middlewares?.length || 0,
        hasRouter: !!engine.router,
      }
    }
  }

  triggerEvent() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      engine.events.emit('custom:event', {
        message: '这是一个自定义事件',
        timestamp: new Date().toISOString(),
      })
    }
  }
}

