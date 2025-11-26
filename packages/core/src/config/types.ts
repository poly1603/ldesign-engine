/**
 * 配置管理类型定义
 *
 * @module config/types
 */

/**
 * 配置值类型
 */
export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ConfigObject
  | ConfigValue[]

/**
 * 配置对象
 */
export interface ConfigObject {
  [key: string]: ConfigValue
}

/**
 * 环境类型
 */
export type Environment = 'development' | 'test' | 'staging' | 'production' | string

/**
 * 配置源
 * 
 * 定义配置的来源和优先级
 */
export interface ConfigSource {
  /** 源名称 */
  name: string
  /** 优先级（数字越大优先级越高） */
  priority: number
  /** 配置数据 */
  data: ConfigObject
  /** 是否为只读 */
  readonly?: boolean
}

/**
 * 配置加载器
 * 
 * 用于从外部源加载配置
 */
export interface ConfigLoader {
  /** 加载器名称 */
  name: string
  /** 加载配置 */
  load(): Promise<ConfigObject> | ConfigObject
  /** 监听配置变化（可选） */
  watch?(callback: (config: ConfigObject) => void): () => void
}

/**
 * 配置验证器
 */
export interface ConfigValidator {
  /** 验证配置 */
  validate(config: ConfigObject): boolean | Promise<boolean>
  /** 获取验证错误 */
  getErrors?(): string[]
}

/**
 * 配置选项
 */
export interface ConfigOptions {
  /** 当前环境 */
  environment?: Environment
  /** 环境变量前缀 */
  envPrefix?: string
  /** 是否自动加载环境变量 */
  loadEnv?: boolean
  /** 配置文件路径 */
  configFiles?: string[]
  /** 默认配置 */
  defaults?: ConfigObject
  /** 配置验证器 */
  validator?: ConfigValidator
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  /**
   * 获取配置值
   * @param key - 配置键（支持点号分隔的路径）
   * @param defaultValue - 默认值
   */
  get<T = ConfigValue>(key: string, defaultValue?: T): T

  /**
   * 设置配置值
   * @param key - 配置键
   * @param value - 配置值
   */
  set(key: string, value: ConfigValue): void

  /**
   * 批量设置配置
   * @param config - 配置对象
   */
  setAll(config: ConfigObject): void

  /**
   * 检查配置是否存在
   * @param key - 配置键
   */
  has(key: string): boolean

  /**
   * 删除配置
   * @param key - 配置键
   */
  delete(key: string): boolean

  /**
   * 获取所有配置
   */
  getAll(): ConfigObject

  /**
   * 清空配置
   */
  clear(): void

  /**
   * 添加配置源
   * @param source - 配置源
   */
  addSource(source: ConfigSource): void

  /**
   * 添加配置加载器
   * @param loader - 配置加载器
   */
  addLoader(loader: ConfigLoader): Promise<void>

  /**
   * 重新加载配置
   */
  reload(): Promise<void>

  /**
   * 获取当前环境
   */
  getEnvironment(): Environment

  /**
   * 设置环境
   * @param env - 环境
   */
  setEnvironment(env: Environment): void

  /**
   * 验证配置
   */
  validate(): Promise<boolean>

  /**
   * 监听配置变化
   * @param key - 配置键（可选，不传则监听所有变化）
   * @param callback - 回调函数
   */
  watch(key: string | ((value: unknown) => void), callback?: (value: unknown) => void): () => void

  /**
   * 导出配置
   * @param format - 导出格式
   */
  export(format?: 'json' | 'env'): string

  /**
   * 合并配置
   * @param config - 要合并的配置
   * @param deep - 是否深度合并
   */
  merge(config: ConfigObject, deep?: boolean): void
}