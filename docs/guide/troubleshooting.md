# 故障排除

本章提供 @ldesign/engine 常见问题的解决方案和调试技巧。

## 常见问题

### 1. 安装问题

#### 问题：npm install 失败

**症状：**
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解决方案：**

1. **清理缓存**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **使用 --legacy-peer-deps**
```bash
npm install --legacy-peer-deps
```

3. **检查 Node.js 版本**
```bash
node --version  # 确保 >= 14.0.0
npm --version   # 确保 >= 6.0.0
```

#### 问题：TypeScript 类型错误

**症状：**
```typescript
// 类型错误：找不到模块 '@ldesign/engine'
import { Engine } from '@ldesign/engine'
```

**解决方案：**

1. **安装类型定义**
```bash
npm install --save-dev @types/node
```

2. **检查 tsconfig.json**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  }
}
```

3. **重新生成类型**
```bash
npx tsc --noEmit  # 检查类型错误
```

### 2. 插件问题

#### 问题：插件安装失败

**症状：**
```javascript
Error: Plugin 'my-plugin' installation failed: Missing dependencies
```

**解决方案：**

1. **检查插件依赖**
```typescript
class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'
  dependencies = ['http-plugin', 'storage-plugin'] // 确保依赖存在
  
  async install(engine: Engine) {
    // 验证依赖
    for (const dep of this.dependencies) {
      if (!engine.hasPlugin(dep)) {
        throw new Error(`Missing dependency: ${dep}`)
      }
    }
    
    // 插件逻辑
  }
}
```

2. **按正确顺序安装插件**
```typescript
// ❌ 错误的顺序
await engine.use(new MyPlugin())      // 依赖 http-plugin
await engine.use(new HttpPlugin())    // 但 http-plugin 后安装

// ✅ 正确的顺序
await engine.use(new HttpPlugin())    // 先安装依赖
await engine.use(new MyPlugin())      // 再安装依赖它的插件
```

3. **使用插件管理器**
```typescript
const pluginManager = new PluginManager(engine)

// 自动解析依赖顺序
await pluginManager.installPlugins([
  new HttpPlugin(),
  new StoragePlugin(),
  new MyPlugin()  // 依赖会自动排序
])
```

#### 问题：插件间通信失败

**症状：**
```javascript
Error: Method 'getData' not found
```

**解决方案：**

1. **检查方法注册**
```typescript
class DataPlugin implements Plugin {
  name = 'data-plugin'
  
  install(engine: Engine) {
    // 确保方法已注册
    engine.addMethod('getData', this.getData.bind(this))
    console.log('getData method registered')
  }
  
  private async getData(id: string) {
    return { id, data: 'some data' }
  }
}
```

2. **验证插件状态**
```typescript
// 检查插件是否已安装
if (!engine.hasPlugin('data-plugin')) {
  throw new Error('data-plugin not installed')
}

// 检查方法是否存在
if (!engine.hasMethod('getData')) {
  throw new Error('getData method not available')
}

// 安全调用
try {
  const result = await engine.getData('123')
  console.log(result)
} catch (error) {
  console.error('Failed to get data:', error)
}
```

### 3. 状态管理问题

#### 问题：状态更新不生效

**症状：**
```javascript
// 状态没有更新
engine.setState('user.name', 'John')
console.log(engine.getState('user.name')) // 仍然是旧值
```

**解决方案：**

1. **检查状态路径**
```typescript
// ❌ 错误：路径不存在
engine.setState('user.name', 'John')  // user 对象不存在

// ✅ 正确：先初始化父对象
engine.setState('user', { name: 'John' })
// 或者
engine.setState(state => ({
  ...state,
  user: {
    ...state.user,
    name: 'John'
  }
}))
```

2. **避免直接修改状态**
```typescript
// ❌ 错误：直接修改状态对象
const user = engine.getState('user')
user.name = 'John'  // 这不会触发更新

// ✅ 正确：使用 setState
engine.setState('user', {
  ...engine.getState('user'),
  name: 'John'
})
```

3. **检查订阅**
```typescript
// 确保订阅正确设置
engine.subscribe('user.name', (name) => {
  console.log('Name changed:', name)
})

// 测试状态更新
engine.setState('user.name', 'John')
```

#### 问题：内存泄漏

**症状：**
应用运行一段时间后变慢，内存使用持续增长。

**解决方案：**

1. **正确清理订阅**
```typescript
class Component {
  private unsubscribers: Array<() => void> = []
  
  constructor(private engine: Engine) {
    // 保存取消订阅函数
    this.unsubscribers.push(
      engine.subscribe('user', this.onUserChange.bind(this))
    )
    
    this.unsubscribers.push(
      engine.subscribe('settings', this.onSettingsChange.bind(this))
    )
  }
  
  destroy() {
    // 清理所有订阅
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
  }
  
  private onUserChange(user: any) {
    // 处理用户变化
  }
  
  private onSettingsChange(settings: any) {
    // 处理设置变化
  }
}
```

2. **清理定时器和事件监听器**
```typescript
class TimerPlugin implements Plugin {
  name = 'timer-plugin'
  private timers: NodeJS.Timeout[] = []
  private intervals: NodeJS.Timeout[] = []
  
  install(engine: Engine) {
    // 创建定时器时保存引用
    const timer = setTimeout(() => {
      console.log('Timer executed')
    }, 5000)
    this.timers.push(timer)
    
    const interval = setInterval(() => {
      console.log('Interval executed')
    }, 1000)
    this.intervals.push(interval)
  }
  
  uninstall() {
    // 清理所有定时器
    this.timers.forEach(timer => clearTimeout(timer))
    this.intervals.forEach(interval => clearInterval(interval))
    
    this.timers = []
    this.intervals = []
  }
}
```

### 4. 性能问题

#### 问题：应用启动缓慢

**症状：**
应用初始化时间过长，用户体验差。

**解决方案：**

1. **使用懒加载**
```typescript
// ❌ 一次性加载所有插件
const engine = new Engine({ name: 'app', version: '1.0.0' })
await engine.use([
  new AnalyticsPlugin(),
  new ChartsPlugin(),
  new ReportsPlugin(),
  new AdminPlugin()
])

// ✅ 按需加载插件
const engine = new Engine({ name: 'app', version: '1.0.0' })

// 只加载核心插件
await engine.use([
  new AuthPlugin(),
  new HttpPlugin(),
  new StoragePlugin()
])

// 按需加载其他插件
engine.addMethod('loadAnalytics', async () => {
  if (!engine.hasPlugin('analytics-plugin')) {
    const { AnalyticsPlugin } = await import('./plugins/analytics')
    await engine.use(new AnalyticsPlugin())
  }
})
```

2. **优化插件初始化**
```typescript
class OptimizedPlugin implements Plugin {
  name = 'optimized-plugin'
  
  async install(engine: Engine) {
    // 延迟非关键初始化
    this.registerCriticalMethods(engine)
    
    // 异步初始化非关键功能
    setTimeout(() => {
      this.initializeNonCriticalFeatures(engine)
    }, 0)
  }
  
  private registerCriticalMethods(engine: Engine) {
    // 注册核心方法
    engine.addMethod('criticalMethod', this.criticalMethod)
  }
  
  private async initializeNonCriticalFeatures(engine: Engine) {
    // 初始化非关键功能
    await this.loadConfiguration()
    await this.setupAnalytics()
    await this.initializeCache()
  }
}
```

#### 问题：频繁的状态更新导致性能问题

**症状：**
界面卡顿，CPU 使用率高。

**解决方案：**

1. **使用防抖和节流**
```typescript
class PerformantComponent {
  constructor(private engine: Engine) {
    // 防抖搜索
    this.debouncedSearch = this.debounce(this.search.bind(this), 300)
    
    // 节流滚动处理
    this.throttledScroll = this.throttle(this.onScroll.bind(this), 100)
  }
  
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }
  
  private throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        func.apply(this, args)
      }
    }
  }
  
  private search(query: string) {
    this.engine.setState('search.query', query)
    // 执行搜索
  }
  
  private onScroll(event: Event) {
    const scrollTop = (event.target as Element).scrollTop
    this.engine.setState('ui.scrollTop', scrollTop)
  }
}
```

2. **批量状态更新**
```typescript
// ❌ 多次单独更新
engine.setState('user.name', 'John')
engine.setState('user.email', 'john@example.com')
engine.setState('user.age', 30)

// ✅ 批量更新
engine.setState(state => ({
  ...state,
  user: {
    ...state.user,
    name: 'John',
    email: 'john@example.com',
    age: 30
  }
}))
```

### 5. 网络问题

#### 问题：API 请求失败

**症状：**
```javascript
Error: Network request failed
Error: Request timeout
```

**解决方案：**

1. **实现重试机制**
```typescript
class HttpService {
  async request(url: string, options: RequestInit = {}, maxRetries = 3): Promise<any> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          timeout: 10000  // 10秒超时
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return await response.json()
      } catch (error) {
        lastError = error as Error
        console.warn(`Request failed (attempt ${attempt}/${maxRetries}):`, error.message)
        
        if (attempt < maxRetries) {
          // 指数退避
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`Request failed after ${maxRetries} attempts: ${lastError.message}`)
  }
}
```

2. **处理网络状态**
```typescript
class NetworkAwareService {
  private isOnline = navigator.onLine
  private requestQueue: Array<() => Promise<any>> = []
  
  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }
  
  async makeRequest(requestFn: () => Promise<any>): Promise<any> {
    if (this.isOnline) {
      try {
        return await requestFn()
      } catch (error) {
        // 如果是网络错误，加入队列
        if (this.isNetworkError(error)) {
          this.requestQueue.push(requestFn)
          throw new Error('Request queued due to network error')
        }
        throw error
      }
    } else {
      // 离线时加入队列
      this.requestQueue.push(requestFn)
      throw new Error('Request queued - device is offline')
    }
  }
  
  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0 && this.isOnline) {
      const requestFn = this.requestQueue.shift()!
      try {
        await requestFn()
      } catch (error) {
        console.error('Queued request failed:', error)
      }
    }
  }
  
  private isNetworkError(error: any): boolean {
    return error.name === 'TypeError' && error.message.includes('fetch')
  }
}
```

## 调试技巧

### 1. 启用调试模式

```typescript
// 创建引擎时启用调试
const engine = new Engine({
  name: 'debug-app',
  version: '1.0.0',
  debug: true,  // 启用调试模式
  logLevel: 'debug'
})

// 或者运行时启用
engine.setDebugMode(true)
```

### 2. 使用内置调试工具

```typescript
// 检查引擎状态
console.log('Engine info:', engine.getInfo())
console.log('Installed plugins:', engine.getInstalledPlugins())
console.log('Available methods:', engine.getAvailableMethods())
console.log('Current state:', engine.getState())

// 监听所有事件
engine.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args)
})

// 监听状态变化
engine.subscribe('*', (path, newValue, oldValue) => {
  console.log(`State changed: ${path}`, { newValue, oldValue })
})
```

### 3. 性能分析

```typescript
// 测量方法执行时间
const originalMethod = engine.getData
engine.addMethod('getData', async (...args) => {
  const start = performance.now()
  try {
    const result = await originalMethod.apply(engine, args)
    const duration = performance.now() - start
    console.log(`getData took ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`getData failed after ${duration.toFixed(2)}ms:`, error)
    throw error
  }
})

// 监控内存使用
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    })
  }
}, 10000)
```

### 4. 错误追踪

```typescript
// 全局错误处理
engine.on('error', (error) => {
  console.error('Engine error:', error)
  
  // 发送错误报告
  if (typeof window !== 'undefined' && window.navigator.onLine) {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(err => console.error('Failed to report error:', err))
  }
})

// 插件错误处理
engine.on('plugin:error', ({ plugin, error }) => {
  console.error(`Plugin ${plugin} error:`, error)
  
  // 尝试重新加载插件
  setTimeout(async () => {
    try {
      await engine.reloadPlugin(plugin)
      console.log(`Plugin ${plugin} reloaded successfully`)
    } catch (reloadError) {
      console.error(`Failed to reload plugin ${plugin}:`, reloadError)
    }
  }, 5000)
})
```

## 常用调试命令

在浏览器控制台中，您可以使用以下命令进行调试：

```javascript
// 获取引擎实例（假设挂载在 window 上）
const engine = window.__ENGINE__

// 检查插件状态
engine.getInstalledPlugins()

// 查看当前状态
engine.getState()

// 触发事件
engine.emit('debug:test', { message: 'Debug event' })

// 调用方法
engine.getData('test-id')

// 检查方法是否存在
engine.hasMethod('getData')

// 查看事件监听器
engine.getEventListeners()

// 启用/禁用插件
engine.disablePlugin('plugin-name')
engine.enablePlugin('plugin-name')
```

## 获取帮助

如果您遇到本文档未涵盖的问题，可以通过以下方式获取帮助：

1. **查看源代码**：检查 `@ldesign/engine` 的源代码以了解内部实现
2. **查看示例**：参考 [示例文档](../examples/index.md) 中的完整示例
3. **社区支持**：在项目的 GitHub Issues 中搜索或提交问题
4. **文档反馈**：如果发现文档问题，请提交反馈帮助我们改进

记住，大多数问题都可以通过仔细阅读错误消息、检查配置和逐步调试来解决。保持耐心，系统性地排查问题。