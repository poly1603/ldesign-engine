/**
 * 资源管理模块
 *
 * 提供统一的资源释放协议和内存泄漏检测机制
 *
 * @module utils/disposable
 */

/**
 * AggregateError polyfill for environments that don't support it
 */
class AggregateErrorPolyfill extends Error {
  errors: Error[];

  constructor(errors: Error[], message?: string) {
    super(message);
    this.name = 'AggregateError';
    this.errors = errors;
  }
}

// Use native AggregateError if available, otherwise use polyfill
const AggregateErrorImpl = (typeof globalThis !== 'undefined' &&
  'AggregateError' in globalThis)
  ? (globalThis as unknown as { AggregateError: typeof AggregateErrorPolyfill }).AggregateError
  : AggregateErrorPolyfill;

// Replace global reference
const AggregateError = AggregateErrorImpl;

/**
 * 可释放资源接口
 *
 * 实现此接口的对象可以被统一管理和释放
 *
 * @example
 * ```typescript
 * class DatabaseConnection implements Disposable {
 *   private connection: Connection
 *
 *   dispose(): void {
 *     this.connection.close()
 *   }
 *
 *   get isDisposed(): boolean {
 *     return this.connection.isClosed
 *   }
 * }
 * ```
 */
export interface Disposable {
  /** 释放资源 */
  dispose(): void | Promise<void>
  /** 是否已释放 */
  readonly isDisposed: boolean
}

/**
 * 资源释放回调
 */
export type DisposeCallback = () => void | Promise<void>

/**
 * 资源泄漏警告配置
 */
export interface LeakDetectorConfig {
  /** 是否启用泄漏检测 */
  enabled: boolean
  /** 警告阈值（未释放资源数量） */
  warningThreshold?: number
  /** 自定义警告回调 */
  onWarning?: (message: string, unreleased: string[]) => void
}

/**
 * 组合资源管理器
 *
 * 用于管理多个可释放资源，确保它们按正确顺序释放
 *
 * @example
 * ```typescript
 * const disposables = new CompositeDisposable()
 *
 * // 添加资源
 * disposables.add(connection)
 * disposables.add(subscription)
 * disposables.add(() => cleanup())
 *
 * // 一次性释放所有资源
 * await disposables.dispose()
 * ```
 */
export class CompositeDisposable implements Disposable {
  private resources: Array<Disposable | DisposeCallback> = []
  private disposed = false
  private resourceNames = new Map<Disposable | DisposeCallback, string>()

  /**
   * 添加可释放资源
   *
   * @param resource - 可释放资源或释放回调
   * @param name - 资源名称（用于调试和泄漏检测）
   * @returns 当前实例（支持链式调用）
   */
  add(resource: Disposable | DisposeCallback, name?: string): this {
    if (this.disposed) {
      // 如果已释放，立即释放新添加的资源
      this.disposeResource(resource)
      return this
    }

    this.resources.push(resource)
    if (name) {
      this.resourceNames.set(resource, name)
    }

    return this
  }

  /**
   * 移除资源（不释放）
   *
   * @param resource - 要移除的资源
   * @returns 是否移除成功
   */
  remove(resource: Disposable | DisposeCallback): boolean {
    const index = this.resources.indexOf(resource)
    if (index !== -1) {
      this.resources.splice(index, 1)
      this.resourceNames.delete(resource)
      return true
    }
    return false
  }

  /**
   * 释放所有资源
   *
   * 按照添加的相反顺序释放（LIFO）
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.disposed = true

    // 逆序释放资源
    const errors: Error[] = []
    for (let i = this.resources.length - 1; i >= 0; i--) {
      try {
        await this.disposeResource(this.resources[i])
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    this.resources.length = 0
    this.resourceNames.clear()

    // 如果有错误，抛出聚合错误
    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `Failed to dispose ${errors.length} resource(s)`
      )
    }
  }

  /**
   * 是否已释放
   */
  get isDisposed(): boolean {
    return this.disposed
  }

  /**
   * 资源数量
   */
  get size(): number {
    return this.resources.length
  }

  /**
   * 获取未释放资源名称列表
   */
  getResourceNames(): string[] {
    return this.resources.map((r, i) =>
      this.resourceNames.get(r) || `resource_${i}`
    )
  }

  /**
   * 释放单个资源
   * @private
   */
  private async disposeResource(resource: Disposable | DisposeCallback): Promise<void> {
    if (typeof resource === 'function') {
      await resource()
    } else {
      await resource.dispose()
    }
  }
}

/**
 * 自动资源管理器
 *
 * 提供类似 Python with 语句或 C# using 语句的资源管理
 *
 * @example
 * ```typescript
 * // 自动释放资源
 * await using(connection, async (conn) => {
 *   await conn.query('SELECT * FROM users')
 * })
 * // connection 已自动释放
 * ```
 */
export async function using<T extends Disposable, R>(
  resource: T,
  fn: (resource: T) => R | Promise<R>
): Promise<R> {
  try {
    return await fn(resource)
  } finally {
    await resource.dispose()
  }
}

/**
 * 多资源自动管理
 *
 * @example
 * ```typescript
 * await usingAll([conn1, conn2], async ([c1, c2]) => {
 *   await c1.query('...')
 *   await c2.query('...')
 * })
 * ```
 */
export async function usingAll<T extends Disposable[], R>(
  resources: T,
  fn: (resources: T) => R | Promise<R>
): Promise<R> {
  const disposable = new CompositeDisposable()
  resources.forEach(r => disposable.add(r))

  try {
    return await fn(resources)
  } finally {
    await disposable.dispose()
  }
}

/**
 * 资源泄漏检测器
 *
 * 用于开发环境检测未正确释放的资源
 *
 * @example
 * ```typescript
 * const detector = new LeakDetector({
 *   enabled: process.env.NODE_ENV === 'development',
 *   warningThreshold: 10
 * })
 *
 * // 注册资源
 * const id = detector.track(connection, 'DB Connection')
 *
 * // 释放时取消跟踪
 * detector.untrack(id)
 *
 * // 检查泄漏
 * detector.checkLeaks()
 * ```
 */
export class LeakDetector {
  private tracked = new Map<string, { name: string; stack?: string; timestamp: number }>()
  private config: LeakDetectorConfig
  private idCounter = 0

  constructor(config: LeakDetectorConfig) {
    this.config = {
      warningThreshold: 50,
      ...config
    }
  }

  /**
   * 开始跟踪资源
   *
   * @param resource - 资源对象
   * @param name - 资源名称
   * @returns 跟踪 ID
   */
  track(resource: Disposable, name: string): string {
    if (!this.config.enabled) {
      return ''
    }

    const id = `resource_${++this.idCounter}`
    this.tracked.set(id, {
      name,
      stack: new Error().stack,
      timestamp: Date.now()
    })

    // 检查是否超过阈值
    if (this.tracked.size >= (this.config.warningThreshold ?? 50)) {
      this.warn()
    }

    return id
  }

  /**
   * 取消跟踪资源
   *
   * @param id - 跟踪 ID
   */
  untrack(id: string): void {
    if (!this.config.enabled || !id) {
      return
    }

    this.tracked.delete(id)
  }

  /**
   * 检查资源泄漏
   *
   * @returns 未释放的资源信息
   */
  checkLeaks(): Array<{ name: string; age: number; stack?: string }> {
    if (!this.config.enabled) {
      return []
    }

    const now = Date.now()
    const leaks: Array<{ name: string; age: number; stack?: string }> = []

    this.tracked.forEach((info) => {
      leaks.push({
        name: info.name,
        age: now - info.timestamp,
        stack: info.stack
      })
    })

    return leaks
  }

  /**
   * 获取未释放资源数量
   */
  get leakCount(): number {
    return this.tracked.size
  }

  /**
   * 发出警告
   * @private
   */
  private warn(): void {
    const unreleased = Array.from(this.tracked.values()).map(v => v.name)
    const message = `[LeakDetector] Warning: ${unreleased.length} resources have not been disposed`

    if (this.config.onWarning) {
      this.config.onWarning(message, unreleased)
    } else {
      console.warn(message, unreleased)
    }
  }

  /**
   * 清理所有跟踪
   */
  clear(): void {
    this.tracked.clear()
  }
}

/**
 * 创建可取消的资源包装器
 *
 * @param dispose - 释放回调
 * @returns Disposable 对象
 *
 * @example
 * ```typescript
 * const subscription = createDisposable(() => {
 *   eventEmitter.off('event', handler)
 * })
 *
 * // 稍后释放
 * subscription.dispose()
 * ```
 */
export function createDisposable(dispose: DisposeCallback): Disposable {
  let disposed = false

  return {
    dispose: async () => {
      if (disposed) return
      disposed = true
      await dispose()
    },
    get isDisposed() {
      return disposed
    }
  }
}

/**
 * 延迟初始化的可释放资源
 *
 * 资源在首次访问时才会创建
 *
 * @example
 * ```typescript
 * const lazyConnection = new LazyDisposable(
 *   async () => await createConnection(),
 *   async (conn) => await conn.close()
 * )
 *
 * // 首次访问时创建
 * const conn = await lazyConnection.get()
 *
 * // 释放
 * await lazyConnection.dispose()
 * ```
 */
export class LazyDisposable<T> implements Disposable {
  private instance: T | null = null
  private initializing: Promise<T> | null = null
  private disposed = false

  constructor(
    private factory: () => T | Promise<T>,
    private disposer: (instance: T) => void | Promise<void>
  ) {}

  /**
   * 获取资源实例（懒加载）
   */
  async get(): Promise<T> {
    if (this.disposed) {
      throw new Error('Resource has been disposed')
    }

    if (this.instance !== null) {
      return this.instance
    }

    // 防止并发初始化
    if (this.initializing) {
      return this.initializing
    }

    this.initializing = Promise.resolve(this.factory()).then(instance => {
      this.instance = instance
      this.initializing = null
      return instance
    })

    return this.initializing
  }

  /**
   * 检查是否已初始化
   */
  get isInitialized(): boolean {
    return this.instance !== null
  }

  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.disposed = true

    // 等待初始化完成
    if (this.initializing) {
      await this.initializing
    }

    if (this.instance !== null) {
      await this.disposer(this.instance)
      this.instance = null
    }
  }

  get isDisposed(): boolean {
    return this.disposed
  }
}

/**
 * 引用计数资源管理器
 *
 * 当所有引用都释放后才真正释放资源
 *
 * @example
 * ```typescript
 * const shared = new RefCountedDisposable(connection)
 *
 * // 增加引用
 * const ref1 = shared.acquire()
 * const ref2 = shared.acquire()
 *
 * // 释放引用
 * ref1.dispose()  // 不会释放 connection
 * ref2.dispose()  // 释放 connection
 * ```
 */
export class RefCountedDisposable<T extends Disposable> implements Disposable {
  private refCount = 1
  private disposed = false

  constructor(private resource: T) {}

  /**
   * 获取新引用
   *
   * @returns 可释放的引用
   */
  acquire(): Disposable {
    if (this.disposed) {
      throw new Error('Resource has been disposed')
    }

    this.refCount++

    return createDisposable(() => {
      this.release()
    })
  }

  /**
   * 获取底层资源
   */
  get value(): T {
    if (this.disposed) {
      throw new Error('Resource has been disposed')
    }
    return this.resource
  }

  /**
   * 释放一个引用
   * @private
   */
  private async release(): Promise<void> {
    this.refCount--

    if (this.refCount === 0 && !this.disposed) {
      await this.dispose()
    }
  }

  /**
   * 强制释放（无视引用计数）
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.refCount = 0
    await this.resource.dispose()
  }

  get isDisposed(): boolean {
    return this.disposed
  }

  /**
   * 获取当前引用计数
   */
  get referenceCount(): number {
    return this.refCount
  }
}

/**
 * 作用域资源管理器
 *
 * 在特定作用域内自动管理资源
 *
 * @example
 * ```typescript
 * await withScope(async (scope) => {
 *   const conn = scope.use(await createConnection())
 *   const file = scope.use(await openFile())
 *
 *   // 使用资源...
 *
 * }) // 作用域结束时自动释放所有资源
 * ```
 */
export class ResourceScope {
  private disposables = new CompositeDisposable()

  /**
   * 在作用域内使用资源
   *
   * @param resource - 资源
   * @param name - 资源名称
   * @returns 资源本身
   */
  use<T extends Disposable>(resource: T, name?: string): T {
    this.disposables.add(resource, name)
    return resource
  }

  /**
   * 添加清理回调
   *
   * @param callback - 清理回调
   * @param name - 回调名称
   */
  defer(callback: DisposeCallback, name?: string): void {
    this.disposables.add(callback, name)
  }

  /**
   * 释放所有资源
   */
  async dispose(): Promise<void> {
    await this.disposables.dispose()
  }
}

/**
 * 在作用域内执行函数，自动管理资源
 *
 * @param fn - 作用域函数
 * @returns 函数返回值
 */
export async function withScope<R>(
  fn: (scope: ResourceScope) => R | Promise<R>
): Promise<R> {
  const scope = new ResourceScope()
  try {
    return await fn(scope)
  } finally {
    await scope.dispose()
  }
}
