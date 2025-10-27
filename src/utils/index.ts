/**
 * @ldesign/engine/utils 工具函数集
 * 
 * 提供各种经过性能优化的实用工具函数，包括：
 * - 基础工具：防抖、节流、深拷贝、延迟等
 * - 数组处理：分块、去重、分组等
 * - 对象处理：嵌套值访问、深度合并等
 * - 类型检查：isFunction、isObject、isPromise等
 * - 错误处理：重试、安全JSON解析等
 * - 内存管理：LRU缓存、对象池、资源管理器
 * - 并发控制：信号量、速率限制、熔断器
 * - 批处理：DataLoader、请求合并、批处理调度器
 */

// ============ 基础工具函数 ============

/**
 * 数组分块
 * 
 * 将大数组分割成指定大小的小数组块，常用于批处理和分页。
 * 
 * ## 性能特点
 * - 时间复杂度：O(n)
 * - 空间复杂度：O(n)
 * - 使用 slice 创建新数组，不修改原数组
 * 
 * @template T 数组元素类型
 * @param {T[]} array 要分块的数组
 * @param {number} size 每块的大小
 * @returns {T[][]} 分块后的二维数组
 * 
 * @example
 * ```typescript
 * // 基础使用
 * const arr = [1, 2, 3, 4, 5, 6, 7]
 * const chunks = chunk(arr, 3)
 * // [[1, 2, 3], [4, 5, 6], [7]]
 * 
 * // 批处理API请求
 * const users = [user1, user2, ..., user100]
 * const batches = chunk(users, 10)
 * for (const batch of batches) {
 *   await Promise.all(batch.map(user => saveUser(user)))
 * }
 * ```
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * 防抖函数
 * 
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。
 * 常用于搜索输入、窗口resize等频繁触发的场景。
 * 
 * ## 工作原理
 * ```
 * 用户输入: a -> b -> c -> d -> [等待300ms] -> 执行
 *           |    |    |    |
 *          清除 清除 清除  设置定时器
 * ```
 * 
 * ## 性能优化
 * - 减少函数调用次数，降低CPU占用
 * - 避免频繁的DOM操作和网络请求
 * - 典型场景可减少90%+的函数调用
 * 
 * @template T 函数类型
 * @param {T} fn 要防抖的函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 * 
 * @example
 * ```typescript
 * // 搜索输入防抖
 * const debouncedSearch = debounce((query: string) => {
 *   api.search(query)
 * }, 300)
 * 
 * // 用户快速输入时，只有停止输入300ms后才会触发搜索
 * input.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value)
 * })
 * 
 * // 窗口resize防抖
 * const debouncedResize = debounce(() => {
 *   console.log('窗口大小变化')
 * }, 200)
 * window.addEventListener('resize', debouncedResize)
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * 
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次，只有一次生效。
 * 常用于滚动事件、按钮点击等需要限制频率的场景。
 * 
 * ## 工作原理
 * ```
 * 时间轴:  0ms   100ms  200ms  300ms  400ms  500ms
 * 触发:    ✓     ✗      ✓      ✗      ✓      ✗
 *         执行   忽略   执行   忽略   执行   忽略
 * （间隔200ms）
 * ```
 * 
 * ## 与防抖的区别
 * - **防抖**：等待停止触发后才执行（最后一次）
 * - **节流**：按固定频率执行（定期执行）
 * 
 * ## 使用场景
 * - **防抖**：搜索框输入、表单验证、按钮提交
 * - **节流**：滚动加载、拖拽、鼠标移动、窗口resize
 * 
 * @template T 函数类型
 * @param {T} fn 要节流的函数
 * @param {number} delay 节流间隔（毫秒）
 * @returns {Function} 节流后的函数
 * 
 * @example
 * ```typescript
 * // 滚动事件节流
 * const throttledScroll = throttle(() => {
 *   console.log('滚动位置:', window.scrollY)
 * }, 200)
 * window.addEventListener('scroll', throttledScroll)
 * 
 * // 按钮点击节流（防止重复点击）
 * const throttledSubmit = throttle(() => {
 *   api.submitForm(formData)
 * }, 1000)
 * button.addEventListener('click', throttledSubmit)
 * 
 * // 鼠标移动节流
 * const throttledMouseMove = throttle((e: MouseEvent) => {
 *   console.log('鼠标位置:', e.clientX, e.clientY)
 * }, 100)
 * document.addEventListener('mousemove', throttledMouseMove)
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any
  }

  const cloned: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as any)[key])
    }
  }
  return cloned
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

/**
 * 格式化时间
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

/**
 * 获取嵌套值
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * 设置嵌套值
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}

/**
 * 分组
 */
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * 去重
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * 检查是否为空
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 检查是否为函数
 */
export function isFunction(value: any): value is (...args: any[]) => unknown {
  return typeof value === 'function'
}

/**
 * 检查是否为对象
 */
export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object'
}

/**
 * 检查是否为 Promise
 */
export function isPromise(value: any): value is Promise<any> {
  return value instanceof Promise
}

/**
 * 安全的 JSON parse
 */
export function safeJsonParse(json: string, fallback: any = null): any {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * 安全的 JSON stringify
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return fallback
  }
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: number
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay: initialDelay = 1000, backoff = 2 } = options

  let lastError: unknown = null
  let currentDelay = initialDelay

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay))
        currentDelay *= backoff
      }
    }
  }

  throw (lastError instanceof Error ? lastError : new Error('Unknown error'))
}

// ============ 内存管理工具（新增） ============

export { createManagedContext, destroyGlobalContext, getGlobalContext } from './memory-management';
export { createMemoryMonitor, MemoryMonitor } from './memory-monitor';
export type { MemoryError, MemoryMonitorConfig, MemoryStats, MemoryWarning } from './memory-monitor';
export { createResourceManager, ResourceManager } from './resource-manager';

// ============ LRU缓存（新增） ============

export { createLRUCache, LRUCache } from './lru-cache';
export type { LRUCacheOptions } from './lru-cache';

// ============ 并发控制工具（新增） ============

export {
  Semaphore,
  createSemaphore,
  ConcurrencyLimiter,
  createConcurrencyLimiter,
  RateLimiter,
  createRateLimiter,
  CircuitBreaker,
  createCircuitBreaker,
  Concurrent,
  RateLimit,
  WithCircuitBreaker
} from './concurrency-control';
export type {
  ConcurrencyLimiterConfig,
  RateLimiterConfig,
  CircuitBreakerConfig,
  CircuitState
} from './concurrency-control';

// ============ 请求批处理（新增） ============

export {
  DataLoader,
  createDataLoader,
  RequestMerger,
  createRequestMerger,
  BatchScheduler,
  createBatchScheduler
} from './request-batcher';
export type {
  BatcherConfig,
  RequestMergerConfig,
  BatchSchedulerConfig
} from './request-batcher';

// ============ 内存分析（新增） ============

export {
  MemoryProfiler,
  createMemoryProfiler,
  MemoryLeakDetector,
  createMemoryLeakDetector
} from './memory-profiler';
export type {
  MemorySnapshot,
  LeakSuspect,
  MemoryProfilerConfig,
  LeakDetectorConfig
} from './memory-profiler';

// ============ 数据处理工具（新增） ============

export {
  DataValidator,
  createValidator,
  DataTransformer,
  createTransformer,
  DataNormalizer,
  createNormalizer,
  DataCompressor,
  createCompressor
} from './data-processing';

// ============ 异步工具（新增） ============

export {
  PromiseQueue,
  createPromiseQueue,
  ParallelExecutor,
  createParallelExecutor,
  executeSerial,
  withTimeout,
  CancellationToken,
  createCancellationToken,
  cancellablePromise,
  retryWithBackoff,
  parallelLimit,
  sleep,
  waitUntil,
  debouncePromise,
  createBatchExecutor,
  onceAsync,
  withRetry,
  allSettledSafe,
  poll
} from './async-helpers';

// ============ 安全工具（新增） ============

export {
  SimpleEncryption,
  createSimpleEncryption,
  HashUtils,
  createHashUtils,
  TokenManager,
  createTokenManager,
  PermissionValidator,
  createPermissionValidator,
  generateRandomString,
  generateUUID,
  secureRandom,
  base64Encode,
  base64Decode,
  checkPasswordStrength,
  secureCompare
} from './security-helpers';