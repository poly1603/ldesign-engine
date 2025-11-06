import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { getEngine } from '@ldesign/engine-lit'

@customElement('app-navigation')
export class AppNavigation extends LitElement {
  static styles = css`
    .navigation {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #667eea;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 1rem 1.5rem;
      text-decoration: none;
      color: #666;
      font-weight: 500;
      transition: all 0.3s;
      border-radius: 6px;
      cursor: pointer;
    }

    .nav-link:hover {
      background: #f3f4f6;
      color: #333;
    }

    .nav-link.active {
      background: #667eea;
      color: white;
    }
  `

  @state()
  private currentPath = '/'

  private engine = getEngine()
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    
    if (this.engine.router) {
      const route = this.engine.router.getCurrentRoute()
      this.currentPath = route.value?.path || '/'
      
      this.unsubscribe = this.engine.events.on('router:navigated', () => {
        if (this.engine.router) {
          const route = this.engine.router.getCurrentRoute()
          this.currentPath = route.value?.path || '/'
        }
      })
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  private navigate(path: string, event: Event) {
    event.preventDefault()
    if (this.engine.router) {
      this.engine.router.push(path)
    }
  }

  private isActive(path: string): boolean {
    return this.currentPath === path || this.currentPath.startsWith(path + '/')
  }

  render() {
    return html`
      <nav class="navigation">
        <div class="nav-container">
          <div class="nav-brand">
            <h1>🚀 Lit + LDesign Engine</h1>
          </div>
          <div class="nav-links">
            <a
              href="/"
              class="nav-link ${this.isActive('/') && !this.isActive('/user') && !this.isActive('/about') ? 'active' : ''}"
              @click=${(e: Event) => this.navigate('/', e)}
            >
              🏠 首页
            </a>
            <a
              href="/about"
              class="nav-link ${this.isActive('/about') ? 'active' : ''}"
              @click=${(e: Event) => this.navigate('/about', e)}
            >
              ℹ️ 关于
            </a>
            <a
              href="/user/1"
              class="nav-link ${this.isActive('/user') ? 'active' : ''}"
              @click=${(e: Event) => this.navigate('/user/1', e)}
            >
              👤 用户
            </a>
          </div>
        </div>
      </nav>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-navigation': AppNavigation
  }
}

