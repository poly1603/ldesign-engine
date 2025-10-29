/**
 * Angular 状态适配器
 *
 * 使用 RxJS BehaviorSubject 实现响应式状态
 */

import { BehaviorSubject, Observable } from 'rxjs'
import type { StateAdapter, ReactiveState, Unsubscribe } from '@ldesign/engine-core'

/**
 * Angular 响应式状态实现
 *
 * 使用 RxJS BehaviorSubject 实现响应式状态
 */
class AngularReactiveState<T> implements ReactiveState<T> {
  private subject: BehaviorSubject<T>
  private readonly initialValue: T

  constructor(initialValue: T) {
    this.subject = new BehaviorSubject(initialValue)
    this.initialValue = initialValue
  }

  get value(): T {
    return this.subject.getValue()
  }

  set value(newValue: T) {
    this.subject.next(newValue)
  }

  readonly(): Readonly<T> {
    return this.subject.getValue()
  }

  update(updater: (prev: T) => T): void {
    this.value = updater(this.value)
  }

  reset(): void {
    this.subject.next(this.initialValue)
  }

  /**
   * 获取 Observable (用于 Angular 组件)
   *
   * @returns Observable
   */
  asObservable(): Observable<T> {
    return this.subject.asObservable()
  }

  /**
   * 订阅状态变化
   *
   * @param callback - 状态变化时的回调
   * @returns 取消订阅的函数
   */
  subscribe(callback: (value: T) => void): Unsubscribe {
    const subscription = this.subject.subscribe(callback)
    return () => subscription.unsubscribe()
  }
}

/**
 * Angular 只读响应式状态实现
 */
class AngularReadonlyReactiveState<T> implements ReactiveState<T> {
  private subject: BehaviorSubject<T>

  constructor(getter: () => T) {
    this.subject = new BehaviorSubject(getter())
  }

  get value(): T {
    return this.subject.getValue()
  }

  set value(_newValue: T) {
    console.warn('[AngularStateAdapter] Cannot set value on readonly state')
  }

  readonly(): Readonly<T> {
    return this.subject.getValue()
  }

  update(_updater: (prev: T) => T): void {
    console.warn('[AngularStateAdapter] Cannot update readonly state')
  }

  reset(): void {
    console.warn('[AngularStateAdapter] Cannot reset readonly state')
  }

  /**
   * 获取 Observable
   */
  asObservable(): Observable<T> {
    return this.subject.asObservable()
  }

  /**
   * 更新计算值
   *
   * @internal
   */
  _updateValue(newValue: T): void {
    this.subject.next(newValue)
  }
}

/**
 * Angular 状态适配器
 *
 * 实现 StateAdapter 接口,充分利用 RxJS 的响应式能力
 */
export class AngularStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   *
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    return new AngularReactiveState(initialValue)
  }

  /**
   * 监听状态变化
   *
   * 使用轮询实现 (因为 RxJS 需要 Observable 源)
   *
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined = undefined
    let isFirst = true

    // 使用轮询检测变化 (60fps)
    const timer = setInterval(() => {
      const newValue = getter()
      if (!isFirst && newValue !== oldValue) {
        callback(newValue, oldValue)
      }
      oldValue = newValue
      isFirst = false
    }, 16)

    return () => clearInterval(timer)
  }

  /**
   * 批量更新状态
   *
   * RxJS 会自动批处理更新
   *
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
    // RxJS 会自动批处理更新
  }

  /**
   * 计算属性
   *
   * @param getter - 计算函数
   * @returns 计算属性
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const computedState = new AngularReadonlyReactiveState(getter)

    // 监听依赖变化并更新计算值
    this.watch(getter, (newValue) => {
      (computedState as any)._updateValue(newValue)
    })

    return computedState
  }
}

/**
 * 创建 Angular 状态适配器
 *
 * @returns Angular 状态适配器实例
 */
export function createAngularStateAdapter(): AngularStateAdapter {
  return new AngularStateAdapter()
}


