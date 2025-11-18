/**
 * 配置管理器实现
 *
 * 提供多源配置管理、环境切换和配置监听功能
 *
 * @module config/config-manager
 */

import type {
  ConfigManager,
  ConfigObject,
  ConfigValue,
  ConfigSource,
  ConfigLoader,
  ConfigValidator,
  ConfigOptions,
  Environment,
} from './types'

/**
 * 配置管理器实现类
 * 
 * 特性：
 * - 支持多配置源和优先级
 * - 支持环境切换
 * - 支持配置验证
 * - 支持配置监听
 * - 支持深度合并
 * - 支持路径访问（点号分隔）
 * 
 * @example
 * ```typescript
 * const config = new ConfigManagerImpl({
 *   environment: 'development',
 *   defaults: {
 *     app: {
 *       name: 'My App',
 *       port: 3000
 *     }
 *   }
 * })
 * 
 * // 获取配置
 * const port = config.get('app.port', 3000)
 * 
 * // 监听配置变化
 * config.watch('app.port', (value) => {
 *   console.log('Port changed:', value)
 * })
 * ```
 */
export class ConfigManagerImpl implements ConfigManager {
  /** 配置数据 */
  private config: ConfigObject = {}

  /** 配置源列表 */
  private sources: ConfigSource[] = []

  /** 配置加载器列表 */
  private loaders: ConfigLoader[] = []

  /** 当前环境 */
  private environment: Environment = 'development'

  /** 配置选项 */
  private options: ConfigOptions

  /** 监听器存储 */
  private watchers = new Map<string, Set<(value: ConfigValue) => void>>()

  /** 全局监听器 */
  private globalWatchers = new Set<(value: ConfigValue) => void>()

  /** 配置缓存 - 用于优化 getAll() 性能 */
  private configCache: { value: ConfigObject; timestamp: number } | null = null

  /** 缓存 TTL（毫秒） */
  private readonly CACHE_TTL = 1000

  /**
   * 构造函数
   * 
   * @param options - 配置选项
   */
  constructor(options: ConfigOptions = {}) {
    this.options = {
      environment: 'development',
      envPrefix: 'APP_',
      loadEnv: true,
      ...options,
    }

    this.environment = this.options.environment || 'development'

    // 加载默认配置
    if (this.options.defaults) {
      this.config = this.deepClone(this.options.defaults)
    }

    // 加载环境变量
    if (this.options.loadEnv && typeof process !== 'undefined' && process.env) {
      this.loadEnvironmentVariables()
    }
  }

  /**
   * 获取配置值
   * 
   * @param key - 配置键（支持点号分隔）
   * @param defaultValue - 默认值
   * @returns 配置值
   */
  get<T = ConfigValue>(key: string, defaultValue?: T): T {
    const keys = key.split('.')
    let current: ConfigValue = this.config

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as ConfigObject)[k]
      } else {
        return defaultValue as T
      }
    }

    return current as T
  }

  /**
   * 设置配置值
   *
   * @param key - 配置键
   * @param value - 配置值
   */
  set(key: string, value: ConfigValue): void {
    const keys = key.split('.')
    const lastKey = keys.pop()!

    let current = this.config

    // 创建嵌套对象
    for (const k of keys) {
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {}
      }
      current = current[k] as ConfigObject
    }

    const oldValue = current[lastKey]
    current[lastKey] = value

    // 清除缓存
    this.configCache = null

    // 触发监听器
    this.notifyWatchers(key, value, oldValue)
  }

  /**
   * 批量设置配置
   * 
   * @param config - 配置对象
   */
  setAll(config: ConfigObject): void {
    Object.entries(config).forEach(([key, value]) => {
      this.set(key, value)
    })
  }

  /**
   * 检查配置是否存在
   * 
   * @param key - 配置键
   * @returns 是否存在
   */
  has(key: string): boolean {
    const keys = key.split('.')
    let current: ConfigValue = this.config

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as ConfigObject)[k]
      } else {
        return false
      }
    }

    return true
  }

  /**
   * 删除配置
   * 
   * @param key - 配置键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    const keys = key.split('.')
    const lastKey = keys.pop()!

    let current = this.config

    for (const k of keys) {
      if (!(k in current) || typeof current[k] !== 'object') {
        return false
      }
      current = current[k] as ConfigObject
    }

    if (lastKey in current) {
      delete current[lastKey]
      this.notifyWatchers(key, undefined, current[lastKey])
      return true
    }

    return false
  }

  /**
   * 获取所有配置
   *
   * 性能优化: 使用缓存避免频繁克隆
   *
   * @returns 配置对象
   */
  getAll(): ConfigObject {
    const now = Date.now()

    // 使用缓存（1秒内）
    if (this.configCache && (now - this.configCache.timestamp) < this.CACHE_TTL) {
      return this.deepClone(this.configCache.value)
    }

    // 更新缓存
    const cloned = this.deepClone(this.config)
    this.configCache = { value: this.config, timestamp: now }

    return cloned
  }

  /**
   * 清空配置
   */
  clear(): void {
    const oldConfig = this.config
    this.config = {}

    // 清除缓存
    this.configCache = null

    // 通知所有监听器
    this.globalWatchers.forEach(watcher => {
      watcher({})
    })

    this.watchers.clear()
  }

  /**
   * 添加配置源
   * 
   * @param source - 配置源
   */
  addSource(source: ConfigSource): void {
    this.sources.push(source)

    // 按优先级排序
    this.sources.sort((a, b) => b.priority - a.priority)

    // 重新合并配置
    this.mergeSourcesConfig()
  }

  /**
   * 添加配置加载器
   * 
   * @param loader - 配置加载器
   */
  async addLoader(loader: ConfigLoader): Promise<void> {
    this.loaders.push(loader)

    // 加载配置
    const config = await loader.load()

    // 合并配置
    this.merge(config, true)

    // 如果支持监听，设置监听器
    if (loader.watch) {
      loader.watch((newConfig) => {
        this.merge(newConfig, true)
      })
    }
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<void> {
    // 清空当前配置
    this.config = this.options.defaults ? this.deepClone(this.options.defaults) : {}

    // 重新加载环境变量
    if (this.options.loadEnv && typeof process !== 'undefined' && process.env) {
      this.loadEnvironmentVariables()
    }

    // 重新合并配置源
    this.mergeSourcesConfig()

    // 重新加载所有加载器
    for (const loader of this.loaders) {
      const config = await loader.load()
      this.merge(config, true)
    }

    // 通知监听器
    this.globalWatchers.forEach(watcher => {
      watcher(this.config)
    })
  }

  /**
   * 获取当前环境
   * 
   * @returns 环境名称
   */
  getEnvironment(): Environment {
    return this.environment
  }

  /**
   * 设置环境
   * 
   * @param env - 环境名称
   */
  setEnvironment(env: Environment): void {
    const oldEnv = this.environment
    this.environment = env

    if (oldEnv !== env) {
      // 环境变化，可能需要重新加载配置
      this.reload()
    }
  }

  /**
   * 验证配置
   * 
   * @returns 是否有效
   */
  async validate(): Promise<boolean> {
    if (!this.options.validator) {
      return true
    }

    return await this.options.validator.validate(this.config)
  }

  /**
   * 监听配置变化
   *
   * @param key - 配置键或回调函数
   * @param callback - 回调函数
   * @returns 取消监听函数
   */
  watch(key: string | ((value: ConfigValue) => void), callback?: (value: ConfigValue) => void): () => void {
    if (typeof key === 'function') {
      // 全局监听
      this.globalWatchers.add(key)
      return () => this.globalWatchers.delete(key)
    }

    if (!callback) {
      throw new Error('Callback is required when key is provided')
    }

    // 特定键监听
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set())
    }

    const watchers = this.watchers.get(key)!
    watchers.add(callback)

    return () => watchers.delete(callback)
  }

  /**
   * 导出配置
   * 
   * @param format - 导出格式
   * @returns 导出的字符串
   */
  export(format: 'json' | 'env' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.config, null, 2)
    }

    // 导出为环境变量格式
    const envLines: string[] = []
    const prefix = this.options.envPrefix || ''

    const flattenConfig = (obj: ConfigObject, parentKey = ''): void => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = parentKey ? `${parentKey}_${key}` : key

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenConfig(value as ConfigObject, fullKey)
        } else {
          const envKey = `${prefix}${fullKey.toUpperCase()}`
          const envValue = Array.isArray(value) ? JSON.stringify(value) : String(value)
          envLines.push(`${envKey}=${envValue}`)
        }
      })
    }

    flattenConfig(this.config)

    return envLines.join('\n')
  }

  /**
   * 合并配置
   * 
   * @param config - 要合并的配置
   * @param deep - 是否深度合并
   */
  merge(config: ConfigObject, deep = false): void {
    if (deep) {
      this.config = this.deepMerge(this.config, config)
    } else {
      Object.assign(this.config, config)
    }

    // 通知监听器
    this.globalWatchers.forEach(watcher => {
      watcher(this.config)
    })
  }

  /**
   * 加载环境变量
   * 
   * @private
   */
  private loadEnvironmentVariables(): void {
    const prefix = this.options.envPrefix || ''
    const env = process.env

    Object.keys(env).forEach(key => {
      if (key.startsWith(prefix)) {
        const configKey = key
          .substring(prefix.length)
          .toLowerCase()
          .replace(/_/g, '.')

        let value: ConfigValue = env[key]

        // 尝试解析 JSON
        if (value && typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch {
            // 保持字符串值
          }
        }

        this.set(configKey, value)
      }
    })
  }

  /**
   * 合并配置源
   * 
   * @private
   */
  private mergeSourcesConfig(): void {
    // 按优先级合并配置源
    for (const source of this.sources) {
      if (!source.readonly || !this.hasConflict(source.data)) {
        this.merge(source.data, true)
      }
    }
  }

  /**
   * 检查配置冲突
   * 
   * @private
   * @param config - 配置对象
   * @returns 是否有冲突
   */
  private hasConflict(config: ConfigObject): boolean {
    // 简单实现：检查是否有重复的键
    const keys = Object.keys(config)

    for (const key of keys) {
      if (this.has(key)) {
        return true
      }
    }

    return false
  }

  /**
   * 通知监听器
   *
   * @private
   * @param key - 配置键
   * @param value - 新值
   * @param oldValue - 旧值
   */
  private notifyWatchers(key: string, value: ConfigValue, oldValue: ConfigValue): void {
    // 通知特定键的监听器
    const watchers = this.watchers.get(key)
    if (watchers) {
      watchers.forEach(watcher => watcher(value))
    }

    // 通知全局监听器
    this.globalWatchers.forEach(watcher => {
      watcher(this.config)
    })
  }

  /**
   * 深度克隆对象（优化版）
   *
   * 性能优化:
   * - 优先使用原生 structuredClone（Node 17+, 现代浏览器）
   * - 降级到 JSON 序列化（适用于可序列化对象）
   * - 最后降级到递归克隆
   *
   * @private
   * @param obj - 对象
   * @returns 克隆后的对象
   */
  private deepClone<T>(obj: T): T {
    // 基本类型直接返回
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    // 性能优化: 使用原生 structuredClone（最快）
    if (typeof structuredClone !== 'undefined') {
      try {
        return structuredClone(obj)
      } catch {
        // 降级到其他方法
      }
    }

    // 降级方案: 使用 JSON（适用于可序列化对象）
    if (this.isSerializable(obj)) {
      try {
        return JSON.parse(JSON.stringify(obj))
      } catch {
        // 降级到递归克隆
      }
    }

    // 最后降级: 递归克隆
    return this.recursiveClone(obj)
  }

  /**
   * 检查对象是否可序列化
   *
   * @private
   * @param obj - 对象
   * @returns 是否可序列化
   */
  private isSerializable(obj: unknown): boolean {
    if (obj === null || typeof obj !== 'object') {
      return true
    }

    // Date、RegExp、Function 等不可序列化
    if (obj instanceof Date || obj instanceof RegExp || typeof obj === 'function') {
      return false
    }

    // 递归检查对象属性
    if (Array.isArray(obj)) {
      return obj.every(item => this.isSerializable(item))
    }

    return Object.values(obj as Record<string, unknown>).every(value => this.isSerializable(value))
  }

  /**
   * 递归克隆对象
   *
   * @private
   * @param obj - 对象
   * @returns 克隆后的对象
   */
  private recursiveClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T
    }

    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as T
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.recursiveClone(item)) as T
    }

    const cloned: Record<string, unknown> = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.recursiveClone((obj as Record<string, unknown>)[key])
      }
    }

    return cloned as T
  }

  /**
   * 深度合并对象
   * 
   * @private
   * @param target - 目标对象
   * @param source - 源对象
   * @returns 合并后的对象
   */
  private deepMerge(target: ConfigObject, source: ConfigObject): ConfigObject {
    const result = { ...target }

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key]) &&
          result[key] &&
          typeof result[key] === 'object' &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(
            result[key] as ConfigObject,
            source[key] as ConfigObject
          )
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
  }
}

/**
 * 创建配置管理器
 * 
 * @param options - 配置选项
 * @returns 配置管理器实例
 * 
 * @example
 * ```typescript
 * const config = createConfigManager({
 *   environment: 'production',
 *   defaults: {
 *     api: {
 *       url: 'https://api.example.com'
 *     }
 *   }
 * })
 * ```
 */
export function createConfigManager(options?: ConfigOptions): ConfigManager {
  return new ConfigManagerImpl(options)
}