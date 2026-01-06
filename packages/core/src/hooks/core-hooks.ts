/**
 * Core Hooks Implementation
 *
 * Framework-agnostic hooks for working with the engine.
 * These provide reactive primitives that can be used directly or
 * adapted by framework-specific packages.
 *
 * @module hooks/core-hooks
 */

import type { CoreEngine } from '../types/engine'
import type { EventHandler, EventPayload, Unsubscribe } from '../types/event'
import type {
  ReactiveRef,
  ReadonlyRef,
  WatchOptions,
  WatchStopHandle,
  WatchCallback,
  AsyncStateOptions,
  AsyncStateResult,
  DebouncedStateOptions,
  ThrottledStateOptions,
  LifecycleCallback,
  EventListenerOptions,
} from './types'

/**
 * Create a reactive state reference from engine state
 *
 * @param engine - Engine instance
 * @param key - State key
 * @param initialValue - Initial value if state doesn't exist
 * @returns Reactive reference
 *
 * @example
 * ```typescript
 * const countRef = createStateRef(engine, 'count', 0)
 *
 * // Read value
 * console.log(countRef.value) // 0
 *
 * // Update value
 * countRef.set(1)
 *
 * // Subscribe to changes
 * const unsubscribe = countRef.subscribe((value) => {
 *   console.log('Count changed:', value)
 * })
 * ```
 */
export function createStateRef<T>(
  engine: CoreEngine,
  key: string,
  initialValue?: T
): ReactiveRef<T> {
  // Initialize state if it doesn't exist
  if (!engine.state.has(key) && initialValue !== undefined) {
    engine.state.set(key, initialValue)
  }

  return {
    get value(): T {
      return engine.state.get<T>(key) ?? initialValue as T
    },
    set value(newValue: T) {
      engine.state.set(key, newValue)
    },
    subscribe(listener: (value: T) => void): Unsubscribe {
      return engine.state.watch<T>(key, (newValue) => {
        listener(newValue as T)
      })
    },
    get(): T {
      return engine.state.get<T>(key) ?? initialValue as T
    },
    set(value: T): void {
      engine.state.set(key, value)
    },
  }
}

/**
 * Create a read-only reactive reference from engine state
 *
 * @param engine - Engine instance
 * @param key - State key
 * @returns Read-only reactive reference
 *
 * @example
 * ```typescript
 * const userRef = createReadonlyStateRef(engine, 'user')
 *
 * // Read value
 * console.log(userRef.value)
 *
 * // Subscribe to changes
 * userRef.subscribe((user) => {
 *   console.log('User changed:', user)
 * })
 *
 * // Cannot modify:
 * // userRef.set(newUser) // Error: No set method
 * ```
 */
export function createReadonlyStateRef<T>(
  engine: CoreEngine,
  key: string
): ReadonlyRef<T> {
  return {
    get value(): T {
      return engine.state.get<T>(key) as T
    },
    subscribe(listener: (value: T) => void): Unsubscribe {
      return engine.state.watch<T>(key, (newValue) => {
        listener(newValue as T)
      })
    },
    get(): T {
      return engine.state.get<T>(key) as T
    },
  }
}

/**
 * Watch engine state changes with advanced options
 *
 * @param engine - Engine instance
 * @param key - State key or getter function
 * @param callback - Callback when state changes
 * @param options - Watch options
 * @returns Stop handle
 *
 * @example
 * ```typescript
 * // Basic watch
 * const stop = watchState(engine, 'count', (newValue, oldValue) => {
 *   console.log(`Count: ${oldValue} -> ${newValue}`)
 * })
 *
 * // With options
 * const stop = watchState(engine, 'search', handler, {
 *   immediate: true,
 *   debounce: 300
 * })
 *
 * // Stop watching
 * stop()
 * ```
 */
export function watchState<T>(
  engine: CoreEngine,
  key: string,
  callback: WatchCallback<T>,
  options: WatchOptions = {}
): WatchStopHandle {
  const { immediate, debounce, throttle } = options

  let lastValue: T | undefined = engine.state.get<T>(key)
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastCallTime = 0

  // Create the actual callback
  let actualCallback = callback

  // Apply debounce
  if (debounce && debounce > 0) {
    actualCallback = (newValue: T, oldValue: T | undefined) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        callback(newValue, oldValue)
      }, debounce)
    }
  }

  // Apply throttle
  if (throttle && throttle > 0) {
    const originalCallback = actualCallback
    actualCallback = (newValue: T, oldValue: T | undefined) => {
      const now = Date.now()
      if (now - lastCallTime >= throttle) {
        lastCallTime = now
        originalCallback(newValue, oldValue)
      }
    }
  }

  // Immediate execution
  if (immediate) {
    actualCallback(lastValue as T, undefined)
  }

  // Set up watcher
  const unsubscribe = engine.state.watch<T>(key, (newValue, oldValue) => {
    actualCallback(newValue as T, oldValue as T)
    lastValue = newValue as T
  })

  // Return stop handle
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    unsubscribe()
  }
}

/**
 * Create an async state hook
 *
 * Handles async operations with loading/error states.
 *
 * @param engine - Engine instance
 * @param key - State key to store the result
 * @param asyncFn - Async function to execute
 * @param options - Async state options
 * @returns Async state result object
 *
 * @example
 * ```typescript
 * const { data, loading, error, execute } = createAsyncState(
 *   engine,
 *   'users',
 *   async () => {
 *     const response = await fetch('/api/users')
 *     return response.json()
 *   },
 *   { immediate: true }
 * )
 *
 * // Refresh data
 * await execute()
 * ```
 */
export function createAsyncState<T>(
  engine: CoreEngine,
  key: string,
  asyncFn: () => Promise<T>,
  options: AsyncStateOptions<T> = {}
): AsyncStateResult<T> {
  const {
    initialValue,
    immediate = false,
    resetOnError = false,
    timeout,
    onError,
    onSuccess,
  } = options

  // State keys
  const dataKey = key
  const loadingKey = `${key}:loading`
  const errorKey = `${key}:error`

  // Initialize state
  if (initialValue !== undefined) {
    engine.state.set(dataKey, initialValue)
  }
  engine.state.set(loadingKey, false)
  engine.state.set(errorKey, null)

  const execute = async (): Promise<T | undefined> => {
    engine.state.set(loadingKey, true)
    engine.state.set(errorKey, null)

    try {
      let result: T

      if (timeout && timeout > 0) {
        // Execute with timeout
        result = await Promise.race([
          asyncFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeout)
          ),
        ])
      } else {
        result = await asyncFn()
      }

      engine.state.set(dataKey, result)
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      engine.state.set(errorKey, error)

      if (resetOnError && initialValue !== undefined) {
        engine.state.set(dataKey, initialValue)
      }

      onError?.(error)
      return undefined
    } finally {
      engine.state.set(loadingKey, false)
    }
  }

  const reset = (): void => {
    engine.state.set(dataKey, initialValue)
    engine.state.set(loadingKey, false)
    engine.state.set(errorKey, null)
  }

  // Execute immediately if requested
  if (immediate) {
    execute()
  }

  return {
    get data() {
      return engine.state.get<T>(dataKey)
    },
    get loading() {
      return engine.state.get<boolean>(loadingKey) ?? false
    },
    get error() {
      return engine.state.get<Error | null>(errorKey) ?? null
    },
    execute,
    reset,
  }
}

/**
 * Create a debounced state reference
 *
 * Updates are delayed and batched.
 *
 * @param engine - Engine instance
 * @param key - State key
 * @param initialValue - Initial value
 * @param options - Debounce options
 * @returns Reactive reference with debounced updates
 *
 * @example
 * ```typescript
 * const searchRef = createDebouncedState(engine, 'search', '', {
 *   delay: 300,
 *   maxWait: 1000
 * })
 *
 * // Rapidly setting values will debounce
 * searchRef.set('h')
 * searchRef.set('he')
 * searchRef.set('hel')
 * searchRef.set('hell')
 * searchRef.set('hello')
 * // Only 'hello' will be committed after 300ms
 * ```
 */
export function createDebouncedState<T>(
  engine: CoreEngine,
  key: string,
  initialValue: T,
  options: DebouncedStateOptions
): ReactiveRef<T> {
  const { delay, maxWait, leading = false, trailing = true } = options

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let maxWaitTimeoutId: ReturnType<typeof setTimeout> | undefined
  let pendingValue: T | undefined
  let lastSetTime = 0

  // Initialize state
  if (!engine.state.has(key)) {
    engine.state.set(key, initialValue)
  }

  const flush = (): void => {
    if (pendingValue !== undefined) {
      engine.state.set(key, pendingValue)
      pendingValue = undefined
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    if (maxWaitTimeoutId) {
      clearTimeout(maxWaitTimeoutId)
      maxWaitTimeoutId = undefined
    }
  }

  const set = (value: T): void => {
    const now = Date.now()
    const isFirstCall = lastSetTime === 0
    lastSetTime = now

    pendingValue = value

    // Leading edge execution
    if (leading && isFirstCall) {
      flush()
      return
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout for trailing edge
    if (trailing) {
      timeoutId = setTimeout(flush, delay)
    }

    // Set maxWait timeout if specified
    if (maxWait && !maxWaitTimeoutId) {
      maxWaitTimeoutId = setTimeout(flush, maxWait)
    }
  }

  return {
    get value(): T {
      return engine.state.get<T>(key) ?? initialValue
    },
    set value(newValue: T) {
      set(newValue)
    },
    subscribe(listener: (value: T) => void): Unsubscribe {
      return engine.state.watch<T>(key, (newValue) => {
        listener(newValue as T)
      })
    },
    get(): T {
      return engine.state.get<T>(key) ?? initialValue
    },
    set,
  }
}

/**
 * Create a throttled state reference
 *
 * Updates are rate-limited.
 *
 * @param engine - Engine instance
 * @param key - State key
 * @param initialValue - Initial value
 * @param options - Throttle options
 * @returns Reactive reference with throttled updates
 *
 * @example
 * ```typescript
 * const scrollRef = createThrottledState(engine, 'scrollY', 0, {
 *   interval: 100
 * })
 *
 * // High-frequency updates will be throttled
 * window.addEventListener('scroll', () => {
 *   scrollRef.set(window.scrollY)
 * })
 * ```
 */
export function createThrottledState<T>(
  engine: CoreEngine,
  key: string,
  initialValue: T,
  options: ThrottledStateOptions
): ReactiveRef<T> {
  const { interval, leading = true, trailing = true } = options

  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let pendingValue: T | undefined

  // Initialize state
  if (!engine.state.has(key)) {
    engine.state.set(key, initialValue)
  }

  const set = (value: T): void => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    if (timeSinceLastCall >= interval) {
      // Enough time has passed, execute immediately
      if (leading || lastCallTime !== 0) {
        lastCallTime = now
        engine.state.set(key, value)
      }
    } else if (trailing) {
      // Schedule trailing edge execution
      pendingValue = value

      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          if (pendingValue !== undefined) {
            lastCallTime = Date.now()
            engine.state.set(key, pendingValue)
            pendingValue = undefined
          }
          timeoutId = undefined
        }, interval - timeSinceLastCall)
      }
    }
  }

  return {
    get value(): T {
      return engine.state.get<T>(key) ?? initialValue
    },
    set value(newValue: T) {
      set(newValue)
    },
    subscribe(listener: (value: T) => void): Unsubscribe {
      return engine.state.watch<T>(key, (newValue) => {
        listener(newValue as T)
      })
    },
    get(): T {
      return engine.state.get<T>(key) ?? initialValue
    },
    set,
  }
}

/**
 * Create an event listener hook
 *
 * @param engine - Engine instance
 * @param event - Event name
 * @param handler - Event handler
 * @param options - Event listener options
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onEvent(engine, 'user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 *
 * // With options
 * const unsubscribe = onEvent(engine, 'init', handler, {
 *   once: true,
 *   priority: 100
 * })
 * ```
 */
export function onEvent<T = EventPayload>(
  engine: CoreEngine,
  event: string,
  handler: EventHandler<T>,
  options: EventListenerOptions = {}
): Unsubscribe {
  const { once = false, priority = 0 } = options

  if (once) {
    return engine.events.once(event, handler as EventHandler<EventPayload>)
  }

  return engine.events.on(event, handler as EventHandler<EventPayload>, priority)
}

/**
 * Create a lifecycle hook
 *
 * @param engine - Engine instance
 * @param hook - Lifecycle hook name
 * @param callback - Callback function
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onLifecycle(engine, 'beforeInit', () => {
 *   console.log('Engine is about to initialize')
 * })
 *
 * // Clean up when no longer needed
 * unsubscribe()
 * ```
 */
export function onLifecycle(
  engine: CoreEngine,
  hook: string,
  callback: LifecycleCallback
): Unsubscribe {
  return engine.lifecycle.on(hook, callback)
}

/**
 * Create a one-time lifecycle hook
 *
 * @param engine - Engine instance
 * @param hook - Lifecycle hook name
 * @param callback - Callback function
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * onLifecycleOnce(engine, 'init', () => {
 *   console.log('Engine initialized (only runs once)')
 * })
 * ```
 */
export function onLifecycleOnce(
  engine: CoreEngine,
  hook: string,
  callback: LifecycleCallback
): Unsubscribe {
  return engine.lifecycle.once(hook, callback)
}

/**
 * Batch multiple state updates
 *
 * @param engine - Engine instance
 * @param fn - Function containing state updates
 *
 * @example
 * ```typescript
 * batchUpdates(engine, () => {
 *   engine.state.set('a', 1)
 *   engine.state.set('b', 2)
 *   engine.state.set('c', 3)
 * })
 * // Watchers only trigger once after all updates
 * ```
 */
export function batchUpdates(engine: CoreEngine, fn: () => void): void {
  engine.state.batch(fn)
}

/**
 * Create a computed state that derives from other states
 *
 * @param engine - Engine instance
 * @param key - Key for the computed state
 * @param dependencies - Array of state keys to depend on
 * @param compute - Compute function
 * @returns Read-only reference to computed value
 *
 * @example
 * ```typescript
 * const totalRef = createComputedState(
 *   engine,
 *   'total',
 *   ['price', 'quantity'],
 *   () => {
 *     const price = engine.state.get<number>('price') ?? 0
 *     const quantity = engine.state.get<number>('quantity') ?? 0
 *     return price * quantity
 *   }
 * )
 *
 * console.log(totalRef.value) // Computed total
 * ```
 */
export function createComputedState<T>(
  engine: CoreEngine,
  key: string,
  dependencies: string[],
  compute: () => T
): ReadonlyRef<T> {
  // Initial computation
  const initialValue = compute()
  engine.state.set(key, initialValue)

  // Watch all dependencies
  const unsubscribes: Unsubscribe[] = []

  for (const dep of dependencies) {
    const unsubscribe = engine.state.watch(dep, () => {
      const newValue = compute()
      engine.state.set(key, newValue)
    })
    unsubscribes.push(unsubscribe)
  }

  return {
    get value(): T {
      return engine.state.get<T>(key) as T
    },
    subscribe(listener: (value: T) => void): Unsubscribe {
      return engine.state.watch<T>(key, (newValue) => {
        listener(newValue as T)
      })
    },
    get(): T {
      return engine.state.get<T>(key) as T
    },
  }
}

/**
 * Create a state history tracker with undo/redo support
 *
 * @param engine - Engine instance
 * @param key - State key to track
 * @param maxHistory - Maximum history length (default: 10)
 * @returns History controller
 *
 * @example
 * ```typescript
 * const history = createStateHistory(engine, 'document', 50)
 *
 * // Make changes
 * engine.state.set('document', { content: 'Hello' })
 * engine.state.set('document', { content: 'Hello World' })
 *
 * // Undo
 * history.undo() // Back to { content: 'Hello' }
 *
 * // Redo
 * history.redo() // Forward to { content: 'Hello World' }
 * ```
 */
export function createStateHistory<T>(
  engine: CoreEngine,
  key: string,
  maxHistory: number = 10
) {
  const history: T[] = []
  let currentIndex = -1

  // Initialize with current value
  const currentValue = engine.state.get<T>(key)
  if (currentValue !== undefined) {
    history.push(currentValue)
    currentIndex = 0
  }

  // Watch for changes
  engine.state.watch<T>(key, (newValue, oldValue) => {
    // Skip if this is an undo/redo operation
    if (history[currentIndex] === newValue) {
      return
    }

    // Remove any future history (if we're not at the end)
    if (currentIndex < history.length - 1) {
      history.splice(currentIndex + 1)
    }

    // Add new value
    history.push(newValue as T)

    // Limit history size
    if (history.length > maxHistory) {
      history.shift()
    } else {
      currentIndex++
    }
  })

  return {
    get canUndo(): boolean {
      return currentIndex > 0
    },
    get canRedo(): boolean {
      return currentIndex < history.length - 1
    },
    get historyLength(): number {
      return history.length
    },
    get currentIndex(): number {
      return currentIndex
    },
    undo(): boolean {
      if (!this.canUndo) return false
      currentIndex--
      engine.state.set(key, history[currentIndex])
      return true
    },
    redo(): boolean {
      if (!this.canRedo) return false
      currentIndex++
      engine.state.set(key, history[currentIndex])
      return true
    },
    clear(): void {
      const currentValue = engine.state.get<T>(key)
      history.length = 0
      if (currentValue !== undefined) {
        history.push(currentValue)
      }
      currentIndex = history.length - 1
    },
  }
}
