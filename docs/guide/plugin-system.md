# 插件系统

插件系统是 @ldesign/engine 的核心特性之一，它允许您以模块化的方式扩展引擎功能。本章将详细介绍如何开发、注册和管理插件。

## 插件基础

### 插件接口

```typescript
interface Plugin {
  // 基本信息
  name: string                    // 插件唯一标识
  version: string                 // 插件版本
  description?: string            // 插件描述
  author?: string                 // 插件作者
  license?: string                // 插件许可证
  homepage?: string               // 插件主页
  
  // 依赖关系
  dependencies?: string[]         // 依赖的其他插件
  peerDependencies?: string[]     // 对等依赖
  optionalDependencies?: string[] // 可选依赖
  
  // 生命周期钩子
  install: (engine: Engine) => void | Promise<void>
  uninstall?: (engine: Engine) => void | Promise<void>
  enable?: (engine: Engine) => void | Promise<void>
  disable?: (engine: Engine) => void | Promise<void>
  
  // 配置
  config?: PluginConfig
  schema?: JSONSchema             // 配置验证模式
  
  // 元数据
  tags?: string[]                 // 插件标签
  category?: string               // 插件分类
  priority?: number               // 加载优先级
}
```

### 最简单的插件

```typescript
import { Plugin, Engine } from '@ldesign/engine'

const helloPlugin: Plugin = {
  name: 'hello-plugin',
  version: '1.0.0',
  description: '一个简单的问候插件',
  
  install(engine: Engine) {
    console.log('Hello Plugin 已安装！')
    
    // 添加一个问候方法
    engine.addMethod('sayHello', (name: string) => {
      return `Hello, ${name}!`
    })
    
    // 监听引擎启动事件
    engine.on('engine:started', () => {
      console.log('引擎启动了，Hello Plugin 准备就绪！')
    })
  },
  
  uninstall(engine: Engine) {
    console.log('Hello Plugin 已卸载！')
    engine.removeMethod('sayHello')
  }
}

// 注册插件
engine.registerPlugin(helloPlugin)

// 使用插件提供的方法
const greeting = engine.sayHello('World')
console.log(greeting) // "Hello, World!"
```

## 插件开发

### 插件结构

推荐的插件目录结构：

```
my-plugin/
├── src/
│   ├── index.ts          # 插件入口
│   ├── plugin.ts         # 插件主逻辑
│   ├── config.ts         # 配置定义
│   ├── types.ts          # 类型定义
│   └── utils/
│       └── helpers.ts    # 工具函数
├── tests/
│   └── plugin.test.ts    # 测试文件
├── docs/
│   └── README.md         # 插件文档
├── package.json
└── tsconfig.json
```

### 完整的插件示例

```typescript
// src/types.ts
export interface UserData {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

export interface AuthConfig {
  tokenExpiry: number
  refreshThreshold: number
  autoRefresh: boolean
  storage: 'localStorage' | 'sessionStorage' | 'memory'
}

// src/config.ts
import { AuthConfig } from './types'

export const defaultConfig: AuthConfig = {
  tokenExpiry: 3600000, // 1小时
  refreshThreshold: 300000, // 5分钟
  autoRefresh: true,
  storage: 'localStorage'
}

export const configSchema = {
  type: 'object',
  properties: {
    tokenExpiry: { type: 'number', minimum: 60000 },
    refreshThreshold: { type: 'number', minimum: 30000 },
    autoRefresh: { type: 'boolean' },
    storage: { type: 'string', enum: ['localStorage', 'sessionStorage', 'memory'] }
  },
  required: ['tokenExpiry', 'refreshThreshold', 'autoRefresh', 'storage']
}

// src/plugin.ts
import { Plugin, Engine } from '@ldesign/engine'
import { UserData, AuthConfig } from './types'
import { defaultConfig, configSchema } from './config'

export class AuthPlugin implements Plugin {
  name = 'auth-plugin'
  version = '1.0.0'
  description = '用户认证和授权插件'
  author = 'Your Name'
  license = 'MIT'
  
  dependencies = ['core-plugin']
  config = defaultConfig
  schema = configSchema
  
  private engine!: Engine
  private config!: AuthConfig
  private currentUser: UserData | null = null
  private token: string | null = null
  private refreshTimer?: NodeJS.Timeout
  
  async install(engine: Engine) {
    this.engine = engine
    this.config = { ...defaultConfig, ...engine.getPluginConfig(this.name) }
    
    // 注册认证相关方法
    engine.addMethod('login', this.login.bind(this))
    engine.addMethod('logout', this.logout.bind(this))
    engine.addMethod('getCurrentUser', this.getCurrentUser.bind(this))
    engine.addMethod('isAuthenticated', this.isAuthenticated.bind(this))
    engine.addMethod('hasRole', this.hasRole.bind(this))
    engine.addMethod('refreshToken', this.refreshToken.bind(this))
    
    // 注册事件监听器
    engine.on('auth:login', this.onLogin.bind(this))
    engine.on('auth:logout', this.onLogout.bind(this))
    engine.on('auth:token-expired', this.onTokenExpired.bind(this))
    
    // 恢复用户会话
    await this.restoreSession()
    
    // 设置自动刷新
    if (this.config.autoRefresh) {
      this.setupAutoRefresh()
    }
    
    console.log('Auth Plugin 安装完成')
  }
  
  async uninstall(engine: Engine) {
    // 清理定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    
    // 移除方法
    engine.removeMethod('login')
    engine.removeMethod('logout')
    engine.removeMethod('getCurrentUser')
    engine.removeMethod('isAuthenticated')
    engine.removeMethod('hasRole')
    engine.removeMethod('refreshToken')
    
    // 移除事件监听器
    engine.off('auth:login', this.onLogin)
    engine.off('auth:logout', this.onLogout)
    engine.off('auth:token-expired', this.onTokenExpired)
    
    console.log('Auth Plugin 卸载完成')
  }
  
  async enable(engine: Engine) {
    console.log('Auth Plugin 已启用')
    await this.restoreSession()
  }
  
  async disable(engine: Engine) {
    console.log('Auth Plugin 已禁用')
    this.logout()
  }
  
  // 认证方法
  async login(credentials: { email: string; password: string }): Promise<UserData> {
    try {
      // 模拟 API 调用
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) {
        throw new Error('登录失败')
      }
      
      const { user, token } = await response.json()
      
      this.currentUser = user
      this.token = token
      
      // 保存到存储
      this.saveSession()
      
      // 触发登录事件
      this.engine.emit('auth:login', user)
      
      return user
    } catch (error) {
      this.engine.emit('auth:login-failed', error)
      throw error
    }
  }
  
  logout(): void {
    this.currentUser = null
    this.token = null
    
    // 清理存储
    this.clearSession()
    
    // 清理定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    
    // 触发登出事件
    this.engine.emit('auth:logout')
  }
  
  getCurrentUser(): UserData | null {
    return this.currentUser
  }
  
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null
  }
  
  hasRole(role: string): boolean {
    return this.currentUser?.role === role
  }
  
  async refreshToken(): Promise<string> {
    if (!this.token) {
      throw new Error('没有可刷新的令牌')
    }
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('令牌刷新失败')
      }
      
      const { token } = await response.json()
      this.token = token
      
      // 保存新令牌
      this.saveSession()
      
      // 触发刷新事件
      this.engine.emit('auth:token-refreshed', token)
      
      return token
    } catch (error) {
      this.engine.emit('auth:refresh-failed', error)
      throw error
    }
  }
  
  // 私有方法
  private async restoreSession(): Promise<void> {
    try {
      const storage = this.getStorage()
      const sessionData = storage.getItem('auth-session')
      
      if (sessionData) {
        const { user, token, timestamp } = JSON.parse(sessionData)
        
        // 检查令牌是否过期
        if (Date.now() - timestamp < this.config.tokenExpiry) {
          this.currentUser = user
          this.token = token
          
          // 设置自动刷新
          if (this.config.autoRefresh) {
            this.setupAutoRefresh()
          }
          
          this.engine.emit('auth:session-restored', user)
        } else {
          this.clearSession()
        }
      }
    } catch (error) {
      console.error('恢复会话失败:', error)
      this.clearSession()
    }
  }
  
  private saveSession(): void {
    if (!this.currentUser || !this.token) return
    
    const storage = this.getStorage()
    const sessionData = {
      user: this.currentUser,
      token: this.token,
      timestamp: Date.now()
    }
    
    storage.setItem('auth-session', JSON.stringify(sessionData))
  }
  
  private clearSession(): void {
    const storage = this.getStorage()
    storage.removeItem('auth-session')
  }
  
  private getStorage(): Storage {
    switch (this.config.storage) {
      case 'localStorage':
        return localStorage
      case 'sessionStorage':
        return sessionStorage
      case 'memory':
      default:
        // 内存存储实现
        return {
          getItem: (key: string) => (this as any)[`_${key}`] || null,
          setItem: (key: string, value: string) => { (this as any)[`_${key}`] = value },
          removeItem: (key: string) => { delete (this as any)[`_${key}`] },
          clear: () => {},
          length: 0,
          key: () => null
        }
    }
  }
  
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    
    const refreshTime = this.config.tokenExpiry - this.config.refreshThreshold
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken()
        this.setupAutoRefresh() // 设置下次刷新
      } catch (error) {
        console.error('自动刷新令牌失败:', error)
        this.engine.emit('auth:token-expired')
      }
    }, refreshTime)
  }
  
  // 事件处理器
  private onLogin(user: UserData): void {
    console.log('用户登录:', user.name)
    this.engine.setState('currentUser', user)
  }
  
  private onLogout(): void {
    console.log('用户登出')
    this.engine.setState('currentUser', null)
  }
  
  private onTokenExpired(): void {
    console.log('令牌已过期，自动登出')
    this.logout()
  }
}

// src/index.ts
export { AuthPlugin } from './plugin'
export * from './types'
export * from './config'

// 创建插件实例
export const authPlugin = new AuthPlugin()
```

## 插件注册和管理

### 注册插件

```typescript
import { Engine } from '@ldesign/engine'
import { authPlugin, corePlugin, uiPlugin } from './plugins'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 单个注册
engine.registerPlugin(authPlugin)

// 批量注册
engine.registerPlugins([
  corePlugin,
  uiPlugin,
  authPlugin
])

// 带配置注册
engine.registerPlugin(authPlugin, {
  tokenExpiry: 7200000, // 2小时
  autoRefresh: true,
  storage: 'localStorage'
})
```

### 插件生命周期管理

```typescript
// 安装插件
await engine.installPlugin('auth-plugin')

// 启用插件
await engine.enablePlugin('auth-plugin')

// 禁用插件
await engine.disablePlugin('auth-plugin')

// 卸载插件
await engine.uninstallPlugin('auth-plugin')

// 重新加载插件
await engine.reloadPlugin('auth-plugin')
```

### 插件状态查询

```typescript
// 检查插件是否已注册
if (engine.hasPlugin('auth-plugin')) {
  console.log('认证插件已注册')
}

// 获取插件信息
const pluginInfo = engine.getPluginInfo('auth-plugin')
console.log(pluginInfo)
// {
//   name: 'auth-plugin',
//   version: '1.0.0',
//   status: 'enabled',
//   dependencies: ['core-plugin'],
//   config: { ... }
// }

// 获取所有插件
const allPlugins = engine.getPlugins()
console.log(allPlugins)

// 获取已启用的插件
const enabledPlugins = engine.getEnabledPlugins()
console.log(enabledPlugins)
```

## 插件依赖管理

### 依赖声明

```typescript
const advancedAuthPlugin: Plugin = {
  name: 'advanced-auth-plugin',
  version: '1.0.0',
  
  // 必需依赖
  dependencies: ['auth-plugin', 'core-plugin'],
  
  // 对等依赖（需要特定版本）
  peerDependencies: ['ui-plugin@^2.0.0'],
  
  // 可选依赖
  optionalDependencies: ['analytics-plugin'],
  
  install(engine) {
    // 检查依赖是否满足
    if (!engine.hasPlugin('auth-plugin')) {
      throw new Error('需要 auth-plugin 插件')
    }
    
    // 检查可选依赖
    if (engine.hasPlugin('analytics-plugin')) {
      console.log('检测到分析插件，启用高级功能')
      this.enableAnalytics(engine)
    }
  },
  
  enableAnalytics(engine: Engine) {
    engine.on('auth:login', (user) => {
      engine.emit('analytics:track', {
        event: 'user_login',
        userId: user.id,
        timestamp: Date.now()
      })
    })
  }
}
```

### 依赖解析

```typescript
// 引擎会自动解析依赖顺序
engine.registerPlugins([
  advancedAuthPlugin, // 依赖 auth-plugin
  authPlugin,         // 依赖 core-plugin
  corePlugin,         // 无依赖
  uiPlugin           // 无依赖
])

// 实际安装顺序：
// 1. core-plugin
// 2. auth-plugin
// 3. ui-plugin
// 4. advanced-auth-plugin
```

### 循环依赖检测

```typescript
// 引擎会检测并阻止循环依赖
const pluginA: Plugin = {
  name: 'plugin-a',
  version: '1.0.0',
  dependencies: ['plugin-b'],
  install() {}
}

const pluginB: Plugin = {
  name: 'plugin-b',
  version: '1.0.0',
  dependencies: ['plugin-a'], // 循环依赖！
  install() {}
}

try {
  engine.registerPlugins([pluginA, pluginB])
} catch (error) {
  console.error('检测到循环依赖:', error.message)
}
```

## 插件配置

### 配置定义

```typescript
const configurablePlugin: Plugin = {
  name: 'configurable-plugin',
  version: '1.0.0',
  
  // 默认配置
  config: {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    debug: false
  },
  
  // 配置验证模式
  schema: {
    type: 'object',
    properties: {
      apiUrl: { type: 'string', format: 'uri' },
      timeout: { type: 'number', minimum: 1000, maximum: 30000 },
      retries: { type: 'number', minimum: 0, maximum: 10 },
      debug: { type: 'boolean' }
    },
    required: ['apiUrl', 'timeout', 'retries']
  },
  
  install(engine) {
    const config = engine.getPluginConfig(this.name)
    console.log('插件配置:', config)
    
    // 使用配置
    this.setupApiClient(config)
  },
  
  setupApiClient(config: any) {
    // 根据配置设置 API 客户端
  }
}
```

### 配置更新

```typescript
// 更新插件配置
engine.updatePluginConfig('configurable-plugin', {
  timeout: 10000,
  debug: true
})

// 监听配置变化
engine.on('plugin:config-updated', ({ pluginName, config }) => {
  console.log(`插件 ${pluginName} 配置已更新:`, config)
})
```

## 插件通信

### 事件通信

```typescript
// 插件 A 发布事件
const pluginA: Plugin = {
  name: 'plugin-a',
  version: '1.0.0',
  
  install(engine) {
    engine.addMethod('processData', (data) => {
      // 处理数据
      const result = this.process(data)
      
      // 发布处理完成事件
      engine.emit('data:processed', result)
      
      return result
    })
  },
  
  process(data: any) {
    return { ...data, processed: true, timestamp: Date.now() }
  }
}

// 插件 B 监听事件
const pluginB: Plugin = {
  name: 'plugin-b',
  version: '1.0.0',
  
  install(engine) {
    // 监听数据处理完成事件
    engine.on('data:processed', (result) => {
      console.log('数据处理完成:', result)
      this.saveResult(result)
    })
  },
  
  saveResult(result: any) {
    // 保存结果
  }
}
```

### 服务注册

```typescript
// 插件提供服务
const servicePlugin: Plugin = {
  name: 'service-plugin',
  version: '1.0.0',
  
  install(engine) {
    // 注册服务
    engine.registerService('dataService', {
      save: (data: any) => {
        console.log('保存数据:', data)
        return Promise.resolve(data)
      },
      load: (id: string) => {
        console.log('加载数据:', id)
        return Promise.resolve({ id, data: 'mock data' })
      }
    })
  }
}

// 其他插件使用服务
const consumerPlugin: Plugin = {
  name: 'consumer-plugin',
  version: '1.0.0',
  dependencies: ['service-plugin'],
  
  install(engine) {
    const dataService = engine.getService('dataService')
    
    engine.addMethod('saveAndLoad', async (data) => {
      await dataService.save(data)
      return await dataService.load(data.id)
    })
  }
}
```

## 插件测试

### 单元测试

```typescript
// tests/auth-plugin.test.ts
import { Engine } from '@ldesign/engine'
import { AuthPlugin } from '../src/plugin'

describe('AuthPlugin', () => {
  let engine: Engine
  let plugin: AuthPlugin
  
  beforeEach(() => {
    engine = new Engine({
      name: 'test-engine',
      version: '1.0.0'
    })
    
    plugin = new AuthPlugin()
  })
  
  afterEach(async () => {
    if (engine.hasPlugin(plugin.name)) {
      await engine.uninstallPlugin(plugin.name)
    }
  })
  
  test('应该正确安装插件', async () => {
    await engine.registerPlugin(plugin)
    await engine.installPlugin(plugin.name)
    
    expect(engine.hasPlugin(plugin.name)).toBe(true)
    expect(engine.hasMethod('login')).toBe(true)
    expect(engine.hasMethod('logout')).toBe(true)
  })
  
  test('应该正确处理登录', async () => {
    await engine.registerPlugin(plugin)
    await engine.installPlugin(plugin.name)
    
    // 模拟登录
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' as const }
    
    // 监听登录事件
    const loginHandler = jest.fn()
    engine.on('auth:login', loginHandler)
    
    // 模拟 API 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'mock-token' })
    })
    
    const result = await engine.login({ email: 'test@example.com', password: 'password' })
    
    expect(result).toEqual(mockUser)
    expect(loginHandler).toHaveBeenCalledWith(mockUser)
    expect(engine.isAuthenticated()).toBe(true)
  })
  
  test('应该正确处理登出', async () => {
    await engine.registerPlugin(plugin)
    await engine.installPlugin(plugin.name)
    
    // 先登录
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' }, 
        token: 'mock-token' 
      })
    })
    
    await engine.login({ email: 'test@example.com', password: 'password' })
    expect(engine.isAuthenticated()).toBe(true)
    
    // 监听登出事件
    const logoutHandler = jest.fn()
    engine.on('auth:logout', logoutHandler)
    
    // 登出
    engine.logout()
    
    expect(engine.isAuthenticated()).toBe(false)
    expect(logoutHandler).toHaveBeenCalled()
  })
})
```

### 集成测试

```typescript
// tests/plugin-integration.test.ts
import { Engine } from '@ldesign/engine'
import { AuthPlugin } from '../src/auth-plugin'
import { UIPlugin } from '../src/ui-plugin'

describe('插件集成测试', () => {
  let engine: Engine
  
  beforeEach(() => {
    engine = new Engine({
      name: 'integration-test',
      version: '1.0.0'
    })
  })
  
  test('多个插件应该能正常协作', async () => {
    const authPlugin = new AuthPlugin()
    const uiPlugin = new UIPlugin()
    
    // 注册插件
    await engine.registerPlugins([authPlugin, uiPlugin])
    await engine.installPlugin(authPlugin.name)
    await engine.installPlugin(uiPlugin.name)
    
    // 测试插件间通信
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' as const }
    
    // 模拟登录
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'mock-token' })
    })
    
    await engine.login({ email: 'test@example.com', password: 'password' })
    
    // 验证 UI 插件响应了认证事件
    expect(engine.getState('ui.showLoginForm')).toBe(false)
    expect(engine.getState('ui.currentUser')).toEqual(mockUser)
  })
})
```

## 插件发布

### 包结构

```json
// package.json
{
  "name": "@myorg/engine-auth-plugin",
  "version": "1.0.0",
  "description": "Authentication plugin for @ldesign/engine",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "ldesign",
    "engine",
    "plugin",
    "auth",
    "authentication"
  ],
  "peerDependencies": {
    "@ldesign/engine": "^1.0.0"
  },
  "devDependencies": {
    "@ldesign/engine": "^1.0.0",
    "typescript": "^4.9.0",
    "jest": "^29.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

### 文档

```markdown
# Auth Plugin for @ldesign/engine

用户认证和授权插件。

## 安装

```bash
npm install @myorg/engine-auth-plugin
```

## 使用

```typescript
import { Engine } from '@ldesign/engine'
import { authPlugin } from '@myorg/engine-auth-plugin'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 注册插件
engine.registerPlugin(authPlugin, {
  tokenExpiry: 3600000,
  autoRefresh: true
})

// 使用认证功能
const user = await engine.login({
  email: 'user@example.com',
  password: 'password'
})
```

## API

### 方法

- `login(credentials)` - 用户登录
- `logout()` - 用户登出
- `getCurrentUser()` - 获取当前用户
- `isAuthenticated()` - 检查是否已认证
- `hasRole(role)` - 检查用户角色
- `refreshToken()` - 刷新令牌

### 事件

- `auth:login` - 用户登录成功
- `auth:logout` - 用户登出
- `auth:token-refreshed` - 令牌刷新成功
- `auth:token-expired` - 令牌过期

### 配置

- `tokenExpiry` - 令牌过期时间（毫秒）
- `refreshThreshold` - 刷新阈值（毫秒）
- `autoRefresh` - 是否自动刷新
- `storage` - 存储方式

## 许可证

MIT
```

## 最佳实践

### 1. 插件设计原则

- **单一职责**：每个插件只负责一个特定功能
- **松耦合**：通过事件和服务进行通信
- **可配置**：提供灵活的配置选项
- **可测试**：编写完整的测试用例
- **文档完善**：提供清晰的使用文档

### 2. 错误处理

```typescript
const robustPlugin: Plugin = {
  name: 'robust-plugin',
  version: '1.0.0',
  
  async install(engine) {
    try {
      // 插件安装逻辑
      await this.initialize(engine)
    } catch (error) {
      // 记录错误但不阻止其他插件
      console.error(`插件 ${this.name} 安装失败:`, error)
      engine.emit('plugin:install-failed', { plugin: this.name, error })
      
      // 可选：提供降级功能
      this.installFallback(engine)
    }
  },
  
  async initialize(engine: Engine) {
    // 可能失败的初始化逻辑
  },
  
  installFallback(engine: Engine) {
    // 提供基本功能
    console.log(`插件 ${this.name} 以降级模式运行`)
  }
}
```

### 3. 性能优化

```typescript
const optimizedPlugin: Plugin = {
  name: 'optimized-plugin',
  version: '1.0.0',
  
  install(engine) {
    // 懒加载重型依赖
    engine.addMethod('heavyOperation', async () => {
      const { HeavyLibrary } = await import('./heavy-library')
      return new HeavyLibrary().process()
    })
    
    // 节流事件处理
    engine.on('scroll', this.throttle(this.onScroll, 16))
    
    // 缓存计算结果
    const cache = new Map()
    engine.addMethod('expensiveCalculation', (input) => {
      if (cache.has(input)) {
        return cache.get(input)
      }
      
      const result = this.calculate(input)
      cache.set(input, result)
      return result
    })
  },
  
  throttle(fn: Function, delay: number) {
    let lastCall = 0
    return (...args: any[]) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return fn.apply(this, args)
      }
    }
  }
}
```

### 4. 版本兼容性

```typescript
const versionAwarePlugin: Plugin = {
  name: 'version-aware-plugin',
  version: '2.0.0',
  
  install(engine) {
    const engineVersion = engine.getVersion()
    
    if (this.isCompatible(engineVersion)) {
      this.installLatestFeatures(engine)
    } else {
      this.installLegacyFeatures(engine)
    }
  },
  
  isCompatible(version: string): boolean {
    // 检查版本兼容性
    return semver.gte(version, '1.2.0')
  },
  
  installLatestFeatures(engine: Engine) {
    // 使用最新 API
  },
  
  installLegacyFeatures(engine: Engine) {
    // 使用兼容 API
  }
}
```

## 下一步

现在您已经掌握了插件系统的开发和使用，可以继续学习：

- [事件系统](/guide/event-system) - 深入了解事件通信
- [中间件](/guide/middleware) - 学习中间件的使用
- [状态管理](/guide/state-management) - 掌握状态管理
- [API 参考](/api/plugin) - 查看插件 API 文档
- [示例](/examples/plugin-development) - 查看更多插件开发示例