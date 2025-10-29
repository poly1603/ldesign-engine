/**
 * Lit 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'

export type { LitAdapterConfig } from '../adapter/lit-adapter'
export type { StateController, EventController } from '../adapter/lit-adapter'

/**
 * Lit 引擎接口
 */
export interface LitEngine extends CoreEngine {
  /** 挂载应用 */
  mount(mountElement?: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
  /** 注册自定义元素 */
  registerElement(tagName: string, elementClass: CustomElementConstructor): void
  /** 获取已注册的自定义元素列表 */
  getRegisteredElements(): string[]
}

/**
 * 自定义元素定义
 */
export interface CustomElementDefinition {
  /** 标签名 */
  tagName: string
  /** 元素类 */
  elementClass: CustomElementConstructor
}

/**
 * Lit 引擎应用配置
 */
export interface LitEngineAppOptions {
  /** 挂载元素 (可选，Lit 通常使用自定义元素) */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 自定义元素列表 */
  customElements?: CustomElementDefinition[]
  /** 功能开关 */
  features?: {
    enableDevTools?: boolean
    autoRegister?: boolean
  }
  /** 初始化完成回调 */
  onReady?: (engine: LitEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: LitEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}

