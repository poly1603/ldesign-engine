# 插件开发指南

学习如何为 @ldesign/engine 创建自定义插件。

## 📋 插件基础

### 什么是插件?

插件是扩展引擎功能的模块化单元。每个插件都遵循统一的接口,可以在任何框架中使用。

### 插件接口

```typescript
interface Plugin {
  // 必需
  name: string                    // 插件名称 (唯一标识)
  version?: string                // 插件版本
  dependencies?: string[]         // 依赖的其他插件
  
  // 生命周期钩子
  install(context: PluginContext): void | Promise<void>
  beforeInstall?(context: PluginContext): void | Promise<void>
  afterInstall?(context: PluginContext): void | Promise<void>
  uninstall?(context: PluginContext): void | Promise<void>
  beforeUninstall?(context: PluginContext): void | Promise<void>
  afterUninstall?(context: PluginContext): void | Promise<void>
  
  // 配置
  config?: Record<string, any>
  defaultConfig?: Record<string, any>
}
```

### 插件上下文

```typescript
interface PluginContext {
  engine: CoreEngine          // 引擎实例
  logger: Logger              // 日志器
  config: ConfigManager       // 配置管理器
  events: EventManager        // 事件管理器
  state: StateManager         // 状态管理器
  cache: CacheManager         // 缓存管理器
  lifecycle: LifecycleManager // 生命周期管理器
  middleware: MiddlewareManager // 中间件管理器
  plugins: PluginManager      // 插件管理器
  di: DIContainer            // 依赖注入容器
}
```

## 🎯 创建简单插件

### 示例: Hello World 插件

```typescript
import type { Plugin, PluginContext } from '@ldesign/engine-core'

export function createHelloPlugin(message: string = 'Hello World'): Plugin {
  return {
    name: 'hello',
    version: '1.0.0',
    
    install(context: PluginContext) {
      const { engine, logger } = context
      
      // 添加方法到引擎
      ;(engine as any).sayHello = () => {
        logger.info(message)
        return message
      }
      
      logger.debug('[hello] Plugin installed')
    },
    
    uninstall(context: PluginContext) {
      const { engine, logger } = context
      
      // 清理
      delete (engine as any).sayHello
      
      logger.debug('[hello] Plugin uninstalled')
    }
  }
}

// 使用
await engine.use(createHelloPlugin('你好,世界!'))
engine.sayHello() // "你好,世界!"
```

## 🔧 实战案例

### 案例 1: 日志收集插件

```typescript
interface LogCollectorConfig {
  endpoint: string
  batchSize: number
  flushInterval: number
}

export function createLogCollectorPlugin(config: LogCollectorConfig): Plugin {
  let logBuffer: any[] = []
  let flushTimer: any = null
  
  const flush = async () => {
    if (logBuffer.length === 0) return
    
    try {
      await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logBuffer })
      })
      logBuffer = []
    } catch (error) {
      console.error('Failed to flush logs:', error)
    }
  }
  
  return {
    name: 'log-collector',
    version: '1.0.0',
    
    install(context: PluginContext) {
      const { events, logger } = context
      
      // 监听所有日志事件
      events.on('logger:log', (data) => {
        logBuffer.push({
          level: data.level,
          message: data.message,
          timestamp: Date.now()
        })
        
        // 达到批量大小时刷新
        if (logBuffer.length >= config.batchSize) {
          flush()
        }
      })
      
      // 定时刷新
      flushTimer = setInterval(flush, config.flushInterval)
      
      logger.debug('[log-collector] Plugin installed')
    },
    
    async uninstall(context: PluginContext) {
      const { logger } = context
      
      // 清理定时器
      if (flushTimer) {
        clearInterval(flushTimer)
      }
      
      // 刷新剩余日志
      await flush()
      
      logger.debug('[log-collector] Plugin uninstalled')
    }
  }
}
```

### 案例 2: 权限管理插件

```typescript
interface PermissionConfig {
  roles: Record<string, string[]>  // 角色 -> 权限列表
  defaultRole: string
}

export function createPermissionPlugin(config: PermissionConfig): Plugin {
  return {
    name: 'permission',
    version: '1.0.0',
    
    install(context: PluginContext) {
      const { engine, state, events, logger } = context
      
      // 初始化权限状态
      state.setState('permission', {
        currentRole: config.defaultRole,
        roles: config.roles
      })
      
      // 设置角色
      ;(engine as any).setRole = (role: string) => {
        if (!config.roles[role]) {
          throw new Error(`Role "${role}" not found`)
        }
        
        const oldRole = state.getState('permission.currentRole')
        state.setState('permission.currentRole', role)
        
        events.emit('permission:role-changed', {
          from: oldRole,
          to: role
        })
        
        logger.debug(`[permission] Role changed: ${oldRole} -> ${role}`)
      }
      
      // 检查权限
      ;(engine as any).hasPermission = (permission: string): boolean => {
        const role = state.getState('permission.currentRole')
        const permissions = config.roles[role] || []
        return permissions.includes(permission)
      }
      
      // 获取当前角色
      ;(engine as any).getRole = (): string => {
        return state.getState('permission.currentRole')
      }
      
      logger.debug('[permission] Plugin installed')
    },
    
    uninstall(context: PluginContext) {
      const { engine, state, logger } = context
      
      // 清理状态
      state.setState('permission', undefined)
      
      // 移除方法
      delete (engine as any).setRole
      delete (engine as any).hasPermission
      delete (engine as any).getRole
      
      logger.debug('[permission] Plugin uninstalled')
    }
  }
}

// 使用
await engine.use(createPermissionPlugin({
  roles: {
    admin: ['read', 'write', 'delete'],
    user: ['read', 'write'],
    guest: ['read']
  },
  defaultRole: 'guest'
}))

engine.setRole('admin')
engine.hasPermission('delete') // true
engine.setRole('user')
engine.hasPermission('delete') // false
```

### 案例 3: 路由插件

```typescript
interface RouteConfig {
  path: string
  component: any
  meta?: Record<string, any>
}

interface RouterConfig {
  routes: RouteConfig[]
  mode?: 'hash' | 'history'
}

export function createRouterPlugin(config: RouterConfig): Plugin {
  return {
    name: 'router',
    version: '1.0.0',
    dependencies: ['permission'], // 可选依赖权限插件
    
    install(context: PluginContext) {
      const { engine, state, events, logger } = context
      
      // 初始化路由状态
      state.setState('router', {
        routes: config.routes,
        currentPath: window.location.pathname,
        history: []
      })
      
      // 导航到指定路由
      ;(engine as any).navigate = (path: string) => {
        const route = config.routes.find(r => r.path === path)
        if (!route) {
          throw new Error(`Route "${path}" not found`)
        }
        
        // 检查权限 (如果有权限插件)
        if ((engine as any).hasPermission) {
          const requiredPermission = route.meta?.permission
          if (requiredPermission && !(engine as any).hasPermission(requiredPermission)) {
            throw new Error(`Permission denied for route "${path}"`)
          }
        }
        
        const oldPath = state.getState('router.currentPath')
        
        // 更新路径
        state.setState('router.currentPath', path)
        
        // 更新历史
        const history = state.getState('router.history') || []
        history.push(path)
        state.setState('router.history', history)
        
        // 更新浏览器 URL
        if (config.mode === 'history') {
          window.history.pushState({}, '', path)
        } else {
          window.location.hash = path
        }
        
        // 发射事件
        events.emit('router:navigated', {
          from: oldPath,
          to: path,
          route
        })
        
        logger.debug(`[router] Navigated: ${oldPath} -> ${path}`)
      }
      
      // 获取当前路由
      ;(engine as any).getCurrentRoute = () => {
        const path = state.getState('router.currentPath')
        return config.routes.find(r => r.path === path)
      }
      
      // 后退
      ;(engine as any).goBack = () => {
        const history = state.getState('router.history') || []
        if (history.length > 1) {
          history.pop() // 移除当前
          const prevPath = history[history.length - 1]
          ;(engine as any).navigate(prevPath)
        }
      }
      
      logger.debug('[router] Plugin installed')
    },
    
    uninstall(context: PluginContext) {
      const { engine, state, logger } = context
      
      state.setState('router', undefined)
      delete (engine as any).navigate
      delete (engine as any).getCurrentRoute
      delete (engine as any).goBack
      
      logger.debug('[router] Plugin uninstalled')
    }
  }
}
```

## 🎨 最佳实践

### 1. 使用工厂函数

```typescript
// ✅ 推荐: 使用工厂函数
export function createMyPlugin(config: MyConfig): Plugin {
  return { /* ... */ }
}

// ❌ 不推荐: 直接导出对象
export const myPlugin: Plugin = { /* ... */ }
```

### 2. 提供类型定义

```typescript
// 为扩展的引擎方法提供类型
export interface MyPluginExtensions {
  myMethod(): void
}

declare module '@ldesign/engine-core' {
  interface CoreEngine extends MyPluginExtensions {}
}
```

### 3. 清理资源

```typescript
install(context) {
  // 保存需要清理的资源
  this.timer = setInterval(() => {}, 1000)
}

uninstall(context) {
  // 确保清理所有资源
  if (this.timer) {
    clearInterval(this.timer)
  }
}
```

### 4. 使用事件通信

```typescript
install(context) {
  const { events } = context
  
  // 发射事件而不是直接调用
  events.emit('my-plugin:action', { data: 'value' })
  
  // 监听其他插件的事件
  events.on('other-plugin:event', (data) => {
    // 响应事件
  })
}
```

### 5. 错误处理

```typescript
install(context) {
  const { logger } = context
  
  try {
    // 可能失败的操作
  } catch (error) {
    logger.error('[my-plugin] Installation failed:', error)
    throw error // 重新抛出让引擎处理
  }
}
```

## 📦 发布插件

### 1. 创建 package.json

```json
{
  "name": "@yourorg/engine-plugin-name",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "@ldesign/engine-core": "^1.0.0"
  }
}
```

### 2. 导出插件

```typescript
// src/index.ts
export { createMyPlugin } from './plugin'
export type { MyPluginConfig } from './types'
```

### 3. 编写文档

```markdown
# @yourorg/engine-plugin-name

## 安装
\`\`\`bash
pnpm add @yourorg/engine-plugin-name
\`\`\`

## 使用
\`\`\`typescript
import { createMyPlugin } from '@yourorg/engine-plugin-name'

await engine.use(createMyPlugin({ /* config */ }))
\`\`\`
```

## 🔍 调试插件

```typescript
export function createMyPlugin(config: MyConfig): Plugin {
  return {
    name: 'my-plugin',
    
    beforeInstall(context) {
      console.log('[my-plugin] Before install')
    },
    
    install(context) {
      const { logger } = context
      
      // 使用日志而不是 console.log
      logger.debug('[my-plugin] Installing...')
      logger.info('[my-plugin] Config:', config)
      
      // 在开发环境暴露调试方法
      if (context.engine.config.get('debug')) {
        ;(window as any).__MY_PLUGIN__ = {
          getState: () => context.state.getState('my-plugin'),
          config
        }
      }
    }
  }
}
```

## 📚 参考资源

- [插件 API 参考](../api/plugin-manager.md)
- [内置插件源码](../../packages/core/src/plugin/plugins/)
- [示例项目](../../examples/)

## 💡 提示

- 插件名称应该唯一
- 使用语义化版本号
- 提供完整的 TypeScript 类型
- 编写单元测试
- 提供使用示例和文档
