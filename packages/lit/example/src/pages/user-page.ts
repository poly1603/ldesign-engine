import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { getEngine } from '@ldesign/engine-lit'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

const mockUsers: Record<string, User> = {
  '1': {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: '管理员',
    avatar: '👨‍💼',
  },
  '2': {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    role: '开发者',
    avatar: '👨‍💻',
  },
  '3': {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    role: '设计师',
    avatar: '👨‍🎨',
  },
}

@customElement('user-page')
export class UserPage extends LitElement {
  static styles = css`
    .user {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      color: #333;
    }

    .user-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .avatar {
      font-size: 5rem;
      margin-bottom: 1rem;
    }

    .user-name {
      font-size: 1.8rem;
      font-weight: bold;
      color: #333;
      margin: 0 0 0.5rem;
    }

    .user-email {
      color: #666;
      margin: 0 0 1rem;
    }

    .user-role {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .user-info {
      text-align: left;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #f0f0f0;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #333;
    }

    .info-value {
      color: #666;
    }

    .user-selector {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: #f3f4f6;
      color: #333;
      transition: all 0.3s;
    }

    button:hover {
      background: #e5e7eb;
    }

    button.active {
      background: #667eea;
      color: white;
    }

    .not-found {
      text-align: center;
      padding: 3rem;
      color: #999;
    }
  `

  @state()
  private userId = '1'

  @state()
  private user: User | null = null

  private engine = getEngine()
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    
    if (this.engine.router) {
      const route = this.engine.router.getCurrentRoute()
      this.userId = route.value?.params?.id || '1'
      this.user = mockUsers[this.userId] || null
      
      this.unsubscribe = this.engine.events.on('router:navigated', () => {
        if (this.engine.router) {
          const route = this.engine.router.getCurrentRoute()
          this.userId = route.value?.params?.id || '1'
          this.user = mockUsers[this.userId] || null
        }
      })
    } else {
      this.user = mockUsers[this.userId]
    }

    if (this.user) {
      this.engine.state.set('currentUser', this.user)
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  private switchUser(id: string) {
    if (this.engine.router) {
      this.engine.router.push(`/user/${id}`)
    }
  }

  render() {
    if (!this.user) {
      return html`
        <div class="user">
          <div class="not-found">
            <h2>用户不存在</h2>
            <p>ID: ${this.userId}</p>
          </div>
        </div>
      `
    }

    return html`
      <div class="user">
        <div class="header">
          <h1>👤 用户详情</h1>
        </div>

        <div class="user-card">
          <div class="avatar">${this.user.avatar}</div>
          <h2 class="user-name">${this.user.name}</h2>
          <p class="user-email">${this.user.email}</p>
          <span class="user-role">${this.user.role}</span>

          <div class="user-info">
            <div class="info-item">
              <span class="info-label">用户 ID</span>
              <span class="info-value">${this.user.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">${this.user.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">邮箱</span>
              <span class="info-value">${this.user.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">角色</span>
              <span class="info-value">${this.user.role}</span>
            </div>
          </div>

          <div class="user-selector">
            <button
              class=${this.userId === '1' ? 'active' : ''}
              @click=${() => this.switchUser('1')}
            >
              用户 1
            </button>
            <button
              class=${this.userId === '2' ? 'active' : ''}
              @click=${() => this.switchUser('2')}
            >
              用户 2
            </button>
            <button
              class=${this.userId === '3' ? 'active' : ''}
              @click=${() => this.switchUser('3')}
            >
              用户 3
            </button>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-page': UserPage
  }
}

