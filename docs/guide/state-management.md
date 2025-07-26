# 状态管理

状态管理是 @ldesign/engine 的核心功能之一，它提供了一个简单而强大的方式来管理应用程序的状态。本章将详细介绍如何使用状态管理功能，包括状态的创建、更新、监听和持久化。

## 状态基础

### 基本概念

状态管理系统包含以下核心概念：

- **状态 (State)**：应用程序的数据
- **状态树 (State Tree)**：所有状态的层次结构
- **状态路径 (State Path)**：访问嵌套状态的路径
- **状态监听器 (State Listener)**：监听状态变化的函数
- **状态持久化 (State Persistence)**：将状态保存到存储中

### 基本用法

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  initialState: {
    user: {
      id: null,
      name: '',
      email: '',
      isAuthenticated: false
    },
    ui: {
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false
    },
    app: {
      version: '1.0.0',
      lastUpdated: Date.now()
    }
  }
})

// 获取状态
const user = engine.getState('user')
const theme = engine.getState('ui.theme')

// 设置状态
engine.setState('user.name', 'Alice')
engine.setState('ui.theme', 'dark')

// 批量更新状态
engine.updateState({
  'user.isAuthenticated': true,
  'ui.language': 'en-US'
})
```

## 状态操作

### 获取状态

```typescript
// 获取根状态
const rootState = engine.getState()
console.log(rootState)
// {
//   user: { id: null, name: '', email: '', isAuthenticated: false },
//   ui: { theme: 'light', language: 'zh-CN', sidebarCollapsed: false },
//   app: { version: '1.0.0', lastUpdated: 1234567890 }
// }

// 获取特定状态
const user = engine.getState('user')
const userName = engine.getState('user.name')
const theme = engine.getState('ui.theme')

// 获取嵌套状态
const userProfile = engine.getState('user.profile.personal')

// 使用默认值
const settings = engine.getState('user.settings', { notifications: true })

// 获取多个状态
const states = engine.getStates(['user.name', 'ui.theme', 'app.version'])
console.log(states)
// {
//   'user.name': 'Alice',
//   'ui.theme': 'dark',
//   'app.version': '1.0.0'
// }
```

### 设置状态

```typescript
// 设置简单值
engine.setState('user.name', 'Alice')
engine.setState('ui.theme', 'dark')
engine.setState('app.isLoading', true)

// 设置对象
engine.setState('user', {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  isAuthenticated: true
})

// 设置嵌套对象
engine.setState('user.profile', {
  personal: {
    age: 25,
    location: 'Beijing'
  },
  professional: {
    title: 'Developer',
    company: 'Tech Corp'
  }
})

// 使用函数更新
engine.setState('user.loginCount', (current) => (current || 0) + 1)

// 条件设置
engine.setStateIf('user.lastLogin', Date.now(), (current) => !current)
```

### 批量更新

```typescript
// 批量更新多个状态
engine.updateState({
  'user.name': 'Bob',
  'user.email': 'bob@example.com',
  'ui.theme': 'dark',
  'ui.language': 'en-US'
})

// 使用函数批量更新
engine.updateState({
  'user.loginCount': (current) => (current || 0) + 1,
  'user.lastLogin': () => Date.now(),
  'app.sessionId': () => generateSessionId()
})

// 事务性更新（要么全部成功，要么全部失败）
try {
  await engine.updateStateTransaction({
    'user.balance': (current) => {
      if (current < 100) throw new Error('余额不足')
      return current - 100
    },
    'user.purchases': (current) => [...(current || []), newPurchase]
  })
} catch (error) {
  console.error('状态更新失败:', error)
}
```

### 删除状态

```typescript
// 删除特定状态
engine.deleteState('user.tempData')
engine.deleteState('ui.modal')

// 批量删除
engine.deleteStates(['user.cache', 'ui.tooltip', 'app.temp'])

// 清空状态分支
engine.clearState('user.notifications')

// 重置状态到初始值
engine.resetState('user')
engine.resetState('ui.theme')

// 重置所有状态
engine.resetAllState()
```

## 状态监听

### 基本监听

```typescript
// 监听特定状态变化
engine.onStateChange('user.name', (newValue, oldValue, path) => {
  console.log(`用户名从 "${oldValue}" 变更为 "${newValue}"`)
})

// 监听对象状态变化
engine.onStateChange('user', (newUser, oldUser) => {
  console.log('用户信息变化:', { newUser, oldUser })
})

// 监听嵌套状态变化
engine.onStateChange('user.profile.personal', (newProfile, oldProfile) => {
  console.log('个人资料变化:', newProfile)
})

// 一次性监听
engine.onceStateChange('app.initialized', (initialized) => {
  if (initialized) {
    console.log('应用初始化完成')
    startApplication()
  }
})
```

### 高级监听

```typescript
// 深度监听（监听所有子状态变化）
engine.onStateChangeDeep('user', (changes) => {
  console.log('用户状态深度变化:', changes)
  // changes: [
  //   { path: 'user.name', newValue: 'Alice', oldValue: '' },
  //   { path: 'user.email', newValue: 'alice@example.com', oldValue: '' }
  // ]
})

// 条件监听
engine.onStateChangeIf(
  'user.balance',
  (balance) => balance < 100, // 条件：余额小于100
  (balance) => {
    console.warn('余额不足:', balance)
    showLowBalanceWarning()
  }
)

// 节流监听（避免频繁触发）
engine.onStateChangeThrottled(
  'ui.scrollPosition',
  (position) => {
    updateScrollIndicator(position)
  },
  100 // 100ms 节流
)

// 防抖监听
engine.onStateChangeDebounced(
  'search.query',
  (query) => {
    performSearch(query)
  },
  300 // 300ms 防抖
)

// 批量监听
engine.onStatesChange(
  ['user.name', 'user.email', 'user.avatar'],
  (changes) => {
    console.log('用户基本信息变化:', changes)
    updateUserProfile(changes)
  }
)
```

### 监听器管理

```typescript
// 获取监听器 ID
const listenerId = engine.onStateChange('user.name', handler)

// 移除特定监听器
engine.offStateChange(listenerId)

// 移除所有监听器
engine.offStateChange('user.name')

// 暂停/恢复监听器
engine.pauseStateListener(listenerId)
engine.resumeStateListener(listenerId)

// 监听器信息
const listenerInfo = engine.getStateListenerInfo(listenerId)
console.log(listenerInfo)
// {
//   id: 'listener_123',
//   path: 'user.name',
//   handler: [Function],
//   options: { throttle: 100 },
//   active: true
// }
```

## 状态计算和派生

### 计算属性

```typescript
// 定义计算属性
engine.defineComputed('user.fullName', {
  dependencies: ['user.firstName', 'user.lastName'],
  compute: (firstName, lastName) => {
    return `${firstName} ${lastName}`.trim()
  }
})

engine.defineComputed('user.isVip', {
  dependencies: ['user.level', 'user.points'],
  compute: (level, points) => {
    return level >= 5 || points >= 10000
  }
})

engine.defineComputed('ui.isDarkMode', {
  dependencies: ['ui.theme'],
  compute: (theme) => theme === 'dark'
})

// 使用计算属性
const fullName = engine.getState('user.fullName')
const isVip = engine.getState('user.isVip')

// 监听计算属性变化
engine.onStateChange('user.fullName', (fullName) => {
  console.log('全名变化:', fullName)
})
```

### 派生状态

```typescript
// 定义派生状态
engine.defineDerived('dashboard.stats', {
  dependencies: ['users', 'orders', 'products'],
  derive: (users, orders, products) => {
    return {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalProducts: products.length,
      averageOrderValue: orders.reduce((sum, order) => sum + order.total, 0) / orders.length,
      topProducts: products
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map(p => ({ id: p.id, name: p.name, sales: p.sales }))
    }
  },
  cache: true, // 启用缓存
  ttl: 60000   // 缓存1分钟
})

// 异步派生状态
engine.defineDerivedAsync('user.recommendations', {
  dependencies: ['user.preferences', 'user.history'],
  derive: async (preferences, history) => {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify({ preferences, history })
    })
    return await response.json()
  },
  cache: true,
  ttl: 300000 // 缓存5分钟
})
```

### 状态选择器

```typescript
// 定义选择器
const userSelectors = {
  // 基本选择器
  getCurrentUser: (state) => state.user,
  
  // 计算选择器
  getAuthenticatedUser: (state) => {
    return state.user.isAuthenticated ? state.user : null
  },
  
  // 参数化选择器
  getUserById: (state, userId) => {
    return state.users.find(user => user.id === userId)
  },
  
  // 复合选择器
  getUserWithPermissions: (state) => {
    const user = state.user
    const permissions = state.permissions[user.role] || []
    return { ...user, permissions }
  }
}

// 注册选择器
engine.registerSelectors('user', userSelectors)

// 使用选择器
const currentUser = engine.select('user.getCurrentUser')
const authenticatedUser = engine.select('user.getAuthenticatedUser')
const specificUser = engine.select('user.getUserById', 123)

// 监听选择器结果变化
engine.onSelectorChange('user.getCurrentUser', (user) => {
  console.log('当前用户变化:', user)
})
```

## 状态持久化

### 基本持久化

```typescript
// 配置持久化
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'indexedDB'
    key: 'my-app-state',
    
    // 包含的状态路径
    include: [
      'user.preferences',
      'ui.theme',
      'ui.language',
      'app.settings'
    ],
    
    // 排除的状态路径
    exclude: [
      'user.tempData',
      'ui.modal',
      'app.cache'
    ],
    
    // 自动保存间隔（毫秒）
    autoSaveInterval: 5000,
    
    // 序列化配置
    serializer: {
      serialize: (state) => JSON.stringify(state),
      deserialize: (data) => JSON.parse(data)
    }
  }
})
```

### 高级持久化

```typescript
// 自定义存储适配器
class CustomStorageAdapter {
  async get(key: string): Promise<any> {
    // 从自定义存储获取数据
    const data = await customStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }
  
  async set(key: string, value: any): Promise<void> {
    // 保存到自定义存储
    await customStorage.setItem(key, JSON.stringify(value))
  }
  
  async remove(key: string): Promise<void> {
    // 从自定义存储删除
    await customStorage.removeItem(key)
  }
  
  async clear(): Promise<void> {
    // 清空自定义存储
    await customStorage.clear()
  }
}

// 使用自定义存储
engine.setPersistenceAdapter(new CustomStorageAdapter())

// 条件持久化
engine.setPersistenceCondition((path, value, oldValue) => {
  // 只持久化重要变化
  if (path.startsWith('user.temp')) return false
  if (path === 'ui.scrollPosition') return false
  if (typeof value === 'function') return false
  
  return true
})

// 加密持久化
engine.setPersistenceSerializer({
  serialize: (state) => {
    const json = JSON.stringify(state)
    return encrypt(json, encryptionKey)
  },
  deserialize: (data) => {
    const json = decrypt(data, encryptionKey)
    return JSON.parse(json)
  }
})
```

### 手动持久化控制

```typescript
// 手动保存状态
await engine.saveState()

// 手动加载状态
await engine.loadState()

// 保存特定状态
await engine.saveState(['user.preferences', 'ui.theme'])

// 清除持久化数据
await engine.clearPersistedState()

// 获取持久化信息
const persistenceInfo = engine.getPersistenceInfo()
console.log(persistenceInfo)
// {
//   enabled: true,
//   lastSaved: 1234567890,
//   size: 1024,
//   keys: ['user.preferences', 'ui.theme']
// }
```

## 状态验证

### 状态模式验证

```typescript
// 定义状态模式
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string', minLength: 1, maxLength: 50 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0, maximum: 150 },
    isAuthenticated: { type: 'boolean' },
    preferences: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: ['light', 'dark'] },
        language: { type: 'string', pattern: '^[a-z]{2}-[A-Z]{2}$' }
      }
    }
  },
  required: ['id', 'name', 'email']
}

// 注册状态模式
engine.registerStateSchema('user', userSchema)

// 验证状态
try {
  engine.setState('user', {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    age: 25,
    isAuthenticated: true
  })
} catch (error) {
  console.error('状态验证失败:', error.message)
}

// 自定义验证器
engine.registerStateValidator('user.email', (email) => {
  if (!email.includes('@')) {
    throw new Error('邮箱格式无效')
  }
  
  if (email.endsWith('@temp.com')) {
    throw new Error('不允许使用临时邮箱')
  }
  
  return true
})
```

### 状态约束

```typescript
// 定义状态约束
engine.addStateConstraint('user.balance', {
  min: 0,
  max: 1000000,
  validator: (balance) => {
    if (balance < 0) {
      throw new Error('余额不能为负数')
    }
    return true
  }
})

engine.addStateConstraint('user.age', {
  min: 0,
  max: 150,
  transform: (age) => Math.floor(age) // 自动转换为整数
})

// 状态依赖约束
engine.addStateDependencyConstraint({
  when: 'user.isVip',
  equals: true,
  then: {
    'user.maxPurchases': { min: 10 },
    'user.discountRate': { min: 0.1, max: 0.5 }
  }
})
```

## 状态调试

### 状态历史

```typescript
// 启用状态历史
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  stateHistory: {
    enabled: true,
    maxSize: 100, // 最多保存100个历史记录
    include: ['user', 'ui'], // 只记录特定状态的历史
    exclude: ['temp'] // 排除临时状态
  }
})

// 获取状态历史
const history = engine.getStateHistory('user.name')
console.log(history)
// [
//   { value: '', timestamp: 1234567890, action: 'init' },
//   { value: 'Alice', timestamp: 1234567891, action: 'set' },
//   { value: 'Bob', timestamp: 1234567892, action: 'set' }
// ]

// 撤销状态变化
engine.undoState('user.name') // 撤销到上一个值
engine.undoState('user.name', 2) // 撤销到2步之前

// 重做状态变化
engine.redoState('user.name')

// 回到特定时间点
engine.revertStateToTimestamp('user.name', 1234567891)

// 清除历史
engine.clearStateHistory('user.name')
engine.clearAllStateHistory()
```

### 状态快照

```typescript
// 创建状态快照
const snapshot = engine.createStateSnapshot()
console.log(snapshot)
// {
//   id: 'snapshot_123',
//   timestamp: 1234567890,
//   state: { user: {...}, ui: {...}, app: {...} }
// }

// 创建特定状态的快照
const userSnapshot = engine.createStateSnapshot(['user', 'ui.theme'])

// 恢复快照
engine.restoreStateSnapshot(snapshot.id)

// 比较快照
const diff = engine.compareStateSnapshots(snapshot1.id, snapshot2.id)
console.log(diff)
// {
//   added: ['user.newField'],
//   removed: ['user.oldField'],
//   changed: [
//     { path: 'user.name', from: 'Alice', to: 'Bob' }
//   ]
// }

// 管理快照
const snapshots = engine.getStateSnapshots()
engine.deleteStateSnapshot(snapshot.id)
engine.clearStateSnapshots()
```

### 状态监控

```typescript
// 启用状态监控
engine.enableStateMonitoring({
  logChanges: true,
  logLevel: 'debug',
  includeStackTrace: true,
  maxLogSize: 1000
})

// 监听状态变化事件
engine.on('state:changed', (event) => {
  console.log('状态变化:', event)
  // {
  //   path: 'user.name',
  //   newValue: 'Alice',
  //   oldValue: '',
  //   timestamp: 1234567890,
  //   source: 'setState',
  //   stackTrace: '...'
  // }
})

// 获取状态统计
const stats = engine.getStateStats()
console.log(stats)
// {
//   totalChanges: 123,
//   mostChangedPaths: [
//     { path: 'ui.scrollPosition', changes: 45 },
//     { path: 'user.lastActivity', changes: 23 }
//   ],
//   averageChangeFrequency: 2.5, // 每秒变化次数
//   memoryUsage: 1024 // 状态占用内存（字节）
// }
```

## 状态模式

### 状态机模式

```typescript
// 定义状态机
class UserStateMachine {
  private states = {
    'guest': {
      login: 'authenticating',
      register: 'registering'
    },
    'authenticating': {
      success: 'authenticated',
      failure: 'guest'
    },
    'authenticated': {
      logout: 'guest',
      suspend: 'suspended'
    },
    'suspended': {
      reactivate: 'authenticated',
      delete: 'deleted'
    },
    'deleted': {}
  }
  
  constructor(private engine: Engine) {
    this.engine.setState('user.state', 'guest')
    this.setupTransitions()
  }
  
  private setupTransitions() {
    this.engine.onStateChange('user.state', (newState, oldState) => {
      console.log(`用户状态从 ${oldState} 转换到 ${newState}`)
      this.engine.emit('user:state-changed', { from: oldState, to: newState })
    })
  }
  
  transition(action: string) {
    const currentState = this.engine.getState('user.state')
    const nextState = this.states[currentState]?.[action]
    
    if (nextState) {
      this.engine.setState('user.state', nextState)
      return true
    } else {
      console.warn(`无效的状态转换: ${currentState} -> ${action}`)
      return false
    }
  }
  
  canTransition(action: string): boolean {
    const currentState = this.engine.getState('user.state')
    return !!this.states[currentState]?.[action]
  }
}

// 使用状态机
const userStateMachine = new UserStateMachine(engine)

userStateMachine.transition('login') // guest -> authenticating
userStateMachine.transition('success') // authenticating -> authenticated
userStateMachine.transition('logout') // authenticated -> guest
```

### 状态同步模式

```typescript
// 多引擎状态同步
class StateSync {
  private engines: Engine[] = []
  private syncPaths: string[] = []
  
  constructor(engines: Engine[], syncPaths: string[]) {
    this.engines = engines
    this.syncPaths = syncPaths
    this.setupSync()
  }
  
  private setupSync() {
    this.engines.forEach((engine, index) => {
      this.syncPaths.forEach(path => {
        engine.onStateChange(path, (newValue) => {
          // 同步到其他引擎
          this.engines.forEach((otherEngine, otherIndex) => {
            if (otherIndex !== index) {
              otherEngine.setState(path, newValue, { sync: false })
            }
          })
        })
      })
    })
  }
  
  syncState(path: string, value: any) {
    this.engines.forEach(engine => {
      engine.setState(path, value, { sync: false })
    })
  }
}

// 使用状态同步
const mainEngine = new Engine({ name: 'main', version: '1.0.0' })
const workerEngine = new Engine({ name: 'worker', version: '1.0.0' })

const stateSync = new StateSync(
  [mainEngine, workerEngine],
  ['user.preferences', 'ui.theme']
)
```

## 最佳实践

### 1. 状态结构设计

```typescript
// ✅ 好的状态结构
const goodState = {
  // 按功能模块组织
  user: {
    profile: {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com'
    },
    preferences: {
      theme: 'dark',
      language: 'zh-CN',
      notifications: true
    },
    session: {
      isAuthenticated: true,
      token: 'jwt-token',
      expiresAt: 1234567890
    }
  },
  
  ui: {
    layout: {
      sidebarCollapsed: false,
      headerVisible: true
    },
    modals: {
      loginModal: { visible: false },
      confirmModal: { visible: false, message: '' }
    },
    forms: {
      loginForm: { loading: false, errors: {} },
      profileForm: { dirty: false, errors: {} }
    }
  },
  
  data: {
    users: { items: [], loading: false, error: null },
    products: { items: [], loading: false, error: null }
  }
}

// ❌ 不好的状态结构
const badState = {
  // 扁平化，难以管理
  userName: 'Alice',
  userEmail: 'alice@example.com',
  userTheme: 'dark',
  sidebarCollapsed: false,
  loginModalVisible: false,
  usersLoading: false,
  productsLoading: false,
  // ...
}
```

### 2. 状态更新模式

```typescript
// ✅ 不可变更新
engine.setState('user.preferences', (current) => ({
  ...current,
  theme: 'dark'
}))

engine.setState('data.users.items', (current) => [
  ...current,
  newUser
])

// ✅ 批量更新
engine.updateState({
  'user.profile.name': 'New Name',
  'user.profile.email': 'new@example.com',
  'ui.forms.profileForm.dirty': true
})

// ❌ 直接修改状态对象
const user = engine.getState('user')
user.name = 'New Name' // 不要这样做！
engine.setState('user', user)
```

### 3. 性能优化

```typescript
// ✅ 使用计算属性避免重复计算
engine.defineComputed('dashboard.summary', {
  dependencies: ['data.users.items', 'data.orders.items'],
  compute: (users, orders) => {
    return {
      totalUsers: users.length,
      totalOrders: orders.length,
      revenue: orders.reduce((sum, order) => sum + order.total, 0)
    }
  }
})

// ✅ 使用节流监听器
engine.onStateChangeThrottled(
  'ui.scrollPosition',
  updateScrollIndicator,
  100
)

// ✅ 选择性持久化
const engine = new Engine({
  persistence: {
    include: ['user.preferences', 'ui.theme'],
    exclude: ['ui.scrollPosition', 'data.cache']
  }
})
```

### 4. 错误处理

```typescript
// ✅ 状态验证
engine.registerStateValidator('user.email', (email) => {
  if (!email || !email.includes('@')) {
    throw new Error('邮箱格式无效')
  }
})

// ✅ 事务性更新
try {
  await engine.updateStateTransaction({
    'user.balance': (current) => {
      if (current < amount) throw new Error('余额不足')
      return current - amount
    },
    'user.transactions': (current) => [...current, transaction]
  })
} catch (error) {
  console.error('交易失败:', error)
  showErrorMessage(error.message)
}

// ✅ 状态恢复
engine.on('state:error', (error, context) => {
  console.error('状态错误:', error)
  
  // 恢复到上一个有效状态
  if (context.path) {
    engine.undoState(context.path)
  }
})
```

## 下一步

现在您已经掌握了状态管理的使用，可以继续学习：

- [错误处理](/guide/error-handling) - 了解错误处理机制
- [性能优化](/guide/performance) - 掌握性能优化技巧
- [测试](/guide/testing) - 学习如何测试状态管理
- [API 参考](/api/state) - 查看完整的状态管理 API 文档
- [示例](/examples/state-patterns) - 查看更多状态管理模式示例