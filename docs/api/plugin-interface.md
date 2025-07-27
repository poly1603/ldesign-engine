# 插件接口 API

本文档详细介绍了 @ldesign/engine 的插件接口规范，包括插件的定义、生命周期、通信机制和最佳实践。

## 插件接口定义

### Plugin 接口

```typescript
interface Plugin {
  // 必需属性
  name: string // 插件唯一标识符

  // 可选属性
  version?: string // 插件版本
  description?: string // 插件描述
  author?: string // 插件作者
  homepage?: string // 插件主页
  repository?: string // 插件仓库地址
  license?: string // 插件许可证
  keywords?: string[] // 插件关键词

  // 依赖信息
  dependencies?: PluginDependency[] // 插件依赖
  peerDependencies?: PluginDependency[] // 对等依赖

  // 生命周期钩子
  install: PluginInstallFunction // 安装函数（必需）
  uninstall?: PluginUninstallFunction // 卸载函数（可选）

  // 配置选项
  defaultOptions?: any // 默认配置选项
  optionsSchema?: any // 配置选项验证模式

  // 元数据
  metadata?: PluginMetadata // 插件元数据
}
```

### 插件函数类型

```typescript
// 插件安装函数
type PluginInstallFunction = (
  engine: Engine,
  options?: any
) => void | Promise<void>

// 插件卸载函数
type PluginUninstallFunction = (
  engine: Engine
) => void | Promise<void>

// 插件函数（简化形式）
type PluginFunction = PluginInstallFunction
```

### 插件依赖

```typescript
interface PluginDependency {
  name: string // 依赖插件名称
  version?: string // 版本要求
  optional?: boolean // 是否为可选依赖
  reason?: string // 依赖原因说明
}
```

### 插件元数据

```typescript
interface PluginMetadata {
  category?: string // 插件分类
  tags?: string[] // 插件标签
  compatibility?: { // 兼容性信息
    engine?: string // 引擎版本要求
    node?: string // Node.js 版本要求
    browser?: boolean // 是否支持浏览器
  }
  features?: string[] // 插件功能列表
  experimental?: boolean // 是否为实验性功能
}
```

## 插件生命周期

### 安装阶段

```typescript
// 插件安装示例
const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',

  async install(engine, options = {}) {
    console.log(`安装插件: ${this.name}`)

    // 1. 验证配置选项
    const config = this.validateOptions(options)

    // 2. 初始化插件状态
    engine.setState(`plugins.${this.name}`, {
      config,
      status: 'installing',
      startTime: Date.now()
    })

    // 3. 注册事件监听器
    engine.on('start', this.onEngineStart.bind(this))
    engine.on('stop', this.onEngineStop.bind(this))

    // 4. 注册中间件
    engine.middleware(this.createMiddleware(config))

    // 5. 扩展引擎功能
    this.extendEngine(engine, config)

    // 6. 触发安装完成事件
    engine.emit('plugin:installed', this, config)

    // 7. 更新插件状态
    engine.setState(`plugins.${this.name}.status`, 'installed')

    console.log(`插件 ${this.name} 安装完成`)
  },

  validateOptions(options: any) {
    // 验证和合并配置选项
    return { ...this.defaultOptions, ...options }
  },

  onEngineStart() {
    console.log(`插件 ${this.name} 响应引擎启动`)
  },

  onEngineStop() {
    console.log(`插件 ${this.name} 响应引擎停止`)
  },

  createMiddleware(config: any) {
    return async (context: any, next: () => Promise<void>) => {
      // 中间件逻辑
      console.log(`插件 ${this.name} 中间件执行`)
      await next()
    }
  },

  extendEngine(engine: Engine, config: any) {
    // 扩展引擎功能
    (engine as any).myPluginMethod = () => {
      console.log(`插件 ${this.name} 提供的方法`)
    }
  }
}
```

### 卸载阶段

```typescript
const myPlugin: Plugin = {
  name: 'my-plugin',

  async install(engine, options) {
    // 安装逻辑...
  },

  async uninstall(engine) {
    console.log(`卸载插件: ${this.name}`)

    // 1. 更新插件状态
    engine.setState(`plugins.${this.name}.status`, 'uninstalling')

    // 2. 移除事件监听器
    engine.off('start', this.onEngineStart)
    engine.off('stop', this.onEngineStop)

    // 3. 移除中间件
    engine.removeMiddleware(this.middleware)

    // 4. 清理扩展功能
    delete (engine as any).myPluginMethod

    // 5. 清理插件状态
    engine.removeState(`plugins.${this.name}`)

    // 6. 触发卸载完成事件
    engine.emit('plugin:uninstalled', this)

    console.log(`插件 ${this.name} 卸载完成`)
  }
}
```

## 插件通信

### 事件通信

```typescript
const pluginA: Plugin = {
  name: 'plugin-a',

  install(engine) {
    // 监听其他插件的事件
    engine.on('plugin-b:data-ready', (data) => {
      console.log('Plugin A 收到 Plugin B 的数据:', data)
    })

    // 发送事件给其他插件
    engine.emit('plugin-a:initialized', { message: 'Plugin A 已初始化' })
  }
}

const pluginB: Plugin = {
  name: 'plugin-b',

  install(engine) {
    // 监听 Plugin A 的事件
    engine.on('plugin-a:initialized', (data) => {
      console.log('Plugin B 收到 Plugin A 的消息:', data)

      // 响应事件
      engine.emit('plugin-b:data-ready', { response: '数据已准备好' })
    })
  }
}
```

### 状态共享

```typescript
const dataPlugin: Plugin = {
  name: 'data-plugin',

  install(engine) {
    // 设置共享数据
    engine.setState('shared.data', {
      users: [],
      config: {}
    })

    // 提供数据操作方法
    engine.setState('shared.methods.addUser', (user: any) => {
      const data = engine.getState('shared.data')
      data.users.push(user)
      engine.setState('shared.data', data)
      engine.emit('data:user-added', user)
    })
  }
}

const uiPlugin: Plugin = {
  name: 'ui-plugin',

  install(engine) {
    // 使用共享数据
    const data = engine.getState('shared.data')
    console.log('当前用户数量:', data.users.length)

    // 使用共享方法
    const addUser = engine.getState('shared.methods.addUser')
    addUser({ id: 1, name: 'John' })

    // 监听数据变化
    engine.on('data:user-added', (user) => {
      console.log('新用户添加:', user)
      this.updateUI()
    })
  },

  updateUI() {
    // 更新 UI 逻辑
  }
}
```

### 服务注册

```typescript
// 服务提供者插件
const servicePlugin: Plugin = {
  name: 'service-plugin',

  install(engine) {
    // 注册服务
    const apiService = {
      async get(url: string) {
        const response = await fetch(url)
        return response.json()
      },

      async post(url: string, data: any) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        return response.json()
      }
    }

    engine.setState('services.api', apiService)
    engine.emit('service:registered', 'api', apiService)
  }
}

// 服务消费者插件
const consumerPlugin: Plugin = {
  name: 'consumer-plugin',

  install(engine) {
    // 等待服务注册
    engine.on('service:registered', (serviceName, service) => {
      if (serviceName === 'api') {
        this.apiService = service
        this.initializeWithApi()
      }
    })

    // 或直接获取服务
    const apiService = engine.getState('services.api')
    if (apiService) {
      this.apiService = apiService
      this.initializeWithApi()
    }
  },

  async initializeWithApi() {
    const data = await this.apiService.get('/api/data')
    console.log('获取到数据:', data)
  }
}
```

## 插件配置

### 配置选项验证

```typescript
import Joi from 'joi'

const configPlugin: Plugin = {
  name: 'config-plugin',

  // 默认配置
  defaultOptions: {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    debug: false
  },

  // 配置验证模式
  optionsSchema: Joi.object({
    apiUrl: Joi.string().uri().required(),
    timeout: Joi.number().integer().min(1000).max(30000),
    retries: Joi.number().integer().min(0).max(10),
    debug: Joi.boolean()
  }),

  install(engine, options = {}) {
    // 验证配置
    const { error, value: config } = this.optionsSchema.validate({
      ...this.defaultOptions,
      ...options
    })

    if (error) {
      throw new Error(`插件配置错误: ${error.message}`)
    }

    // 使用验证后的配置
    this.config = config
    console.log('插件配置:', this.config)
  }
}
```

### 动态配置更新

```typescript
const dynamicPlugin: Plugin = {
  name: 'dynamic-plugin',

  install(engine, options) {
    this.config = { ...this.defaultOptions, ...options }

    // 监听配置更新事件
    engine.on(`plugin:${this.name}:config-update`, (newConfig) => {
      this.updateConfig(engine, newConfig)
    })

    // 提供配置更新方法
    engine.setState(`plugins.${this.name}.updateConfig`, (newConfig: any) => {
      engine.emit(`plugin:${this.name}:config-update`, newConfig)
    })
  },

  updateConfig(engine: Engine, newConfig: any) {
    const oldConfig = this.config
    this.config = { ...this.config, ...newConfig }

    console.log('配置已更新:', {
      old: oldConfig,
      new: this.config
    })

    // 触发配置变化事件
    engine.emit(`plugin:${this.name}:config-changed`, this.config, oldConfig)

    // 重新初始化（如果需要）
    if (this.needsReinitialization(oldConfig, this.config)) {
      this.reinitialize(engine)
    }
  },

  needsReinitialization(oldConfig: any, newConfig: any): boolean {
    // 检查是否需要重新初始化
    return oldConfig.apiUrl !== newConfig.apiUrl
  },

  reinitialize(engine: Engine) {
    console.log('重新初始化插件')
    // 重新初始化逻辑
  }
}
```

## 插件依赖管理

### 依赖声明

```typescript
const dependentPlugin: Plugin = {
  name: 'dependent-plugin',
  version: '1.0.0',

  // 声明依赖
  dependencies: [
    {
      name: 'base-plugin',
      version: '^1.0.0',
      reason: '提供基础功能'
    },
    {
      name: 'utils-plugin',
      version: '>=2.0.0',
      reason: '提供工具函数'
    }
  ],

  // 可选依赖
  peerDependencies: [
    {
      name: 'optional-plugin',
      version: '*',
      optional: true,
      reason: '提供额外功能'
    }
  ],

  install(engine, options) {
    // 检查依赖
    this.checkDependencies(engine)

    // 获取依赖插件
    const basePlugin = engine.getPlugin('base-plugin')
    const utilsPlugin = engine.getPlugin('utils-plugin')

    if (!basePlugin || !utilsPlugin) {
      throw new Error('缺少必需的依赖插件')
    }

    // 使用依赖插件的功能
    this.baseService = engine.getState('services.base')
    this.utils = engine.getState('services.utils')

    // 检查可选依赖
    const optionalPlugin = engine.getPlugin('optional-plugin')
    if (optionalPlugin) {
      this.optionalService = engine.getState('services.optional')
      console.log('可选插件可用，启用额外功能')
    }
  },

  checkDependencies(engine: Engine) {
    for (const dep of this.dependencies || []) {
      const plugin = engine.getPlugin(dep.name)
      if (!plugin) {
        throw new Error(`缺少依赖插件: ${dep.name}`)
      }

      if (dep.version && !this.isVersionCompatible(plugin.version, dep.version)) {
        throw new Error(`插件 ${dep.name} 版本不兼容，需要 ${dep.version}，当前 ${plugin.version}`)
      }
    }
  },

  isVersionCompatible(current: string, required: string): boolean {
    // 简化的版本检查逻辑
    // 实际应用中应使用 semver 库
    return true
  }
}
```

### 依赖注入

```typescript
// 依赖注入装饰器
function inject(serviceName: string) {
  return function (target: any, propertyKey: string) {
    target._injections = target._injections || []
    target._injections.push({ propertyKey, serviceName })
  }
}

class AdvancedPlugin implements Plugin {
  name = 'advanced-plugin'

  @inject('api')
  private apiService: any

  @inject('logger')
  private logger: any

  install(engine: Engine, options: any) {
    // 执行依赖注入
    this.performDependencyInjection(engine)

    // 使用注入的服务
    this.logger.info('Advanced plugin initialized')
  }

  private performDependencyInjection(engine: Engine) {
    const injections = (this as any)._injections || []

    for (const injection of injections) {
      const service = engine.getState(`services.${injection.serviceName}`)
      if (service) {
        (this as any)[injection.propertyKey] = service
      }
 else {
        throw new Error(`服务 ${injection.serviceName} 未找到`)
      }
    }
  }
}
```

## 插件测试

### 单元测试

```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { Engine } from '@ldesign/engine'

describe('MyPlugin', () => {
  let engine: Engine
  let plugin: Plugin

  beforeEach(() => {
    engine = new Engine()
    plugin = {
      name: 'test-plugin',
      install: vi.fn(),
      uninstall: vi.fn()
    }
  })

  it('should install plugin correctly', async () => {
    // 安装插件
    engine.use(plugin)

    // 验证插件已安装
    expect(engine.hasPlugin('test-plugin')).toBe(true)
    expect(plugin.install).toHaveBeenCalledWith(engine, undefined)
  })

  it('should uninstall plugin correctly', async () => {
    // 安装插件
    engine.use(plugin)

    // 卸载插件
    engine.unuse(plugin)

    // 验证插件已卸载
    expect(engine.hasPlugin('test-plugin')).toBe(false)
    expect(plugin.uninstall).toHaveBeenCalledWith(engine)
  })

  it('should pass options to plugin', () => {
    const options = { setting: 'value' }

    // 使用选项安装插件
    engine.use(plugin, options)

    // 验证选项已传递
    expect(plugin.install).toHaveBeenCalledWith(engine, options)
  })
})
```

### 集成测试

```typescript
describe('Plugin Integration', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine()
  })

  it('should handle plugin communication', async () => {
    const events: any[] = []

    // 创建测试插件
    const pluginA: Plugin = {
      name: 'plugin-a',
      install(engine) {
        engine.on('plugin-b:message', (data) => {
          events.push({ from: 'plugin-b', to: 'plugin-a', data })
        })

        setTimeout(() => {
          engine.emit('plugin-a:message', { hello: 'from A' })
        }, 10)
      }
    }

    const pluginB: Plugin = {
      name: 'plugin-b',
      install(engine) {
        engine.on('plugin-a:message', (data) => {
          events.push({ from: 'plugin-a', to: 'plugin-b', data })
          engine.emit('plugin-b:message', { hello: 'from B' })
        })
      }
    }

    // 安装插件
    engine.use(pluginA)
    engine.use(pluginB)

    // 等待事件传播
    await new Promise(resolve => setTimeout(resolve, 50))

    // 验证通信
    expect(events).toHaveLength(2)
    expect(events[0].from).toBe('plugin-a')
    expect(events[1].from).toBe('plugin-b')
  })
})
```

## 插件最佳实践

### 1. 命名规范

```typescript
// 好的命名
const goodPlugin: Plugin = {
  name: 'my-company-feature-plugin', // 使用连字符分隔
  version: '1.0.0', // 遵循语义化版本
  description: '提供特定功能的插件' // 清晰的描述
}

// 避免的命名
const badPlugin: Plugin = {
  name: 'plugin', // 太通用
  name: 'MyPlugin', // 使用驼峰命名
  name: 'my_plugin' // 使用下划线
}
```

### 2. 错误处理

```typescript
const robustPlugin: Plugin = {
  name: 'robust-plugin',

  async install(engine, options) {
    try {
      // 验证环境
      this.validateEnvironment()

      // 验证配置
      const config = this.validateConfig(options)

      // 初始化插件
      await this.initialize(engine, config)
    }
 catch (error) {
      // 记录错误
      console.error(`插件 ${this.name} 安装失败:`, error)

      // 清理已创建的资源
      await this.cleanup(engine)

      // 重新抛出错误
      throw error
    }
  },

  validateEnvironment() {
    if (typeof window === 'undefined' && this.requiresBrowser) {
      throw new Error('此插件需要浏览器环境')
    }
  },

  validateConfig(options: any) {
    if (!options.apiKey) {
      throw new Error('缺少必需的 apiKey 配置')
    }
    return options
  },

  async cleanup(engine: Engine) {
    // 清理逻辑
  }
}
```

### 3. 性能优化

```typescript
const optimizedPlugin: Plugin = {
  name: 'optimized-plugin',

  install(engine, options) {
    // 延迟初始化
    this.lazyInit = () => {
      if (!this.initialized) {
        this.doInitialization(engine, options)
        this.initialized = true
      }
    }

    // 只在需要时初始化
    engine.on('plugin:needed', this.lazyInit)
  },

  doInitialization(engine: Engine, options: any) {
    // 实际初始化逻辑
    console.log('插件初始化')
  }
}
```

### 4. 文档和元数据

```typescript
const wellDocumentedPlugin: Plugin = {
  name: 'well-documented-plugin',
  version: '1.2.3',
  description: '一个功能完整且文档齐全的示例插件',
  author: 'Your Name <your.email@example.com>',
  homepage: 'https://github.com/yourname/plugin',
  repository: 'https://github.com/yourname/plugin.git',
  license: 'MIT',
  keywords: ['plugin', 'example', 'documentation'],

  metadata: {
    category: 'utility',
    tags: ['helper', 'tools'],
    compatibility: {
      engine: '^2.0.0',
      node: '>=14.0.0',
      browser: true
    },
    features: [
      '功能1：数据处理',
      '功能2：事件管理',
      '功能3：状态同步'
    ],
    experimental: false
  },

  defaultOptions: {
    enabled: true,
    debug: false,
    timeout: 5000
  },

  install(engine, options) {
    // 插件实现
  }
}
```

## 插件生态系统

### 插件注册表

```typescript
// 插件注册表
class PluginRegistry {
  private plugins = new Map<string, Plugin>()

  register(plugin: Plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已存在`)
    }

    this.plugins.set(plugin.name, plugin)
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  search(query: string): Plugin[] {
    return this.list().filter(plugin =>
      plugin.name.includes(query)
      || plugin.description?.includes(query)
      || plugin.keywords?.some(keyword => keyword.includes(query))
    )
  }
}

// 全局注册表
const registry = new PluginRegistry()

// 注册插件
registry.register(myPlugin)

// 查找插件
const plugin = registry.get('my-plugin')
```

### 插件市场

```typescript
// 插件市场客户端
class PluginMarket {
  private baseUrl = 'https://plugins.ldesign.com/api'

  async search(query: string): Promise<Plugin[]> {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`)
    return response.json()
  }

  async getPlugin(name: string): Promise<Plugin> {
    const response = await fetch(`${this.baseUrl}/plugins/${name}`)
    return response.json()
  }

  async install(engine: Engine, name: string, options?: any): Promise<void> {
    const plugin = await this.getPlugin(name)
    engine.use(plugin, options)
  }

  async update(engine: Engine, name: string): Promise<void> {
    const currentPlugin = engine.getPlugin(name)
    if (!currentPlugin) {
      throw new Error(`插件 ${name} 未安装`)
    }

    const latestPlugin = await this.getPlugin(name)

    if (currentPlugin.version !== latestPlugin.version) {
      engine.unuse(currentPlugin)
      engine.use(latestPlugin)
    }
  }
}

// 使用插件市场
const market = new PluginMarket()

// 搜索插件
const plugins = await market.search('data processing')

// 安装插件
await market.install(engine, 'data-processor-plugin')
```

这个插件接口 API 文档提供了完整的插件开发指南，包括接口定义、生命周期管理、通信机制、配置管理、依赖处理、测试方法和最佳实践。开发者可以根据这些规范创建高质量、可维护的插件。
