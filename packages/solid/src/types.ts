/**
 * Solid 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'
import type { Component } from 'solid-js'

/**
 * Solid 引擎接口
 */
export interface SolidEngine extends CoreEngine {
  /** 根组件 */
  readonly rootComponent?: Component
  /** 挂载应用 */
  mount(mountElement: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
}

/**
 * Solid 引擎应用配置
 */
export interface SolidEngineAppOptions {
  /** 根组件 */
  rootComponent: Component
  /** 挂载元素 */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 功能开关 */
  features?: {
    enableHotReload?: boolean
    enableDevTools?: boolean
  }
  /** 初始化完成回调 */
  onReady?: (engine: SolidEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: SolidEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}


