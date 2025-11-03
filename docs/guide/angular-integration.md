# Angular 集成指南

完整的 @ldesign/engine 与 Angular 集成指南。

## 安装

```bash
pnpm add @ldesign/engine-core @ldesign/engine-angular rxjs
```

## 基础集成

### 1. 创建引擎实例

在应用入口创建引擎实例：

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser'
import { createEngine } from '@ldesign/engine-core'
import { provideEngine } from '@ldesign/engine-angular'
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme'
import { AppComponent } from './app/app.component'

// 创建引擎
const engine = createEngine({
  name: 'my-angular-app',
  version: '1.0.0',
  logger: {
    level: 'info'
  }
})

// 注册插件
engine.use(createI18nPlugin({
  locale: 'en',
  messages: {
    en: { welcome: 'Welcome' },
    zh: { welcome: '欢迎' }
  }
}))

engine.use(createThemePlugin({
  defaultTheme: 'light'
}))

// 初始化引擎
await engine.initialize()

// 启动 Angular 应用并提供引擎
bootstrapApplication(AppComponent, {
  providers: [provideEngine(engine)]
})
```

### 2. 在组件中使用

注入 EngineService：

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>{{ appName }}</h1>
      <button (click)="switchLanguage()">切换语言</button>
    </div>
  `
})
export class AppComponent implements OnInit {
  appName = ''
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.appName = this.engine.config.get('name')
  }
  
  switchLanguage() {
    const i18nPlugin = this.engine.getPlugin('i18n')
    i18nPlugin?.api.setLocale('zh')
  }
}
```

## EngineService

Angular 适配器提供了 EngineService，它是核心引擎的封装。

### 基本使用

```typescript
import { Component } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-example',
  template: `<div>{{ message }}</div>`
})
export class ExampleComponent {
  message = ''
  
  constructor(private engine: EngineService) {
    // 访问配置
    this.message = this.engine.config.get('message', 'Hello')
    
    // 记录日志
    this.engine.logger.info('Component initialized')
    
    // 触发事件
    this.engine.events.emit('component:ready')
  }
}
```

### 获取插件

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-features',
  template: `
    <div>
      <button (click)="changeTheme()">Change Theme</button>
      <button (click)="changeLanguage()">Change Language</button>
    </div>
  `
})
export class FeaturesComponent implements OnInit {
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    // 获取插件
    const i18nPlugin = this.engine.getPlugin('i18n')
    const themePlugin = this.engine.getPlugin('theme')
  }
  
  changeTheme() {
    const themePlugin = this.engine.getPlugin('theme')
    themePlugin?.api.setTheme('dark')
  }
  
  changeLanguage() {
    const i18nPlugin = this.engine.getPlugin('i18n')
    i18nPlugin?.api.setLocale('zh')
  }
}
```

## RxJS Observables

EngineService 提供了响应式的 Observable 支持：

### locale$ - 语言流

监听语言变化：

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-language',
  template: `<div>Current locale: {{ locale }}</div>`
})
export class LanguageComponent implements OnInit {
  locale = 'en'
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.locale$.subscribe(locale => {
      this.locale = locale
    })
  }
}
```

### theme$ - 主题流

监听主题变化：

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-theme',
  template: `<div [class]="'theme-' + theme">Content</div>`
})
export class ThemeComponent implements OnInit {
  theme = 'light'
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.theme$.subscribe(theme => {
      this.theme = theme
    })
  }
}
```

### events$ - 事件流

监听所有事件：

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-event-log',
  template: `
    <div *ngFor="let event of eventLog">
      {{ event.type }}: {{ event.payload | json }}
    </div>
  `
})
export class EventLogComponent implements OnInit {
  eventLog: any[] = []
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.events$.subscribe(event => {
      this.eventLog.unshift(event)
      if (this.eventLog.length > 10) {
        this.eventLog.length = 10
      }
    })
  }
}
```

### status$ - 状态流

监听引擎状态：

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-status',
  template: `<div>Status: {{ status }}</div>`
})
export class StatusComponent implements OnInit {
  status = 'initializing'
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.status$.subscribe(status => {
      this.status = status
    })
  }
}
```

## 高级用法

### 状态管理

使用引擎状态：

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-user-profile',
  template: `
    <div>
      <p>Name: {{ user.name }}</p>
      <p>Email: {{ user.email }}</p>
      <button (click)="updateUser()">Update</button>
    </div>
  `
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user = { name: '', email: '' }
  private subscription?: Subscription
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    // 获取初始状态
    this.user = this.engine.getState('user', this.user)
    
    // 监听状态变化
    this.subscription = this.engine.getState$('user', this.user)
      .subscribe(user => {
        this.user = user
      })
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }
  
  updateUser() {
    this.engine.setState('user', {
      name: 'John',
      email: 'john@example.com'
    })
  }
}
```

### 事件监听

监听特定事件：

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-notifications',
  template: `
    <div *ngFor="let notification of notifications">
      {{ notification }}
    </div>
  `
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: string[] = []
  private subscription?: Subscription
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.subscription = this.engine.onEvent('notification:show')
      .subscribe((data: any) => {
        this.notifications.push(data.message)
      })
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }
}
```

### 与 Angular Router 集成

```typescript
// app.routes.ts
import { Routes } from '@angular/router'
import { inject } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [
      () => {
        const engine = inject(EngineService)
        const authPlugin = engine.getPlugin('auth')
        return authPlugin?.api.isAuthenticated() || false
      }
    ],
    loadComponent: () => import('./admin/admin.component')
  }
]
```

### 与 Angular Signals 集成

```typescript
import { Component, signal, effect } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <button (click)="increment()">+1</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0)
  
  constructor(private engine: EngineService) {
    // 同步到引擎状态
    effect(() => {
      this.engine.setState('counter', this.count())
    })
    
    // 从引擎状态初始化
    const savedCount = this.engine.getState('counter', 0)
    this.count.set(savedCount)
  }
  
  increment() {
    this.count.update(n => n + 1)
  }
}
```

## 完整示例

### 多语言应用

```typescript
// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { EngineService } from '@ldesign/engine-angular'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app">
      <header>
        <h1>{{ t('app.title') }}</h1>
        <button (click)="switchLanguage()">
          {{ locale === 'en' ? '中文' : 'English' }}
        </button>
      </header>
      <main>
        <p>{{ t('app.welcome') }}</p>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  locale = 'en'
  translations: any = {}
  private subscription?: Subscription
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.subscription = this.engine.locale$.subscribe(locale => {
      this.locale = locale
      this.updateTranslations()
    })
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }
  
  updateTranslations() {
    const i18nPlugin = this.engine.getPlugin('i18n')
    if (i18nPlugin?.api) {
      this.translations = i18nPlugin.api.messages[this.locale]
    }
  }
  
  switchLanguage() {
    const newLocale = this.locale === 'en' ? 'zh' : 'en'
    const i18nPlugin = this.engine.getPlugin('i18n')
    i18nPlugin?.api.setLocale(newLocale)
  }
  
  t(key: string): string {
    const keys = key.split('.')
    let value = this.translations
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }
}
```

### 主题切换

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-theme-switcher',
  template: `
    <div [class]="'theme-' + currentTheme">
      <button (click)="toggleTheme()">
        Toggle Theme ({{ currentTheme }})
      </button>
    </div>
  `,
  styles: [`
    .theme-light {
      background: white;
      color: black;
    }
    .theme-dark {
      background: #1f1f1f;
      color: white;
    }
  `]
})
export class ThemeSwitcherComponent implements OnInit, OnDestroy {
  currentTheme = 'light'
  private subscription?: Subscription
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.subscription = this.engine.theme$.subscribe(theme => {
      this.currentTheme = theme
      this.applyTheme()
    })
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }
  
  applyTheme() {
    const themePlugin = this.engine.getPlugin('theme')
    if (themePlugin?.api) {
      const theme = themePlugin.api.getCurrentTheme()
      document.documentElement.style.setProperty(
        '--primary',
        theme.colors.primary
      )
      document.documentElement.style.setProperty(
        '--background',
        theme.colors.background
      )
    }
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    const themePlugin = this.engine.getPlugin('theme')
    themePlugin?.api.setTheme(newTheme)
  }
}
```

## TypeScript 支持

### 类型定义

```typescript
// types/engine.d.ts
import type { CoreEngine } from '@ldesign/engine-core'

declare module '@angular/core' {
  interface Injector {
    get(token: typeof ENGINE_TOKEN): CoreEngine
  }
}
```

### 插件类型

```typescript
import type { Plugin } from '@ldesign/engine-core'

interface MyPluginAPI {
  doSomething(): void
  getValue(): string
}

interface MyPlugin extends Plugin {
  api: MyPluginAPI
}

// 使用时的类型断言
const myPlugin = this.engine.getPlugin('my-plugin') as MyPlugin | undefined
```

## 性能优化

### 1. OnPush 变更检测

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core'

@Component({
  selector: 'app-optimized',
  template: `<div>{{ data }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  // 组件逻辑
}
```

### 2. 取消订阅

使用 takeUntil 模式：

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'app-example',
  template: `<div>Example</div>`
})
export class ExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.locale$
      .pipe(takeUntil(this.destroy$))
      .subscribe(locale => {
        // 处理语言变化
      })
  }
  
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
```

### 3. 懒加载插件

```typescript
@Component({
  selector: 'app-feature',
  template: `<div>Feature</div>`
})
export class FeatureComponent implements OnInit {
  constructor(private engine: EngineService) {}
  
  async ngOnInit() {
    // 懒加载插件
    const { createFeaturePlugin } = await import('@my/feature-plugin')
    await this.engine.use(createFeaturePlugin())
  }
}
```

## 常见问题

### Q: 如何在服务中使用引擎？

A: 直接注入 EngineService：

```typescript
import { Injectable } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private engine: EngineService) {}
  
  async fetchData() {
    this.engine.logger.info('Fetching data...')
    // 数据获取逻辑
  }
}
```

### Q: 如何处理异步插件初始化？

A: 在 bootstrap 前完成初始化：

```typescript
const engine = createEngine({ /* ... */ })
engine.use(createAsyncPlugin())

await engine.initialize()

bootstrapApplication(AppComponent, {
  providers: [provideEngine(engine)]
})
```

### Q: 如何在 SSR 中使用？

A: 为每个请求创建新的引擎实例：

```typescript
// server.ts
export async function render() {
  const engine = createEngine({ /* ... */ })
  await engine.initialize()
  
  const html = await renderApplication(AppComponent, {
    appId: 'app',
    providers: [provideEngine(engine)]
  })
  
  return html
}
```

## 最佳实践

1. **使用依赖注入** - 始终通过 DI 获取 EngineService
2. **管理订阅** - 在 ngOnDestroy 中取消所有订阅
3. **使用 OnPush** - 优化变更检测性能
4. **类型安全** - 充分利用 TypeScript 类型系统
5. **错误处理** - 使用 ErrorHandler 捕获引擎相关错误

## 下一步

- [查看完整示例](/examples/angular)
- [学习插件开发](/guide/plugin-development)
- [了解核心概念](/guide/core-concepts)
- [API 参考](/api/angular/service)
