/**
 * 异步工具函数集
 * 
 * 提供Promise队列、并行执行、超时控制等异步编程工具
 */

/**
 * Promise队列
 * 
 * 按顺序执行Promise，确保任务按添加顺序完成
 * 
 * @example
 * ```typescript
 * const queue = createPromiseQueue()
 * 
 * queue.add(() => api.fetchUser(1))
 * queue.add(() => api.fetchUser(2))
 * queue.add(() => api.fetchUser(3))
 * 
 * // 按顺序执行，每个任务完成后才执行下一个
 * ```
 */
export class PromiseQueue {
  private queue: Array<() => Promise<any>> = []
  private running = false
  private results: any[] = []

  /**
   * 添加任务到队列
   */
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task()
          this.results.push(result)
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })

      if (!this.running) {
        this.run()
      }
    })
  }

  /**
   * 运行队列
   */
  private async run(): Promise<void> {
    if (this.running || this.queue.length === 0) return

    this.running = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.error('队列任务执行失败:', error)
        }
      }
    }

    this.running = false
  }

  /**
   * 获取所有结果
   */
  getResults(): any[] {
    return [...this.results]
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = []
    this.results = []
  }

  /**
   * 获取队列长度
   */
  size(): number {
    return this.queue.length
  }
}

/**
 * 创建Promise队列
 */
export function createPromiseQueue(): PromiseQueue {
  return new PromiseQueue()
}

/**
 * 并行执行控制器
 * 
 * 控制Promise的并发执行数量，避免同时发起过多请求
 * 
 * @example
 * ```typescript
 * const executor = createParallelExecutor(3) // 最多3个并发
 * 
 * const tasks = users.map(user => 
 *   () => api.fetchUserData(user.id)
 * )
 * 
 * const results = await executor.execute(tasks)
 * ```
 */
export class ParallelExecutor {
  constructor(private concurrency: number = 5) { }

  /**
   * 并行执行任务
   */
  async execute<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = []
    const executing: Promise<void>[] = []

    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result)
      })

      executing.push(promise)

      if (executing.length >= this.concurrency) {
        await Promise.race(executing)
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        )
      }
    }

    await Promise.all(executing)
    return results
  }

  /**
   * 设置并发数
   */
  setConcurrency(n: number): void {
    this.concurrency = n
  }
}

/**
 * 创建并行执行器
 */
export function createParallelExecutor(concurrency = 5): ParallelExecutor {
  return new ParallelExecutor(concurrency)
}

/**
 * 串行执行器
 * 
 * 按顺序执行Promise数组
 */
export async function executeSerial<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = []

  for (const task of tasks) {
    const result = await task()
    results.push(result)
  }

  return results
}

/**
 * 超时控制
 * 
 * 为Promise添加超时限制，超时后自动拒绝
 * 
 * @example
 * ```typescript
 * // 3秒超时
 * const result = await withTimeout(
 *   api.fetchData(),
 *   3000,
 *   '请求超时'
 * )
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string | Error = '操作超时'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const error = typeof timeoutError === 'string'
          ? new Error(timeoutError)
          : timeoutError
        reject(error)
      }, timeoutMs)
    })
  ])
}

/**
 * 取消令牌（AbortController封装）
 * 
 * 提供统一的取消机制，支持多个操作共享同一个取消令牌
 * 
 * @example
 * ```typescript
 * const token = createCancellationToken()
 * 
 * // 在多个地方使用同一个token
 * fetch('/api/user', { signal: token.signal })
 * fetch('/api/posts', { signal: token.signal })
 * 
 * // 取消所有请求
 * token.cancel('用户取消操作')
 * ```
 */
export class CancellationToken {
  private controller: AbortController
  private _isCancelled = false
  private _reason?: string

  constructor() {
    this.controller = new AbortController()
  }

  /**
   * 获取AbortSignal
   */
  get signal(): AbortSignal {
    return this.controller.signal
  }

  /**
   * 是否已取消
   */
  get isCancelled(): boolean {
    return this._isCancelled
  }

  /**
   * 取消原因
   */
  get reason(): string | undefined {
    return this._reason
  }

  /**
   * 取消操作
   */
  cancel(reason?: string): void {
    if (this._isCancelled) return

    this._isCancelled = true
    this._reason = reason
    this.controller.abort(reason)
  }

  /**
   * 抛出取消错误（如果已取消）
   */
  throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new Error(this._reason || '操作已取消')
    }
  }
}

/**
 * 创建取消令牌
 */
export function createCancellationToken(): CancellationToken {
  return new CancellationToken()
}

/**
 * 可取消的Promise
 * 
 * 包装Promise使其可取消
 */
export function cancellablePromise<T>(
  executor: (
    resolve: (value: T) => void,
    reject: (reason?: any) => void,
    token: CancellationToken
  ) => void
): { promise: Promise<T>; cancel: (reason?: string) => void } {
  const token = createCancellationToken()

  const promise = new Promise<T>((resolve, reject) => {
    token.signal.addEventListener('abort', () => {
      reject(new Error(token.reason || '操作已取消'))
    })

    executor(resolve, reject, token)
  })

  return {
    promise,
    cancel: (reason) => token.cancel(reason)
  }
}

/**
 * 重试包装器（带指数退避）
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => api.unstableEndpoint(),
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     maxDelay: 10000,
 *     backoffFactor: 2
 *   }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
    onRetry?: (attempt: number, error: any) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onRetry
  } = options

  let lastError: any
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, error)

        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffFactor, maxDelay)
      }
    }
  }

  throw lastError
}

/**
 * 并发限制执行
 * 
 * 简化的并发控制，确保同时运行的Promise不超过指定数量
 */
export async function parallelLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<any>[] = []

  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result)
      executing.splice(executing.indexOf(p), 1)
    })

    executing.push(p)

    if (executing.length >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * 睡眠函数（带取消支持）
 */
export function sleep(ms: number, token?: CancellationToken): Promise<void> {
  return new Promise((resolve, reject) => {
    if (token?.isCancelled) {
      reject(new Error(token.reason || '操作已取消'))
      return
    }

    const timer = setTimeout(resolve, ms)

    token?.signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error(token.reason || '操作已取消'))
    })
  })
}

/**
 * 等待条件满足
 * 
 * @example
 * ```typescript
 * // 等待DOM元素出现
 * await waitUntil(
 *   () => document.querySelector('#app') !== null,
 *   { timeout: 5000, interval: 100 }
 * )
 * ```
 */
export async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number
    interval?: number
    timeoutError?: string
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, timeoutError = '等待超时' } = options
  const startTime = Date.now()

  while (true) {
    const result = await Promise.resolve(condition())
    if (result) return

    if (Date.now() - startTime > timeout) {
      throw new Error(timeoutError)
    }

    await sleep(interval)
  }
}

/**
 * 防抖Promise
 * 
 * 确保在指定时间内只执行最后一次调用
 */
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: number | undefined
  let latestResolve: ((value: any) => void) | undefined
  let latestReject: ((reason: any) => void) | undefined

  return function (...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      // 取消之前的调用
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }

      latestResolve = resolve
      latestReject = reject

      timeoutId = window.setTimeout(async () => {
        try {
          const result = await fn(...args)
          latestResolve?.(result)
        } catch (error) {
          latestReject?.(error)
        }
      }, delay)
    })
  }
}

/**
 * 批处理执行器
 * 
 * 收集一段时间内的所有调用，然后批量执行
 * 
 * @example
 * ```typescript
 * const batchSave = createBatchExecutor(
 *   async (users: User[]) => {
 *     await api.batchSaveUsers(users)
 *   },
 *   { delay: 100, maxBatchSize: 50 }
 * )
 * 
 * // 多次调用会被批量处理
 * batchSave(user1)
 * batchSave(user2)
 * batchSave(user3)
 * // 100ms后统一执行：api.batchSaveUsers([user1, user2, user3])
 * ```
 */
export function createBatchExecutor<T, R>(
  executor: (batch: T[]) => Promise<R>,
  options: {
    delay?: number
    maxBatchSize?: number
  } = {}
): (item: T) => Promise<R> {
  const { delay = 0, maxBatchSize = Infinity } = options

  let batch: T[] = []
  let timeoutId: number | undefined

  const flush = async (): Promise<R> => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }

    const currentBatch = batch
    batch = []

    return await executor(currentBatch)
  }

  return (item: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      batch.push(item)

      if (batch.length >= maxBatchSize) {
        flush().then(resolve).catch(reject)
      } else {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(() => {
          flush().then(resolve).catch(reject)
        }, delay)
      }
    })
  }
}

/**
 * 最多一次执行（Memoize Promise）
 * 
 * 确保同一个Promise只执行一次，后续调用返回相同结果
 */
export function onceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  let cached: Promise<ReturnType<T>> | undefined
  let called = false

  return function (...args: Parameters<T>): Promise<ReturnType<T>> {
    if (!called) {
      called = true
      cached = fn(...args)
    }
    return cached!
  } as T
}

/**
 * 重试装饰器
 * 
 * 为函数添加自动重试功能
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries = 3,
  delay = 1000
): T {
  return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args)
      } catch (error) {
        lastError = error
        if (attempt < maxRetries) {
          await sleep(delay * (attempt + 1))
        }
      }
    }

    throw lastError
  } as T
}

/**
 * Promise.all的安全版本
 * 
 * 即使部分Promise失败，也返回成功的结果
 */
export async function allSettledSafe<T>(
  promises: Promise<T>[]
): Promise<Array<{ success: true; value: T } | { success: false; error: any }>> {
  const results = await Promise.allSettled(promises)

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return { success: true, value: result.value }
    } else {
      return { success: false, error: result.reason }
    }
  })
}

/**
 * 轮询函数
 * 
 * 定期执行函数直到满足条件或超时
 * 
 * @example
 * ```typescript
 * // 轮询检查任务状态
 * const result = await poll(
 *   async () => {
 *     const status = await api.getTaskStatus(taskId)
 *     return status === 'completed' ? status : null
 *   },
 *   { interval: 1000, timeout: 30000 }
 * )
 * ```
 */
export async function poll<T>(
  fn: () => Promise<T | null | undefined>,
  options: {
    interval?: number
    timeout?: number
    onTick?: (attempt: number) => void
  } = {}
): Promise<T> {
  const { interval = 1000, timeout = 30000, onTick } = options
  const startTime = Date.now()
  let attempt = 0

  while (true) {
    attempt++
    onTick?.(attempt)

    const result = await fn()
    if (result !== null && result !== undefined) {
      return result
    }

    if (Date.now() - startTime > timeout) {
      throw new Error('轮询超时')
    }

    await sleep(interval)
  }
}
