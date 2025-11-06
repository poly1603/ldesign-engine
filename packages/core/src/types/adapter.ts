/**
 * 框架适配器类型定义
 */

import type { CoreEngine } from './engine'
import type { Unsubscribe } from './event'

/**
 * 框架信息
 */
export interface FrameworkInfo {
  /** 框架名称 */
  name: string
  /** 框架版本 */
  version: string
  /** 框架特性 */
  features?: {
    reactive?: boolean
    components?: boolean
    directives?: boolean
    slots?: boolean
    [key: string]: any
  }
}

/**
 * 响应式状态
 */
export interface ReactiveState<T> {
  value: T
  readonly(): T
  update(updater: (prev: T) => T): void
  reset?(): void
}

/**
 * 状态适配器
 */
export interface StateAdapter {
  /** 创建响应式状态 */
  createReactiveState<T>(initialValue: T): ReactiveState<T>
  /** 监听状态变化 */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe
  /** 批量更新 */
  batch(fn: () => void): void
  /** 计算属性 */
  computed<T>(getter: () => T): ReactiveState<T>
}

/**
 * 事件适配器
 */
export interface EventAdapter {
  /** 触发事件 */
  emit(event: string, payload?: any): void
  /** 监听事件 */
  on(event: string, handler: (payload: any) => void): Unsubscribe
  /** 一次性监听 */
  once(event: string, handler: (payload: any) => void): Unsubscribe
  /** 移除监听 */
  off(event: string, handler?: (payload: any) => void): void
}

/**
 * 生命周期钩子映射
 */
export interface LifecycleHookMap {
  beforeMount: string
  mounted: string
  beforeUpdate: string
  updated: string
  beforeUnmount: string
  unmounted: string
  [key: string]: string
}

/**
 * 框架适配器接口
 */
export interface FrameworkAdapter<App = any, Component = any> {
  /** 框架信息 */
  readonly info: FrameworkInfo
  /** 创建应用 */
  createApp(rootComponent: Component, options?: any): App
  /** 挂载应用 */
  mount(app: App, mountElement: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(app: App): Promise<void>
  /** 注册引擎到应用 */
  registerEngine(app: App, engine: CoreEngine): void
  /** 创建状态适配器 */
  createStateAdapter(): StateAdapter
  /** 创建事件适配器 */
  createEventAdapter(): EventAdapter
  /** 映射生命周期钩子 */
  mapLifecycleHooks(): LifecycleHookMap
  /** 注册组件 */
  registerComponent?(app: App, name: string, component: any): void
  /** 注册指令 */
  registerDirective?(app: App, name: string, directive: any): void
  /** 提供全局属性 */
  provideGlobalProperty?(app: App, key: string, value: any): void
}

