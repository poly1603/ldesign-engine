/**
 * 持久化状态管理器
 * 
 * 扩展核心状态管理器，添加持久化功能
 * 
 * @module state/persistent-state-manager
 */

import { CoreStateManager } from './state-manager'
import type { PersistenceAdapter, PersistenceConfig } from './persistence'

/**
 * 持久化状态管理器
 * 
 * 特性:
 * - 自动持久化指定的状态键
 * - 支持多种存储适配器
 * - 自动恢复持久化的状态
 * - 防抖保存优化性能
 * 
 * @example
 * ```typescript
 * import { PersistentStateManager, LocalStoragePersistence } from '@ldesign/engine-core'
 * 
 * const stateManager = new PersistentStateManager({
 *   adapter: new LocalStoragePersistence('myapp'),
 *   autoSave: true,
 *   saveDelay: 300
 * })
 * 
 * // 标记需要持久化的键
 * stateManager.persist('user')
 * stateManager.persist('settings')
 * 
 * // 恢复持久化的状态
 * await stateManager.restore()
 * 
 * // 设置状态会自动保存
 * stateManager.set('user', { name: 'Alice' })
 * ```
 */
export class PersistentStateManager extends CoreStateManager {
  /** 持久化适配器 */
  private adapter: PersistenceAdapter

  /** 需要持久化的键集合 */
  private persistKeys = new Set<string>()

  /** 排除持久化的键集合 */
  private excludeKeys = new Set<string>()

  /** 是否自动保存 */
  private autoSave: boolean

  /** 自动保存延迟（毫秒） */
  private saveDelay: number

  /** 保存定时器 */
  private saveTimers = new Map<string, NodeJS.Timeout>()

  /** 是否已恢复 */
  private restored = false

  /**
   * 构造函数
   * 
   * @param config - 持久化配置
   */
  constructor(config: PersistenceConfig) {
    super()

    this.adapter = config.adapter
    this.autoSave = config.autoSave ?? true
    this.saveDelay = config.saveDelay ?? 300

    // 初始化包含/排除键
    if (config.include) {
      config.include.forEach(key => this.persistKeys.add(key))
    }
    if (config.exclude) {
      config.exclude.forEach(key => this.excludeKeys.add(key))
    }

    // 自动恢复
    if (config.autoRestore) {
      this.restore().catch(error => {
        console.error('[PersistentStateManager] Auto restore failed:', error)
      })
    }
  }

  /**
   * 标记需要持久化的键
   * 
   * @param key - 状态键
   * 
   * @example
   * ```typescript
   * stateManager.persist('user')
   * stateManager.persist('settings')
   * ```
   */
  persist(key: string): void {
    this.persistKeys.add(key)
    this.excludeKeys.delete(key)

    // 立即保存当前值
    const value = this.get(key)
    if (value !== undefined) {
      this.saveToStorage(key, value)
    }
  }

  /**
   * 取消持久化
   * 
   * @param key - 状态键
   * @param removeFromStorage - 是否从存储中删除
   */
  unpersist(key: string, removeFromStorage = false): void {
    this.persistKeys.delete(key)

    if (removeFromStorage) {
      this.adapter.remove(key)
    }
  }

  /**
   * 排除某个键的持久化
   * 
   * @param key - 状态键
   */
  exclude(key: string): void {
    this.excludeKeys.add(key)
    this.persistKeys.delete(key)
  }

  /**
   * 检查键是否需要持久化
   * 
   * @param key - 状态键
   * @returns 是否需要持久化
   */
  private shouldPersist(key: string): boolean {
    // 如果在排除列表中，不持久化
    if (this.excludeKeys.has(key)) {
      return false
    }

    // 如果有包含列表，只持久化列表中的键
    if (this.persistKeys.size > 0) {
      return this.persistKeys.has(key)
    }

    // 否则持久化所有键（除了排除的）
    return true
  }

  /**
   * 重写 set 方法，添加持久化功能
   */
  set<T = any>(key: string, value: T): void {
    // 调用父类方法设置状态
    super.set(key, value)

    // 如果需要持久化且启用了自动保存
    if (this.shouldPersist(key) && this.autoSave) {
      this.scheduleSave(key, value)
    }
  }

  /**
   * 重写 setShallow 方法
   */
  setShallow<T = any>(key: string, value: T): void {
    super.setShallow(key, value)

    if (this.shouldPersist(key) && this.autoSave) {
      this.scheduleSave(key, value)
    }
  }

  /**
   * 重写 delete 方法
   */
  delete(key: string): boolean {
    const result = super.delete(key)

    // 从存储中删除
    if (result && this.shouldPersist(key)) {
      this.adapter.remove(key)
    }

    return result
  }

  /**
   * 重写 clear 方法
   */
  clear(): void {
    // 清除所有持久化的键
    if (this.adapter.clear) {
      this.adapter.clear()
    }

    super.clear()
  }

  /**
   * 调度保存（防抖）
   * 
   * @param key - 状态键
   * @param value - 状态值
   */
  private scheduleSave(key: string, value: any): void {
    // 清除之前的定时器
    const existingTimer = this.saveTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      this.saveToStorage(key, value)
      this.saveTimers.delete(key)
    }, this.saveDelay)

    this.saveTimers.set(key, timer)
  }

  /**
   * 保存到存储
   * 
   * @param key - 状态键
   * @param value - 状态值
   */
  private saveToStorage(key: string, value: any): void {
    try {
      this.adapter.save(key, value)
    } catch (error) {
      console.error(`[PersistentStateManager] Failed to save key "${key}":`, error)
    }
  }

  /**
   * 立即保存指定键
   * 
   * @param key - 状态键
   * 
   * @example
   * ```typescript
   * stateManager.saveNow('user')
   * ```
   */
  async saveNow(key: string): Promise<void> {
    // 清除定时器
    const timer = this.saveTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.saveTimers.delete(key)
    }

    const value = this.get(key)
    if (value !== undefined && this.shouldPersist(key)) {
      await this.adapter.save(key, value)
    }
  }

  /**
   * 立即保存所有需要持久化的键
   * 
   * @example
   * ```typescript
   * await stateManager.saveAll()
   * ```
   */
  async saveAll(): Promise<void> {
    // 清除所有定时器
    this.saveTimers.forEach(timer => clearTimeout(timer))
    this.saveTimers.clear()

    const keys = this.persistKeys.size > 0 
      ? Array.from(this.persistKeys)
      : this.keys().filter(key => this.shouldPersist(key))

    await Promise.all(
      keys.map(async key => {
        const value = this.get(key)
        if (value !== undefined) {
          await this.adapter.save(key, value)
        }
      })
    )
  }

  /**
   * 从存储恢复状态
   * 
   * @example
   * ```typescript
   * await stateManager.restore()
   * ```
   */
  async restore(): Promise<void> {
    if (this.restored) {
      console.warn('[PersistentStateManager] Already restored')
      return
    }

    try {
      const keys = this.persistKeys.size > 0
        ? Array.from(this.persistKeys)
        : (this.adapter.keys ? await this.adapter.keys() : [])

      for (const key of keys) {
        if (!this.shouldPersist(key)) {
          continue
        }

        try {
          const value = await this.adapter.load(key)
          if (value !== undefined) {
            // 直接调用父类的 set，避免触发保存
            super.set(key, value)
          }
        } catch (error) {
          console.error(`[PersistentStateManager] Failed to restore key "${key}":`, error)
        }
      }

      this.restored = true
    } catch (error) {
      console.error('[PersistentStateManager] Restore failed:', error)
      throw error
    }
  }

  /**
   * 获取持久化统计信息
   * 
   * @returns 统计信息
   */
  getPersistedStats(): {
    persistedKeys: string[]
    excludedKeys: string[]
    pendingSaves: number
  } {
    return {
      persistedKeys: Array.from(this.persistKeys),
      excludedKeys: Array.from(this.excludeKeys),
      pendingSaves: this.saveTimers.size,
    }
  }

  /**
   * 销毁时清理定时器
   */
  destroy(): void {
    // 清除所有定时器
    this.saveTimers.forEach(timer => clearTimeout(timer))
    this.saveTimers.clear()
  }
}

/**
 * 创建持久化状态管理器
 * 
 * @param config - 持久化配置
 * @returns 持久化状态管理器实例
 * 
 * @example
 * ```typescript
 * import { createPersistentStateManager, LocalStoragePersistence } from '@ldesign/engine-core'
 * 
 * const stateManager = createPersistentStateManager({
 *   adapter: new LocalStoragePersistence(),
 *   include: ['user', 'settings'],
 *   autoSave: true,
 *   autoRestore: true
 * })
 * ```
 */
export function createPersistentStateManager(config: PersistenceConfig): PersistentStateManager {
  return new PersistentStateManager(config)
}