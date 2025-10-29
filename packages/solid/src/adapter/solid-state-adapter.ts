/**
 * Solid.js 状态适配器实现
 * 
 * 将引擎状态管理器适配到 Solid.js 的响应式系统
 * 
 * @module adapter/solid-state-adapter
 */

import { createSignal, createMemo, createEffect, type Accessor, type Setter } from 'solid-js'
import type { StateAdapter, ReactiveState, Unsubscribe } from '@ldesign/engine-core'

/**
 * Solid 响应式状态实现
 * 
 * 使用 Solid 的 createSignal 实现响应式状态
 */
class SolidReactiveState<T> implements ReactiveState<T> {
  private accessor: Accessor<T>
  private setter: Setter<T>
  private readonly initialValue: T

  constructor(initialValue: T) {
    const [accessor, setter] = createSignal<T>(initialValue)
    this.accessor = accessor
    this.setter = setter
    this.initialValue = initialValue
  }

  get value(): T {
    return this.accessor()
  }

  set value(newValue: T) {
    this.setter(() => newValue)
  }

  readonly(): Readonly<T> {
    return this.accessor()
  }

  update(updater: (prev: T) => T): void {
    this.setter(updater)
  }

  reset(): void {
    this.setter(() => this.initialValue)
  }

  /**
   * 获取 Accessor(用于 Solid 组件)
   * 
   * @returns Accessor
   */
  getAccessor(): Accessor<T> {
    return this.accessor
  }

  /**
   * 获取 Setter(用于 Solid 组件)
   * 
   * @returns Setter
   */
  getSetter(): Setter<T> {
    return this.setter
  }

  /**
   * 获取 Signal 元组
   * 
   * @returns [Accessor, Setter]
   */
  getSignal(): [Accessor<T>, Setter<T>] {
    return [this.accessor, this.setter]
  }
}

/**
 * Solid 只读响应式状态实现
 */
class SolidReadonlyReactiveState<T> implements ReactiveState<T> {
  private accessor: Accessor<T>

  constructor(accessor: Accessor<T>) {
    this.accessor = accessor
  }

  get value(): T {
    return this.accessor()
  }

  set value(_newValue: T) {
    console.warn('[SolidStateAdapter] Cannot set value on readonly state')
  }

  readonly(): Readonly<T> {
    return this.accessor()
  }

  update(_updater: (prev: T) => T): void {
    console.warn('[SolidStateAdapter] Cannot update readonly state')
  }

  reset(): void {
    console.warn('[SolidStateAdapter] Cannot reset readonly state')
  }

  /**
   * 获取 Accessor
   * 
   * @returns Accessor
   */
  getAccessor(): Accessor<T> {
    return this.accessor
  }
}

/**
 * Solid 状态适配器
 * 
 * 实现 StateAdapter 接口,充分利用 Solid 的响应式系统
 */
export class SolidStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    return new SolidReactiveState(initialValue)
  }

  /**
   * 监听状态变化
   * 
   * 使用 Solid 的 createEffect
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined = undefined
    let isFirst = true

    // 使用 createEffect 来监听变化
    const dispose = createEffect(() => {
      const newValue = getter()
      
      if (!isFirst) {
        callback(newValue, oldValue)
      }
      
      oldValue = newValue
      isFirst = false
    })

    return dispose
  }

  /**
   * 批量更新状态
   * 
   * Solid 会自动批处理响应式更新
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
    // Solid 会自动批处理更新
  }

  /**
   * 计算属性
   * 
   * 使用 Solid 的 createMemo
   * 
   * @param getter - 计算函数
   * @returns 计算属性
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const memo = createMemo(getter)
    return new SolidReadonlyReactiveState(memo)
  }
}

/**
 * 创建 Solid 状态适配器
 * 
 * @returns Solid 状态适配器实例
 */
export function createSolidStateAdapter(): SolidStateAdapter {
  return new SolidStateAdapter()
}

