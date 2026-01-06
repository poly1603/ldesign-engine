/**
 * Hooks Types
 *
 * Type definitions for the core hooks system.
 *
 * @module hooks/types
 */

import type { CoreEngine } from '../types/engine'
import type { EventHandler, EventPayload, Unsubscribe } from '../types/event'
import type { StateChangeListener } from '../types/state'

/**
 * Hook context containing the engine instance
 */
export interface HookContext {
  /** Engine instance */
  engine: CoreEngine
}

/**
 * Reactive state reference
 */
export interface ReactiveRef<T> {
  /** Current value */
  value: T
  /** Subscribe to changes */
  subscribe: (listener: (value: T) => void) => Unsubscribe
  /** Get current value */
  get: () => T
  /** Set new value */
  set: (value: T) => void
}

/**
 * Read-only reactive state reference
 */
export interface ReadonlyRef<T> {
  /** Current value (read-only) */
  readonly value: T
  /** Subscribe to changes */
  subscribe: (listener: (value: T) => void) => Unsubscribe
  /** Get current value */
  get: () => T
}

/**
 * Computed state options
 */
export interface ComputedOptions<T> {
  /** Getter function */
  get: () => T
  /** Optional setter function */
  set?: (value: T) => void
}

/**
 * Watch options
 */
export interface WatchOptions {
  /** Run immediately on creation */
  immediate?: boolean
  /** Deep watch (for objects/arrays) */
  deep?: boolean
  /** Debounce interval in ms */
  debounce?: number
  /** Throttle interval in ms */
  throttle?: number
}

/**
 * Watch stop handle
 */
export type WatchStopHandle = () => void

/**
 * Watch callback with old and new values
 */
export type WatchCallback<T> = (newValue: T, oldValue: T | undefined) => void

/**
 * Effect cleanup function
 */
export type EffectCleanup = () => void

/**
 * Effect function that may return a cleanup
 */
export type EffectFn = () => void | EffectCleanup

/**
 * Lifecycle hook callback
 */
export type LifecycleCallback = () => void | Promise<void>

/**
 * Event listener options
 */
export interface EventListenerOptions {
  /** Listen only once */
  once?: boolean
  /** Priority (higher runs first) */
  priority?: number
}

/**
 * State selector function
 */
export type StateSelector<T, R> = (state: T) => R

/**
 * Async state options
 */
export interface AsyncStateOptions<T> {
  /** Initial value before loading */
  initialValue?: T
  /** Whether to execute immediately */
  immediate?: boolean
  /** Reset to initial value on error */
  resetOnError?: boolean
  /** Timeout in ms */
  timeout?: number
  /** Error callback */
  onError?: (error: Error) => void
  /** Success callback */
  onSuccess?: (data: T) => void
}

/**
 * Async state result
 */
export interface AsyncStateResult<T> {
  /** The data value */
  data: T | undefined
  /** Whether currently loading */
  loading: boolean
  /** Error if any */
  error: Error | null
  /** Execute/refresh the async operation */
  execute: () => Promise<T | undefined>
  /** Reset to initial state */
  reset: () => void
}

/**
 * Debounced state options
 */
export interface DebouncedStateOptions {
  /** Debounce delay in ms */
  delay: number
  /** Maximum wait time in ms */
  maxWait?: number
  /** Execute on leading edge */
  leading?: boolean
  /** Execute on trailing edge */
  trailing?: boolean
}

/**
 * Throttled state options
 */
export interface ThrottledStateOptions {
  /** Throttle interval in ms */
  interval: number
  /** Execute on leading edge */
  leading?: boolean
  /** Execute on trailing edge */
  trailing?: boolean
}
