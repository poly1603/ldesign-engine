/**
 * 状态管理系统类型定义
 */

import type { Unsubscribe } from './event'

/**
 * 状态变化监听器
 */
export type StateChangeListener<T = any> = (newValue: T, oldValue: T) => void

/**
 * 状态管理器接口
 */
export interface StateManager {
  /** 设置状态 */
  set: <T = any>(key: string, value: T) => void
  /** 获取状态 */
  get: <T = any>(key: string) => T | undefined
  /** 检查状态是否存在 */
  has: (key: string) => boolean
  /** 删除状态 */
  delete: (key: string) => boolean
  /** 清空所有状态 */
  clear: () => void
  /** 监听状态变化 */
  watch: <T = any>(key: string, listener: StateChangeListener<T>) => Unsubscribe
  /** 批量更新状态 */
  batch: (fn: () => void) => void
  /** 获取所有状态键 */
  keys: () => string[]
  /** 获取所有状态 */
  getAll: () => Record<string, any>
  /** 批量设置状态 */
  setAll: (states: Record<string, any>) => void
  /** 获取状态数量 */
  size: () => number
  /** 导出为 JSON */
  toJSON: (pretty?: boolean) => string
  /** 从 JSON 导入 */
  fromJSON: (json: string, merge?: boolean) => void
}

