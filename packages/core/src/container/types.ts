/**
 * 依赖注入容器类型定义
 *
 * 提供服务注册、依赖解析和生命周期管理的类型支持
 *
 * @module container/types
 */

/**
 * 服务标识符类型
 * 
 * 支持字符串、Symbol 或构造函数作为服务标识
 */
export type ServiceIdentifier<T = any> = string | symbol | Constructor<T>

/**
 * 构造函数类型
 */
export type Constructor<T = any> = new (...args: any[]) => T

/**
 * 工厂函数类型
 */
export type Factory<T = any> = (container: ServiceContainer) => T | Promise<T>

/**
 * 服务提供者接口
 * 
 * 用于批量注册服务的提供者模式
 */
export interface ServiceProvider {
  /** 提供者名称 */
  name: string
  /** 注册服务 */
  register(container: ServiceContainer): void | Promise<void>
  /** 启动服务（可选） */
  boot?(container: ServiceContainer): void | Promise<void>
}

/**
 * 服务生命周期
 */
export enum ServiceLifetime {
  /** 单例 - 整个应用生命周期只创建一次 */
  Singleton = 'singleton',
  /** 瞬态 - 每次请求都创建新实例 */
  Transient = 'transient',
  /** 作用域 - 在同一作用域内共享实例 */
  Scoped = 'scoped',
}

/**
 * 服务描述符
 * 
 * 描述服务的注册信息
 */
export interface ServiceDescriptor<T = any> {
  /** 服务标识 */
  identifier: ServiceIdentifier<T>
  /** 服务实现 */
  implementation: Constructor<T> | Factory<T> | T
  /** 生命周期 */
  lifetime: ServiceLifetime
  /** 是否为工厂函数 */
  isFactory?: boolean
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 服务解析选项
 */
export interface ResolveOptions {
  /** 是否为可选依赖 */
  optional?: boolean
  /** 默认值（当服务不存在时） */
  defaultValue?: any
  /** 是否允许多个实例 */
  multiple?: boolean
}

/**
 * 服务容器接口
 * 
 * 提供依赖注入的核心功能
 */
export interface ServiceContainer {
  /**
   * 注册服务
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   * @param lifetime - 生命周期
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T> | T,
    lifetime?: ServiceLifetime
  ): void

  /**
   * 注册单例服务
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  singleton<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T> | T
  ): void

  /**
   * 注册瞬态服务
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  transient<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T>
  ): void

  /**
   * 注册作用域服务
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  scoped<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T>
  ): void

  /**
   * 解析服务
   * @param identifier - 服务标识
   * @param options - 解析选项
   */
  resolve<T>(
    identifier: ServiceIdentifier<T>,
    options?: ResolveOptions
  ): T

  /**
   * 异步解析服务
   * @param identifier - 服务标识
   * @param options - 解析选项
   */
  resolveAsync<T>(
    identifier: ServiceIdentifier<T>,
    options?: ResolveOptions
  ): Promise<T>

  /**
   * 检查服务是否已注册
   * @param identifier - 服务标识
   */
  has<T>(identifier: ServiceIdentifier<T>): boolean

  /**
   * 注册服务提供者
   * @param provider - 服务提供者
   */
  addProvider(provider: ServiceProvider): Promise<void>

  /**
   * 创建子容器（作用域）
   */
  createScope(): ServiceContainer

  /**
   * 清理容器
   */
  clear(): void
}

/**
 * 装饰器元数据键
 */
export const METADATA_KEY = {
  /** 可注入标记 */
  INJECTABLE: Symbol('injectable'),
  /** 构造函数参数类型 */
  PARAM_TYPES: Symbol('design:paramtypes'),
  /** 注入标记 */
  INJECT: Symbol('inject'),
  /** 可选注入 */
  OPTIONAL: Symbol('optional'),
} as const

/**
 * 注入元数据
 */
export interface InjectMetadata {
  /** 参数索引 */
  index: number
  /** 服务标识 */
  identifier: ServiceIdentifier
  /** 是否可选 */
  optional?: boolean
}