/**
 * React 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'
import type { ComponentType, ReactElement } from 'react'

/**
 * React 引擎接口
 */
export interface ReactEngine extends CoreEngine {
  /** 根组件 */
  readonly rootComponent?: ComponentType
  /** 挂载应用 */
  mount(mountElement: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
}

/**
 * React 引擎应用配置
 */
export interface ReactEngineAppOptions {
  /** 根组件 */
  rootComponent: ComponentType
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
  onReady?: (engine: ReactEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: ReactEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}

