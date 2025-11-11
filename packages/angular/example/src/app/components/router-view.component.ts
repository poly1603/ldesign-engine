/**
 * Angular Engine 示例 - 路由视图组件
 */
import { Component, OnInit, OnDestroy, ViewContainerRef, ComponentRef, Type, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HomeComponent } from '../pages/home.component'
import { AboutComponent } from '../pages/about.component'
import { UserComponent } from '../pages/user.component'

interface RouteConfig {
  path: string
  component: Type<any>
}

@Component({
  selector: 'app-router-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="router-view">
      <div *ngIf="!currentComponent" class="page">
        <h2>404 - 页面未找到</h2>
        <p>路径: {{ currentPath }}</p>
      </div>
    </div>
  `,
  styles: [`
    .router-view {
      width: 100%;
    }

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
  `]
})
export class RouterViewComponent implements OnInit, OnDestroy {
  currentPath = '/'
  currentComponent: Type<any> | null = null
  private componentRef?: ComponentRef<any>
  private unsubscribe?: () => void
  private unsubscribeInstalled?: () => void
  private viewContainerRef = inject(ViewContainerRef)
  private _hashChangeHandler = () => this.updateRoute()

  routes: RouteConfig[] = [
    { path: '/', component: HomeComponent },
    { path: '/about', component: AboutComponent },
    { path: '/user/:id', component: UserComponent },
  ]

  ngOnInit() {
    // 等待引擎准备就绪
    this.waitForEngine()
  }

  /**
   * 等待引擎准备就绪
   */
  private waitForEngine() {
    if (typeof window === 'undefined') return

    const setupWithEngine = (engine: any) => {
      // 总是监听 router 安装事件（即使当前还没有 router）
      this.unsubscribeInstalled = engine.events?.on?.('router:installed', () => this.updateRoute())

      // 监听浏览器 hash 变化（手动修改地址或前进/后退）
      window.addEventListener('hashchange', this._hashChangeHandler)

      if (engine.router) {
        // 已有路由器：监听导航并立即刷新一次
        this.unsubscribe = engine.events?.on?.('router:navigated', () => this.updateRoute())
        this.updateRoute()
      } else {
        // 尚未安装路由器：短暂延迟后再尝试刷新
        setTimeout(() => this.updateRoute(), 0)
      }
    }

    const engine = (window as any).__ENGINE__
    if (engine) {
      setupWithEngine(engine)
    } else {
      // 如果引擎还没准备好，等待 engine-ready 事件
      const handleEngineReady = () => {
        const eng = (window as any).__ENGINE__
        if (eng) {
          setupWithEngine(eng)
          window.removeEventListener('ldesign:engine-ready', handleEngineReady)
        }
      }
      window.addEventListener('ldesign:engine-ready', handleEngineReady)
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
    if (this.unsubscribeInstalled) {
      this.unsubscribeInstalled()
    }
    window.removeEventListener('hashchange', this._hashChangeHandler)
    if (this.componentRef) {
      this.componentRef.destroy()
    }
  }

  updateRoute() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        this.currentPath = route.value?.path || '/'

        // 查找匹配的路由
        const matchedRoute = this.routes.find(r => {
          if (r.path === this.currentPath) return true
          // 简单的参数匹配（例如 /user/:id）
          const pathPattern = r.path.replace(/:\w+/g, '[^/]+')
          const regex = new RegExp(`^${pathPattern}$`)
          return regex.test(this.currentPath)
        })

        if (matchedRoute) {
          this.currentComponent = matchedRoute.component
          this.renderComponent(matchedRoute.component)
        } else {
          this.currentComponent = null
          if (this.componentRef) {
            this.componentRef.destroy()
            this.componentRef = undefined
          }
        }
      }
    }
  }

  renderComponent(component: Type<any>) {
    // 清除之前的组件
    this.viewContainerRef.clear()
    if (this.componentRef) {
      this.componentRef.destroy()
    }

    // 创建新组件
    this.componentRef = this.viewContainerRef.createComponent(component)
  }
}

