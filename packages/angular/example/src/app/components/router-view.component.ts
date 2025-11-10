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
  private viewContainerRef = inject(ViewContainerRef)

  routes: RouteConfig[] = [
    { path: '/', component: HomeComponent },
    { path: '/about', component: AboutComponent },
    { path: '/user/:id', component: UserComponent },
  ]

  ngOnInit() {
    if (typeof window !== 'undefined' && (window as any).__ENGINE__) {
      const engine = (window as any).__ENGINE__
      if (engine.router) {
        this.updateRoute()

        // 监听路由变化
        this.unsubscribe = engine.events.on('router:navigated', () => {
          this.updateRoute()
        })
      }
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
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

