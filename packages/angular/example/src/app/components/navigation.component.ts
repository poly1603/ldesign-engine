/**
 * Angular Engine 示例 - 导航组件
 */
import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'

interface NavItem {
  path: string
  label: string
  icon: string
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navigation">
      <div class="nav-brand">
        <span class="logo">🚀</span>
        <span class="brand-name">LDesign Engine</span>
      </div>
      <div class="nav-links">
        <a 
          *ngFor="let item of navItems"
          [href]="item.path"
          (click)="navigate($event, item.path)"
          [class.active]="isActive(item.path)"
          class="nav-link"
        >
          {{ item.icon }} {{ item.label }}
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #dd0031 0%, #c3002f 100%);
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: white;
      font-size: 1.2rem;
    }

    .logo {
      font-size: 1.5rem;
    }

    .nav-links {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.3);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class NavigationComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/about', label: '关于', icon: 'ℹ️' },
    { path: '/user/1', label: '用户', icon: '👤' },
  ]

  currentPath = '/'
  private unsubscribe?: () => void

  ngOnInit() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        this.updateCurrentPath()
        
        // 监听路由变化
        this.unsubscribe = engine.events.on('router:navigated', () => {
          this.updateCurrentPath()
        })
      }
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  updateCurrentPath() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        this.currentPath = route.value?.path || '/'
      }
    }
  }

  isActive(path: string): boolean {
    if (path === '/') {
      return this.currentPath === '/'
    }
    return this.currentPath.startsWith(path)
  }

  navigate(event: Event, path: string) {
    event.preventDefault()
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        engine.router.push(path)
      }
    }
  }
}

