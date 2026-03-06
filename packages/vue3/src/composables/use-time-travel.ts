/**
 * 时间旅行组合式 API
 *
 * 基于 Core 的 TimeTravelStateManager，提供响应式的 undo/redo/snapshot 功能
 *
 * @module composables/use-time-travel
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { TimeTravelStateManager, type StateSnapshot, type TimeTravelConfig } from '@ldesign/engine-core'
import { useEngine } from './use-engine'

/**
 * 时间旅行返回值
 */
export interface TimeTravelReturn {
  /** 是否可以撤销 */
  canUndo: ComputedRef<boolean>
  /** 是否可以重做 */
  canRedo: ComputedRef<boolean>
  /** 当前快照索引 */
  currentIndex: Ref<number>
  /** 快照列表 */
  snapshots: Ref<StateSnapshot[]>
  /** 撤销 */
  undo: () => boolean
  /** 重做 */
  redo: () => boolean
  /** 创建快照 */
  snapshot: (description?: string) => string
  /** 跳转到指定快照 */
  goToSnapshot: (id: string) => boolean
  /** 跳转到指定索引 */
  goToIndex: (index: number) => boolean
  /** 清空历史 */
  clearHistory: () => void
}

/**
 * 使用时间旅行
 *
 * 创建一个独立的 TimeTravelStateManager 并与引擎状态桥接
 *
 * @param config - 时间旅行配置
 * @returns 时间旅行状态和方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTimeTravel } from '@ldesign/engine-vue3'
 *
 * const {
 *   canUndo, canRedo, snapshots, currentIndex,
 *   undo, redo, snapshot
 * } = useTimeTravel({ maxHistory: 30 })
 *
 * // 创建命名快照
 * snapshot('保存点 1')
 *
 * // 撤销
 * undo()
 * </script>
 * ```
 */
export function useTimeTravel(config: TimeTravelConfig = {}): TimeTravelReturn {
  const ttm = new TimeTravelStateManager(config)

  const currentIndex = ref(0)
  const snapshots = ref<StateSnapshot[]>([])

  const refresh = () => {
    const stats = ttm.getTimeTravelStats()
    currentIndex.value = stats.currentIndex
    snapshots.value = ttm.getSnapshots()
  }

  refresh()

  const undo = (): boolean => {
    const result = ttm.undo()
    if (result) refresh()
    return result
  }

  const redo = (): boolean => {
    const result = ttm.redo()
    if (result) refresh()
    return result
  }

  const snapshotFn = (description?: string): string => {
    const id = ttm.snapshot(description)
    refresh()
    return id
  }

  const goToSnapshot = (id: string): boolean => {
    const result = ttm.goToSnapshot(id)
    if (result) refresh()
    return result
  }

  const goToIndex = (index: number): boolean => {
    const result = ttm.goToIndex(index)
    if (result) refresh()
    return result
  }

  const clearHistory = () => {
    ttm.clearHistory()
    refresh()
  }

  onUnmounted(() => {
    ttm.destroy()
  })

  return {
    canUndo: computed(() => currentIndex.value > 0),
    canRedo: computed(() => currentIndex.value < snapshots.value.length - 1),
    currentIndex,
    snapshots,
    undo,
    redo,
    snapshot: snapshotFn,
    goToSnapshot,
    goToIndex,
    clearHistory,
  }
}
