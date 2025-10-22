/**
 * Concurrency Control Utilities
 * Provides Semaphore, ConcurrencyLimiter, RateLimiter, and CircuitBreaker
 */

// ============================================
// Semaphore
// ============================================

export class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []

  constructor(permits: number) {
    if (permits <= 0) {
      throw new Error('Permits must be greater than 0')
    }
    this.permits = permits
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }

    return new Promise<void>(resolve => {
      this.waiting.push(resolve)
    })
  }

  release(): void {
    this.permits++

    const resolve = this.waiting.shift()
    if (resolve) {
      this.permits--
      resolve()
    }
  }

  available(): number {
    return this.permits
  }

  waitingCount(): number {
    return this.waiting.length
  }

  async runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

export function createSemaphore(permits: number): Semaphore {
  return new Semaphore(permits)
}

// ============================================
// ConcurrencyLimiter
// ============================================

export interface ConcurrencyLimiterConfig {
  maxConcurrent: number
  timeout?: number
  onQueueFull?: () => void
  maxQueueSize?: number
}

export class ConcurrencyLimiter {
  private semaphore: Semaphore
  private config: Required<ConcurrencyLimiterConfig>
  private stats = {
    executed: 0,
    succeeded: 0,
    failed: 0,
    timeouts: 0,
    totalWaitTime: 0
  }

  constructor(config: ConcurrencyLimiterConfig) {
    this.semaphore = new Semaphore(config.maxConcurrent)
    this.config = {
      maxConcurrent: config.maxConcurrent,
      timeout: config.timeout || 30000,
      maxQueueSize: config.maxQueueSize || 1000,
      onQueueFull: config.onQueueFull || (() => { })
    }
  }

  async execute<T>(fn: () => Promise<T> | T): Promise<T> {
    if (this.semaphore.waitingCount() >= this.config.maxQueueSize) {
      this.config.onQueueFull()
      throw new Error('Concurrency queue is full')
    }

    const startWait = Date.now()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.stats.timeouts++
        reject(new Error('Operation timeout'))
      }, this.config.timeout)
    })

    try {
      this.stats.executed++

      const result = await Promise.race([
        this.semaphore.runExclusive(async () => {
          const waitTime = Date.now() - startWait
          this.stats.totalWaitTime += waitTime
          return await fn()
        }),
        timeoutPromise
      ])

      this.stats.succeeded++
      return result
    } catch (error) {
      this.stats.failed++
      throw error
    }
  }

  async executeBatch<T>(operations: Array<() => Promise<T> | T>): Promise<T[]> {
    return Promise.all(operations.map(op => this.execute(op)))
  }

  getStats(): typeof ConcurrencyLimiter.prototype.stats & {
    averageWaitTime: number
    currentWaiting: number
    available: number
  } {
    return {
      ...this.stats,
      averageWaitTime: this.stats.executed > 0
        ? this.stats.totalWaitTime / this.stats.executed
        : 0,
      currentWaiting: this.semaphore.waitingCount(),
      available: this.semaphore.available()
    }
  }

  resetStats(): void {
    this.stats = {
      executed: 0,
      succeeded: 0,
      failed: 0,
      timeouts: 0,
      totalWaitTime: 0
    }
  }
}

export function createConcurrencyLimiter(config: ConcurrencyLimiterConfig): ConcurrencyLimiter {
  return new ConcurrencyLimiter(config)
}

// ============================================
// RateLimiter
// ============================================

export interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
  strategy?: 'sliding' | 'fixed'
}

export class RateLimiter {
  private requests: number[] = []
  private config: Required<RateLimiterConfig>
  private stats = {
    totalRequests: 0,
    allowed: 0,
    rejected: 0,
    currentRate: 0
  }

  constructor(config: RateLimiterConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      strategy: config.strategy || 'sliding'
    }
  }

  async tryAcquire(): Promise<boolean> {
    this.stats.totalRequests++

    const now = Date.now()

    if (this.config.strategy === 'sliding') {
      this.requests = this.requests.filter(
        timestamp => now - timestamp < this.config.windowMs
      )
    } else {
      if (this.requests.length > 0 &&
        now - this.requests[0] >= this.config.windowMs) {
        this.requests = []
      }
    }

    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now)
      this.stats.allowed++
      this.updateRate()
      return true
    }

    this.stats.rejected++
    return false
  }

  async waitForPermit(): Promise<void> {
    while (!(await this.tryAcquire())) {
      const oldestRequest = this.requests[0]
      const waitTime = this.config.windowMs - (Date.now() - oldestRequest) + 10
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  async execute<T>(fn: () => Promise<T> | T): Promise<T> {
    await this.waitForPermit()
    return await fn()
  }

  private updateRate(): void {
    const now = Date.now()
    const recentRequests = this.requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    )
    this.stats.currentRate = (recentRequests.length / this.config.windowMs) * 1000
  }

  getStats(): typeof RateLimiter.prototype.stats {
    return { ...this.stats }
  }

  reset(): void {
    this.requests = []
    this.stats = {
      totalRequests: 0,
      allowed: 0,
      rejected: 0,
      currentRate: 0
    }
  }
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config)
}

// ============================================
// CircuitBreaker
// ============================================

export interface CircuitBreakerConfig {
  failureThreshold: number
  successThreshold: number
  timeout: number
  resetTimeout: number
  onStateChange?: (state: CircuitState) => void
}

export type CircuitState = 'closed' | 'open' | 'half-open'

export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failures = 0
  private successes = 0
  private lastFailureTime = 0
  private config: Required<CircuitBreakerConfig>
  private stats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    rejectedCalls: 0,
    stateChanges: 0
  }

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config.failureThreshold,
      successThreshold: config.successThreshold,
      timeout: config.timeout,
      resetTimeout: config.resetTimeout,
      onStateChange: config.onStateChange || (() => { })
    }
  }

  async execute<T>(fn: () => Promise<T> | T): Promise<T> {
    this.stats.totalCalls++

    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.changeState('half-open')
      } else {
        this.stats.rejectedCalls++
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Circuit breaker timeout'))
        }, this.config.timeout)
      })

      const result = await Promise.race([
        Promise.resolve(fn()),
        timeoutPromise
      ])

      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.stats.successfulCalls++
    this.failures = 0

    if (this.state === 'half-open') {
      this.successes++
      if (this.successes >= this.config.successThreshold) {
        this.changeState('closed')
        this.successes = 0
      }
    }
  }

  private onFailure(): void {
    this.stats.failedCalls++
    this.failures++
    this.lastFailureTime = Date.now()
    this.successes = 0

    if (this.state === 'half-open') {
      this.changeState('open')
    } else if (this.failures >= this.config.failureThreshold) {
      this.changeState('open')
    }
  }

  private changeState(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState
      this.stats.stateChanges++
      this.config.onStateChange(newState)
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getStats(): typeof CircuitBreaker.prototype.stats & {
    state: CircuitState
    failures: number
    successes: number
  } {
    return {
      ...this.stats,
      state: this.state,
      failures: this.failures,
      successes: this.successes
    }
  }

  reset(): void {
    this.changeState('closed')
    this.failures = 0
    this.successes = 0
    this.lastFailureTime = 0
  }

  forceOpen(): void {
    this.changeState('open')
  }

  forceClose(): void {
    this.changeState('closed')
    this.failures = 0
  }
}

export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  return new CircuitBreaker(config)
}

// ============================================
// Decorators
// ============================================

export function Concurrent(maxConcurrent: number) {
  const limiter = createConcurrencyLimiter({ maxConcurrent })

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return limiter.execute(() => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

export function RateLimit(maxRequests: number, windowMs: number) {
  const limiter = createRateLimiter({ maxRequests, windowMs })

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return limiter.execute(() => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

export function WithCircuitBreaker(config: CircuitBreakerConfig) {
  const breaker = createCircuitBreaker(config)

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return breaker.execute(() => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

// Export all for index.ts

