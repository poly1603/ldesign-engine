# 状态管理示例

本文档详细介绍了 @ldesign/engine 中状态管理系统的各种使用方式，包括基础状态操作、状态监听、状态持久化、状态同步等高级功能。

## 基础状态管理

### 简单状态操作

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'StateManagementExample',
  debug: true
})

// 基础状态操作示例
engine.start().then(() => {
  console.log('=== 基础状态操作 ===')

  // 1. 设置状态
  console.log('\n1. 设置状态')
  engine.setState('user', {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'dark',
      language: 'zh-CN'
    }
  })

  engine.setState('app', {
    version: '1.0.0',
    environment: 'development',
    features: {
      notifications: true,
      analytics: false
    }
  })

  engine.setState('counter', 0)

  console.log('状态设置完成')

  // 2. 获取状态
  console.log('\n2. 获取状态')
  const user = engine.getState('user')
  const app = engine.getState('app')
  const counter = engine.getState('counter')

  console.log('用户状态:', user)
  console.log('应用状态:', app)
  console.log('计数器状态:', counter)

  // 3. 检查状态是否存在
  console.log('\n3. 检查状态存在性')
  console.log('user 状态存在:', engine.hasState('user'))
  console.log('nonexistent 状态存在:', engine.hasState('nonexistent'))

  // 4. 更新状态
  console.log('\n4. 更新状态')
  engine.setState('counter', counter + 1)
  console.log('更新后的计数器:', engine.getState('counter'))

  // 更新嵌套状态
  const currentUser = engine.getState('user')
  engine.setState('user', {
    ...currentUser,
    preferences: {
      ...currentUser.preferences,
      theme: 'light'
    }
  })

  console.log('更新后的用户状态:', engine.getState('user'))

  // 5. 删除状态
  console.log('\n5. 删除状态')
  engine.removeState('counter')
  console.log('删除后 counter 状态存在:', engine.hasState('counter'))
  console.log('尝试获取已删除的状态:', engine.getState('counter'))
})
```

## 状态监听和响应

### 状态变化监听

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'StateListenerExample' })

// 状态变化监听器
class StateListener {
  private engine: Engine
  private listeners: Map<string, Function[]> = new Map()

  constructor(engine: Engine) {
    this.engine = engine
    this.setupGlobalListener()
  }

  // 设置全局状态监听
  private setupGlobalListener() {
    this.engine.on('state:changed', (data) => {
      const { key, oldValue, newValue } = data
      console.log(`🔄 状态变化: ${key}`, {
        from: oldValue,
        to: newValue
      })

      // 触发特定状态的监听器
      const keyListeners = this.listeners.get(key) || []
      keyListeners.forEach((listener) => {
        try {
          listener(newValue, oldValue, key)
        }
 catch (error) {
          console.error(`状态监听器错误 (${key}):`, error)
        }
      })
    })

    this.engine.on('state:added', (data) => {
      console.log(`➕ 状态添加: ${data.key} =`, data.value)
    })

    this.engine.on('state:removed', (data) => {
      console.log(`➖ 状态删除: ${data.key}`)
    })
  }

  // 监听特定状态变化
  watch(key: string, listener: (newValue: any, oldValue: any, key: string) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }

    this.listeners.get(key)!.push(listener)

    // 返回取消监听的函数
    return () => {
      const keyListeners = this.listeners.get(key)
      if (keyListeners) {
        const index = keyListeners.indexOf(listener)
        if (index > -1) {
          keyListeners.splice(index, 1)
        }
      }
    }
  }

  // 监听多个状态
  watchMultiple(keys: string[], listener: (changes: Record<string, { newValue: any, oldValue: any }>) => void) {
    const unsubscribers: Function[] = []
    const pendingChanges: Record<string, { newValue: any, oldValue: any }> = {}

    keys.forEach((key) => {
      const unsubscribe = this.watch(key, (newValue, oldValue) => {
        pendingChanges[key] = { newValue, oldValue }

        // 使用 setTimeout 来批量处理变化
        setTimeout(() => {
          if (Object.keys(pendingChanges).length > 0) {
            listener({ ...pendingChanges })
            Object.keys(pendingChanges).forEach(k => delete pendingChanges[k])
          }
        }, 0)
      })

      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }

  // 计算属性（基于其他状态计算的状态）
  computed(key: string, dependencies: string[], computeFn: (...values: any[]) => any) {
    const updateComputed = () => {
      const values = dependencies.map(dep => this.engine.getState(dep))
      const computedValue = computeFn(...values)
      this.engine.setState(key, computedValue)
    }

    // 初始计算
    updateComputed()

    // 监听依赖变化
    const unsubscribers = dependencies.map(dep =>
      this.watch(dep, updateComputed)
    )

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
      this.engine.removeState(key)
    }
  }
}

// 状态验证器
class StateValidator {
  private engine: Engine
  private validators: Map<string, Function[]> = new Map()

  constructor(engine: Engine) {
    this.engine = engine
    this.setupValidation()
  }

  private setupValidation() {
    // 拦截状态设置，进行验证
    const originalSetState = this.engine.setState.bind(this.engine)

    this.engine.setState = (key: string, value: any) => {
      const validators = this.validators.get(key) || []

      for (const validator of validators) {
        const result = validator(value, key)
        if (result !== true) {
          const error = typeof result === 'string' ? result : `状态验证失败: ${key}`
          console.error('❌ 状态验证失败:', error)
          throw new Error(error)
        }
      }

      return originalSetState(key, value)
    }
  }

  // 添加验证器
  addValidator(key: string, validator: (value: any, key: string) => boolean | string) {
    if (!this.validators.has(key)) {
      this.validators.set(key, [])
    }

    this.validators.get(key)!.push(validator)
  }

  // 移除验证器
  removeValidator(key: string, validator: Function) {
    const keyValidators = this.validators.get(key)
    if (keyValidators) {
      const index = keyValidators.indexOf(validator)
      if (index > -1) {
        keyValidators.splice(index, 1)
      }
    }
  }
}

// 使用状态监听和验证
engine.start().then(() => {
  console.log('=== 状态监听和验证 ===')

  const stateListener = new StateListener(engine)
  const stateValidator = new StateValidator(engine)

  // 1. 设置状态验证器
  console.log('\n1. 设置状态验证器')

  // 用户状态验证
  stateValidator.addValidator('user', (value) => {
    if (!value || typeof value !== 'object') {
      return '用户状态必须是对象'
    }
    if (!value.id || !value.name) {
      return '用户状态必须包含 id 和 name'
    }
    return true
  })

  // 计数器状态验证
  stateValidator.addValidator('counter', (value) => {
    if (typeof value !== 'number') {
      return '计数器必须是数字'
    }
    if (value < 0) {
      return '计数器不能为负数'
    }
    return true
  })

  // 2. 设置状态监听器
  console.log('\n2. 设置状态监听器')

  // 监听用户状态变化
  const unsubscribeUser = stateListener.watch('user', (newUser, oldUser) => {
    console.log('👤 用户状态变化:', {
      old: oldUser,
      new: newUser
    })

    // 用户登录/登出逻辑
    if (!oldUser && newUser) {
      console.log('🔑 用户登录:', newUser.name)
    }
 else if (oldUser && !newUser) {
      console.log('🚪 用户登出')
    }
 else if (oldUser && newUser && oldUser.id !== newUser.id) {
      console.log('🔄 用户切换:', `${oldUser.name} -> ${newUser.name}`)
    }
  })

  // 监听计数器变化
  const unsubscribeCounter = stateListener.watch('counter', (newValue, oldValue) => {
    console.log(`🔢 计数器变化: ${oldValue} -> ${newValue}`)

    if (newValue > 10) {
      console.log('🎉 计数器达到里程碑: 10+')
    }
  })

  // 监听多个状态
  const unsubscribeMultiple = stateListener.watchMultiple(['user', 'counter'], (changes) => {
    console.log('📊 批量状态变化:', changes)
  })

  // 3. 计算属性
  console.log('\n3. 设置计算属性')

  // 设置基础状态
  engine.setState('firstName', 'John')
  engine.setState('lastName', 'Doe')

  // 计算全名
  const unsubscribeFullName = stateListener.computed(
    'fullName',
    ['firstName', 'lastName'],
    (firstName, lastName) => `${firstName} ${lastName}`
  )

  console.log('计算的全名:', engine.getState('fullName'))

  // 4. 测试状态操作
  console.log('\n4. 测试状态操作')

  // 设置有效的用户状态
  engine.setState('user', {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com'
  })

  // 设置计数器
  engine.setState('counter', 5)

  // 更新计数器
  for (let i = 6; i <= 12; i++) {
    setTimeout(() => {
      engine.setState('counter', i)
    }, (i - 5) * 100)
  }

  // 更新姓名
  setTimeout(() => {
    engine.setState('firstName', 'Jane')
  }, 500)

  setTimeout(() => {
    engine.setState('lastName', 'Smith')
  }, 600)

  // 5. 测试验证失败
  setTimeout(() => {
    console.log('\n5. 测试验证失败')

    try {
      engine.setState('user', { id: 1 }) // 缺少 name，应该失败
    }
 catch (error) {
      console.log('捕获验证错误:', error.message)
    }

    try {
      engine.setState('counter', -1) // 负数，应该失败
    }
 catch (error) {
      console.log('捕获验证错误:', error.message)
    }
  }, 1000)

  // 6. 清理监听器
  setTimeout(() => {
    console.log('\n6. 清理监听器')
    unsubscribeUser()
    unsubscribeCounter()
    unsubscribeMultiple()
    unsubscribeFullName()
    console.log('所有监听器已清理')
  }, 2000)
})
```

## 状态持久化

### 本地存储状态管理

```typescript
import { Engine } from '@ldesign/engine'

// 状态持久化管理器
class StatePersistence {
  private engine: Engine
  private storageKey: string
  private persistentKeys: Set<string> = new Set()
  private autoSave: boolean
  private saveDelay: number
  private saveTimer: NodeJS.Timeout | null = null

  constructor(engine: Engine, options: {
    storageKey?: string
    autoSave?: boolean
    saveDelay?: number
  } = {}) {
    this.engine = engine
    this.storageKey = options.storageKey || 'engine-state'
    this.autoSave = options.autoSave ?? true
    this.saveDelay = options.saveDelay || 1000

    this.setupPersistence()
  }

  private setupPersistence() {
    if (this.autoSave) {
      this.engine.on('state:changed', (data) => {
        if (this.persistentKeys.has(data.key)) {
          this.scheduleSave()
        }
      })

      this.engine.on('state:added', (data) => {
        if (this.persistentKeys.has(data.key)) {
          this.scheduleSave()
        }
      })

      this.engine.on('state:removed', (data) => {
        if (this.persistentKeys.has(data.key)) {
          this.scheduleSave()
        }
      })
    }
  }

  // 标记状态为持久化
  persist(key: string) {
    this.persistentKeys.add(key)
    console.log(`💾 状态 '${key}' 标记为持久化`)
  }

  // 取消状态持久化
  unpersist(key: string) {
    this.persistentKeys.delete(key)
    console.log(`🗑️ 状态 '${key}' 取消持久化`)
  }

  // 延迟保存（防抖）
  private scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = setTimeout(() => {
      this.save()
    }, this.saveDelay)
  }

  // 保存状态到本地存储
  save() {
    try {
      const persistentState: Record<string, any> = {}

      this.persistentKeys.forEach((key) => {
        if (this.engine.hasState(key)) {
          persistentState[key] = this.engine.getState(key)
        }
      })

      const stateData = {
        timestamp: Date.now(),
        version: '1.0.0',
        state: persistentState
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(stateData))
        console.log('💾 状态已保存到本地存储:', Object.keys(persistentState))
      }
 else {
        // Node.js 环境，模拟存储
        console.log('💾 状态已保存（模拟）:', Object.keys(persistentState))
      }
    }
 catch (error) {
      console.error('❌ 状态保存失败:', error)
    }
  }

  // 从本地存储加载状态
  load() {
    try {
      let stateData: any = null

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          stateData = JSON.parse(stored)
        }
      }
 else {
        // Node.js 环境，模拟加载
        console.log('📂 从本地存储加载状态（模拟）')
        stateData = {
          timestamp: Date.now() - 60000,
          version: '1.0.0',
          state: {
            user: {
              id: 1,
              name: 'Restored User',
              email: 'restored@example.com'
            },
            preferences: {
              theme: 'dark',
              language: 'zh-CN'
            }
          }
        }
      }

      if (stateData && stateData.state) {
        Object.entries(stateData.state).forEach(([key, value]) => {
          this.engine.setState(key, value)
          this.persist(key) // 自动标记为持久化
        })

        console.log('📂 状态已从本地存储加载:', Object.keys(stateData.state))
        console.log('📅 保存时间:', new Date(stateData.timestamp).toLocaleString())

        return stateData
      }
    }
 catch (error) {
      console.error('❌ 状态加载失败:', error)
    }

    return null
  }

  // 清除持久化状态
  clear() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey)
      }

      console.log('🗑️ 持久化状态已清除')
    }
 catch (error) {
      console.error('❌ 清除持久化状态失败:', error)
    }
  }

  // 获取持久化状态信息
  getInfo() {
    return {
      storageKey: this.storageKey,
      persistentKeys: Array.from(this.persistentKeys),
      autoSave: this.autoSave,
      saveDelay: this.saveDelay
    }
  }
}

// 状态快照管理器
class StateSnapshot {
  private engine: Engine
  private snapshots: Map<string, any> = new Map()

  constructor(engine: Engine) {
    this.engine = engine
  }

  // 创建快照
  create(name: string, keys?: string[]) {
    const snapshot: Record<string, any> = {}

    if (keys) {
      keys.forEach((key) => {
        if (this.engine.hasState(key)) {
          snapshot[key] = this.deepClone(this.engine.getState(key))
        }
      })
    }
 else {
      // 快照所有状态
      const allStates = this.getAllStates()
      Object.entries(allStates).forEach(([key, value]) => {
        snapshot[key] = this.deepClone(value)
      })
    }

    this.snapshots.set(name, {
      timestamp: Date.now(),
      data: snapshot
    })

    console.log(`📸 快照 '${name}' 已创建:`, Object.keys(snapshot))
    return snapshot
  }

  // 恢复快照
  restore(name: string) {
    const snapshot = this.snapshots.get(name)

    if (!snapshot) {
      console.error(`❌ 快照 '${name}' 不存在`)
      return false
    }

    Object.entries(snapshot.data).forEach(([key, value]) => {
      this.engine.setState(key, this.deepClone(value))
    })

    console.log(`🔄 快照 '${name}' 已恢复:`, Object.keys(snapshot.data))
    console.log(`📅 快照时间:`, new Date(snapshot.timestamp).toLocaleString())

    return true
  }

  // 删除快照
  delete(name: string) {
    const deleted = this.snapshots.delete(name)
    if (deleted) {
      console.log(`🗑️ 快照 '${name}' 已删除`)
    }
 else {
      console.log(`❌ 快照 '${name}' 不存在`)
    }
    return deleted
  }

  // 列出所有快照
  list() {
    const snapshots: Array<{ name: string, timestamp: number, keys: string[] }> = []

    this.snapshots.forEach((snapshot, name) => {
      snapshots.push({
        name,
        timestamp: snapshot.timestamp,
        keys: Object.keys(snapshot.data)
      })
    })

    return snapshots.sort((a, b) => b.timestamp - a.timestamp)
  }

  // 比较快照
  compare(name1: string, name2: string) {
    const snapshot1 = this.snapshots.get(name1)
    const snapshot2 = this.snapshots.get(name2)

    if (!snapshot1 || !snapshot2) {
      console.error('❌ 快照不存在')
      return null
    }

    const differences: Record<string, { snapshot1: any, snapshot2: any }> = {}
    const allKeys = new Set([
      ...Object.keys(snapshot1.data),
      ...Object.keys(snapshot2.data)
    ])

    allKeys.forEach((key) => {
      const value1 = snapshot1.data[key]
      const value2 = snapshot2.data[key]

      if (!this.deepEqual(value1, value2)) {
        differences[key] = {
          snapshot1: value1,
          snapshot2: value2
        }
      }
    })

    return differences
  }

  // 深度克隆
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item))
    }

    const cloned: any = {}
    Object.keys(obj).forEach((key) => {
      cloned[key] = this.deepClone(obj[key])
    })

    return cloned
  }

  // 深度比较
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true
    }

    if (obj1 == null || obj2 == null) {
      return false
    }

    if (typeof obj1 !== typeof obj2) {
      return false
    }

    if (typeof obj1 !== 'object') {
      return false
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false
      }

      if (!this.deepEqual(obj1[key], obj2[key])) {
        return false
      }
    }

    return true
  }

  // 获取所有状态（模拟方法）
  private getAllStates(): Record<string, any> {
    // 这里应该从引擎获取所有状态
    // 由于没有直接的 API，我们模拟一下
    const states: Record<string, any> = {}

    // 假设我们知道所有的状态键
    const knownKeys = ['user', 'preferences', 'counter', 'app']

    knownKeys.forEach((key) => {
      if (this.engine.hasState(key)) {
        states[key] = this.engine.getState(key)
      }
    })

    return states
  }
}

// 使用状态持久化
const engine = new Engine({ name: 'StatePersistenceExample' })

engine.start().then(() => {
  console.log('=== 状态持久化示例 ===')

  const persistence = new StatePersistence(engine, {
    storageKey: 'my-app-state',
    autoSave: true,
    saveDelay: 500
  })

  const snapshot = new StateSnapshot(engine)

  // 1. 加载持久化状态
  console.log('\n1. 加载持久化状态')
  const loadedData = persistence.load()

  if (loadedData) {
    console.log('加载的状态:', loadedData.state)
  }
 else {
    console.log('没有找到持久化状态，使用默认状态')

    // 设置默认状态
    engine.setState('user', {
      id: 1,
      name: 'Default User',
      email: 'default@example.com'
    })

    engine.setState('preferences', {
      theme: 'light',
      language: 'en-US',
      notifications: true
    })

    engine.setState('counter', 0)

    // 标记为持久化
    persistence.persist('user')
    persistence.persist('preferences')
    persistence.persist('counter')
  }

  // 2. 创建初始快照
  console.log('\n2. 创建初始快照')
  snapshot.create('initial')

  // 3. 修改状态
  console.log('\n3. 修改状态')

  setTimeout(() => {
    engine.setState('user', {
      ...engine.getState('user'),
      name: 'Updated User',
      lastLogin: new Date().toISOString()
    })

    engine.setState('counter', 5)
  }, 1000)

  setTimeout(() => {
    engine.setState('preferences', {
      ...engine.getState('preferences'),
      theme: 'dark',
      language: 'zh-CN'
    })

    // 创建修改后的快照
    snapshot.create('after-changes')
  }, 2000)

  // 4. 更多修改
  setTimeout(() => {
    console.log('\n4. 更多状态修改')

    for (let i = 6; i <= 10; i++) {
      setTimeout(() => {
        engine.setState('counter', i)
      }, i * 100)
    }
  }, 3000)

  // 5. 创建最终快照并比较
  setTimeout(() => {
    console.log('\n5. 创建最终快照并比较')

    snapshot.create('final')

    // 列出所有快照
    console.log('\n所有快照:')
    const allSnapshots = snapshot.list()
    allSnapshots.forEach((snap) => {
      console.log(`- ${snap.name}: ${new Date(snap.timestamp).toLocaleString()} (${snap.keys.join(', ')})`)
    })

    // 比较快照
    console.log('\n比较 initial 和 final 快照:')
    const differences = snapshot.compare('initial', 'final')
    if (differences) {
      Object.entries(differences).forEach(([key, diff]) => {
        console.log(`${key}:`, {
          initial: diff.snapshot1,
          final: diff.snapshot2
        })
      })
    }
  }, 4000)

  // 6. 恢复快照
  setTimeout(() => {
    console.log('\n6. 恢复到初始快照')

    console.log('恢复前的状态:')
    console.log('- user:', engine.getState('user'))
    console.log('- counter:', engine.getState('counter'))
    console.log('- preferences:', engine.getState('preferences'))

    snapshot.restore('initial')

    console.log('\n恢复后的状态:')
    console.log('- user:', engine.getState('user'))
    console.log('- counter:', engine.getState('counter'))
    console.log('- preferences:', engine.getState('preferences'))
  }, 5000)

  // 7. 手动保存和清理
  setTimeout(() => {
    console.log('\n7. 手动保存和清理')

    // 手动保存
    persistence.save()

    // 显示持久化信息
    console.log('持久化信息:', persistence.getInfo())

    // 清理一些快照
    snapshot.delete('after-changes')

    console.log('\n清理后的快照:')
    snapshot.list().forEach((snap) => {
      console.log(`- ${snap.name}: ${new Date(snap.timestamp).toLocaleString()}`)
    })
  }, 6000)
})
```

## 状态同步和共享

### 多实例状态同步

```typescript
import { Engine } from '@ldesign/engine'

// 状态同步管理器
class StateSynchronizer {
  private engines: Map<string, Engine> = new Map()
  private syncRules: Map<string, SyncRule[]> = new Map()
  private eventBus: Engine

  constructor() {
    this.eventBus = new Engine({ name: 'StateSyncEventBus' })
    this.eventBus.start()
  }

  // 注册引擎实例
  register(id: string, engine: Engine) {
    this.engines.set(id, engine)

    // 监听状态变化
    engine.on('state:changed', (data) => {
      this.handleStateChange(id, data)
    })

    engine.on('state:added', (data) => {
      this.handleStateChange(id, { ...data, type: 'added' })
    })

    engine.on('state:removed', (data) => {
      this.handleStateChange(id, { ...data, type: 'removed' })
    })

    console.log(`🔗 引擎 '${id}' 已注册到同步器`)
  }

  // 取消注册引擎实例
  unregister(id: string) {
    this.engines.delete(id)
    this.syncRules.delete(id)
    console.log(`🔌 引擎 '${id}' 已从同步器取消注册`)
  }

  // 添加同步规则
  addSyncRule(sourceEngineId: string, rule: SyncRule) {
    if (!this.syncRules.has(sourceEngineId)) {
      this.syncRules.set(sourceEngineId, [])
    }

    this.syncRules.get(sourceEngineId)!.push(rule)
    console.log(`📋 为引擎 '${sourceEngineId}' 添加同步规则:`, rule)
  }

  // 处理状态变化
  private handleStateChange(sourceEngineId: string, data: any) {
    const rules = this.syncRules.get(sourceEngineId) || []

    rules.forEach((rule) => {
      if (this.shouldSync(rule, data)) {
        this.syncState(sourceEngineId, rule, data)
      }
    })
  }

  // 检查是否应该同步
  private shouldSync(rule: SyncRule, data: any): boolean {
    // 检查状态键匹配
    if (rule.stateKeys && !rule.stateKeys.includes(data.key)) {
      return false
    }

    // 检查自定义条件
    if (rule.condition && !rule.condition(data)) {
      return false
    }

    return true
  }

  // 同步状态
  private syncState(sourceEngineId: string, rule: SyncRule, data: any) {
    const sourceEngine = this.engines.get(sourceEngineId)
    if (!sourceEngine)
return

    rule.targetEngineIds.forEach((targetEngineId) => {
      const targetEngine = this.engines.get(targetEngineId)
      if (!targetEngine || targetEngineId === sourceEngineId)
return

      try {
        let syncValue = data.newValue || data.value

        // 应用转换函数
        if (rule.transform) {
          syncValue = rule.transform(syncValue, data.key, sourceEngineId, targetEngineId)
        }

        // 确定目标状态键
        const targetKey = rule.keyMapping?.[data.key] || data.key

        // 同步状态
        if (data.type === 'removed') {
          targetEngine.removeState(targetKey)
        }
 else {
          targetEngine.setState(targetKey, syncValue)
        }

        console.log(`🔄 状态同步: ${sourceEngineId}.${data.key} -> ${targetEngineId}.${targetKey}`)

        // 触发同步事件
        this.eventBus.emit('sync:completed', {
          sourceEngineId,
          targetEngineId,
          sourceKey: data.key,
          targetKey,
          value: syncValue
        })
      }
 catch (error) {
        console.error(`❌ 状态同步失败: ${sourceEngineId} -> ${targetEngineId}:`, error)

        this.eventBus.emit('sync:error', {
          sourceEngineId,
          targetEngineId,
          key: data.key,
          error
        })
      }
    })
  }

  // 手动同步所有状态
  syncAll(sourceEngineId: string, targetEngineIds: string[]) {
    const sourceEngine = this.engines.get(sourceEngineId)
    if (!sourceEngine)
return

    // 这里需要获取所有状态，我们模拟一下
    const allStates = this.getAllStates(sourceEngine)

    Object.entries(allStates).forEach(([key, value]) => {
      targetEngineIds.forEach((targetEngineId) => {
        const targetEngine = this.engines.get(targetEngineId)
        if (targetEngine && targetEngineId !== sourceEngineId) {
          targetEngine.setState(key, value)
        }
      })
    })

    console.log(`🔄 全量同步完成: ${sourceEngineId} -> [${targetEngineIds.join(', ')}]`)
  }

  // 获取同步统计
  getStats() {
    const stats = {
      registeredEngines: this.engines.size,
      syncRules: 0,
      engines: Array.from(this.engines.keys())
    }

    this.syncRules.forEach((rules) => {
      stats.syncRules += rules.length
    })

    return stats
  }

  // 模拟获取所有状态
  private getAllStates(engine: Engine): Record<string, any> {
    // 这里应该从引擎获取所有状态
    const states: Record<string, any> = {}
    const knownKeys = ['user', 'preferences', 'counter', 'app', 'session']

    knownKeys.forEach((key) => {
      if (engine.hasState(key)) {
        states[key] = engine.getState(key)
      }
    })

    return states
  }
}

// 同步规则接口
interface SyncRule {
  targetEngineIds: string[]
  stateKeys?: string[] // 要同步的状态键，不指定则同步所有
  keyMapping?: Record<string, string> // 状态键映射
  condition?: (data: any) => boolean // 同步条件
  transform?: (value: any, key: string, sourceId: string, targetId: string) => any // 值转换
}

// 状态广播器
class StateBroadcaster {
  private synchronizer: StateSynchronizer
  private channels: Map<string, Set<string>> = new Map()

  constructor(synchronizer: StateSynchronizer) {
    this.synchronizer = synchronizer
  }

  // 创建广播频道
  createChannel(channelName: string, engineIds: string[]) {
    this.channels.set(channelName, new Set(engineIds))

    // 为频道中的每个引擎添加同步规则
    engineIds.forEach((sourceId) => {
      const targetIds = engineIds.filter(id => id !== sourceId)

      this.synchronizer.addSyncRule(sourceId, {
        targetEngineIds: targetIds,
        condition: (data) => {
          // 只同步标记为广播的状态
          return data.key.startsWith('broadcast:') || data.key.startsWith('shared:')
        },
        transform: (value, key, sourceId, targetId) => {
          // 添加来源信息
          if (typeof value === 'object' && value !== null) {
            return {
              ...value,
              _source: sourceId,
              _timestamp: Date.now()
            }
          }
          return value
        }
      })
    })

    console.log(`📡 广播频道 '${channelName}' 已创建，包含引擎: [${engineIds.join(', ')}]`)
  }

  // 向频道广播消息
  broadcast(channelName: string, message: any) {
    const engineIds = this.channels.get(channelName)
    if (!engineIds) {
      console.error(`❌ 广播频道 '${channelName}' 不存在`)
      return
    }

    const broadcastKey = `broadcast:${channelName}:${Date.now()}`

    // 向频道中的第一个引擎设置状态，会自动同步到其他引擎
    const firstEngineId = Array.from(engineIds)[0]
    const firstEngine = this.synchronizer.engines.get(firstEngineId)

    if (firstEngine) {
      firstEngine.setState(broadcastKey, {
        channel: channelName,
        message,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9)
      })

      console.log(`📡 消息已广播到频道 '${channelName}':`, message)
    }
  }

  // 删除频道
  deleteChannel(channelName: string) {
    this.channels.delete(channelName)
    console.log(`🗑️ 广播频道 '${channelName}' 已删除`)
  }

  // 获取频道列表
  getChannels() {
    const channels: Array<{ name: string, engines: string[] }> = []

    this.channels.forEach((engineIds, name) => {
      channels.push({
        name,
        engines: Array.from(engineIds)
      })
    })

    return channels
  }
}

// 使用状态同步
const synchronizer = new StateSynchronizer()
const broadcaster = new StateBroadcaster(synchronizer)

// 创建多个引擎实例
const mainEngine = new Engine({ name: 'MainEngine' })
const workerEngine = new Engine({ name: 'WorkerEngine' })
const uiEngine = new Engine({ name: 'UIEngine' })

Promise.all([
  mainEngine.start(),
  workerEngine.start(),
  uiEngine.start()
]).then(() => {
  console.log('=== 状态同步示例 ===')

  // 注册引擎到同步器
  synchronizer.register('main', mainEngine)
  synchronizer.register('worker', workerEngine)
  synchronizer.register('ui', uiEngine)

  // 1. 设置基本同步规则
  console.log('\n1. 设置同步规则')

  // 主引擎的用户状态同步到所有其他引擎
  synchronizer.addSyncRule('main', {
    targetEngineIds: ['worker', 'ui'],
    stateKeys: ['user', 'session'],
    transform: (value, key) => {
      if (key === 'user') {
        // 移除敏感信息
        const { password, ...safeUser } = value
        return safeUser
      }
      return value
    }
  })

  // UI 引擎的主题设置同步到主引擎
  synchronizer.addSyncRule('ui', {
    targetEngineIds: ['main'],
    stateKeys: ['theme', 'language'],
    keyMapping: {
      theme: 'ui:theme',
      language: 'ui:language'
    }
  })

  // Worker 引擎的计算结果同步到主引擎和 UI 引擎
  synchronizer.addSyncRule('worker', {
    targetEngineIds: ['main', 'ui'],
    stateKeys: ['calculation', 'progress'],
    condition: (data) => {
      // 只同步已完成的计算
      return data.newValue?.status === 'completed'
    }
  })

  // 2. 创建广播频道
  console.log('\n2. 创建广播频道')
  broadcaster.createChannel('notifications', ['main', 'worker', 'ui'])
  broadcaster.createChannel('system', ['main', 'worker'])

  // 3. 设置状态监听
  console.log('\n3. 设置状态监听')

  // 监听同步事件
  synchronizer.eventBus.on('sync:completed', (data) => {
    console.log(`✅ 同步完成: ${data.sourceEngineId}.${data.sourceKey} -> ${data.targetEngineId}.${data.targetKey}`)
  })

  synchronizer.eventBus.on('sync:error', (data) => {
    console.log(`❌ 同步失败: ${data.sourceEngineId} -> ${data.targetEngineId} (${data.key}):`, data.error.message)
  })

  // 监听广播消息
  const engines = { main: mainEngine, worker: workerEngine, ui: uiEngine }

  Object.entries(engines).forEach(([id, engine]) => {
    engine.on('state:changed', (data) => {
      if (data.key.startsWith('broadcast:')) {
        const broadcastData = data.newValue
        console.log(`📨 ${id} 收到广播 [${broadcastData.channel}]:`, broadcastData.message)
      }
    })
  })

  // 4. 测试状态同步
  console.log('\n4. 测试状态同步')

  // 在主引擎设置用户状态
  setTimeout(() => {
    console.log('\n设置主引擎用户状态')
    mainEngine.setState('user', {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123', // 这个应该被过滤掉
      role: 'admin'
    })

    mainEngine.setState('session', {
      id: 'sess_123',
      startTime: Date.now(),
      isActive: true
    })
  }, 1000)

  // 在 UI 引擎设置主题
  setTimeout(() => {
    console.log('\n设置 UI 引擎主题')
    uiEngine.setState('theme', 'dark')
    uiEngine.setState('language', 'zh-CN')
  }, 2000)

  // 在 Worker 引擎设置计算结果
  setTimeout(() => {
    console.log('\n设置 Worker 引擎计算结果')

    // 进行中的计算（不会同步）
    workerEngine.setState('calculation', {
      id: 'calc_1',
      status: 'running',
      progress: 50,
      result: null
    })

    // 完成的计算（会同步）
    setTimeout(() => {
      workerEngine.setState('calculation', {
        id: 'calc_1',
        status: 'completed',
        progress: 100,
        result: { sum: 12345, average: 123.45 }
      })
    }, 1000)
  }, 3000)

  // 5. 测试广播
  setTimeout(() => {
    console.log('\n5. 测试广播')

    broadcaster.broadcast('notifications', {
      type: 'info',
      title: '系统通知',
      message: '这是一条测试广播消息'
    })

    setTimeout(() => {
      broadcaster.broadcast('system', {
        type: 'warning',
        title: '系统警告',
        message: '内存使用率较高'
      })
    }, 1000)
  }, 5000)

  // 6. 检查同步结果
  setTimeout(() => {
    console.log('\n6. 检查同步结果')

    console.log('\n主引擎状态:')
    console.log('- user:', mainEngine.getState('user'))
    console.log('- session:', mainEngine.getState('session'))
    console.log('- ui:theme:', mainEngine.getState('ui:theme'))
    console.log('- calculation:', mainEngine.getState('calculation'))

    console.log('\nWorker 引擎状态:')
    console.log('- user:', workerEngine.getState('user'))
    console.log('- session:', workerEngine.getState('session'))

    console.log('\nUI 引擎状态:')
    console.log('- user:', uiEngine.getState('user'))
    console.log('- calculation:', uiEngine.getState('calculation'))

    // 显示同步统计
    console.log('\n同步统计:', synchronizer.getStats())
    console.log('广播频道:', broadcaster.getChannels())
  }, 7000)
})
```

## 总结

这些状态管理示例展示了 @ldesign/engine 状态系统的强大功能：

1. **基础状态管理** - 设置、获取、检查、删除状态
2. **状态监听** - 监听状态变化、验证状态、计算属性
3. **状态持久化** - 本地存储、快照管理、状态恢复
4. **状态同步** - 多实例同步、广播机制、状态共享

状态管理系统的优势：
- **响应式** - 状态变化自动触发监听器
- **可验证** - 支持状态验证和约束
- **可持久化** - 支持本地存储和快照
- **可同步** - 支持多实例状态同步
- **可扩展** - 灵活的插件和中间件集成

通过这些示例，您可以学习如何在应用中有效地管理状态，构建响应式、可维护的应用程序。
