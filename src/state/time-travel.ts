/**
 * 状态时间旅行（Time Travel）
 * 提供状态快照管理、撤销/重做、状态回放等功能
 */

import type { StateManager } from '../types'

export interface StateSnapshot {
  id: string
  state: Record<string, unknown>
  timestamp: number
  label?: string
  metadata?: Record<string, unknown>
}

export interface TimeTravelConfig {
  maxSnapshots?: number
  maxUndoStack?: number
  autoSnapshot?: boolean
  snapshotInterval?: number
}

/**
 * 时间旅行管理器
 */
export class TimeTravelManager {
  private snapshots: StateSnapshot[] = []
  private undoStack: StateSnapshot[] = []
  private redoStack: StateSnapshot[] = []
  private config: Required<TimeTravelConfig>
  private snapshotIdCounter = 0
  private autoSnapshotTimer?: number

  constructor(
    private stateManager: StateManager,
    config: TimeTravelConfig = {}
  ) {
    this.config = {
      maxSnapshots: config.maxSnapshots || 50,
      maxUndoStack: config.maxUndoStack || 20,
      autoSnapshot: config.autoSnapshot ?? false,
      snapshotInterval: config.snapshotInterval || 60000 // 1分钟
    }

    // 启动自动快照
    if (this.config.autoSnapshot) {
      this.startAutoSnapshot()
    }
  }

  /**
   * 创建快照
   */
  createSnapshot(label?: string, metadata?: Record<string, unknown>): string {
    const snapshot: StateSnapshot = {
      id: `snapshot-${++this.snapshotIdCounter}-${Date.now()}`,
      state: this.stateManager.getSnapshot(),
      timestamp: Date.now(),
      label,
      metadata
    }

    this.snapshots.push(snapshot)

    // 限制快照数量
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot.id
  }

  /**
   * 恢复到指定快照
   */
  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === snapshotId)
    if (!snapshot) {
      return false
    }

    // 保存当前状态到撤销栈
    this.pushToUndoStack()

    // 恢复快照
    this.stateManager.restoreFromSnapshot(snapshot.state)

    return true
  }

  /**
   * 撤销操作
   */
  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false
    }

    // 保存当前状态到重做栈
    this.pushToRedoStack()

    // 恢复上一个状态
    const previousState = this.undoStack.pop()!
    this.stateManager.restoreFromSnapshot(previousState.state)

    return true
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false
    }

    // 保存当前状态到撤销栈
    this.pushToUndoStack()

    // 恢复重做状态
    const nextState = this.redoStack.pop()!
    this.stateManager.restoreFromSnapshot(nextState.state)

    return true
  }

  /**
   * 推入撤销栈
   */
  private pushToUndoStack(): void {
    const snapshot: StateSnapshot = {
      id: `undo-${Date.now()}`,
      state: this.stateManager.getSnapshot(),
      timestamp: Date.now()
    }

    this.undoStack.push(snapshot)

    // 限制栈大小
    if (this.undoStack.length > this.config.maxUndoStack) {
      this.undoStack.shift()
    }

    // 清空重做栈（因为做了新操作）
    this.redoStack = []
  }

  /**
   * 推入重做栈
   */
  private pushToRedoStack(): void {
    const snapshot: StateSnapshot = {
      id: `redo-${Date.now()}`,
      state: this.stateManager.getSnapshot(),
      timestamp: Date.now()
    }

    this.redoStack.push(snapshot)

    // 限制栈大小
    if (this.redoStack.length > this.config.maxUndoStack) {
      this.redoStack.shift()
    }
  }

  /**
   * 回放状态变化（从快照A到快照B）
   */
  async playback(
    fromSnapshotId: string,
    toSnapshotId: string,
    options: {
      speed?: number
      onStep?: (snapshot: StateSnapshot) => void
    } = {}
  ): Promise<void> {
    const fromIndex = this.snapshots.findIndex(s => s.id === fromSnapshotId)
    const toIndex = this.snapshots.findIndex(s => s.id === toSnapshotId)

    if (fromIndex === -1 || toIndex === -1) {
      throw new Error('Snapshot not found')
    }

    const speed = options.speed || 1.0
    const snapshots = this.snapshots.slice(
      Math.min(fromIndex, toIndex),
      Math.max(fromIndex, toIndex) + 1
    )

    // 回放每个快照
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i]
      const nextSnapshot = snapshots[i + 1]

      // 恢复状态
      this.stateManager.restoreFromSnapshot(snapshot.state)

      // 回调
      if (options.onStep) {
        options.onStep(snapshot)
      }

      // 等待时间间隔
      if (nextSnapshot) {
        const delay = (nextSnapshot.timestamp - snapshot.timestamp) / speed
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * 比较两个快照的差异
   */
  diff(snapshotId1: string, snapshotId2: string): {
    added: string[]
    removed: string[]
    modified: string[]
  } {
    const snapshot1 = this.snapshots.find(s => s.id === snapshotId1)
    const snapshot2 = this.snapshots.find(s => s.id === snapshotId2)

    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshot not found')
    }

    const keys1 = Object.keys(snapshot1.state)
    const keys2 = Object.keys(snapshot2.state)

    const added = keys2.filter(k => !keys1.includes(k))
    const removed = keys1.filter(k => !keys2.includes(k))
    const modified = keys1.filter(k =>
      keys2.includes(k) && snapshot1.state[k] !== snapshot2.state[k]
    )

    return { added, removed, modified }
  }

  /**
   * 获取所有快照
   */
  getSnapshots(): StateSnapshot[] {
    return [...this.snapshots]
  }

  /**
   * 获取快照
   */
  getSnapshot(snapshotId: string): StateSnapshot | undefined {
    return this.snapshots.find(s => s.id === snapshotId)
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId: string): boolean {
    const index = this.snapshots.findIndex(s => s.id === snapshotId)
    if (index === -1) {
      return false
    }

    this.snapshots.splice(index, 1)
    return true
  }

  /**
   * 启动自动快照
   */
  private startAutoSnapshot(): void {
    this.autoSnapshotTimer = window.setInterval(() => {
      this.createSnapshot('auto', { auto: true })
    }, this.config.snapshotInterval)
  }

  /**
   * 停止自动快照
   */
  private stopAutoSnapshot(): void {
    if (this.autoSnapshotTimer) {
      clearInterval(this.autoSnapshotTimer)
      this.autoSnapshotTimer = undefined
    }
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * 获取撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * 获取重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }

  /**
   * 清除所有快照
   */
  clear(): void {
    this.snapshots = []
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * 导出快照
   */
  export(): string {
    return JSON.stringify({
      snapshots: this.snapshots,
      undoStack: this.undoStack,
      redoStack: this.redoStack,
      exportedAt: Date.now()
    })
  }

  /**
   * 导入快照
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.snapshots = parsed.snapshots || []
      this.undoStack = parsed.undoStack || []
      this.redoStack = parsed.redoStack || []
    } catch (error) {
      throw new Error(`Failed to import snapshots: ${error}`)
    }
  }

  /**
   * 销毁时间旅行管理器
   */
  destroy(): void {
    this.stopAutoSnapshot()
    this.clear()
  }
}

/**
 * 创建时间旅行管理器
 */
export function createTimeTravelManager(
  stateManager: StateManager,
  config?: TimeTravelConfig
): TimeTravelManager {
  return new TimeTravelManager(stateManager, config)
}



