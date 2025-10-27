# TypeScript 支持

LDesign Engine 提供完整的 TypeScript 支持，包括类型定义、泛型支持和类型推断。

## 类型导入

### 核心类型

```typescript
import type {
  Engine,
  EngineConfig,
  Plugin,
  Middleware,
  EventHandler,
  StateValue,
} from '@ldesign/engine'
```

### 管理器类型

```typescript
import type {
  PluginManager,
  EventManager,
  StateManager,
  CacheManager,
  MiddlewareManager
} from '@ldesign/engine/types'
```

### 特定功能类型

```typescript
// 事件类型
import type { EventOptions, EventListener } from '@ldesign/engine/types/event'

// 状态类型
import type { StateOptions, WatchCallback } from '@ldesign/engine/types/state'

// 插件类型
import type { PluginContext, PluginOptions } from '@ldesign/engine/types/plugin'
```

## 类型安全的引擎配置

```typescript
import { createEngine } from '@ldesign/engine'
import type { EngineConfig } from '@ldesign/engine'

const config: EngineConfig = {
  debug: true,
  app: {
    name: 'My App',
    version: '1.0.0'
  },
  logger: {
    level: 'debug',
    prefix: '[App]'
  },
  cache: {
    maxSize: 1000,
    defaultTTL: 3600000
  },
  performance: {
    enableMonitoring: true,
    sampleRate: 0.1
  }
}

const engine = createEngine(config)
```

## 泛型支持

### 类型安全的状态

```typescript
// 定义状态类型
interface UserState {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

interface AppState {
  user: UserState
  theme: 'light' | 'dark'
  locale: string
}

// 设置状态（类型检查）
engine.state.set<UserState>('user', {
  id: '123',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
})

// 获取状态（类型推断）
const user = engine.state.get<UserState>('user')
//    ^? const user: UserState | undefined

// 监听状态（类型检查）
engine.state.watch<UserState>('user', (newValue, oldValue) => {
  //                                    ^? newValue: UserState
  //                                                ^? oldValue: UserState | undefined
  console.log('用户变化:', newValue)
})
```

### 类型安全的事件

```typescript
// 定义事件类型
interface EventMap {
  'user:login': { userId: string; timestamp: number }
  'user:logout': { userId: string }
  'data:update': { type: string; payload: any }
}

// 类型安全的事件发射
engine.events.on<EventMap['user:login']>('user:login', (data) => {
  //                                                      ^? data: { userId: string; timestamp: number }
  console.log('用户登录:', data.userId)
})

// 发射事件
engine.events.emit<EventMap['user:login']>('user:login', {
  userId: '123',
  timestamp: Date.now()
})
```

### 类型安全的缓存

```typescript
// 定义缓存数据类型
interface CacheData {
  users: UserState[]
  config: AppConfig
  permissions: Permission[]
}

// 设置缓存
engine.cache.set<CacheData['users']>('users', users, 3600000)

// 获取缓存
const cachedUsers = await engine.cache.get<CacheData['users']>('users')
//    ^? const cachedUsers: UserState[] | undefined
```

## 插件开发类型支持

### 基础插件

```typescript
import type { Plugin, Engine } from '@ldesign/engine'

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  install(engine: Engine) {
    // 插件逻辑
    engine.logger.info('插件已安装')
  }
}
```

### 带配置的插件

```typescript
import type { Plugin, Engine } from '@ldesign/engine'

interface MyPluginOptions {
  apiUrl: string
  timeout?: number
  retry?: boolean
}

function createMyPlugin(options: MyPluginOptions): Plugin {
  return {
    name: 'my-plugin',
    version: '1.0.0',
    
    install(engine: Engine) {
      // 使用配置
      const { apiUrl, timeout = 5000, retry = true } = options
      
      engine.logger.info('插件配置:', { apiUrl, timeout, retry })
    }
  }
}

// 使用插件
engine.use(createMyPlugin({
  apiUrl: 'https://api.example.com',
  timeout: 10000
}))
```

### 泛型插件

```typescript
import type { Plugin, Engine } from '@ldesign/engine'

interface DataPlugin<T> extends Plugin {
  data: T
  getData(): T
  setData(data: T): void
}

function createDataPlugin<T>(initialData: T): DataPlugin<T> {
  let data = initialData
  
  return {
    name: 'data-plugin',
    version: '1.0.0',
    data,
    
    getData() {
      return data
    },
    
    setData(newData: T) {
      data = newData
    },
    
    install(engine: Engine) {
      engine.logger.info('数据插件已安装')
    }
  }
}

// 使用
interface UserData {
  users: UserState[]
}

const plugin = createDataPlugin<UserData>({
  users: []
})
```

## 中间件类型支持

```typescript
import type { Middleware, MiddlewareContext } from '@ldesign/engine'

interface AuthContext extends MiddlewareContext {
  user?: UserState
  token?: string
}

const authMiddleware: Middleware<AuthContext> = {
  name: 'auth',
  
  async handler(context, next) {
    // 检查认证
    if (!context.token) {
      throw new Error('未授权')
    }
    
    // 验证令牌
    const user = await validateToken(context.token)
    context.user = user
    
    await next()
  }
}
```

## Vue 组合式 API 类型支持

### useEngine

```typescript
import { useEngine } from '@ldesign/engine/vue'
import type { Engine } from '@ldesign/engine'

export default defineComponent({
  setup() {
    const engine = useEngine()
    //    ^? const engine: Engine
    
    const user = computed(() => 
      engine.state.get<UserState>('user')
    )
    
    return { user }
  }
})
```

### 自定义 Composable

```typescript
import { useEngine } from '@ldesign/engine/vue'
import { computed, type ComputedRef } from 'vue'

export function useUser(): {
  user: ComputedRef<UserState | undefined>
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
  isLoggedIn: ComputedRef<boolean>
} {
  const engine = useEngine()
  
  const user = computed(() => 
    engine.state.get<UserState>('user')
  )
  
  const isLoggedIn = computed(() => !!user.value)
  
  async function login(credentials: Credentials) {
    const userData = await api.login(credentials)
    engine.state.set('user', userData)
    engine.events.emit('user:login', userData)
  }
  
  function logout() {
    engine.state.remove('user')
    engine.events.emit('user:logout', { userId: user.value?.id })
  }
  
  return {
    user,
    login,
    logout,
    isLoggedIn
  }
}
```

## 类型声明扩展

### 扩展引擎配置

```typescript
// types/engine.d.ts
import '@ldesign/engine'

declare module '@ldesign/engine' {
  interface EngineConfig {
    // 添加自定义配置
    myPlugin?: {
      enabled: boolean
      apiKey: string
    }
  }
}
```

### 扩展状态类型

```typescript
// types/state.d.ts
import '@ldesign/engine'

declare module '@ldesign/engine' {
  interface StateMap {
    user: UserState
    cart: CartState
    theme: 'light' | 'dark'
  }
}

// 现在可以类型安全地使用
engine.state.get('user') // 自动推断为 UserState | undefined
```

### 扩展事件类型

```typescript
// types/events.d.ts
import '@ldesign/engine'

declare module '@ldesign/engine' {
  interface EventMap {
    'user:login': { userId: string }
    'user:logout': { userId: string }
    'cart:add': { productId: string; quantity: number }
  }
}

// 现在事件类型是安全的
engine.events.on('user:login', (data) => {
  // data 自动推断为 { userId: string }
})
```

## 工具类型

### 深度部分类型

```typescript
import type { DeepPartial } from '@ldesign/engine/types'

interface Config {
  api: {
    url: string
    timeout: number
    retry: {
      enabled: boolean
      maxAttempts: number
    }
  }
}

// 所有属性都是可选的
const partialConfig: DeepPartial<Config> = {
  api: {
    timeout: 10000
  }
}
```

### 深度只读类型

```typescript
import type { DeepReadonly } from '@ldesign/engine/types'

interface State {
  user: {
    profile: {
      name: string
    }
  }
}

const state: DeepReadonly<State> = {
  user: {
    profile: {
      name: 'Alice'
    }
  }
}

// 编译错误：无法修改只读属性
// state.user.profile.name = 'Bob'
```

### 函数类型提取

```typescript
import type { ExtractFunctionParams, ExtractFunctionReturn } from '@ldesign/engine/types'

function processData(data: string, options: ProcessOptions): Promise<Result> {
  // 实现
}

type Params = ExtractFunctionParams<typeof processData>
//   ^? type Params = [data: string, options: ProcessOptions]

type Return = ExtractFunctionReturn<typeof processData>
//   ^? type Return = Promise<Result>
```

## 类型保护

```typescript
import { isEngine, isPlugin, isMiddleware } from '@ldesign/engine/utils'

function handleValue(value: unknown) {
  if (isEngine(value)) {
    // value 被推断为 Engine
    value.state.set('key', 'value')
  }
  
  if (isPlugin(value)) {
    // value 被推断为 Plugin
    engine.use(value)
  }
  
  if (isMiddleware(value)) {
    // value 被推断为 Middleware
    engine.middleware.use(value)
  }
}
```

## 严格模式

启用 TypeScript 严格模式以获得最佳类型安全：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## 最佳实践

### 1. 始终定义类型

```typescript
// ❌ 不好
const data = engine.state.get('user')

// ✅ 好
const data = engine.state.get<UserState>('user')
```

### 2. 使用类型推断

```typescript
// ✅ 让 TypeScript 推断返回类型
function getUser() {
  return engine.state.get<UserState>('user')
}
// 返回类型自动推断为 UserState | undefined
```

### 3. 避免 any 类型

```typescript
// ❌ 不好
function process(data: any) {
  // 失去类型安全
}

// ✅ 好
function process<T>(data: T) {
  // 保持类型安全
}
```

### 4. 使用联合类型

```typescript
type Status = 'pending' | 'loading' | 'success' | 'error'

interface RequestState {
  status: Status
  data?: any
  error?: Error
}
```

### 5. 提取复杂类型

```typescript
// 定义在单独的文件中
// types/app.ts
export interface AppState {
  user: UserState
  cart: CartState
  theme: ThemeState
}

export type UserRole = 'admin' | 'user' | 'guest'

export interface UserState {
  id: string
  name: string
  role: UserRole
}
```

## 下一步

- 📖 查看 [API 类型参考](/api/types/)
- 🎯 阅读 [最佳实践](/guide/best-practices)
- 💡 浏览 [示例代码](/examples/)


