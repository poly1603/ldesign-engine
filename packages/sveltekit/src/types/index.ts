/**
 * SvelteKit 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'

export type { SvelteKitAdapterConfig } from '../adapter/sveltekit-adapter'

/**
 * SvelteKit 引擎接口
 */
export interface SvelteKitEngine extends CoreEngine {
  /** 挂载应用 */
  mount(mountElement?: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
  /** 序列化状态 (用于 SSR) */
  serializeState(): string
  /** 反序列化状态 (用于水合) */
  deserializeState(serialized: string): void
  /** 检查是否在服务端 */
  isServerSide(): boolean
  /** 检查是否在客户端 */
  isClientSide(): boolean
}

/**
 * SvelteKit 引擎应用配置
 */
export interface SvelteKitEngineAppOptions {
  /** 挂载元素 (可选，SvelteKit 通常自己管理) */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 功能开关 */
  features?: {
    enableSSR?: boolean
    enableDevTools?: boolean
    serializeState?: boolean
  }
  /** 初始化完成回调 */
  onReady?: (engine: SvelteKitEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: SvelteKitEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}

