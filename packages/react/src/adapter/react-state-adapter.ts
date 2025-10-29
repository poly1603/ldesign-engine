/**
 * React 状态适配器实现
 * 
 * 将引擎状态管理器适配到 React 的状态系统
 * 
 * @module adapter/react-state-adapter
 */

import type { StateAdapter, ReactiveState, Unsubscribe } from '@ldesign/engine-core'

/**
 * React 响应式状态实现
 * 
 * 使用观察者模式实现响应式状态
 */
class ReactReactiveState<T> implements ReactiveState<T> {
  private _value: T
  private readonly initialValue: T
  private listeners = new Set<(value: T) => void>()

  constructor(initialValue: T) {
    this._value = initialValue
    this.initialValue = initialValue
  }

  get value(): T {
    return this._value
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue
      this.notify()
    }
  }

  readonly(): Readonly<T> {
    return this._value
  }

  update(updater: (prev: T) => T): void {
    this.value = updater(this._value)
  }

  reset(): void {
    this.value = this.initialValue
  }

  /**
   * 订阅状态变化
   * 
   * @param listener - 监听器
   * @returns 取消订阅函数
   */
  subscribe(listener: (value: T) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知所有监听器
   */
  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this._value)
      } catch (error) {
        console.error('[ReactReactiveState] Error in listener:', error)
      }
    })
  }
}

/**
 * React 状态适配器
 * 
 * 实现 StateAdapter 接口,提供 React 特定的状态管理功能
 */
export class ReactStateAdapter implements StateAdapter {
  private batchQueue: Array<() => void> = []
  private isBatching = false
  private batchTimer: number | null = null

  /**
   * 创建响应式状态
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    return new ReactReactiveState(initialValue)
  }

  /**
   * 监听状态变化
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let prevValue = getter()
    let isActive = true

    // 使用 requestAnimationFrame 实现高性能监听
    const check = () => {
      if (!isActive) return

      try {
        const newValue = getter()
        if (newValue !== prevValue) {
          const oldValue = prevValue
          prevValue = newValue
          callback(newValue, oldValue)
        }
      } catch (error) {
        console.error('[ReactStateAdapter] Error in watch:', error)
      }

      if (isActive) {
        requestAnimationFrame(check)
      }
    }

    // 启动监听
    requestAnimationFrame(check)

    // 返回取消函数
    return () => {
      isActive = false
    }
  }

  /**
   * 批量更新状态
   * 
   * React 18+ 自动批处理,这里提供额外的批处理控制
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    if (this.isBatching) {
      // 如果已经在批处理中,直接执行
      fn()
      return
    }

    this.isBatching = true
    this.batchQueue = []

    try {
      fn()
    } finally {
      this.isBatching = false

      // 使用 queueMicrotask 确保在下一个微任务中执行
      queueMicrotask(() => {
        const queue = this.batchQueue
        this.batchQueue = []
        queue.forEach(task => task())
      })
    }
  }

  /**
   * 计算属性(React 使用 useMemo 实现)
   * 
   * @param getter - 计算函数
   * @returns 计算属性
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const state = this.createReactiveState(getter())

    // 监听依赖变化并更新计算值
    this.watch(getter, (newValue) => {
      state.value = newValue
    })

    return state
  }

  /**
   * 添加批处理任务
   * 
   * @param task - 任务函数
   */
  private enqueueBatchTask(task: () => void): void {
    if (this.isBatching) {
      this.batchQueue.push(task)
    } else {
      task()
    }
  }
}

/**
 * 创建 React 状态适配器
 * 
 * @returns React 状态适配器实例
 */
export function createReactStateAdapter(): ReactStateAdapter {
  return new ReactStateAdapter()
}

