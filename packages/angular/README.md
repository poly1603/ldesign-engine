# @ldesign/engine-angular

Angular adapter for @ldesign/engine-core - Build powerful Angular applications with plugin system, middleware, and lifecycle management.

## Features

- 🔌 **Plugin System** - Powerful plugin architecture with dependency management
- 🔄 **Middleware System** - Flexible middleware pipeline
- ⏱️ **Lifecycle Management** - Complete lifecycle hooks
- 📡 **Event System** - Robust event system with RxJS integration
- 💾 **State Management** - Reactive state management with RxJS Observables
- 💉 **Dependency Injection** - Full Angular DI support
- 🎯 **Type Safe** - Complete TypeScript support

## Installation

```bash
pnpm add @ldesign/engine-angular @ldesign/engine-core
```

## Basic Usage

### 1. Import Module

```typescript
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { EngineModule } from '@ldesign/engine-angular'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    EngineModule.forRoot({
      config: {
        name: 'My Angular App',
        version: '1.0.0',
        debug: true
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### 2. Use Services in Components

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService, EngineStateService, EngineEventsService } from '@ldesign/engine-angular'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <h2>Count: {{ count$ | async }}</h2>
      <button (click)="increment()">+1</button>
      <button (click)="decrement()">-1</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class CounterComponent implements OnInit {
  count$!: Observable<number | undefined>
  private setCount!: (value: number | ((prev: number | undefined) => number)) => void

  constructor(
    private stateService: EngineStateService,
    private eventsService: EngineEventsService
  ) {}

  ngOnInit() {
    // 创建响应式状态
    const [count$, setCount] = this.stateService.createState<number>('count', 0)
    this.count$ = count$
    this.setCount = setCount

    // 监听事件
    this.eventsService.listen('count:changed', (payload) => {
      console.log('Count changed:', payload)
    })
  }

  increment() {
    this.setCount(prev => (prev || 0) + 1)
    this.eventsService.emit('count:changed', { action: 'increment' })
  }

  decrement() {
    this.setCount(prev => (prev || 0) - 1)
    this.eventsService.emit('count:changed', { action: 'decrement' })
  }

  reset() {
    this.setCount(0)
    this.eventsService.emit('count:changed', { action: 'reset' })
  }
}
```

## API Documentation

### EngineService

Core engine service providing access to the engine instance.

```typescript
@Injectable({ providedIn: 'root' })
export class EngineService {
  // Initialize engine
  async init(config?: CoreEngineConfig): Promise<void>
  
  // Register plugin
  async use(plugin: Plugin): Promise<void>
  
  // Register middleware
  useMiddleware(middleware: Middleware): void
  
  // Access engine modules
  readonly state: StateManager
  readonly events: EventManager
  readonly lifecycle: LifecycleManager
  readonly logger: Logger
  readonly plugins: PluginManager
  readonly middleware: MiddlewareManager
}
```

### EngineStateService

State management service with RxJS Observables.

```typescript
@Injectable({ providedIn: 'root' })
export class EngineStateService {
  // Create reactive state (read/write)
  createState<T>(
    path: string,
    defaultValue?: T
  ): [Observable<T | undefined>, (value: T | ((prev: T | undefined) => T)) => void]
  
  // Create readonly state
  createStateValue<T>(path: string, defaultValue?: T): Observable<T | undefined>
  
  // Get state value (non-reactive)
  get<T>(path: string): T | undefined
  
  // Set state value
  set<T>(path: string, value: T): void
  
  // Delete state
  delete(path: string): void
  
  // Clear all states
  clear(): void
}
```

### EngineEventsService

Event system service with RxJS Subscriptions.

```typescript
@Injectable({ providedIn: 'root' })
export class EngineEventsService {
  // Listen to event
  listen<T>(
    eventName: string,
    handler: EventHandler<T>,
    options?: EventOptions
  ): Subscription
  
  // Emit event
  emit(eventName: string, payload?: any): void
  
  // Listen once
  once<T>(eventName: string, handler: EventHandler<T>): Subscription
  
  // Remove all listeners for event
  off(eventName: string): void
}
```

## Plugin Development

```typescript
import { Plugin } from '@ldesign/engine-core'

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    const { engine, logger } = context
    logger.info('Plugin installed!')
    
    engine.events.on('app:ready', () => {
      console.log('App is ready!')
    })
  }
}

// Register in module
EngineModule.forRoot({
  plugins: [myPlugin]
})
```

## Advanced Usage

### With APP_INITIALIZER

```typescript
import { NgModule, APP_INITIALIZER } from '@angular/core'
import { EngineModule, engineInitializerFactory, EngineService, ENGINE_CONFIG } from '@ldesign/engine-angular'

@NgModule({
  imports: [
    EngineModule.forRoot({
      config: {
        name: 'My App',
        version: '1.0.0'
      }
    })
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: engineInitializerFactory,
      deps: [EngineService, ENGINE_CONFIG],
      multi: true
    }
  ]
})
export class AppModule {}
```

### Reactive State with Async Pipe

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div *ngIf="user$ | async as user">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  user$!: Observable<User | undefined>

  constructor(private stateService: EngineStateService) {}

  ngOnInit() {
    this.user$ = this.stateService.createStateValue<User>('user')
  }
}
```

## API 一致性

与其他框架的 API 保持一致：

| 功能 | React | Vue | Angular |
|------|-------|-----|---------|
| 引擎访问 | `useEngine()` | `useEngine()` | `EngineService` (注入) |
| 状态读写 | `useEngineState()` | `useEngineState()` | `createState()` |
| 只读状态 | `useEngineStateValue()` | `useEngineStateValue()` | `createStateValue()` |
| 事件监听 | `useEventListener()` | `useEventListener()` | `listen()` |
| 事件发射 | `useEventEmitter()` | `useEventEmitter()` | `emit()` |

## Documentation

For detailed documentation, visit [our documentation site](https://ldesign.github.io/engine/).

## License

MIT © ldesign


