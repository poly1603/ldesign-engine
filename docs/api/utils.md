# 工具函数 API

@ldesign/engine 提供了丰富的工具函数，帮助开发者更高效地使用引擎功能。

## 核心工具函数

### 引擎工具

```typescript
import {
  createEngine,
  getEngineVersion,
  isEngine,
  mergeConfigs,
  validateConfig
} from '@ldesign/engine/utils'

// 创建引擎实例
function createEngine(config?: EngineConfig): Engine {
  return new Engine(config)
}

// 检查是否为引擎实例
function isEngine(value: any): value is Engine {
  return value
    && typeof value === 'object'
    && typeof value.start === 'function'
    && typeof value.stop === 'function'
    && typeof value.use === 'function'
}

// 获取引擎版本
function getEngineVersion(): string {
  return '1.0.0' // 从 package.json 读取
}

// 合并配置
function mergeConfigs(...configs: Partial<EngineConfig>[]): EngineConfig {
  return configs.reduce((merged, config) => {
    return deepMerge(merged, config)
  }, {} as EngineConfig)
}

// 验证配置
function validateConfig(config: EngineConfig): ValidationResult {
  const errors: string[] = []

  if (config.name && typeof config.name !== 'string') {
    errors.push('name must be a string')
  }

  if (config.version && typeof config.version !== 'string') {
    errors.push('version must be a string')
  }

  if (config.maxListeners && typeof config.maxListeners !== 'number') {
    errors.push('maxListeners must be a number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

// 使用示例
const engine = createEngine({
  name: 'MyApp',
  debug: true
})

if (isEngine(engine)) {
  console.log('引擎版本:', getEngineVersion())
}

const config = mergeConfigs(
  { name: 'App', debug: true },
  { version: '1.0.0', maxListeners: 100 }
)

const validation = validateConfig(config)
if (!validation.valid) {
  console.error('配置错误:', validation.errors)
}
```

### 插件工具

```typescript
import {
  createPlugin,
  isPlugin,
  resolvePluginDependencies,
  sortPluginsByPriority,
  validatePlugin
} from '@ldesign/engine/utils'

// 创建插件
function createPlugin(definition: PluginDefinition): Plugin {
  if (typeof definition === 'function') {
    // 插件工厂
    return definition()
  }
 else if (typeof definition === 'object' && definition.constructor !== Object) {
    // 插件类
    return new (definition as any)()
  }
 else {
    // 插件对象
    return definition as Plugin
  }
}

// 检查是否为插件
function isPlugin(value: any): value is Plugin {
  return value
    && typeof value === 'object'
    && typeof value.name === 'string'
    && typeof value.version === 'string'
}

// 验证插件
function validatePlugin(plugin: Plugin): ValidationResult {
  const errors: string[] = []

  if (!plugin.name) {
    errors.push('Plugin name is required')
  }

  if (!plugin.version) {
    errors.push('Plugin version is required')
  }

  if (plugin.dependencies) {
    if (!Array.isArray(plugin.dependencies)) {
      errors.push('Plugin dependencies must be an array')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 解析插件依赖
function resolvePluginDependencies(plugins: Plugin[]): Plugin[] {
  const resolved: Plugin[] = []
  const resolving = new Set<string>()
  const resolved_names = new Set<string>()

  function resolve(plugin: Plugin) {
    if (resolved_names.has(plugin.name)) {
      return
    }

    if (resolving.has(plugin.name)) {
      throw new Error(`Circular dependency detected: ${plugin.name}`)
    }

    resolving.add(plugin.name)

    // 解析依赖
    if (plugin.dependencies) {
      for (const depName of plugin.dependencies) {
        const dep = plugins.find(p => p.name === depName)
        if (!dep) {
          throw new Error(`Dependency not found: ${depName}`)
        }
        resolve(dep)
      }
    }

    resolving.delete(plugin.name)
    resolved_names.add(plugin.name)
    resolved.push(plugin)
  }

  plugins.forEach(resolve)
  return resolved
}

// 按优先级排序插件
function sortPluginsByPriority(plugins: Array<{ plugin: Plugin, config: PluginConfig }>): Array<{ plugin: Plugin, config: PluginConfig }> {
  return plugins.sort((a, b) => {
    const priorityA = a.config.priority || 0
    const priorityB = b.config.priority || 0
    return priorityB - priorityA // 高优先级在前
  })
}

// 使用示例
const pluginA: Plugin = {
  name: 'PluginA',
  version: '1.0.0',
  dependencies: ['PluginB']
}

const pluginB: Plugin = {
  name: 'PluginB',
  version: '1.0.0'
}

const plugins = [pluginA, pluginB]
const resolvedPlugins = resolvePluginDependencies(plugins)
console.log('解析后的插件顺序:', resolvedPlugins.map(p => p.name))

const pluginsWithConfig = [
  { plugin: pluginA, config: { priority: 10 } },
  { plugin: pluginB, config: { priority: 20 } }
]

const sortedPlugins = sortPluginsByPriority(pluginsWithConfig)
console.log('排序后的插件:', sortedPlugins.map(p => p.plugin.name))
```

### 事件工具

```typescript
import {
  createEventEmitter,
  createEventFilter,
  debounceEvent,
  isEventEmitter,
  matchEventPattern,
  parseEventName,
  throttleEvent
} from '@ldesign/engine/utils'

// 创建事件发射器
function createEventEmitter(options?: EventEmitterOptions): EventEmitter {
  return new EventEmitter(options)
}

// 检查是否为事件发射器
function isEventEmitter(value: any): value is EventEmitter {
  return value
    && typeof value === 'object'
    && typeof value.on === 'function'
    && typeof value.emit === 'function'
}

// 解析事件名称
function parseEventName(eventName: string): {
  namespace?: string
  name: string
  wildcard: boolean
} {
  const parts = eventName.split(':')

  if (parts.length === 1) {
    return {
      name: parts[0],
      wildcard: parts[0].includes('*')
    }
  }

  return {
    namespace: parts[0],
    name: parts.slice(1).join(':'),
    wildcard: eventName.includes('*')
  }
}

// 匹配事件模式
function matchEventPattern(pattern: string, eventName: string): boolean {
  // 转换通配符模式为正则表达式
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(eventName)
}

// 创建事件过滤器
function createEventFilter(patterns: string[]): EventFilter {
  return (event: string) => {
    return patterns.some(pattern => matchEventPattern(pattern, event))
  }
}

// 防抖事件
function debounceEvent<T extends any[]>(
  emitter: EventEmitter,
  event: string,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      emitter.emit(event, ...args)
      timeoutId = null
    }, delay)
  }
}

// 节流事件
function throttleEvent<T extends any[]>(
  emitter: EventEmitter,
  event: string,
  interval: number
): (...args: T) => void {
  let lastEmit = 0

  return (...args: T) => {
    const now = Date.now()

    if (now - lastEmit >= interval) {
      emitter.emit(event, ...args)
      lastEmit = now
    }
  }
}

// 使用示例
const emitter = createEventEmitter()

// 解析事件名称
const parsed = parseEventName('user:profile:update')
console.log('解析结果:', parsed)

// 匹配事件模式
const matches = matchEventPattern('user:*', 'user:login')
console.log('匹配结果:', matches)

// 创建过滤器
const filter = createEventFilter(['user:*', 'system:*'])
console.log('过滤结果:', filter('user:login')) // true

// 防抖事件
const debouncedEmit = debounceEvent(emitter, 'search', 300)
debouncedEmit('query1')
debouncedEmit('query2') // 只有这个会被发射

// 节流事件
const throttledEmit = throttleEvent(emitter, 'scroll', 100)
for (let i = 0; i < 10; i++) {
  throttledEmit(i) // 只有部分会被发射
}
```

### 中间件工具

```typescript
import {
  cacheMiddleware,
  composeMiddleware,
  conditionalMiddleware,
  createMiddleware,
  retryMiddleware,
  timeoutMiddleware
} from '@ldesign/engine/utils'

// 创建中间件
function createMiddleware<T = any>(
  handler: (context: T, next: NextFunction) => void | Promise<void>
): Middleware<T> {
  return handler
}

// 组合中间件
function composeMiddleware<T = any>(
  ...middlewares: Middleware<T>[]
): Middleware<T> {
  return async (context: T, next: NextFunction) => {
    let index = 0

    const dispatch = async (): Promise<void> => {
      if (index >= middlewares.length) {
        return next()
      }

      const middleware = middlewares[index++]
      await middleware(context, dispatch)
    }

    await dispatch()
  }
}

// 条件中间件
function conditionalMiddleware<T = any>(
  condition: (context: T) => boolean | Promise<boolean>,
  middleware: Middleware<T>
): Middleware<T> {
  return async (context: T, next: NextFunction) => {
    const shouldExecute = await condition(context)

    if (shouldExecute) {
      await middleware(context, next)
    }
 else {
      await next()
    }
  }
}

// 重试中间件
function retryMiddleware<T = any>(
  middleware: Middleware<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Middleware<T> {
  return async (context: T, next: NextFunction) => {
    let attempts = 0

    while (attempts <= maxRetries) {
      try {
        await middleware(context, next)
        return
      }
 catch (error) {
        attempts++

        if (attempts > maxRetries) {
          throw error
        }

        console.log(`重试中间件 ${attempts}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, delay * attempts))
      }
    }
  }
}

// 超时中间件
function timeoutMiddleware<T = any>(
  middleware: Middleware<T>,
  timeout: number
): Middleware<T> {
  return async (context: T, next: NextFunction) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`中间件执行超时: ${timeout}ms`))
      }, timeout)
    })

    await Promise.race([
      middleware(context, next),
      timeoutPromise
    ])
  }
}

// 缓存中间件
function cacheMiddleware<T = any>(
  keyGenerator: (context: T) => string,
  ttl: number = 60000
): Middleware<T> {
  const cache = new Map<string, {
    data: any
    timestamp: number
  }>()

  return async (context: T, next: NextFunction) => {
    const key = keyGenerator(context)
    const cached = cache.get(key)

    if (cached && Date.now() - cached.timestamp < ttl) {
      // 使用缓存数据
      Object.assign(context, cached.data)
      return
    }

    const originalContext = JSON.parse(JSON.stringify(context))
    await next()

    // 缓存结果
    cache.set(key, {
      data: JSON.parse(JSON.stringify(context)),
      timestamp: Date.now()
    })
  }
}

// 使用示例
const authMiddleware = createMiddleware((context: any, next) => {
  if (!context.user) {
    throw new Error('未授权')
  }
  next()
})

const validationMiddleware = createMiddleware((context: any, next) => {
  if (!context.data) {
    throw new Error('数据验证失败')
  }
  next()
})

// 组合中间件
const composedMiddleware = composeMiddleware(
  authMiddleware,
  validationMiddleware
)

// 条件中间件
const adminOnlyMiddleware = conditionalMiddleware(
  (context: any) => context.user?.role === 'admin',
  createMiddleware((context, next) => {
    console.log('管理员操作')
    next()
  })
)

// 重试中间件
const retryableMiddleware = retryMiddleware(
  createMiddleware(async (context, next) => {
    if (Math.random() < 0.7) {
      throw new Error('随机失败')
    }
    next()
  }),
  3,
  1000
)

// 超时中间件
const timedMiddleware = timeoutMiddleware(
  createMiddleware(async (context, next) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    next()
  }),
  5000
)

// 缓存中间件
const cachedMiddleware = cacheMiddleware(
  (context: any) => `user-${context.userId}`,
  30000
)
```

### 状态工具

```typescript
import {
  createStateManager,
  deepClone,
  deepEqual,
  deepMerge,
  deleteNestedValue,
  getNestedValue,
  setNestedValue
} from '@ldesign/engine/utils'

// 创建状态管理器
function createStateManager(initialState?: Record<string, any>): StateManager {
  return new StateManager(initialState)
}

// 深度克隆
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any
  }

  if (typeof obj === 'object') {
    const cloned = {} as any
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  return obj
}

// 深度合并
function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  const result = {} as T

  for (const obj of objects) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = deepMerge(result[key] || {}, value) as any
        }
 else {
          result[key] = value as any
        }
      }
    }
  }

  return result
}

// 深度比较
function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true
  }

  if (a == null || b == null) {
    return false
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a !== 'object') {
    return false
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false
    }

    if (!deepEqual(a[key], b[key])) {
      return false
    }
  }

  return true
}

// 获取嵌套值
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[key]
  }

  return current
}

// 设置嵌套值
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {}
    }

    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

// 删除嵌套值
function deleteNestedValue(obj: any, path: string): boolean {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]

    if (current[key] == null || typeof current[key] !== 'object') {
      return false
    }

    current = current[key]
  }

  const lastKey = keys[keys.length - 1]
  if (lastKey in current) {
    delete current[lastKey]
    return true
  }

  return false
}

// 使用示例
const stateManager = createStateManager({
  user: { id: 1, name: 'John' },
  settings: { theme: 'dark' }
})

// 深度克隆
const cloned = deepClone({ a: { b: { c: 1 } } })
console.log('克隆结果:', cloned)

// 深度合并
const merged = deepMerge(
  { a: { b: 1 }, c: 2 },
  { a: { d: 3 }, e: 4 }
)
console.log('合并结果:', merged) // { a: { b: 1, d: 3 }, c: 2, e: 4 }

// 深度比较
const equal = deepEqual(
  { a: { b: 1 } },
  { a: { b: 1 } }
)
console.log('比较结果:', equal) // true

// 嵌套值操作
const obj = { a: { b: { c: 1 } } }
console.log('获取值:', getNestedValue(obj, 'a.b.c')) // 1

setNestedValue(obj, 'a.b.d', 2)
console.log('设置后:', obj) // { a: { b: { c: 1, d: 2 } } }

deleteNestedValue(obj, 'a.b.c')
console.log('删除后:', obj) // { a: { b: { d: 2 } } }
```

### 性能工具

```typescript
import {
  createPerformanceMonitor,
  createProfiler,
  debounce,
  measureMemory,
  measureTime,
  memoize,
  throttle
} from '@ldesign/engine/utils'

// 创建性能监控器
function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor()
}

// 测量执行时间
function measureTime<T>(
  fn: () => T | Promise<T>,
  label?: string
): Promise<{ result: T, duration: number }> {
  return new Promise(async (resolve) => {
    const start = performance.now()

    try {
      const result = await fn()
      const duration = performance.now() - start

      if (label) {
        console.log(`${label}: ${duration.toFixed(2)}ms`)
      }

      resolve({ result, duration })
    }
 catch (error) {
      const duration = performance.now() - start
      console.error(`${label || 'Function'} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  })
}

// 测量内存使用
function measureMemory(): MemoryInfo {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      used: usage.heapUsed,
      total: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    }
  }

  // 浏览器环境
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    }
  }

  return { used: 0, total: 0 }
}

interface MemoryInfo {
  used: number
  total: number
  external?: number
  rss?: number
  limit?: number
}

// 创建性能分析器
function createProfiler(name: string): Profiler {
  return new Profiler(name)
}

class Profiler {
  private marks: Map<string, number> = new Map()
  private measures: Array<{ name: string, duration: number }> = []

  constructor(private name: string) {}

  mark(label: string): void {
    this.marks.set(label, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      throw new Error(`Start mark '${startMark}' not found`)
    }

    const end = endMark ? this.marks.get(endMark) : performance.now()
    if (endMark && !end) {
      throw new Error(`End mark '${endMark}' not found`)
    }

    const duration = (end as number) - start
    this.measures.push({ name, duration })

    return duration
  }

  getReport(): PerformanceReport {
    return {
      name: this.name,
      measures: [...this.measures],
      totalTime: this.measures.reduce((sum, m) => sum + m.duration, 0)
    }
  }

  clear(): void {
    this.marks.clear()
    this.measures = []
  }
}

interface PerformanceReport {
  name: string
  measures: Array<{ name: string, duration: number }>
  totalTime: number
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= interval) {
      fn(...args)
      lastCall = now
    }
  }
}

// 记忆化函数
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>, clear: () => void } {
  const cache = new Map<string, ReturnType<T>>()

  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)

    return result
  }) as T & { cache: Map<string, ReturnType<T>>, clear: () => void }

  memoized.cache = cache
  memoized.clear = () => cache.clear()

  return memoized
}

// 使用示例
// 性能测量
const { result, duration } = await measureTime(async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return 'completed'
}, '异步操作')

console.log('结果:', result, '耗时:', duration)

// 内存监控
const memoryBefore = measureMemory()
// 执行一些操作
const memoryAfter = measureMemory()
console.log('内存变化:', memoryAfter.used - memoryBefore.used)

// 性能分析
const profiler = createProfiler('数据处理')
profiler.mark('start')
// 执行操作1
profiler.mark('middle')
// 执行操作2
profiler.mark('end')

const duration1 = profiler.measure('操作1', 'start', 'middle')
const duration2 = profiler.measure('操作2', 'middle', 'end')

console.log('性能报告:', profiler.getReport())

// 防抖和节流
const debouncedFn = debounce((value: string) => {
  console.log('防抖执行:', value)
}, 300)

const throttledFn = throttle((value: string) => {
  console.log('节流执行:', value)
}, 1000)

// 记忆化
function expensiveFunction(a: number, b: number) {
  console.log('执行昂贵计算')
  return a + b
}

const memoizedFn = memoize(expensiveFunction)
console.log(memoizedFn(1, 2)) // 执行计算
console.log(memoizedFn(1, 2)) // 使用缓存
```

### 验证工具

```typescript
import {
  createValidator,
  custom,
  isEmail,
  isNumber,
  isRequired,
  isString,
  isUrl,
  maxLength,
  minLength,
  pattern
} from '@ldesign/engine/utils'

// 验证器类型
type Validator<T = any> = (value: T) => ValidationResult

interface ValidationResult {
  valid: boolean
  message?: string
}

// 创建验证器
function createValidator<T = any>(
  ...validators: Validator<T>[]
): Validator<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid) {
        return result
      }
    }

    return { valid: true }
  }
}

// 必需验证
function isRequired<T>(message = '此字段为必填项'): Validator<T> {
  return (value: T) => {
    const valid = value !== null && value !== undefined && value !== ''
    return { valid, message: valid ? undefined : message }
  }
}

// 字符串验证
function isString(message = '必须是字符串'): Validator<any> {
  return (value: any) => {
    const valid = typeof value === 'string'
    return { valid, message: valid ? undefined : message }
  }
}

// 数字验证
function isNumber(message = '必须是数字'): Validator<any> {
  return (value: any) => {
    const valid = typeof value === 'number' && !isNaN(value)
    return { valid, message: valid ? undefined : message }
  }
}

// 邮箱验证
function isEmail(message = '邮箱格式不正确'): Validator<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return (value: string) => {
    const valid = emailRegex.test(value)
    return { valid, message: valid ? undefined : message }
  }
}

// URL验证
function isUrl(message = 'URL格式不正确'): Validator<string> {
  return (value: string) => {
    try {
      new URL(value)
      return { valid: true }
    }
 catch {
      return { valid: false, message }
    }
  }
}

// 最小长度验证
function minLength(min: number, message?: string): Validator<string> {
  return (value: string) => {
    const valid = value.length >= min
    return {
      valid,
      message: valid ? undefined : (message || `最少需要${min}个字符`)
    }
  }
}

// 最大长度验证
function maxLength(max: number, message?: string): Validator<string> {
  return (value: string) => {
    const valid = value.length <= max
    return {
      valid,
      message: valid ? undefined : (message || `最多允许${max}个字符`)
    }
  }
}

// 正则模式验证
function pattern(regex: RegExp, message = '格式不正确'): Validator<string> {
  return (value: string) => {
    const valid = regex.test(value)
    return { valid, message: valid ? undefined : message }
  }
}

// 自定义验证
function custom<T>(
  validator: (value: T) => boolean,
  message = '验证失败'
): Validator<T> {
  return (value: T) => {
    const valid = validator(value)
    return { valid, message: valid ? undefined : message }
  }
}

// 对象验证器
function createObjectValidator<T extends Record<string, any>>(
  schema: { [K in keyof T]: Validator<T[K]> }
): Validator<T> {
  return (obj: T) => {
    for (const key in schema) {
      const validator = schema[key]
      const result = validator(obj[key])

      if (!result.valid) {
        return {
          valid: false,
          message: `${String(key)}: ${result.message}`
        }
      }
    }

    return { valid: true }
  }
}

// 使用示例
// 创建用户验证器
const userValidator = createObjectValidator({
  name: createValidator(
    isRequired('姓名不能为空'),
    isString('姓名必须是字符串'),
    minLength(2, '姓名至少2个字符'),
    maxLength(50, '姓名最多50个字符')
  ),

  email: createValidator(
    isRequired('邮箱不能为空'),
    isString('邮箱必须是字符串'),
    isEmail('邮箱格式不正确')
  ),

  age: createValidator(
    isRequired('年龄不能为空'),
    isNumber('年龄必须是数字'),
    custom((age: number) => age >= 0 && age <= 150, '年龄必须在0-150之间')
  ),

  website: createValidator(
    isString('网站必须是字符串'),
    isUrl('网站URL格式不正确')
  ),

  password: createValidator(
    isRequired('密码不能为空'),
    isString('密码必须是字符串'),
    minLength(8, '密码至少8个字符'),
    pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')
  )
})

// 验证用户数据
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  website: 'https://johndoe.com',
  password: 'SecurePass123'
}

const validationResult = userValidator(userData)
if (validationResult.valid) {
  console.log('用户数据验证通过')
}
 else {
  console.error('验证失败:', validationResult.message)
}
```

### 异步工具

```typescript
import {
  delay,
  parallel,
  pool,
  queue,
  retry,
  series,
  timeout,
  waterfall
} from '@ldesign/engine/utils'

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 超时包装
function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = '操作超时'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })

  return Promise.race([promise, timeoutPromise])
}

// 重试函数
function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const result = await fn()
        resolve(result)
        return
      }
 catch (error) {
        attempts++

        if (attempts >= maxAttempts) {
          reject(error)
          return
        }

        await delay(delayMs * attempts)
      }
    }
  })
}

// 并行执行
function parallel<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(tasks.map(task => task()))
}

// 串行执行
function series<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  return tasks.reduce(async (acc, task) => {
    const results = await acc
    const result = await task()
    return [...results, result]
  }, Promise.resolve([] as T[]))
}

// 瀑布流执行
function waterfall<T>(
  tasks: Array<(input: any) => Promise<any>>,
  initialValue?: T
): Promise<any> {
  return tasks.reduce(async (acc, task) => {
    const input = await acc
    return task(input)
  }, Promise.resolve(initialValue))
}

// 任务队列
class TaskQueue<T = any> {
  private queue: Array<() => Promise<T>> = []
  private running = false
  private concurrency: number
  private activeCount = 0

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency
  }

  add(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task()
          resolve(result)
          return result
        }
 catch (error) {
          reject(error)
          throw error
        }
      })

      this.process()
    })
  }

  private async process(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return
    }

    this.activeCount++
    const task = this.queue.shift()!

    try {
      await task()
    }
 finally {
      this.activeCount--
      this.process()
    }
  }

  get size(): number {
    return this.queue.length
  }

  get pending(): number {
    return this.activeCount
  }
}

// 创建队列
function queue<T>(concurrency: number = 1): TaskQueue<T> {
  return new TaskQueue<T>(concurrency)
}

// 资源池
class ResourcePool<T> {
  private resources: T[] = []
  private waitingQueue: Array<(resource: T) => void> = []

  constructor(
    private factory: () => T | Promise<T>,
    private maxSize: number = 10
  ) {}

  async acquire(): Promise<T> {
    if (this.resources.length > 0) {
      return this.resources.pop()!
    }

    if (this.resources.length + this.waitingQueue.length < this.maxSize) {
      return await this.factory()
    }

    return new Promise((resolve) => {
      this.waitingQueue.push(resolve)
    })
  }

  release(resource: T): void {
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!
      waiter(resource)
    }
 else {
      this.resources.push(resource)
    }
  }

  async use<R>(
    fn: (resource: T) => Promise<R>
  ): Promise<R> {
    const resource = await this.acquire()

    try {
      return await fn(resource)
    }
 finally {
      this.release(resource)
    }
  }
}

// 创建资源池
function pool<T>(
  factory: () => T | Promise<T>,
  maxSize: number = 10
): ResourcePool<T> {
  return new ResourcePool(factory, maxSize)
}

// 使用示例
// 延迟执行
await delay(1000)
console.log('延迟1秒后执行')

// 超时控制
try {
  const result = await timeout(
    fetch('/api/data'),
    5000,
    'API请求超时'
  )
  console.log('请求成功:', result)
}
 catch (error) {
  console.error('请求失败:', error.message)
}

// 重试机制
const result = await retry(async () => {
  const response = await fetch('/api/unreliable')
  if (!response.ok) {
    throw new Error('请求失败')
  }
  return response.json()
}, 3, 1000)

// 并行执行
const results = await parallel([
  () => fetch('/api/data1').then(r => r.json()),
  () => fetch('/api/data2').then(r => r.json()),
  () => fetch('/api/data3').then(r => r.json())
])

// 串行执行
const serialResults = await series([
  () => fetch('/api/step1').then(r => r.json()),
  () => fetch('/api/step2').then(r => r.json()),
  () => fetch('/api/step3').then(r => r.json())
])

// 瀑布流
const waterfallResult = await waterfall([
  input => Promise.resolve(input + 1),
  input => Promise.resolve(input * 2),
  input => Promise.resolve(input - 3)
], 5) // 结果: (5 + 1) * 2 - 3 = 9

// 任务队列
const taskQueue = queue(2) // 并发数为2

for (let i = 0; i < 10; i++) {
  taskQueue.add(async () => {
    await delay(1000)
    console.log(`任务 ${i} 完成`)
    return i
  })
}

// 资源池
const dbPool = pool(() => {
  // 创建数据库连接
  return { query: (sql: string) => Promise.resolve([]) }
}, 5)

const data = await dbPool.use(async (db) => {
  return await db.query('SELECT * FROM users')
})
```

这个工具函数 API 文档提供了 @ldesign/engine 的完整工具函数集合，涵盖了引擎操作、插件管理、事件处理、中间件、状态管理、性能优化、验证和异步操作等各个方面的实用工具。
