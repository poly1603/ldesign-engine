/**
 * Angular 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'
import type { ModuleWithProviders } from '@angular/core'

/**
 * Angular 引擎接口
 */
export interface AngularEngine extends CoreEngine {
  /** 挂载应用 */
  mount(mountElement?: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
}

/**
 * Angular 引擎模块配置
 */
export interface AngularEngineConfig {
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
}

/**
 * Angular 模块配置类型
 */
export type AngularEngineModuleConfig = ModuleWithProviders<any>

/**
 * Angular 引擎应用配置
 */
export interface AngularEngineAppOptions {
  /** 挂载元素 (可选，Angular 通常自己管理) */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 功能开关 */
  features?: {
    enableDevTools?: boolean
    enableAOT?: boolean
  }
  /** 初始化完成回调 */
  onReady?: (engine: AngularEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: AngularEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}


