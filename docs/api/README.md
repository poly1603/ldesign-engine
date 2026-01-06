# API Reference

## Core Engine

### `createCoreEngine(config?)`

Creates a new core engine instance.

```typescript
function createCoreEngine(config?: CoreEngineConfig): CoreEngine
```

**Config Options:**
- `name?: string` - Engine name (default: 'LDesign Engine')
- `debug?: boolean` - Enable debug mode
- `environment?: 'development' | 'production' | 'test'`

### CoreEngine

| Property | Type | Description |
|----------|------|-------------|
| `config` | `CoreEngineConfig` | Engine configuration |
| `plugins` | `PluginManager` | Plugin management |
| `middleware` | `MiddlewareManager` | Middleware management |
| `lifecycle` | `LifecycleManager` | Lifecycle hooks |
| `events` | `EventManager` | Event system |
| `state` | `StateManager` | State management |
| `api` | `PluginAPIRegistry` | Plugin API registry |
| `performance` | `PerformanceMonitor` | Performance monitoring |

| Method | Description |
|--------|-------------|
| `init()` | Initialize the engine |
| `destroy()` | Destroy and cleanup |
| `use(plugin, options?)` | Install a plugin |
| `isInitialized()` | Check initialization state |
| `getStats()` | Get engine statistics |
| `healthCheck()` | Health check |
| `measure(name, fn)` | Measure async operation |
| `measureSync(name, fn)` | Measure sync operation |

## Plugin System

### `definePlugin(definition)`

Define a type-safe plugin.

```typescript
function definePlugin<T = unknown>(definition: Plugin<T>): Plugin<T>
```

### Plugin Interface

```typescript
interface Plugin<Options = unknown> {
  readonly name: string
  readonly version?: string
  readonly dependencies?: string[]
  install: (context: PluginContext, options?: Options) => void | Promise<void>
  uninstall?: (context: PluginContext) => void | Promise<void>
}
```

### PluginContext

```typescript
interface PluginContext {
  engine: CoreEngine
  config?: Record<string, unknown>
  framework?: FrameworkInfo
  container?: {
    singleton: (id: string | symbol, impl: any) => void
    resolve: <T>(id: string | symbol) => T
    has: (id: string | symbol) => boolean
  }
}
```

## State Management

### StateManager

| Method | Description |
|--------|-------------|
| `get<T>(key)` | Get state value |
| `set<T>(key, value)` | Set state value |
| `setShallow<T>(key, value)` | Set with shallow comparison |
| `has(key)` | Check if key exists |
| `delete(key)` | Delete state |
| `clear()` | Clear all state |
| `watch<T>(key, listener)` | Watch state changes |
| `batch(fn)` | Batch updates |
| `keys()` | Get all keys |
| `getAll()` | Get all state |
| `setAll(states)` | Batch set |
| `toJSON(pretty?)` | Export to JSON |
| `fromJSON(json, merge?)` | Import from JSON |

## Event System

### EventManager

| Method | Description |
|--------|-------------|
| `emit<T>(event, payload?)` | Emit event |
| `emitAsync<T>(event, payload?)` | Emit async event |
| `emitBatch(events)` | Batch emit |
| `on<T>(event, handler, priority?)` | Subscribe to event |
| `once<T>(event, handler)` | Subscribe once |
| `off(event, handler?)` | Unsubscribe |
| `clear()` | Clear all listeners |
| `listenerCount(event)` | Get listener count |
| `eventNames()` | Get all event names |
| `onThrottled<T>(event, handler, options)` | Throttled subscription |
| `onDebounced<T>(event, handler, delay)` | Debounced subscription |
| `emitDeferred<T>(event, payload?)` | Deferred emit |

## Middleware System

### MiddlewareManager

| Method | Description |
|--------|-------------|
| `use(scope, middleware, priority?)` | Register middleware |
| `remove(scope, middleware)` | Remove middleware |
| `execute(scope, context)` | Execute middleware chain |
| `clear()` | Clear all middleware |
| `size()` | Get middleware count |

## Lifecycle Management

### LifecycleManager

**Built-in Hooks:**
- `beforeInit` - Before initialization
- `init` - During initialization
- `afterInit` - After initialization
- `beforeMount` - Before mounting (Vue)
- `mounted` - After mounting (Vue)
- `beforeUnmount` - Before unmounting
- `unmounted` - After unmounting
- `beforeDestroy` - Before destruction
- `destroyed` - After destruction

| Method | Description |
|--------|-------------|
| `on(hook, callback)` | Register hook callback |
| `once(hook, callback)` | Register one-time callback |
| `off(hook, callback?)` | Remove callback |
| `trigger(hook, ...args)` | Trigger hook |
| `clear()` | Clear all hooks |
| `getHookNames()` | Get registered hook names |

## Vue 3 Integration

### `createVueEngine(config?)`

Creates a Vue 3 engine instance.

```typescript
function createVueEngine(config?: VueEngineConfig): VueEngine
```

### VueEngine

Extends `CoreEngine` with Vue-specific features:

| Method | Description |
|--------|-------------|
| `createVueApp(component?)` | Create Vue app |
| `mount(selector, component?)` | Mount application |
| `unmount()` | Unmount application |
| `useVuePlugin(plugin, options?)` | Use Vue plugin |
| `getApp()` | Get Vue app instance |
| `registerService(id, impl)` | Register service |
| `resolveService<T>(id)` | Resolve service |

### Composables

```typescript
import { 
  useEngine, 
  useEngineState,
  useEngineStateReadonly,
  useAsyncState,
  useDebouncedState
} from '@ldesign/engine-vue3'
```

## Type Constants

### StateKeys

Pre-defined state keys for type safety:

```typescript
StateKeys.I18N_LOCALE           // 'i18n:locale'
StateKeys.I18N_FALLBACK_LOCALE  // 'i18n:fallbackLocale'
StateKeys.COLOR_PRIMARY         // 'color:primaryColor'
StateKeys.COLOR_MODE            // 'color:mode'
StateKeys.ROUTER_MODE           // 'router:mode'
// ... more
```

### EventKeys

Pre-defined event keys:

```typescript
EventKeys.APP_CREATED           // 'app:created'
EventKeys.I18N_LOCALE_CHANGED   // 'i18n:localeChanged'
EventKeys.COLOR_THEME_CHANGED   // 'color:themeChanged'
EventKeys.ROUTER_NAVIGATED      // 'router:navigated'
// ... more
```

## Error Handling

### EngineError

```typescript
class EngineError extends Error {
  code: ErrorCode
  category: ErrorCategory
  severity: ErrorSeverity
  details?: Record<string, unknown>
  cause?: Error
  timestamp: number
  
  toJSON(): object
  isRecoverable(): boolean
}
```

### Error Boundary

```typescript
import { 
  withErrorBoundary,
  safeExecute,
  assertCondition,
  assertDefined,
  createErrorAggregator
} from '@ldesign/engine-core'
```
