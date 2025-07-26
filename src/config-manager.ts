import { reactive, watch } from 'vue'
import { merge, get, set, has, unset } from 'lodash-es'
import type { 
  ConfigManager, 
  EngineConfig, 
  ConfigWatcher, 
  UnwatchFn 
} from './types'
import { ConfigError } from './types'

/**
 * 配置管理器实现
 * 基于Vue 3的响应式系统提供配置管理功能
 */
export class ConfigManagerImpl implements ConfigManager {
  private config: EngineConfig
  private watchers = new Map<string, Set<ConfigWatcher>>()
  private unwatchFns = new Map<string, UnwatchFn[]>()

  constructor(initialConfig: EngineConfig = {}) {
    // 创建响应式配置对象
    this.config = reactive(merge({}, initialConfig))
    this.setupWatchers()
  }

  /**
   * 获取配置值
   */
  get<T>(key: string): T | undefined {
    try {
      return get(this.config, key) as T
    } catch (error) {
      throw new ConfigError(`Failed to get config '${key}'`, key, error)
    }
  }

  /**
   * 设置配置值
   */
  set(key: string, value: any): void {
    try {
      const oldValue = this.get(key)
      set(this.config, key, value)
      
      // 触发监听器
      this.notifyWatchers(key, value, oldValue)
    } catch (error) {
      throw new ConfigError(`Failed to set config '${key}'`, key, error)
    }
  }

  /**
   * 批量更新配置
   */
  update(updates: Partial<EngineConfig>): void {
    try {
      const oldConfig = { ...this.config }
      merge(this.config, updates)
      
      // 触发相关监听器
      this.notifyUpdateWatchers(updates, oldConfig)
    } catch (error) {
      throw new ConfigError('Failed to update config', 'update', error)
    }
  }

  /**
   * 监听配置变更
   */
  watch(key: string, callback: ConfigWatcher): UnwatchFn {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function')
    }

    let watchers = this.watchers.get(key)
    if (!watchers) {
      watchers = new Set()
      this.watchers.set(key, watchers)
    }
    
    watchers.add(callback)

    // 设置Vue的watch
    const unwatchFn = watch(
      () => this.get(key),
      (newValue, oldValue) => {
        try {
          callback(newValue, oldValue)
        } catch (error) {
          console.error(`Error in config watcher for '${key}':`, error)
        }
      },
      { deep: true }
    )

    // 存储取消监听函数
    let unwatchFns = this.unwatchFns.get(key)
    if (!unwatchFns) {
      unwatchFns = []
      this.unwatchFns.set(key, unwatchFns)
    }
    unwatchFns.push(unwatchFn)

    // 返回取消监听函数
    return () => this.unwatch(key, callback)
  }

  /**
   * 取消监听配置变更
   */
  unwatch(key: string, callback?: ConfigWatcher): void {
    if (!callback) {
      // 移除所有监听器
      this.watchers.delete(key)
      const unwatchFns = this.unwatchFns.get(key)
      if (unwatchFns) {
        unwatchFns.forEach(fn => fn())
        this.unwatchFns.delete(key)
      }
      return
    }

    // 移除特定监听器
    const watchers = this.watchers.get(key)
    if (watchers) {
      watchers.delete(callback)
      if (watchers.size === 0) {
        this.watchers.delete(key)
        const unwatchFns = this.unwatchFns.get(key)
        if (unwatchFns) {
          unwatchFns.forEach(fn => fn())
          this.unwatchFns.delete(key)
        }
      }
    }
  }

  /**
   * 验证配置
   */
  validate(config: Partial<EngineConfig>): boolean {
    try {
      // 基本类型验证
      if (config.name !== undefined && typeof config.name !== 'string') {
        return false
      }
      
      if (config.version !== undefined && typeof config.version !== 'string') {
        return false
      }
      
      if (config.debug !== undefined && typeof config.debug !== 'boolean') {
        return false
      }

      // 性能配置验证
      if (config.performance) {
        const perf = config.performance
        if (perf.enabled !== undefined && typeof perf.enabled !== 'boolean') {
          return false
        }
        if (perf.sampleRate !== undefined && 
            (typeof perf.sampleRate !== 'number' || perf.sampleRate < 0 || perf.sampleRate > 1)) {
          return false
        }
      }

      // 开发配置验证
      if (config.dev) {
        const dev = config.dev
        if (dev.enabled !== undefined && typeof dev.enabled !== 'boolean') {
          return false
        }
        if (dev.verbose !== undefined && typeof dev.verbose !== 'boolean') {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * 合并配置
   */
  merge(config: Partial<EngineConfig>): void {
    if (!this.validate(config)) {
      throw new ConfigError('Invalid config provided', 'merge', config)
    }
    
    this.update(config)
  }

  /**
   * 检查配置是否存在
   */
  has(key: string): boolean {
    return has(this.config, key)
  }

  /**
   * 删除配置
   */
  delete(key: string): boolean {
    try {
      if (!this.has(key)) {
        return false
      }
      
      const oldValue = this.get(key)
      unset(this.config, key)
      
      // 触发监听器
      this.notifyWatchers(key, undefined, oldValue)
      return true
    } catch (error) {
      throw new ConfigError(`Failed to delete config '${key}'`, key, error)
    }
  }

  /**
   * 获取所有配置
   */
  getAll(): Readonly<EngineConfig> {
    return this.config
  }

  /**
   * 重置配置
   */
  reset(newConfig?: EngineConfig): void {
    const oldConfig = { ...this.config }
    
    // 清空当前配置
    Object.keys(this.config).forEach(key => {
      delete (this.config as any)[key]
    })
    
    // 设置新配置
    if (newConfig) {
      merge(this.config, newConfig)
    }
    
    // 触发所有监听器
    this.notifyResetWatchers(this.config, oldConfig)
  }

  /**
   * 获取配置键列表
   */
  keys(): string[] {
    return Object.keys(this.config)
  }

  /**
   * 设置监听器
   */
  private setupWatchers(): void {
    // 监听整个配置对象的变化
    watch(
      () => this.config,
      () => {
        // 配置变化时的全局处理
      },
      { deep: true }
    )
  }

  /**
   * 通知监听器
   */
  private notifyWatchers(key: string, newValue: any, oldValue: any): void {
    const watchers = this.watchers.get(key)
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(newValue, oldValue)
        } catch (error) {
          console.error(`Error in config watcher for '${key}':`, error)
        }
      })
    }
  }

  /**
   * 通知更新监听器
   */
  private notifyUpdateWatchers(updates: Partial<EngineConfig>, oldConfig: EngineConfig): void {
    Object.keys(updates).forEach(key => {
      const newValue = get(updates, key)
      const oldValue = get(oldConfig, key)
      if (newValue !== oldValue) {
        this.notifyWatchers(key, newValue, oldValue)
      }
    })
  }

  /**
   * 通知重置监听器
   */
  private notifyResetWatchers(newConfig: EngineConfig, oldConfig: EngineConfig): void {
    const allKeys = new Set([...Object.keys(newConfig), ...Object.keys(oldConfig)])
    allKeys.forEach(key => {
      const newValue = get(newConfig, key)
      const oldValue = get(oldConfig, key)
      if (newValue !== oldValue) {
        this.notifyWatchers(key, newValue, oldValue)
      }
    })
  }

  /**
   * 销毁配置管理器
   */
  destroy(): void {
    // 清除所有监听器
    this.watchers.clear()
    
    // 取消所有Vue watch
    this.unwatchFns.forEach(unwatchFns => {
      unwatchFns.forEach(fn => fn())
    })
    this.unwatchFns.clear()
  }
}