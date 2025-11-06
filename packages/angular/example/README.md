# Angular + LDesign Engine 示例

这是一个使用 `@ldesign/engine-angular` 和 Angular 18 构建的完整示例项目,展示了如何在 Angular 应用中使用 LDesign Engine 的所有核心功能。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 📦 功能展示

本示例展示了以下功能:

### 1. 插件系统 (PluginDemoComponent)

- ✅ 动态安装插件
- ✅ 动态卸载插件
- ✅ 插件依赖管理
- ✅ 插件生命周期
- ✅ 查看已安装插件列表

**示例代码:**

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    console.log('Plugin installed!')
    // 插件逻辑
  },
}

await engine.use(myPlugin)
```

### 2. 中间件系统 (MiddlewareDemoComponent)

- ✅ 洋葱模型中间件
- ✅ 优先级控制
- ✅ 中间件链执行
- ✅ 动态添加中间件
- ✅ 执行日志记录

**示例代码:**

```typescript
const myMiddleware = {
  name: 'my-middleware',
  priority: 100,
  async execute(context, next) {
    console.log('Before')
    await next()
    console.log('After')
  },
}

engine.middleware.use(myMiddleware)
await engine.middleware.execute({ data: {} })
```

### 3. 状态管理 (StateDemoComponent)

- ✅ 响应式状态
- ✅ 状态监听
- ✅ 批量更新
- ✅ 状态重置
- ✅ 计算属性
- ✅ 与 Angular 变更检测集成

**示例代码:**

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">+</button>
    </div>
  `,
})
export class CounterComponent implements OnInit {
  count = 0

  constructor(private engineService: EngineService) {}

  ngOnInit() {
    const engine = this.engineService.getEngine()
    if (engine) {
      this.count = engine.state.get('count') || 0
      
      engine.state.watch('count', (value: number) => {
        this.count = value
      })
    }
  }

  increment() {
    const engine = this.engineService.getEngine()
    if (engine) {
      engine.state.set('count', this.count + 1)
    }
  }
}
```

### 4. 事件系统 (EventDemoComponent)

- ✅ 事件发布订阅
- ✅ 同步事件
- ✅ 异步事件
- ✅ 事件日志
- ✅ 自定义事件
- ✅ 事件监听器管理

**示例代码:**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-events',
  template: `
    <button (click)="login()">Login</button>
  `,
})
export class EventsComponent implements OnInit, OnDestroy {
  private unsubscribe: any

  constructor(private engineService: EngineService) {}

  ngOnInit() {
    const engine = this.engineService.getEngine()
    if (engine) {
      this.unsubscribe = engine.events.on('user:login', (user) => {
        console.log('User logged in:', user)
      })
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  login() {
    const engine = this.engineService.getEngine()
    if (engine) {
      engine.events.emit('user:login', { id: 1 })
    }
  }
}
```

### 5. 生命周期管理 (LifecycleDemoComponent)

- ✅ 生命周期钩子
- ✅ 钩子监听
- ✅ 自定义钩子
- ✅ 钩子触发统计
- ✅ 钩子日志

**示例代码:**

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-lifecycle',
  template: `<div>Component</div>`,
})
export class LifecycleComponent implements OnInit {
  constructor(private engineService: EngineService) {}

  ngOnInit() {
    const engine = this.engineService.getEngine()
    if (engine) {
      engine.lifecycle.on('mounted', () => {
        console.log('Component mounted!')
      })
    }
  }
}
```

## 🎯 核心 API

### 创建引擎应用

```typescript
import { CoreEngine } from '@ldesign/engine-core'
import { createAngularAdapter } from '@ldesign/engine-angular'

const adapter = createAngularAdapter()
const engine = new CoreEngine({
  name: 'My App',
  debug: true,
  adapter,
})

await engine.init()
```

### 使用依赖注入

```typescript
import { Injectable } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Injectable()
export class MyService {
  constructor(private engineService: EngineService) {}

  doSomething() {
    const engine = this.engineService.getEngine()
    if (engine) {
      engine.state.set('key', 'value')
    }
  }
}
```

## 📁 项目结构

```
example/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── plugin-demo.component.ts       # 插件系统演示
│   │   │   ├── middleware-demo.component.ts   # 中间件系统演示
│   │   │   ├── state-demo.component.ts        # 状态管理演示
│   │   │   ├── event-demo.component.ts        # 事件系统演示
│   │   │   ├── lifecycle-demo.component.ts    # 生命周期演示
│   │   │   └── demo-card.css                  # 共享样式
│   │   └── app.component.ts                   # 主应用组件
│   ├── main.ts                                # 入口文件
│   └── styles.css                             # 全局样式
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 技术栈

- **Angular 18** - 现代化的 Web 应用框架
- **RxJS** - 响应式编程库
- **@ldesign/engine-core** - 核心引擎
- **@ldesign/engine-angular** - Angular 适配器
- **@ldesign/launcher** - 开发工具(基于 Vite)
- **TypeScript** - 类型安全

## 📚 相关文档

- [Angular 官方文档](https://angular.dev/)
- [LDesign Engine 核心文档](../../core/README.md)
- [Angular 适配器文档](../README.md)

## 💡 提示

1. 所有演示组件都是完整的功能实现,可以直接在生产环境中使用
2. 使用 Angular 的依赖注入系统管理引擎实例
3. 所有事件都会被 logger 插件记录到控制台
4. 打开浏览器控制台可以看到详细的日志输出
5. 示例展示了 Angular 与引擎的最佳集成方式

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT

