# @ldesign/engine-angular

Angular adapter for LDesign Engine - 为 Angular 提供的 LDesign 引擎适配器。

## 📦 安装

```bash
npm install @ldesign/engine-angular
# or
pnpm add @ldesign/engine-angular
# or
yarn add @ldesign/engine-angular
```

## 🚀 快速开始

### 基本使用

```typescript
import { Component, OnInit } from '@angular/core'
import { CoreEngine } from '@ldesign/engine-core'
import { createAngularAdapter } from '@ldesign/engine-angular'

@Component({
  selector: 'app-root',
  template: '<h1>Angular + LDesign Engine</h1>',
})
export class AppComponent implements OnInit {
  private engine!: CoreEngine

  ngOnInit() {
    const adapter = createAngularAdapter()
    this.engine = new CoreEngine({
      name: 'Angular App',
      adapter,
    })
    
    this.engine.init()
  }
}
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

## 🎯 核心功能

### 1. 适配器

```typescript
import { createAngularAdapter } from '@ldesign/engine-angular'

const adapter = createAngularAdapter()
```

### 2. 引擎服务

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

### 3. RxJS 集成

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Component({
  selector: 'app-state',
  template: `
    <div>
      <p>Engine: {{ (engineName$ | async) || 'Not initialized' }}</p>
    </div>
  `,
})
export class StateComponent implements OnInit {
  engineName$!: Observable<string>

  constructor(private engineService: EngineService) {}

  ngOnInit() {
    this.engineName$ = this.engineService.getEngine$().pipe(
      map(engine => engine?.config.name || 'Not initialized')
    )
  }
}
```

## 🌟 特性

- ✅ **RxJS 集成** - 基于 RxJS 的响应式系统
- ✅ **依赖注入** - 完整的 Angular DI 支持
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **插件系统** - 强大的插件架构
- ✅ **中间件** - 洋葱模型中间件系统
- ✅ **事件系统** - 基于 RxJS Subject 的事件系统
- ✅ **生命周期** - 与 Angular 生命周期集成
- ✅ **状态管理** - 基于 BehaviorSubject 的状态管理

## 📚 API 文档

### AngularAdapter

Angular 框架适配器类。

```typescript
import { AngularAdapter } from '@ldesign/engine-angular'

const adapter = new AngularAdapter()
```

### EngineService

引擎服务,提供依赖注入支持。

```typescript
import { EngineService } from '@ldesign/engine-angular'

@Injectable()
export class MyService {
  constructor(private engineService: EngineService) {}
}
```

### ENGINE_TOKEN

引擎实例注入令牌。

```typescript
import { ENGINE_TOKEN } from '@ldesign/engine-angular'
import { Inject } from '@angular/core'

constructor(@Inject(ENGINE_TOKEN) private engine: CoreEngine) {}
```

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

