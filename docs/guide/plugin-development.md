# 插件开发

本章将详细介绍如何开发自定义插件，包括插件架构、开发流程、最佳实践和高级技巧。

## 插件开发基础

### 插件架构概述

插件是 @ldesign/engine 的核心扩展机制，每个插件都是一个独立的模块，具有以下特点：

- **独立性**：插件可以独立开发、测试和发布
- **可组合性**：多个插件可以组合使用
- **生命周期管理**：支持安装、启用、禁用、卸载等操作
- **依赖管理**：支持插件间的依赖关系
- **配置化**：支持灵活的配置选项

### 插件接口定义

```typescript
interface Plugin {
  // 基本信息
  name: string // 插件唯一标识
  version: string // 插件版本
  description?: string // 插件描述
  author?: string // 插件作者
  license?: string // 插件许可证
  homepage?: string // 插件主页
  keywords?: string[] // 插件关键词

  // 依赖关系
  dependencies?: string[] // 必需依赖
  peerDependencies?: string[] // 对等依赖
  optionalDependencies?: string[] // 可选依赖

  // 生命周期钩子
  install: (engine: Engine) => void | Promise<void>
  uninstall?: (engine: Engine) => void | Promise<void>
  enable?: (engine: Engine) => void | Promise<void>
  disable?: (engine: Engine) => void | Promise<void>

  // 配置
  config?: any // 默认配置
  schema?: JSONSchema // 配置验证模式

  // 元数据
  tags?: string[] // 插件标签
  category?: string // 插件分类
  priority?: number // 加载优先级

  // 兼容性
  engines?: {
    '@ldesign/engine': string // 支持的引擎版本
  }
}
```

## 开发环境搭建

### 项目结构

推荐的插件项目结构：

```
my-plugin/
├── src/
│   ├── index.ts              # 插件入口
│   ├── plugin.ts             # 插件主逻辑
│   ├── config.ts             # 配置定义
│   ├── types.ts              # 类型定义
│   ├── services/             # 服务层
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── utils/                # 工具函数
│   │   ├── helpers.ts
│   │   └── validators.ts
│   └── components/           # 组件（如果有UI）
│       └── PluginUI.vue
├── tests/
│   ├── unit/
│   │   ├── plugin.test.ts
│   │   └── services.test.ts
│   ├── integration/
│   │   └── plugin.integration.test.ts
│   └── fixtures/
│       └── mock-data.ts
├── docs/
│   ├── README.md
│   ├── API.md
│   └── examples/
├── examples/
│   ├── basic-usage.ts
│   └── advanced-usage.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── rollup.config.js
└── .eslintrc.js
```

### 初始化项目

```bash
# 创建项目目录
mkdir my-plugin
cd my-plugin

# 初始化 package.json
npm init -y

# 安装依赖
npm install @ldesign/engine

# 安装开发依赖
npm install --save-dev \
  typescript \
  @types/node \
  jest \
  @types/jest \
  ts-jest \
  rollup \
  @rollup/plugin-typescript \
  @rollup/plugin-node-resolve \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

## 插件开发实战

### 简单插件示例

让我们从一个简单的通知插件开始：

```typescript
// src/types.ts
export interface NotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  duration: number
  maxNotifications: number
  enableSound: boolean
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}
```

```typescript
// src/config.ts
import { NotificationConfig } from './types'

export const defaultConfig: NotificationConfig = {
  position: 'top-right',
  duration: 5000,
  maxNotifications: 5,
  enableSound: false
}

export const configSchema = {
  type: 'object',
  properties: {
    position: {
      type: 'string',
      enum: ['top-right', 'top-left', 'bottom-right', 'bottom-left']
    },
    duration: {
      type: 'number',
      minimum: 1000,
      maximum: 30000
    },
    maxNotifications: {
      type: 'number',
      minimum: 1,
      maximum: 20
    },
    enableSound: {
      type: 'boolean'
    }
  },
  required: ['position', 'duration', 'maxNotifications', 'enableSound']
}
```

```typescript
// src/plugin.ts
import { Notification, NotificationConfig } from './types'
import { configSchema, defaultConfig } from './config'
import { Engine, Plugin } from '@ldesign/engine'

export class NotificationPlugin implements Plugin {
  name = 'notification-plugin'
  version = '1.0.0'
  description = '通知管理插件'
  author = 'Your Name'
  license = 'MIT'

  config = defaultConfig
  schema = configSchema

  private engine!: Engine
  private config!: NotificationConfig
  private notifications: Notification[] = []
  private container?: HTMLElement

  async install(engine: Engine): Promise<void> {
    this.engine = engine
    this.config = { ...defaultConfig, ...engine.getPluginConfig(this.name) }

    // 创建通知容器
    this.createContainer()

    // 注册方法
    engine.addMethod('notify', this.notify.bind(this))
    engine.addMethod('clearNotifications', this.clearNotifications.bind(this))
    engine.addMethod('getNotifications', this.getNotifications.bind(this))

    // 注册事件监听器
    engine.on('notification:show', this.onNotificationShow.bind(this))
    engine.on('notification:hide', this.onNotificationHide.bind(this))

    console.log('Notification Plugin 安装完成')
  }

  async uninstall(engine: Engine): Promise<void> {
    // 清理 DOM
    if (this.container) {
      this.container.remove()
    }

    // 移除方法
    engine.removeMethod('notify')
    engine.removeMethod('clearNotifications')
    engine.removeMethod('getNotifications')

    // 移除事件监听器
    engine.off('notification:show', this.onNotificationShow)
    engine.off('notification:hide', this.onNotificationHide)

    console.log('Notification Plugin 卸载完成')
  }

  async enable(engine: Engine): Promise<void> {
    console.log('Notification Plugin 已启用')
  }

  async disable(engine: Engine): Promise<void> {
    this.clearNotifications()
    console.log('Notification Plugin 已禁用')
  }

  // 公共方法
  notify(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId()
    const fullNotification: Notification = {
      id,
      duration: this.config.duration,
      ...notification
    }

    // 检查通知数量限制
    if (this.notifications.length >= this.config.maxNotifications) {
      this.removeOldestNotification()
    }

    this.notifications.push(fullNotification)
    this.renderNotification(fullNotification)

    // 播放声音
    if (this.config.enableSound) {
      this.playNotificationSound()
    }

    // 自动隐藏
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        this.hideNotification(id)
      }, fullNotification.duration)
    }

    // 触发事件
    this.engine.emit('notification:show', fullNotification)

    return id
  }

  hideNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      const notification = this.notifications[index]
      this.notifications.splice(index, 1)
      this.removeNotificationElement(id)
      this.engine.emit('notification:hide', notification)
    }
  }

  clearNotifications(): void {
    this.notifications.forEach((notification) => {
      this.removeNotificationElement(notification.id)
    })
    this.notifications = []
    this.engine.emit('notification:clear')
  }

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  // 私有方法
  private createContainer(): void {
    this.container = document.createElement('div')
    this.container.className = `notification-container notification-${this.config.position}`
    this.container.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      ${this.getPositionStyles()}
    `
    document.body.appendChild(this.container)
  }

  private getPositionStyles(): string {
    switch (this.config.position) {
      case 'top-right':
        return 'top: 20px; right: 20px;'
      case 'top-left':
        return 'top: 20px; left: 20px;'
      case 'bottom-right':
        return 'bottom: 20px; right: 20px;'
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;'
      default:
        return 'top: 20px; right: 20px;'
    }
  }

  private renderNotification(notification: Notification): void {
    if (!this.container)
return

    const element = document.createElement('div')
    element.id = `notification-${notification.id}`
    element.className = `notification notification-${notification.type}`
    element.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 10px;
      padding: 16px;
      pointer-events: auto;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `

    element.innerHTML = `
      <div class="notification-header">
        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
          ${notification.title}
        </h4>
        <button class="notification-close" style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
        ">&times;</button>
      </div>
      <div class="notification-body">
        <p style="margin: 0; color: #666; font-size: 14px;">
          ${notification.message}
        </p>
      </div>
      ${notification.actions ? this.renderActions(notification.actions) : ''}
    `

    // 添加关闭事件
    const closeBtn = element.querySelector('.notification-close')
    closeBtn?.addEventListener('click', () => {
      this.hideNotification(notification.id)
    })

    // 添加动作事件
    notification.actions?.forEach((action, index) => {
      const actionBtn = element.querySelector(`[data-action="${index}"]`)
      actionBtn?.addEventListener('click', () => {
        action.action()
        this.hideNotification(notification.id)
      })
    })

    this.container.appendChild(element)
  }

  private renderActions(actions: NotificationAction[]): string {
    return `
      <div class="notification-actions" style="margin-top: 12px;">
        ${actions.map((action, index) => `
          <button
            data-action="${index}"
            style="
              background: ${action.style === 'primary' ? '#007bff' : '#6c757d'};
              color: white;
              border: none;
              border-radius: 4px;
              padding: 6px 12px;
              margin-right: 8px;
              cursor: pointer;
              font-size: 12px;
            "
          >
            ${action.label}
          </button>
        `).join('')}
      </div>
    `
  }

  private removeNotificationElement(id: string): void {
    const element = document.getElementById(`notification-${id}`)
    if (element) {
      element.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => {
        element.remove()
      }, 300)
    }
  }

  private removeOldestNotification(): void {
    if (this.notifications.length > 0) {
      const oldest = this.notifications[0]
      this.hideNotification(oldest.id)
    }
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private playNotificationSound(): void {
    // 创建简单的通知声音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  // 事件处理器
  private onNotificationShow(notification: Notification): void {
    console.log('通知显示:', notification.title)
  }

  private onNotificationHide(notification: Notification): void {
    console.log('通知隐藏:', notification.title)
  }
}
```

```typescript
// src/index.ts
export { NotificationPlugin } from './plugin'
export * from './types'
export * from './config'

// 创建插件实例
export const notificationPlugin = new NotificationPlugin()

// 默认导出
export default notificationPlugin
```

### 使用插件

```typescript
// 使用示例
import { notificationPlugin } from './my-plugin'
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 注册插件
engine.use(notificationPlugin, {
  position: 'top-right',
  duration: 3000,
  enableSound: true
})

engine.start()

// 使用通知功能
engine.notify({
  type: 'success',
  title: '操作成功',
  message: '数据已保存'
})

engine.notify({
  type: 'warning',
  title: '注意',
  message: '请确认您的操作',
  actions: [
    {
      label: '确认',
      action: () => console.log('用户确认'),
      style: 'primary'
    },
    {
      label: '取消',
      action: () => console.log('用户取消'),
      style: 'secondary'
    }
  ]
})
```

## 高级插件开发

### 插件间通信

```typescript
// 数据提供者插件
export class DataProviderPlugin implements Plugin {
  name = 'data-provider'
  version = '1.0.0'

  install(engine: Engine) {
    // 注册数据服务
    engine.registerService('dataService', {
      async fetchData(url: string) {
        const response = await fetch(url)
        return response.json()
      },

      async saveData(data: any) {
        // 保存数据逻辑
        return { success: true, id: Date.now() }
      }
    })

    // 发布数据事件
    engine.addMethod('publishData', (data: any) => {
      engine.emit('data:published', data)
    })
  }
}

// 数据消费者插件
export class DataConsumerPlugin implements Plugin {
  name = 'data-consumer'
  version = '1.0.0'
  dependencies = ['data-provider'] // 依赖数据提供者插件

  install(engine: Engine) {
    // 获取数据服务
    const dataService = engine.getService('dataService')

    // 监听数据事件
    engine.on('data:published', (data) => {
      console.log('收到数据:', data)
      this.processData(data)
    })

    // 添加数据处理方法
    engine.addMethod('processRemoteData', async (url: string) => {
      const data = await dataService.fetchData(url)
      return this.processData(data)
    })
  }

  private processData(data: any) {
    // 数据处理逻辑
    return { ...data, processed: true, timestamp: Date.now() }
  }
}
```

### 插件配置管理

```typescript
export class ConfigurablePlugin implements Plugin {
  name = 'configurable-plugin'
  version = '1.0.0'

  // 默认配置
  config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    cache: {
      enabled: true,
      ttl: 300000 // 5分钟
    }
  }

  // 配置验证模式
  schema = {
    type: 'object',
    properties: {
      apiUrl: { type: 'string', format: 'uri' },
      timeout: { type: 'number', minimum: 1000, maximum: 30000 },
      retries: { type: 'number', minimum: 0, maximum: 10 },
      cache: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          ttl: { type: 'number', minimum: 60000 }
        }
      }
    },
    required: ['apiUrl', 'timeout', 'retries']
  }

  private currentConfig: any

  install(engine: Engine) {
    // 获取合并后的配置
    this.currentConfig = engine.getPluginConfig(this.name)

    // 监听配置变化
    engine.on('plugin:config-updated', ({ pluginName, config }) => {
      if (pluginName === this.name) {
        this.onConfigUpdated(config)
      }
    })

    // 添加配置相关方法
    engine.addMethod('getPluginConfig', () => this.currentConfig)
    engine.addMethod('updatePluginConfig', (newConfig: any) => {
      engine.updatePluginConfig(this.name, newConfig)
    })
  }

  private onConfigUpdated(newConfig: any) {
    const oldConfig = this.currentConfig
    this.currentConfig = newConfig

    // 处理配置变化
    if (oldConfig.apiUrl !== newConfig.apiUrl) {
      this.reinitializeApiClient()
    }

    if (oldConfig.cache.enabled !== newConfig.cache.enabled) {
      this.toggleCache(newConfig.cache.enabled)
    }
  }

  private reinitializeApiClient() {
    // 重新初始化 API 客户端
  }

  private toggleCache(enabled: boolean) {
    // 切换缓存状态
  }
}
```

### 插件生命周期管理

```typescript
export class LifecyclePlugin implements Plugin {
  name = 'lifecycle-plugin'
  version = '1.0.0'

  private resources: any[] = []
  private timers: NodeJS.Timeout[] = []
  private eventListeners: Array<{ event: string, handler: Function }> = []

  async install(engine: Engine): Promise<void> {
    console.log('插件安装开始')

    // 初始化资源
    await this.initializeResources()

    // 注册事件监听器
    this.registerEventListeners(engine)

    // 启动定时任务
    this.startTimers()

    console.log('插件安装完成')
  }

  async uninstall(engine: Engine): Promise<void> {
    console.log('插件卸载开始')

    // 清理定时器
    this.clearTimers()

    // 移除事件监听器
    this.removeEventListeners(engine)

    // 清理资源
    await this.cleanupResources()

    console.log('插件卸载完成')
  }

  async enable(engine: Engine): Promise<void> {
    console.log('插件启用')
    // 恢复功能
    this.startTimers()
  }

  async disable(engine: Engine): Promise<void> {
    console.log('插件禁用')
    // 暂停功能
    this.clearTimers()
  }

  private async initializeResources(): Promise<void> {
    // 初始化数据库连接、文件句柄等
    this.resources.push(/* 资源对象 */)
  }

  private async cleanupResources(): Promise<void> {
    // 清理所有资源
    for (const resource of this.resources) {
      if (resource.close) {
        await resource.close()
      }
    }
    this.resources = []
  }

  private registerEventListeners(engine: Engine): void {
    const handlers = [
      { event: 'app:start', handler: this.onAppStart.bind(this) },
      { event: 'app:stop', handler: this.onAppStop.bind(this) }
    ]

    handlers.forEach(({ event, handler }) => {
      engine.on(event, handler)
      this.eventListeners.push({ event, handler })
    })
  }

  private removeEventListeners(engine: Engine): void {
    this.eventListeners.forEach(({ event, handler }) => {
      engine.off(event, handler)
    })
    this.eventListeners = []
  }

  private startTimers(): void {
    // 启动定时任务
    const timer = setInterval(() => {
      this.performPeriodicTask()
    }, 60000) // 每分钟执行一次

    this.timers.push(timer)
  }

  private clearTimers(): void {
    this.timers.forEach(timer => clearInterval(timer))
    this.timers = []
  }

  private onAppStart(): void {
    console.log('应用启动，插件响应')
  }

  private onAppStop(): void {
    console.log('应用停止，插件响应')
  }

  private performPeriodicTask(): void {
    console.log('执行周期性任务')
  }
}
```

## 插件测试

### 单元测试

```typescript
// tests/unit/notification-plugin.test.ts
import { NotificationPlugin } from '../../src/plugin'
import { Engine } from '@ldesign/engine'

describe('NotificationPlugin', () => {
  let engine: Engine
  let plugin: NotificationPlugin

  beforeEach(() => {
    // 模拟 DOM 环境
    document.body.innerHTML = ''

    engine = new Engine({
      name: 'test-engine',
      version: '1.0.0'
    })

    plugin = new NotificationPlugin()
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
    expect(engine.hasMethod('notify')).toBe(true)
    expect(engine.hasMethod('clearNotifications')).toBe(true)
  })

  test('应该能够显示通知', async () => {
    await engine.registerPlugin(plugin)
    await engine.installPlugin(plugin.name)

    const notificationId = engine.notify({
      type: 'info',
      title: '测试通知',
      message: '这是一条测试消息'
    })

    expect(notificationId).toBeDefined()
    expect(engine.getNotifications()).toHaveLength(1)

    const notification = engine.getNotifications()[0]
    expect(notification.title).toBe('测试通知')
    expect(notification.message).toBe('这是一条测试消息')
    expect(notification.type).toBe('info')
  })

  test('应该能够隐藏通知', async () => {
    await engine.registerPlugin(plugin)
    await engine.installPlugin(plugin.name)

    const notificationId = engine.notify({
      type: 'info',
      title: '测试通知',
      message: '这是一条测试消息'
    })

    expect(engine.getNotifications()).toHaveLength(1)

    engine.hideNotification(notificationId)

    expect(engine.getNotifications()).toHaveLength(0)
  })

  test('应该限制通知数量', async () => {
    await engine.registerPlugin(plugin, {
      maxNotifications: 2
    })
    await engine.installPlugin(plugin.name)

    // 添加 3 个通知
    engine.notify({ type: 'info', title: '通知1', message: '消息1' })
    engine.notify({ type: 'info', title: '通知2', message: '消息2' })
    engine.notify({ type: 'info', title: '通知3', message: '消息3' })

    // 应该只有 2 个通知（最新的两个）
    const notifications = engine.getNotifications()
    expect(notifications).toHaveLength(2)
    expect(notifications[0].title).toBe('通知2')
    expect(notifications[1].title).toBe('通知3')
  })

  test('应该触发正确的事件', async () => {
    await engine.registerPlugin(plugin)
    await engine.installPlugin(plugin.name)

    const showHandler = jest.fn()
    const hideHandler = jest.fn()

    engine.on('notification:show', showHandler)
    engine.on('notification:hide', hideHandler)

    const notificationId = engine.notify({
      type: 'info',
      title: '测试通知',
      message: '测试消息'
    })

    expect(showHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        id: notificationId,
        title: '测试通知',
        message: '测试消息'
      })
    )

    engine.hideNotification(notificationId)

    expect(hideHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        id: notificationId,
        title: '测试通知',
        message: '测试消息'
      })
    )
  })
})
```

### 集成测试

```typescript
// tests/integration/plugin-integration.test.ts
import { NotificationPlugin } from '../../src/plugin'
import { DataConsumerPlugin, DataProviderPlugin } from '../fixtures/test-plugins'
import { Engine } from '@ldesign/engine'

describe('插件集成测试', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine({
      name: 'integration-test',
      version: '1.0.0'
    })
  })

  test('多个插件应该能够协同工作', async () => {
    const notificationPlugin = new NotificationPlugin()
    const dataProvider = new DataProviderPlugin()
    const dataConsumer = new DataConsumerPlugin()

    // 注册插件
    await engine.registerPlugins([
      dataProvider,
      dataConsumer,
      notificationPlugin
    ])

    // 安装插件
    await engine.installPlugin('data-provider')
    await engine.installPlugin('data-consumer')
    await engine.installPlugin('notification-plugin')

    // 测试插件间通信
    const testData = { id: 1, name: 'Test Data' }

    // 监听数据处理完成事件
    engine.on('data:processed', (processedData) => {
      // 显示处理完成通知
      engine.notify({
        type: 'success',
        title: '数据处理完成',
        message: `处理了数据: ${processedData.name}`
      })
    })

    // 发布数据
    engine.publishData(testData)

    // 验证通知是否显示
    await new Promise(resolve => setTimeout(resolve, 100))

    const notifications = engine.getNotifications()
    expect(notifications).toHaveLength(1)
    expect(notifications[0].title).toBe('数据处理完成')
  })
})
```

## 插件发布

### package.json 配置

```json
{
  "name": "@your-org/notification-plugin",
  "version": "1.0.0",
  "description": "A notification plugin for @ldesign/engine",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": [
    "ldesign",
    "engine",
    "plugin",
    "notification",
    "ui"
  ],
  "peerDependencies": {
    "@ldesign/engine": "^1.0.0"
  },
  "devDependencies": {
    "@ldesign/engine": "^1.0.0",
    "typescript": "^4.5.0",
    "jest": "^27.0.0",
    "rollup": "^2.60.0"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/notification-plugin.git"
  },
  "bugs": {
    "url": "https://github.com/your-org/notification-plugin/issues"
  },
  "homepage": "https://github.com/your-org/notification-plugin#readme",
  "license": "MIT"
}
```

### 构建配置

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

const isProduction = process.env.NODE_ENV === 'production'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'NotificationPlugin',
      sourcemap: true,
      globals: {
        '@ldesign/engine': 'LDesignEngine'
      }
    }
  ],
  external: ['@ldesign/engine'],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    }),
    isProduction && terser()
  ].filter(Boolean)
}
```

## 插件开发最佳实践

### 1. 设计原则

- **单一职责**：每个插件只负责一个特定功能
- **松耦合**：插件之间通过事件和服务进行通信
- **可配置**：提供灵活的配置选项
- **向后兼容**：保持 API 的向后兼容性

### 2. 错误处理

```typescript
export class RobustPlugin implements Plugin {
  name = 'robust-plugin'
  version = '1.0.0'

  async install(engine: Engine): Promise<void> {
    try {
      await this.initializePlugin(engine)
    }
 catch (error) {
      // 记录错误但不阻止其他插件
      console.error(`插件 ${this.name} 安装失败:`, error)

      // 触发错误事件
      engine.emit('plugin:install-failed', {
        plugin: this.name,
        error
      })

      // 可以选择抛出错误或继续
      throw error
    }
  }

  private async initializePlugin(engine: Engine): Promise<void> {
    // 插件初始化逻辑
  }
}
```

### 3. 性能优化

```typescript
export class OptimizedPlugin implements Plugin {
  name = 'optimized-plugin'
  version = '1.0.0'

  private cache = new Map()
  private debounceTimers = new Map()

  install(engine: Engine) {
    // 使用防抖优化频繁操作
    engine.addMethod('debouncedOperation', this.debounce((data: any) => {
      this.performOperation(data)
    }, 300))

    // 使用缓存优化重复计算
    engine.addMethod('cachedComputation', (input: string) => {
      if (this.cache.has(input)) {
        return this.cache.get(input)
      }

      const result = this.expensiveComputation(input)
      this.cache.set(input, result)
      return result
    })
  }

  private debounce(func: Function, delay: number) {
    return (...args: any[]) => {
      const key = JSON.stringify(args)

      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key))
      }

      const timer = setTimeout(() => {
        func.apply(this, args)
        this.debounceTimers.delete(key)
      }, delay)

      this.debounceTimers.set(key, timer)
    }
  }

  private performOperation(data: any): void {
    // 执行操作
  }

  private expensiveComputation(input: string): any {
    // 昂贵的计算
    return { result: input.toUpperCase() }
  }
}
```

### 4. 文档和示例

为您的插件提供完整的文档：

```markdown
# Notification Plugin

一个用于 @ldesign/engine 的通知管理插件。

## 安装

```bash
npm install @your-org/notification-plugin
```

## 使用

```typescript
import { notificationPlugin } from '@your-org/notification-plugin'
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

engine.use(notificationPlugin)
engine.start()

// 显示通知
engine.notify({
  type: 'success',
  title: '成功',
  message: '操作完成'
})
```

## API

### notify(notification)

显示一个通知。

**参数：**
- `notification` (Object): 通知对象
  - `type` (string): 通知类型 ('info' | 'success' | 'warning' | 'error')
  - `title` (string): 通知标题
  - `message` (string): 通知消息
  - `duration` (number, 可选): 显示时长（毫秒）
  - `actions` (Array, 可选): 操作按钮

**返回值：**
- `string`: 通知 ID

### 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `position` | string | 'top-right' | 通知位置 |
| `duration` | number | 5000 | 默认显示时长 |
| `maxNotifications` | number | 5 | 最大通知数量 |
| `enableSound` | boolean | false | 是否启用声音 |
```

## 下一步

现在您已经掌握了插件开发的核心技能，可以：

- 查看 [插件系统](/guide/plugin-system) 了解更多插件机制
- 阅读 [API 文档](/api/) 获取完整的 API 参考
- 浏览 [示例](/examples/) 学习更多插件开发技巧
- 参与 [社区讨论](https://github.com/ldesign/engine/discussions) 分享您的插件
