/**
 * 中间件系统类型定义
 */

/**
 * 中间件上下文
 */
export interface MiddlewareContext<T = any> {
  /** 上下文数据 */
  data: T
  /** 元数据 */
  metadata?: Record<string, any>
  /** 是否已取消 */
  cancelled?: boolean
}

/**
 * 中间件下一步函数
 */
export type MiddlewareNext = () => void | Promise<void>

/**
 * 中间件接口
 */
export interface Middleware<T = any> {
  /** 中间件名称 */
  readonly name: string
  /** 中间件优先级 (数字越大优先级越高) */
  readonly priority?: number
  /** 执行函数 */
  execute: (context: MiddlewareContext<T>, next: MiddlewareNext) => void | Promise<void>
  /** 错误处理函数 */
  onError?: (error: Error, context: MiddlewareContext<T>) => void | Promise<void>
}

/**
 * 中间件管理器接口
 */
export interface MiddlewareManager {
  /** 注册中间件 */
  use: (middleware: Middleware) => void
  /** 移除中间件 */
  remove: (name: string) => boolean
  /** 获取中间件 */
  get: (name: string) => Middleware | undefined
  /** 获取所有中间件 */
  getAll: () => Middleware[]
  /** 执行中间件链 */
  execute: <T = any>(context: MiddlewareContext<T>) => Promise<void>
  /** 清空所有中间件 */
  clear: () => void
  /** 获取中间件数量 */
  size: () => number
}

