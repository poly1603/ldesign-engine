/**
 * 状态时间旅行模块
 * 
 * 提供状态快照、撤销、重做等时间旅行功能
 * 
 * @module state/time-travel
 */

import { CoreStateManager } from './state-manager'

/**
 * 状态快照接口
 */
export interface StateSnapshot {
  /** 快照 ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 状态数据 */
  state: Record<string, any>
  /** 快照描述 */
  description?: string
  /** 标签 */
  tags?: string[]
}

/**
 * 时间旅行配置
 */
export interface TimeTravelConfig {
  /** 最大历史记录数量 */
  maxHistory?: number
  /** 是否自动创建快照 */
  autoSnapshot?: boolean
  /** 自动快照间隔（毫秒） */
  snapshotInterval?: number
  /** 需要跟踪的键（如果为空则跟踪所有键） */
  trackKeys?: string[]
  /** 不需要跟踪的键 */
  excludeKeys?: string[]
}

/**
 * 时间旅行状态管理器
 * 
 * 扩展核心状态管理器，添加时间旅行功能
 * 
 * 特性:
 * - 状态快照管理
 * - 撤销/重做操作
 * - 历史记录浏览
 * - 自动快照
 * - 选择性跟踪
 * 
 * @example
 * ```typescript
 * import { TimeTravelStateManager } from '@ldesign/engine-core'
 * 
 * const stateManager = new TimeTravelStateManager({
 *   maxHistory: 50,
 *   autoSnapshot: true,
 *   snapshotInterval: 1000
 * })
 * 
 * // 设置状态
 * stateManager.set('count', 0)
 * stateManager.set('count', 1)
 * stateManager.set('count', 2)
 * 
 * // 撤销
 * stateManager.undo() // count = 1
 * stateManager.undo() // count = 0
 * 
 * // 重做
 * stateManager.redo() // count = 1
 * 
 * // 创建命名快照
 * stateManager.snapshot('保存点')
 * 
 * // 跳转到快照
 * stateManager.goToSnapshot(snapshotId)
 * ```
 */
export class TimeTravelStateManager extends CoreStateManager {
  /** 历史记录栈 */
  private history: StateSnapshot[] = []
  
  /** 当前历史位置索引 */
  private currentIndex = -1
  
  /** 最大历史记录数量 */
  private maxHistory: number
  
  /** 是否正在恢复状态（防止循环） */
  private restoring = false
  
  /** 自动快照定时器 */
  private snapshotTimer?: NodeJS.Timeout
  
  /** 需要跟踪的键 */
  private trackKeys = new Set<string>()
  
  /** 排除跟踪的键 */
  private excludeKeys = new Set<string>()
  
  /** 快照 ID 计数器 */
  private snapshotIdCounter = 0

  /**
   * 构造函数
   * 
   * @param config - 时间旅行配置
   */
  constructor(config: TimeTravelConfig = {}) {
    super()
    
    this.maxHistory = config.maxHistory ?? 50
    
    // 初始化跟踪键
    if (config.trackKeys) {
      config.trackKeys.forEach(key => this.trackKeys.add(key))
    }
    if (config.excludeKeys) {
      config.excludeKeys.forEach(key => this.excludeKeys.add(key))
    }
    
    // 自动快照
    if (config.autoSnapshot && config.snapshotInterval) {
      this.startAutoSnapshot(config.snapshotInterval)
    }
    
    // 创建初始快照
    this.snapshot('初始状态')
  }

  /**
   * 重写 set 方法，自动创建快照
   */
  set<T = any>(key: string, value: T): void {
    // 调用父类方法设置状态
    super.set(key, value)
    
    // 如果不在恢复状态中，且键需要跟踪，创建快照
    if (!this.restoring && this.shouldTrack(key)) {
      this.createAutoSnapshot()
    }
  }

  /**
   * 检查键是否需要跟踪
   * 
   * @param key - 状态键
   * @returns 是否需要跟踪
   */
  private shouldTrack(key: string): boolean {
    // 如果在排除列表中，不跟踪
    if (this.excludeKeys.has(key)) {
      return false
    }
    
    // 如果有跟踪列表，只跟踪列表中的键
    if (this.trackKeys.size > 0) {
      return this.trackKeys.has(key)
    }
    
    // 否则跟踪所有键
    return true
  }

  /**
   * 创建状态快照
   * 
   * @param description - 快照描述
   * @param tags - 快照标签
   * @returns 快照 ID
   * 
   * @example
   * ```typescript
   * const snapshotId = stateManager.snapshot('用户登录', ['login', 'auth'])
   * ```
   */
  snapshot(description?: string, tags?: string[]): string {
    // 清除当前位置之后的历史记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }
    
    // 创建新快照
    const snapshot: StateSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: Date.now(),
      state: this.cloneState(),
      description,
      tags
    }
    
    // 添加到历史记录
    this.history.push(snapshot)
    this.currentIndex = this.history.length - 1
    
    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift()
      this.currentIndex--
    }
    
    return snapshot.id
  }

  /**
   * 创建自动快照（防止频繁创建）
   */
  private createAutoSnapshot(): void {
    // 简单的防抖：只在一定时间内创建一次快照
    // 这里简化处理，实际使用时可以添加更复杂的逻辑
    if (this.history.length === 0 || 
        Date.now() - this.history[this.history.length - 1].timestamp > 100) {
      this.snapshot('自动快照')
    }
  }

  /**
   * 撤销到上一个快照
   * 
   * @returns 是否撤销成功
   * 
   * @example
   * ```typescript
   * if (stateManager.undo()) {
   *   console.log('撤销成功')
   * }
   * ```
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false
    }
    
    this.currentIndex--
    this.restoreSnapshot(this.history[this.currentIndex])
    return true
  }

  /**
   * 重做到下一个快照
   * 
   * @returns 是否重做成功
   * 
   * @example
   * ```typescript
   * if (stateManager.redo()) {
   *   console.log('重做成功')
   * }
   * ```
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false
    }
    
    this.currentIndex++
    this.restoreSnapshot(this.history[this.currentIndex])
    return true
  }

  /**
   * 检查是否可以撤销
   * 
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0
  }

  /**
   * 检查是否可以重做
   * 
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * 跳转到指定快照
   * 
   * @param snapshotId - 快照 ID
   * @returns 是否跳转成功
   * 
   * @example
   * ```typescript
   * stateManager.goToSnapshot('snapshot-123')
   * ```
   */
  goToSnapshot(snapshotId: string): boolean {
    const index = this.history.findIndex(s => s.id === snapshotId)
    if (index === -1) {
      return false
    }
    
    this.currentIndex = index
    this.restoreSnapshot(this.history[index])
    return true
  }

  /**
   * 跳转到指定索引的快照
   * 
   * @param index - 快照索引
   * @returns 是否跳转成功
   */
  goToIndex(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false
    }
    
    this.currentIndex = index
    this.restoreSnapshot(this.history[index])
    return true
  }

  /**
   * 获取所有快照
   * 
   * @returns 快照列表
   * 
   * @example
   * ```typescript
   * const snapshots = stateManager.getSnapshots()
   * snapshots.forEach(s => {
   *   console.log(`${s.description} - ${new Date(s.timestamp)}`)
   * })
   * ```
   */
  getSnapshots(): StateSnapshot[] {
    return [...this.history]
  }

  /**
   * 获取当前快照
   * 
   * @returns 当前快照
   */
  getCurrentSnapshot(): StateSnapshot | undefined {
    return this.history[this.currentIndex]
  }

  /**
   * 获取指定快照
   * 
   * @param snapshotId - 快照 ID
   * @returns 快照
   */
  getSnapshot(snapshotId: string): StateSnapshot | undefined {
    return this.history.find(s => s.id === snapshotId)
  }

  /**
   * 删除指定快照
   * 
   * @param snapshotId - 快照 ID
   * @returns 是否删除成功
   */
  deleteSnapshot(snapshotId: string): boolean {
    const index = this.history.findIndex(s => s.id === snapshotId)
    if (index === -1 || index === this.currentIndex) {
      return false
    }
    
    this.history.splice(index, 1)
    
    // 调整当前索引
    if (index < this.currentIndex) {
      this.currentIndex--
    }
    
    return true
  }

  /**
   * 清空历史记录
   * 
   * @param keepCurrent - 是否保留当前状态
   */
  clearHistory(keepCurrent = true): void {
    if (keepCurrent && this.currentIndex >= 0) {
      const current = this.history[this.currentIndex]
      this.history = [current]
      this.currentIndex = 0
    } else {
      this.history = []
      this.currentIndex = -1
    }
  }

  /**
   * 获取时间旅行统计信息
   * 
   * @returns 统计信息
   */
  getTimeTravelStats(): {
    totalSnapshots: number
    currentIndex: number
    canUndo: boolean
    canRedo: boolean
    oldestSnapshot?: StateSnapshot
    newestSnapshot?: StateSnapshot
  } {
    return {
      totalSnapshots: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      oldestSnapshot: this.history[0],
      newestSnapshot: this.history[this.history.length - 1]
    }
  }

  /**
   * 搜索快照
   * 
   * @param query - 搜索条件
   * @returns 匹配的快照列表
   */
  searchSnapshots(query: {
    description?: string
    tags?: string[]
    startTime?: number
    endTime?: number
  }): StateSnapshot[] {
    return this.history.filter(snapshot => {
      // 描述匹配
      if (query.description && 
          !snapshot.description?.toLowerCase().includes(query.description.toLowerCase())) {
        return false
      }
      
      // 标签匹配
      if (query.tags && query.tags.length > 0) {
        if (!snapshot.tags || 
            !query.tags.some(tag => snapshot.tags!.includes(tag))) {
          return false
        }
      }
      
      // 时间范围匹配
      if (query.startTime && snapshot.timestamp < query.startTime) {
        return false
      }
      if (query.endTime && snapshot.timestamp > query.endTime) {
        return false
      }
      
      return true
    })
  }

  /**
   * 恢复快照（内部方法）
   * 
   * @param snapshot - 快照对象
   * @private
   */
  private restoreSnapshot(snapshot: StateSnapshot): void {
    this.restoring = true
    
    try {
      // 清空当前状态
      super.clear()
      
      // 恢复快照状态
      Object.entries(snapshot.state).forEach(([key, value]) => {
        super.set(key, value)
      })
    } finally {
      this.restoring = false
    }
  }

  /**
   * 克隆当前状态
   * 
   * @returns 状态克隆
   * @private
   */
  private cloneState(): Record<string, any> {
    const state: Record<string, any> = {}
    
    this.keys().forEach(key => {
      if (this.shouldTrack(key)) {
        const value = this.get(key)
        // 深度克隆
        state[key] = JSON.parse(JSON.stringify(value))
      }
    })
    
    return state
  }

  /**
   * 生成快照 ID
   * 
   * @returns 快照 ID
   * @private
   */
  private generateSnapshotId(): string {
    return `snapshot-${++this.snapshotIdCounter}-${Date.now()}`
  }

  /**
   * 启动自动快照
   * 
   * @param interval - 快照间隔（毫秒）
   * @private
   */
  private startAutoSnapshot(interval: number): void {
    this.snapshotTimer = setInterval(() => {
      this.snapshot('自动快照')
    }, interval)
  }

  /**
   * 停止自动快照
   */
  stopAutoSnapshot(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer)
      this.snapshotTimer = undefined
    }
  }

  /**
   * 销毁时清理资源
   */
  destroy(): void {
    this.stopAutoSnapshot()
    this.clearHistory(false)
  }
}

/**
 * 创建时间旅行状态管理器
 * 
 * @param config - 时间旅行配置
 * @returns 时间旅行状态管理器实例
 * 
 * @example
 * ```typescript
 * import { createTimeTravelStateManager } from '@ldesign/engine-core'
 * 
 * const stateManager = createTimeTravelStateManager({
 *   maxHistory: 100,
 *   autoSnapshot: true,
 *   snapshotInterval: 2000
 * })
 * ```
 */
export function createTimeTravelStateManager(config?: TimeTravelConfig): TimeTravelStateManager {
  return new TimeTravelStateManager(config)
}