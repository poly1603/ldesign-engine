# Engine 事件命名空间使用指南

## 📋 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 参考](#api-参考)
- [高级用法](#高级用法)
- [最佳实践](#最佳实践)
- [迁移指南](#迁移指南)

## 概述

事件命名空间为 `@ldesign/engine` 提供了事件隔离和组织功能，解决了大型应用中的事件名冲突问题。

### 🎯 解决的问题

- **命名冲突**: 不同模块使用相同事件名
- **事件管理**: 难以追踪和组织大量事件
- **模块隔离**: 缺少模块间的事件边界
- **批量操作**: 难以对相关事件进行批量处理

### ✨ 核心特性

- ✅ **自动前缀**: 事件名自动添加命名空间前缀
- ✅ **层级结构**: 支持无限层级的子命名空间
- ✅ **事件继承**: 可选的父命名空间事件继承
- ✅ **批量操作**: 支持批量监听和触发
- ✅ **通配符**: 监听命名空间下的所有事件
- ✅ **统计监控**: 详细的命名空间统计信息

## 快速开始

### 基础使用

```typescript
import { createEventManager, createNamespaceManager } from '@ldesign/engine-core'

// 创建事件管理器和命名空间管理器
const eventManager = createEventManager()
const nsManager = createNamespaceManager(eventManager)

// 创建命名空间
const userNs = nsManager.namespace('user')
const authNs = nsManager.namespace('user:auth')

// 监听事件（自动添加命名空间前缀）
userNs.on('login', (data) => {
  console.log('User logged in:', data)
})

// 触发事件
userNs.emit('login', { userId: 1, name: 'Alice' })
```

### 层级命名空间

```typescript
// 方式1：使用路径创建
const authNs = nsManager.namespace('app:user:auth')

// 方式2：逐级创建
const appNs = nsManager.namespace('app')
const userNs = appNs.createChild('user')
const authNs2 = userNs.createChild('auth')
```

## 核心概念

### 命名空间路径

```typescript
'app'              // 顶级命名空间
'app:user'         // app 下的 user 子命名空间
'app:user:auth'    // user 下的 auth 子命名空间
```

### 事件名转换

```typescript
const userNs = nsManager.namespace('user')

userNs.on('login', handler)  // 实际监听: 'user:login'
userNs.emit('logout')        // 实际触发: 'user:logout'
```

### 命名空间隔离

```typescript
const user1Ns = nsManager.namespace('module1:user')
const user2Ns = nsManager.namespace('module2:user')

user1Ns.emit('login')  // 只触发 'module1:user:login'
user2Ns.emit('login')  // 只触发 'module2:user:login'
```

## API 参考

### NamespaceManager

#### `namespace(path, config?)`

创建或获取命名空间。

```typescript
const userNs = nsManager.namespace('user', {
  separator: ':',
  inherit: false
})
```

#### `getGlobalStats()`

获取全局统计信息。

```typescript
const stats = nsManager.getGlobalStats()
console.log(`总命名空间: ${stats.totalNamespaces}`)
```

### EventNamespace

#### `emit(event, payload?)`

触发事件。

#### `on(event, handler)`

监听事件。

#### `onAll(handler)`

监听命名空间下的所有事件。

#### `emitBatch(events, payload?)`

批量触发事件。

#### `createChild(name, config?)`

创建子命名空间。

## 高级用法

### 模块化事件管理

```typescript
export class UserModule {
  private ns: EventNamespace

  constructor(nsManager: NamespaceManager) {
    this.ns = nsManager.namespace('app:user')
    this.setupListeners()
  }

  private setupListeners() {
    this.ns.on('login', this.handleLogin)
    this.ns.on('logout', this.handleLogout)
  }

  destroy() {
    this.ns.destroy()
  }
}
```

## 最佳实践

### 1. 使用层级结构

```typescript
// ✅ 推荐
'app:user:auth:login'
'app:user:profile:update'

// ❌ 不推荐
'user_auth_login'
```

### 2. 命名空间与模块对应

```typescript
class UserModule {
  ns = nsManager.namespace('app:user')
}

class AuthModule {
  ns = nsManager.namespace('app:auth')
}
```

### 3. 及时清理资源

```typescript
class FeatureModule {
  destroy() {
    this.ns.destroy()
  }
}
```

## 迁移指南

### 从普通事件系统迁移

**之前：**
```typescript
eventManager.on('user_login', handler)
eventManager.emit('user_login', data)
```

**迁移后：**
```typescript
const userNs = nsManager.namespace('user')
userNs.on('login', handler)
userNs.emit('login', data)
```

## 总结

事件命名空间提供了强大的事件组织和隔离功能，特别适合大型应用：

- ✅ 避免事件名冲突
- ✅ 清晰的模块边界
- ✅ 易于维护和调试
- ✅ 支持批量操作

开始使用命名空间，让您的事件系统更加健壮！