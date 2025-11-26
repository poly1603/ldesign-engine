/**
 * 生命周期系统类型定义
 */

/**
 * 生命周期钩子名称
 */
export type LifecycleHook =
  | 'beforeInit'
  | 'init'
  | 'afterInit'
  | 'beforeMount'
  | 'mounted'
  | 'beforeUpdate'
  | 'updated'
  | 'beforeUnmount'
  | 'unmounted'
  | 'beforeDestroy'
  | 'destroyed'
  | string

/**
 * 生命周期钩子处理函数
 */
export type LifecycleHandler = (...args: unknown[]) => void | Promise<void>

/**
 * 生命周期管理器接口
 */
export interface LifecycleManager {
  /** 注册生命周期钩子 */
  on: (hook: LifecycleHook, handler: LifecycleHandler) => void
  /** 移除生命周期钩子 */
  off: (hook: LifecycleHook, handler?: LifecycleHandler) => void
  /** 触发生命周期钩子 */
  trigger: (hook: LifecycleHook, ...args: unknown[]) => Promise<void>
  /** 一次性钩子 */
  once: (hook: LifecycleHook, handler: LifecycleHandler) => void
  /** 清空所有钩子 */
  clear: () => void
  /** 获取钩子处理函数列表 */
  getHandlers: (hook: LifecycleHook) => LifecycleHandler[]
}

