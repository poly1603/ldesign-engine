# 最佳实践指南

本文档汇总了使用 @ldesign/engine 的最佳实践和推荐模式。

## 📋 目录

- [引擎初始化](#引擎初始化)
- [插件开发](#插件开发)
- [状态管理](#状态管理)
- [事件系统](#事件系统)
- [性能优化](#性能优化)
- [错误处理](#错误处理)
- [测试策略](#测试策略)
- [TypeScript 使用](#typescript-使用)

## 引擎初始化

### ✅ 推荐做法

```typescript
// 1. 在应用入口初始化
import { createEngine } from '@ldesign/engine-core'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0',
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  }
})

// 2. 先注册所有插件
engine.use(createI18nPlugin({ ... }))
engine.use(createThemePlugin({ ... }))

// 3. 最后初始化
await engine.initialize()
```

### ❌ 不推荐做法

```typescript
// ❌ 初始化后注册插件
await engine.initialize()
engine.use(somePlugin) // 可能导致问题

// ❌ 在组件中创建引擎
function MyComponent() {
  const engine = createEngine({ ... }) // 每次渲染都创建新实例
}

// ❌ 不处理初始化错误
createEngine({ ... }).initialize() // 没有错误处理
```

## 插件开发

### ✅ 推荐做法

```typescript
import { Plugin, PluginContext } from '@ldesign/engine-core'

export interface MyPluginOptions {
  option1: string
  option2?: number
}

export function createMyPlugin(options: MyPluginOptions): Plugin {
  return {
    name: 'my-plugin',
    version: '1.0.0',
    
    // 声明依赖
    dependencies: ['i18n'], // 可选
    
    async install(context: PluginContext) {
      const { engine, config } = context
      
      // 使用配置
      const finalOptions = { ...defaultOptions, ...options }
      
      // 注册状态
      engine.state.setState('my-plugin', {
        initialized: true,
        data: null
      })
      
      // 监听事件
      engine.events.on('app:ready', () => {
        // 初始化逻辑
      })
      
      // 返回公共 API
      return {
        doSomething() {
          // 插件功能
        }
      }
    },
    
    async uninstall(context: PluginContext) {
      // 清理资源
      context.engine.state.removeState('my-plugin')
    }
  }
}
```

### ❌ 不推荐做法

```typescript
// ❌ 没有类型定义
export function createMyPlugin(options: any) { }

// ❌ 不清理资源
async uninstall() {
  // 没有清理逻辑
}

// ❌ 在 install 中执行异步操作但不等待
async install(context) {
  fetchData() // 没有 await
}
```

## 状态管理

### ✅ 推荐做法

```typescript
// React
function MyComponent() {
  // 使用明确的状态路径
  const [user, setUser] = useEngineState<User>('app.user', null)
  
  // 避免频繁更新
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [setUser])
  
  return <div>{user?.name}</div>
}

// 使用命名空间组织状态
// ✅ app.user.profile
// ✅ app.user.settings
// ✅ app.ui.theme
```

### ❌ 不推荐做法

```typescript
// ❌ 状态路径太浅
const [data, setData] = useEngineState('data') // 容易冲突

// ❌ 在循环中使用状态
items.map(item => {
  const [state] = useEngineState(`item-${item.id}`) // 不推荐
})

// ❌ 存储大量数据
const [bigData, setBigData] = useEngineState('data', hugeArray) // 影响性能
```

## 事件系统

### ✅ 推荐做法

```typescript
// 1. 使用命名空间
engine.events.emit('user:login', { userId: 123 })
engine.events.emit('user:logout', { userId: 123 })
engine.events.emit('app:ready', {})

// 2. 在组件中正确清理
function MyComponent() {
  useEngineEvent('theme:changed', (data) => {
    console.log('Theme changed', data)
  }) // 自动清理
}

// 3. 使用类型化的事件数据
interface ThemeChangedEvent {
  from: string
  to: string
}

engine.events.emit<ThemeChangedEvent>('theme:changed', {
  from: 'light',
  to: 'dark'
})
```

### ❌ 不推荐做法

```typescript
// ❌ 事件名称不规范
engine.events.emit('change') // 太模糊
engine.events.emit('UserLoggedIn') // 使用 camelCase 而非 kebab-case

// ❌ 忘记清理监听器
const unsubscribe = engine.events.on('event', handler)
// 组件卸载时没有调用 unsubscribe()

// ❌ 在事件处理中抛出错误
engine.events.on('event', () => {
  throw new Error('Oops') // 会影响其他监听器
})
```

## 性能优化

### ✅ 推荐做法

```typescript
// 1. 按需加载插件
const lazyPlugin = async () => {
  const plugin = await import('./heavy-plugin')
  return plugin.createHeavyPlugin()
}

// 2. 使用 memo 避免重复渲染
const MyComponent = React.memo(() => {
  const [state] = useEngineState('data')
  return <div>{state}</div>
})

// 3. 批量更新状态
engine.state.batch(() => {
  engine.state.setState('key1', value1)
  engine.state.setState('key2', value2)
  engine.state.setState('key3', value3)
})

// 4. 使用配置缓存
const config = useEngineConfig('api.url', 'https://api.example.com')
// 配置不会频繁变化，避免不必要的重渲染
```

### ❌ 不推荐做法

```typescript
// ❌ 在渲染中创建新对象
function MyComponent() {
  const [state, setState] = useEngineState('data', { value: 0 }) // 每次都创建新对象
}

// ❌ 频繁触发事件
setInterval(() => {
  engine.events.emit('tick', Date.now()) // 性能问题
}, 10)

// ❌ 不必要的状态监听
function MyComponent() {
  useEngineState('global-data') // 但组件实际不使用这个数据
}
```

## 错误处理

### ✅ 推荐做法

```typescript
// 1. 初始化时的错误处理
try {
  await engine.initialize()
} catch (error) {
  console.error('Failed to initialize engine:', error)
  // 显示错误页面或降级处理
}

// 2. 插件加载错误处理
try {
  engine.use(createPlugin(config))
} catch (error) {
  engine.logger.error('Plugin loading failed:', error)
  // 继续运行，不要让一个插件失败影响整个应用
}

// 3. 在插件中处理错误
export function createMyPlugin() {
  return {
    async install(context) {
      try {
        await someAsyncOperation()
      } catch (error) {
        context.engine.logger.error('Plugin initialization failed:', error)
        // 可以返回降级的功能
        return {
          doSomething: () => console.warn('Feature not available')
        }
      }
    }
  }
}
```

### ❌ 不推荐做法

```typescript
// ❌ 忽略错误
engine.initialize() // 没有 catch

// ❌ 在插件中抛出未捕获的错误
async install(context) {
  throw new Error('Failed') // 会导致整个应用崩溃
}

// ❌ 不提供错误信息
catch (error) {
  console.log('Error') // 没有具体信息
}
```

## 测试策略

### ✅ 推荐做法

```typescript
// 1. 测试插件功能
describe('MyPlugin', () => {
  let engine: CoreEngine
  
  beforeEach(() => {
    engine = createEngine({ name: 'test' })
  })
  
  afterEach(() => {
    engine.destroy()
  })
  
  it('should initialize correctly', async () => {
    const plugin = createMyPlugin({ option: 'value' })
    engine.use(plugin)
    await engine.initialize()
    
    expect(engine.plugins.has('my-plugin')).toBe(true)
  })
})

// 2. 测试 React Hooks
import { renderHook } from '@testing-library/react'
import { EngineProvider } from '@ldesign/engine-react'

it('should update state', () => {
  const wrapper = ({ children }) => (
    <EngineProvider engine={engine}>{children}</EngineProvider>
  )
  
  const { result } = renderHook(
    () => useEngineState('test', 0),
    { wrapper }
  )
  
  act(() => {
    result.current[1](1)
  })
  
  expect(result.current[0]).toBe(1)
})
```

## TypeScript 使用

### ✅ 推荐做法

```typescript
// 1. 定义明确的类型
interface UserState {
  id: number
  name: string
  email: string
}

const [user, setUser] = useEngineState<UserState>('user', null)

// 2. 使用泛型
function createTypedPlugin<T extends PluginOptions>(
  options: T
): Plugin {
  // 实现...
}

// 3. 导出类型
export type { UserState, PluginOptions }

// 4. 使用类型守卫
function isValidUser(user: unknown): user is UserState {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'name' in user
  )
}
```

### ❌ 不推荐做法

```typescript
// ❌ 使用 any
const [data, setData] = useEngineState<any>('data')

// ❌ 不导出类型
interface MyType { } // 只在文件内部定义

// ❌ 类型断言过度使用
const user = data as UserState // 没有验证
```

## 框架特定最佳实践

### React

```typescript
// ✅ 使用 useMemo 优化
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// ✅ 使用 useCallback 避免重复创建函数
const handleClick = useCallback(() => {
  engine.events.emit('click', {})
}, [engine])
```

### Vue

```typescript
// ✅ 使用 computed
const processedData = computed(() => {
  return expensiveComputation(state.value)
})

// ✅ 使用 watchEffect 自动追踪依赖
watchEffect(() => {
  console.log('Theme:', theme.value)
})
```

### Svelte

```typescript
// ✅ 使用响应式语句
$: processedData = expensiveComputation($state)

// ✅ 正确使用 stores
const count = createEngineStateStore('count', 0)
// 在模板中使用 $count 自动订阅
```

### Solid.js

```typescript
// ✅ 使用 createMemo
const processedData = createMemo(() => {
  return expensiveComputation(state())
})

// ✅ 细粒度更新
const [state, setState] = useEngineState('data', { count: 0 })
// 只更新需要的部分
```

## 安全实践

### ✅ 推荐做法

```typescript
// 1. 验证用户输入
function validateConfig(config: unknown): EngineConfig {
  if (!isValidConfig(config)) {
    throw new Error('Invalid configuration')
  }
  return config
}

// 2. 清理敏感数据
engine.events.on('user:logout', () => {
  engine.state.removeState('user.token')
  engine.state.removeState('user.credentials')
})

// 3. 使用环境变量
const apiKey = process.env.VITE_API_KEY || ''
```

## 调试技巧

```typescript
// 1. 使用日志级别
engine.logger.debug('Debug info')
engine.logger.info('Info message')
engine.logger.warn('Warning')
engine.logger.error('Error occurred')

// 2. 监听所有事件
if (process.env.NODE_ENV === 'development') {
  engine.events.on('*', (data) => {
    console.log('Event:', data)
  })
}

// 3. 检查引擎状态
console.log('Engine status:', engine.getStatus())
console.log('Registered plugins:', Array.from(engine.plugins.keys()))
```

## 总结

遵循这些最佳实践可以帮助你：

- 📈 提升应用性能
- 🐛 减少 Bug 数量
- 🔧 提高代码可维护性
- 🎯 改善开发体验
- 🚀 构建更可靠的应用

---

有问题？查看 [文档](./README.md) 或提交 [Issue](https://github.com/your-org/ldesign/issues)。
