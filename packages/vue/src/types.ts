/**
 * Vue3 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'
import type { App, Component } from 'vue'

/**
 * Vue3 引擎接口
 */
export interface Vue3Engine extends CoreEngine {
  /** Vue 应用实例 */
  readonly app?: App
  /** 创建 Vue 应用 */
  createApp(rootComponent: Component): App
  /** 挂载应用 */
  mount(mountElement: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
}

/**
 * Vue3 引擎应用配置
 */
export interface Vue3EngineAppOptions {
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
  onReady?: (engine: Vue3Engine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: Vue3Engine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}

