/**
 * Svelte 状态适配器实现
 * 
 * 将引擎状态管理器适配到 Svelte 的响应式系统
 * 
 * @module adapter/svelte-state-adapter
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store'
import type { StateAdapter, ReactiveState, Unsubscribe } from '@ldesign/engine-core'

/**
 * Svelte 响应式状态实现
 * 
 * 使用 Svelte 的 writable store 实现响应式状态
 */
class SvelteReactiveState<T> implements ReactiveState<T> {
  private store: Writable<T>
  private readonly initialValue: T

  constructor(initialValue: T) {
    this.store = writable(initialValue)
    this.initialValue = initialValue
  }

  get value(): T {
    return get(this.store)
  }

  set value(newValue: T) {
    this.store.set(newValue)
  }

  readonly(): Readonly<T> {
    return get(this.store)
  }

  update(updater: (prev: T) => T): void {
    this.store.update(updater)
  }

  reset(): void {
    this.store.set(this.initialValue)
  }

  /**
   * 获取内部 Store(用于 Svelte 组件)
   * 
   * @returns Writable Store
   */
  getStore(): Writable<T> {
    return this.store
  }

  /**
   * 订阅状态变化
   * 
   * @param callback - 状态变化时的回调
   * @returns 取消订阅的函数
   */
  subscribe(callback: (value: T) => void): Unsubscribe {
    return this.store.subscribe(callback)
  }
}

/**
 * Svelte 只读响应式状态实现
 */
class SvelteReadonlyReactiveState<T> implements ReactiveState<T> {
  private store: Readable<T>
  private currentValue: T

  constructor(store: Readable<T>) {
    this.store = store
    this.currentValue = get(store)
    
    // 订阅更新当前值
    this.store.subscribe(value => {
      this.currentValue = value
    })
  }

  get value(): T {
    return this.currentValue
  }

  set value(_newValue: T) {
    console.warn('[SvelteStateAdapter] Cannot set value on readonly state')
  }

  readonly(): Readonly<T> {
    return this.currentValue
  }

  update(_updater: (prev: T) => T): void {
    console.warn('[SvelteStateAdapter] Cannot update readonly state')
  }

  reset(): void {
    console.warn('[SvelteStateAdapter] Cannot reset readonly state')
  }

  /**
   * 获取内部 Store
   * 
   * @returns Readable Store
   */
  getStore(): Readable<T> {
    return this.store
  }

  /**
   * 订阅状态变化
   * 
   * @param callback - 状态变化时的回调
   * @returns 取消订阅的函数
   */
  subscribe(callback: (value: T) => void): Unsubscribe {
    return this.store.subscribe(callback)
  }
}

/**
 * Svelte 状态适配器
 * 
 * 实现 StateAdapter 接口,充分利用 Svelte 的响应式系统
 */
export class SvelteStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    return new SvelteReactiveState(initialValue)
  }

  /**
   * 监听状态变化
   * 
   * 使用 Svelte 的 store subscribe API
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined = undefined
    let isFirst = true

    // 创建一个 derived store 来监听 getter
    const derivedStore = derived(
      // 使用一个空的 writable 作为依赖触发器
      writable(0),
      () => getter()
    )

    // 使用轮询来检测变化(因为 Svelte 的 derived 需要依赖 store)
    let currentValue = getter()
    const interval = setInterval(() => {
      const newValue = getter()
      if (newValue !== currentValue) {
        if (!isFirst) {
          callback(newValue, currentValue)
        }
        currentValue = newValue
        isFirst = false
      }
    }, 16) // 约 60fps

    return () => {
      clearInterval(interval)
    }
  }

  /**
   * 批量更新状态
   * 
   * Svelte 会自动批处理响应式更新
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
    // Svelte 会自动批处理更新
  }

  /**
   * 计算属性
   * 
   * 使用 Svelte 的 derived store
   * 
   * @param getter - 计算函数
   * @returns 计算属性
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    // 创建一个 derived store
    const computedStore = derived(
      writable(0),
      () => getter()
    )

    return new SvelteReadonlyReactiveState(computedStore)
  }
}

/**
 * 创建 Svelte 状态适配器
 * 
 * @returns Svelte 状态适配器实例
 */
export function createSvelteStateAdapter(): SvelteStateAdapter {
  return new SvelteStateAdapter()
}

