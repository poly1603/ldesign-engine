/**
 * Error Recovery Module
 *
 * Provides automatic recovery mechanisms for various engine operations.
 *
 * @module errors/recovery
 */

import type { Plugin, PluginContext } from '../types/plugin'
import type { CoreEngine } from '../types/engine'
import {
  EngineError,
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy
} from './engine-error'

export { RecoveryStrategy }

/**
 * Recovery options
 */
export interface RecoveryOptions {
  /** Maximum retry attempts */
  maxRetries?: number
  /** Delay between retries (ms) */
  retryDelay?: number
  /** Exponential backoff multiplier */
  backoffMultiplier?: number
  /** Maximum delay (ms) */
  maxDelay?: number
  /** Strategy to use when all retries fail */
  fallbackStrategy?: RecoveryStrategy
  /** Custom error handler */
  onError?: (error: Error, attempt: number) => void
  /** Custom recovery decision */
  shouldRecover?: (error: Error) => boolean
}

/**
 * Recovery result
 */
export interface RecoveryResult<T> {
  /** Whether recovery was successful */
  success: boolean
  /** Result value if successful */
  value?: T
  /** Error if failed */
  error?: EngineError
  /** Number of attempts made */
  attempts: number
  /** Strategy that was applied */
  strategy: RecoveryStrategy
  /** Time taken for recovery (ms) */
  duration: number
}

/**
 * Plugin installation checkpoint for rollback
 */
interface PluginCheckpoint {
  /** Plugin name */
  name: string
  /** State snapshot before installation */
  stateSnapshot: Map<string, unknown>
  /** Event listeners registered */
  eventListeners: Array<{ event: string; handler: Function }>
  /** Services registered */
  services: Array<string | symbol>
  /** Timestamp */
  timestamp: number
}

/**
 * Recoverable operation wrapper
 *
 * Wraps async operations with automatic retry and rollback capabilities.
 *
 * @example
 * ```typescript
 * const result = await recoverableOperation(
 *   async () => await plugin.install(context),
 *   {
 *     maxRetries: 3,
 *     retryDelay: 1000,
 *     backoffMultiplier: 2,
 *     onError: (error, attempt) => {
 *       console.log(`Attempt ${attempt} failed:`, error)
 *     }
 *   }
 * )
 *
 * if (!result.success) {
 *   console.error('Operation failed after all retries:', result.error)
 * }
 * ```
 */
export async function recoverableOperation<T>(
  operation: () => Promise<T>,
  options: RecoveryOptions = {}
): Promise<RecoveryResult<T>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
    fallbackStrategy = RecoveryStrategy.FAIL,
    onError,
    shouldRecover = () => true,
  } = options

  const startTime = performance.now()
  let lastError: Error | undefined
  let currentDelay = retryDelay

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const value = await operation()
      return {
        success: true,
        value,
        attempts: attempt,
        strategy: RecoveryStrategy.RETRY,
        duration: performance.now() - startTime,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      onError?.(lastError, attempt)

      // Check if we should recover
      if (!shouldRecover(lastError)) {
        break
      }

      // If this was not the last attempt, wait and retry
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay))
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay)
      }
    }
  }

  // All retries exhausted
  const engineError = lastError instanceof EngineError
    ? lastError
    : new EngineError(
        `Operation failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
        ErrorCode.UNKNOWN,
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.HIGH,
          cause: lastError,
          recoverable: false,
        }
      )

  return {
    success: false,
    error: engineError,
    attempts: maxRetries + 1,
    strategy: fallbackStrategy,
    duration: performance.now() - startTime,
  }
}

/**
 * Plugin installation recovery manager
 *
 * Provides automatic rollback for failed plugin installations.
 *
 * @example
 * ```typescript
 * const recovery = new PluginRecoveryManager(engine)
 *
 * // Create checkpoint before installation
 * const checkpoint = recovery.createCheckpoint('my-plugin')
 *
 * try {
 *   await plugin.install(context)
 * } catch (error) {
 *   // Rollback to checkpoint
 *   await recovery.rollback(checkpoint)
 * }
 * ```
 */
export class PluginRecoveryManager {
  private checkpoints = new Map<string, PluginCheckpoint>()
  private maxCheckpoints = 10

  constructor(private engine: CoreEngine) {}

  /**
   * Create a checkpoint before plugin installation
   *
   * @param pluginName - Name of the plugin being installed
   * @returns Checkpoint ID
   */
  createCheckpoint(pluginName: string): string {
    const checkpointId = `${pluginName}-${Date.now()}`

    // Snapshot current state
    const stateSnapshot = new Map<string, unknown>()
    for (const key of this.engine.state.keys()) {
      stateSnapshot.set(key, this.engine.state.get(key))
    }

    const checkpoint: PluginCheckpoint = {
      name: pluginName,
      stateSnapshot,
      eventListeners: [],
      services: [],
      timestamp: Date.now(),
    }

    this.checkpoints.set(checkpointId, checkpoint)

    // Limit checkpoint count
    if (this.checkpoints.size > this.maxCheckpoints) {
      const oldestKey = this.checkpoints.keys().next().value
      if (oldestKey) {
        this.checkpoints.delete(oldestKey)
      }
    }

    return checkpointId
  }

  /**
   * Rollback to a checkpoint
   *
   * @param checkpointId - ID of the checkpoint to rollback to
   * @returns Whether rollback was successful
   */
  async rollback(checkpointId: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) {
      console.error(`[PluginRecovery] Checkpoint not found: ${checkpointId}`)
      return false
    }

    try {
      // Restore state
      const currentKeys = this.engine.state.keys()

      // Remove new keys
      currentKeys.forEach(key => {
        if (!checkpoint.stateSnapshot.has(key)) {
          this.engine.state.delete(key)
        }
      })

      // Restore old values
      checkpoint.stateSnapshot.forEach((value, key) => {
        this.engine.state.set(key, value)
      })

      console.log(`[PluginRecovery] Rolled back to checkpoint: ${checkpointId}`)
      return true
    } catch (error) {
      console.error(`[PluginRecovery] Rollback failed:`, error)
      return false
    } finally {
      // Clean up checkpoint
      this.checkpoints.delete(checkpointId)
    }
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.checkpoints.clear()
  }

  /**
   * Get checkpoint count
   */
  get checkpointCount(): number {
    return this.checkpoints.size
  }
}

/**
 * Safe plugin installer with automatic recovery
 *
 * @param engine - Engine instance
 * @param plugin - Plugin to install
 * @param context - Plugin context
 * @param options - Installation options
 * @returns Installation result
 *
 * @example
 * ```typescript
 * const result = await safeInstallPlugin(
 *   engine,
 *   myPlugin,
 *   context,
 *   {
 *     maxRetries: 2,
 *     rollbackOnFailure: true
 *   }
 * )
 *
 * if (!result.success) {
 *   console.error('Plugin installation failed:', result.error)
 * }
 * ```
 */
export async function safeInstallPlugin<T>(
  engine: CoreEngine,
  plugin: Plugin<T>,
  context: PluginContext,
  options?: T,
  recoveryOptions: RecoveryOptions & { rollbackOnFailure?: boolean } = {}
): Promise<RecoveryResult<void>> {
  const { rollbackOnFailure = true, ...retryOptions } = recoveryOptions
  const recoveryManager = new PluginRecoveryManager(engine)

  // Create checkpoint
  const checkpointId = rollbackOnFailure
    ? recoveryManager.createCheckpoint(plugin.name)
    : ''

  const result = await recoverableOperation(
    async () => {
      await plugin.install(context, options)
    },
    {
      ...retryOptions,
      onError: (error, attempt) => {
        console.warn(
          `[SafeInstall] Plugin "${plugin.name}" installation attempt ${attempt} failed:`,
          error.message
        )
        retryOptions.onError?.(error, attempt)
      },
    }
  )

  // Rollback on failure
  if (!result.success && rollbackOnFailure && checkpointId) {
    const rollbackSuccess = await recoveryManager.rollback(checkpointId)
    if (!rollbackSuccess) {
      console.error(
        `[SafeInstall] Rollback failed for plugin "${plugin.name}"`
      )
    }
  }

  return result
}

/**
 * Batch operation with partial failure handling
 *
 * Executes multiple operations and handles partial failures.
 *
 * @example
 * ```typescript
 * const result = await batchOperationWithRecovery(
 *   [
 *     () => installPlugin1(),
 *     () => installPlugin2(),
 *     () => installPlugin3(),
 *   ],
 *   {
 *     continueOnError: true,
 *     rollbackAll: true
 *   }
 * )
 *
 * console.log(`${result.succeeded} succeeded, ${result.failed} failed`)
 * ```
 */
export async function batchOperationWithRecovery<T>(
  operations: Array<() => Promise<T>>,
  options: {
    continueOnError?: boolean
    rollbackAll?: boolean
    maxConcurrency?: number
  } = {}
): Promise<{
  succeeded: number
  failed: number
  results: Array<RecoveryResult<T>>
  errors: Error[]
}> {
  const { continueOnError = true, maxConcurrency = 1 } = options
  const results: Array<RecoveryResult<T>> = []
  const errors: Error[] = []
  let succeeded = 0
  let failed = 0

  // Execute operations sequentially or with limited concurrency
  if (maxConcurrency === 1) {
    for (const operation of operations) {
      const result = await recoverableOperation(operation, { maxRetries: 0 })
      results.push(result)

      if (result.success) {
        succeeded++
      } else {
        failed++
        if (result.error) errors.push(result.error)
        if (!continueOnError) break
      }
    }
  } else {
    // Execute with limited concurrency
    const executing: Promise<void>[] = []

    for (const operation of operations) {
      const promise = (async () => {
        const result = await recoverableOperation(operation, { maxRetries: 0 })
        results.push(result)

        if (result.success) {
          succeeded++
        } else {
          failed++
          if (result.error) errors.push(result.error)
        }
      })()

      executing.push(promise)

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
        // Remove completed promises
        for (let i = executing.length - 1; i >= 0; i--) {
          if (executing[i] !== promise) {
            // This is a simplified check
            executing.splice(i, 1)
          }
        }
      }
    }

    await Promise.all(executing)
  }

  return {
    succeeded,
    failed,
    results,
    errors,
  }
}

/**
 * Circuit breaker for preventing cascading failures
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000
 * })
 *
 * const result = await breaker.execute(async () => {
 *   return await riskyOperation()
 * })
 * ```
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0

  constructor(
    private options: {
      failureThreshold?: number
      resetTimeout?: number
      successThreshold?: number
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000,
      successThreshold: 2,
      ...options,
    }
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<RecoveryResult<T>> {
    const startTime = performance.now()

    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime
      if (timeSinceFailure < this.options.resetTimeout!) {
        return {
          success: false,
          error: new EngineError(
            'Circuit breaker is open',
            ErrorCode.RESOURCE_EXHAUSTED,
            {
              category: ErrorCategory.UNKNOWN,
              severity: ErrorSeverity.MEDIUM,
              recoverable: true,
            }
          ),
          attempts: 0,
          strategy: RecoveryStrategy.FAIL,
          duration: performance.now() - startTime,
        }
      }
      // Try half-open
      this.state = 'half-open'
    }

    try {
      const value = await operation()

      // Success - reset or close circuit
      if (this.state === 'half-open') {
        this.successCount++
        if (this.successCount >= this.options.successThreshold!) {
          this.reset()
        }
      } else {
        this.failureCount = 0
      }

      return {
        success: true,
        value,
        attempts: 1,
        strategy: RecoveryStrategy.RETRY,
        duration: performance.now() - startTime,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))

      this.failureCount++
      this.lastFailureTime = Date.now()
      this.successCount = 0

      // Open circuit if threshold exceeded
      if (this.failureCount >= this.options.failureThreshold!) {
        this.state = 'open'
      }

      return {
        success: false,
        error: error instanceof EngineError
          ? error
          : new EngineError(error.message, ErrorCode.UNKNOWN, {
              category: ErrorCategory.UNKNOWN,
              severity: ErrorSeverity.MEDIUM,
              cause: error,
            }),
        attempts: 1,
        strategy: RecoveryStrategy.FAIL,
        duration: performance.now() - startTime,
      }
    }
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }

  /**
   * Get current state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount
  }
}
