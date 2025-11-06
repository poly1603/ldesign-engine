/**
 * Angular Engine 示例 - 用户详情页面组件
 */
import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'

interface User {
  id: number
  name: string
  email: string
  role: string
  avatar: string
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>👤 用户详情</h2>
      <p>展示路由参数的使用</p>

      <div class="card">
        <h3>当前用户 ID: {{ userId }}</h3>
        <div class="user-profile" *ngIf="currentUser">
          <div class="user-avatar">{{ currentUser.avatar }}</div>
          <div class="user-info">
            <h4>{{ currentUser.name }}</h4>
            <p>{{ currentUser.email }}</p>
            <span class="user-role">{{ currentUser.role }}</span>
          </div>
        </div>
        <p class="hint" *ngIf="!currentUser">用户未找到</p>
      </div>

      <div class="card">
        <h3>切换用户</h3>
        <div class="user-switcher">
          <button 
            *ngFor="let user of users" 
            (click)="switchUser(user.id)"
            [class.active]="userId === user.id.toString()"
          >
            {{ user.avatar }} {{ user.name }}
          </button>
        </div>
      </div>

      <div class="card">
        <h3>📋 用户信息</h3>
        <table class="info-table" *ngIf="currentUser">
          <tr>
            <td><strong>ID:</strong></td>
            <td>{{ currentUser.id }}</td>
          </tr>
          <tr>
            <td><strong>姓名:</strong></td>
            <td>{{ currentUser.name }}</td>
          </tr>
          <tr>
            <td><strong>邮箱:</strong></td>
            <td>{{ currentUser.email }}</td>
          </tr>
          <tr>
            <td><strong>角色:</strong></td>
            <td>{{ currentUser.role }}</td>
          </tr>
        </table>
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

    .user-profile {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem;
      background: linear-gradient(135deg, #dd003115 0%, #c3002f15 100%);
      border-radius: 8px;
    }

    .user-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .user-info h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .user-info p {
      margin: 0 0 0.5rem 0;
      color: #666;
    }

    .user-role {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #dd0031;
      color: white;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    .user-switcher {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .user-switcher button {
      padding: 0.75rem 1.25rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .user-switcher button:hover {
      border-color: #dd0031;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(221, 0, 49, 0.2);
    }

    .user-switcher button.active {
      background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
      color: white;
      border-color: #dd0031;
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
      width: 30%;
      color: #666;
    }
  `]
})
export class UserComponent implements OnInit {
  userId = '1'
  currentUser: User | null = null

  users: User[] = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', avatar: '👨‍💼' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '开发者', avatar: '👨‍💻' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '设计师', avatar: '👨‍🎨' },
  ]

  ngOnInit() {
    // 从路由获取用户 ID
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        this.userId = route.value?.params?.id || '1'
        this.updateCurrentUser()

        // 监听路由变化
        engine.events.on('router:navigated', () => {
          const newRoute = engine.router.getCurrentRoute()
          this.userId = newRoute.value?.params?.id || '1'
          this.updateCurrentUser()
        })
      }
    }
  }

  updateCurrentUser() {
    const id = parseInt(this.userId, 10)
    this.currentUser = this.users.find(u => u.id === id) || null
  }

  switchUser(id: number) {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        engine.router.push(`/user/${id}`)
      }
    }
  }
}

