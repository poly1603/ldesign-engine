/**
 * Vue3 状态适配器实现
 * 
 * 将引擎状态管理器适配到 Vue3 的响应式系统
 * 
 * @module adapter/vue3-state-adapter
 */

import { ref, watch, computed, readonly, nextTick, type Ref } from 'vue'
import type { StateAdapter, ReactiveState, Unsubscribe } from '@ldesign/engine-core'

/**
 * Vue3 响应式状态实现
 * 
 * 使用 Vue3 的 ref 实现响应式状态
 */
class Vue3ReactiveState<T> implements ReactiveState<T> {
  private state: Ref<T>
  private readonly initialValue: T

  constructor(initialValue: T) {
    this.state = ref(initialValue) as Ref<T>
    this.initialValue = initialValue
  }

  get value(): T {
    return this.state.value
  }

  set value(newValue: T) {
    this.state.value = newValue
  }

  readonly(): Readonly<T> {
    return readonly(this.state).value
  }

  update(updater: (prev: T) => T): void {
    this.state.value = updater(this.state.value)
  }

  reset(): void {
    this.state.value = this.initialValue
  }

  /**
   * 获取内部 Ref(用于 Vue 组件)
   * 
   * @returns Ref 对象
   */
  getRef(): Ref<T> {
    return this.state
  }
}

/**
 * Vue3 状态适配器
 * 
 * 实现 StateAdapter 接口,充分利用 Vue3 的响应式系统
 */
export class Vue3StateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    return new Vue3ReactiveState(initialValue)
  }

  /**
   * 监听状态变化
   * 
   * 使用 Vue3 的 watch API
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    const stop = watch(
      getter,
      (newValue, oldValue) => {
        callback(newValue, oldValue)
      },
      {
        immediate: false,
        deep: false,
      }
    )

    return stop
  }

  /**
   * 批量更新状态
   * 
   * Vue3 使用 nextTick 实现批处理
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
    // Vue3 会自动批处理响应式更新
    // 使用 nextTick 确保所有更新完成
    nextTick()
  }

  /**
   * 计算属性
   * 
   * 使用 Vue3 的 computed API
   * 
   * @param getter - 计算函数
   * @returns 计算属性
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const computedRef = computed(getter)
    
    // 包装为 ReactiveState
    return {
      get value() {
        return computedRef.value
      },
      set value(_newValue: T) {
        console.warn('[Vue3StateAdapter] Cannot set value on computed property')
      },
      readonly() {
        return computedRef.value
      },
      update(_updater: (prev: T) => T) {
        console.warn('[Vue3StateAdapter] Cannot update computed property')
      },
      reset() {
        console.warn('[Vue3StateAdapter] Cannot reset computed property')
      },
    }
  }
}

/**
 * 创建 Vue3 状态适配器
 * 
 * @returns Vue3 状态适配器实例
 */
export function createVue3StateAdapter(): Vue3StateAdapter {
  return new Vue3StateAdapter()
}

