/**
 * 框架适配器类型定义
 */

import type { CoreEngine } from './engine'
import type { Unsubscribe } from './event'

/**
 * 框架特性配置
 */
export interface FrameworkFeatures {
  /** 是否支持响应式 */
  reactive?: boolean
  /** 是否支持组件 */
  components?: boolean
  /** 是否支持指令 */
  directives?: boolean
  /** 是否支持插槽 */
  slots?: boolean
  /** 其他自定义特性 */
  [key: string]: boolean | undefined
}

/**
 * 框架信息
 */
export interface FrameworkInfo {
  /** 框架名称 */
  name: string
  /** 框架版本 */
  version: string
  /** 框架特性 */
  features?: FrameworkFeatures
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
 * 事件处理器类型
 * 接收事件载荷并处理
 */
export type EventHandler<T = unknown> = (payload: T) => void

/**
 * 事件适配器
 */
export interface EventAdapter {
  /** 触发事件 */
  emit<T = unknown>(event: string, payload?: T): void
  /** 监听事件 */
  on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe
  /** 一次性监听 */
  once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe
  /** 移除监听 */
  off<T = unknown>(event: string, handler?: EventHandler<T>): void
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
 * 应用创建选项
 */
export interface AppCreateOptions {
  /** 应用配置 */
  [key: string]: unknown
}

/**
 * 框架适配器接口
 *
 * @template App - 应用实例类型
 * @template Component - 组件类型
 */
export interface FrameworkAdapter<App = unknown, Component = unknown> {
  /** 框架信息 */
  readonly info: FrameworkInfo
  /** 创建应用 */
  createApp(rootComponent: Component, options?: AppCreateOptions): App
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
  registerComponent?(app: App, name: string, component: Component): void
  /** 注册指令 */
  registerDirective?(app: App, name: string, directive: unknown): void
  /** 提供全局属性 */
  provideGlobalProperty?(app: App, key: string, value: unknown): void
}

