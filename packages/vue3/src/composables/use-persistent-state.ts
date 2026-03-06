/**
 * 持久化状态组合式 API
 *
 * 基于 Core 的 PersistentStateManager，提供 Vue3 响应式持久化状态管理
 *
 * @module composables/use-persistent-state
 */

import { ref, onUnmounted, type Ref } from 'vue'
import {
  PersistentStateManager,
  LocalStoragePersistence,
  SessionStoragePersistence,
  MemoryPersistence,
  type PersistenceAdapter,
  type PersistenceConfig,
} from '@ldesign/engine-core'

/**
 * 持久化状态选项
 */
export interface UsePersistentStateOptions {
  /** 存储类型（默认 localStorage） */
  storage?: 'local' | 'session' | 'memory' | PersistenceAdapter
  /** 存储键前缀 */
  prefix?: string
  /** 自动保存（默认 true） */
  autoSave?: boolean
  /** 自动保存延迟（毫秒，默认 300） */
  saveDelay?: number
  /** 自动恢复（默认 true） */
  autoRestore?: boolean
}

/**
 * 持久化状态返回值
 */
export interface UsePersistentStateReturn<T> {
  /** 响应式状态值 */
  state: Ref<T>
  /** 设置状态（同时持久化） */
  set: (value: T) => void
  /** 从存储恢复 */
  restore: () => Promise<void>
  /** 手动保存到存储 */
  save: () => Promise<void>
  /** 删除持久化数据 */
  remove: () => void
  /** PersistentStateManager 实例 */
  manager: PersistentStateManager
}

/**
 * 使用持久化状态
 *
 * 自动将状态持久化到 localStorage / sessionStorage / 内存，
 * 并在组件初始化时从存储中恢复。
 *
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @param options - 持久化选项
 * @returns 持久化状态操作
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePersistentState } from '@ldesign/engine-vue3'
 *
 * // 默认使用 localStorage
 * const { state, set } = usePersistentState('user-preference', {
 *   theme: 'light',
 *   lang: 'zh-CN',
 * })
 *
 * // 使用 sessionStorage
 * const { state: token } = usePersistentState('auth-token', '', {
 *   storage: 'session',
 * })
 *
 * // 修改状态会自动持久化
 * set({ theme: 'dark', lang: 'en' })
 * </script>
 * ```
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistentStateOptions = {}
): UsePersistentStateReturn<T> {
  const {
    storage = 'local',
    prefix = 'ldesign:',
    autoSave = true,
    saveDelay = 300,
    autoRestore = true,
  } = options

  // 创建适配器
  let adapter: PersistenceAdapter
  if (typeof storage === 'object') {
    adapter = storage
  } else {
    switch (storage) {
      case 'session':
        adapter = new SessionStoragePersistence(prefix)
        break
      case 'memory':
        adapter = new MemoryPersistence()
        break
      default:
        adapter = new LocalStoragePersistence(prefix)
    }
  }

  // 创建 PersistentStateManager
  const config: PersistenceConfig = {
    adapter,
    autoSave,
    saveDelay,
    autoRestore: false, // 我们手动控制恢复
    include: [key],
  }
  const manager = new PersistentStateManager(config)
  manager.persist(key)

  // 初始化状态
  const state = ref<T>(defaultValue) as Ref<T>

  // 设置默认值
  manager.set(key, defaultValue)

  // 监听 manager 状态变化
  const unwatch = manager.watch(key, (newValue) => {
    state.value = newValue as T
  })

  // 设置状态
  const set = (value: T): void => {
    state.value = value
    manager.set(key, value)
  }

  // 恢复
  const restore = async (): Promise<void> => {
    await manager.restore()
    const restored = manager.get<T>(key)
    if (restored !== undefined) {
      state.value = restored
    }
  }

  // 手动保存
  const save = async (): Promise<void> => {
    await manager.saveAll()
  }

  // 删除
  const remove = (): void => {
    manager.delete(key)
    state.value = defaultValue
  }

  // 自动恢复
  if (autoRestore) {
    restore().catch((err) => {
      console.warn(`[usePersistentState] Failed to restore "${key}":`, err)
    })
  }

  // 组件卸载时清理
  onUnmounted(() => {
    unwatch()
    manager.destroy()
  })

  return {
    state,
    set,
    restore,
    save,
    remove,
    manager,
  }
}
