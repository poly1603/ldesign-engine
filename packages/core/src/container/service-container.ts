/**
 * 服务容器实现
 *
 * 提供完整的依赖注入功能，支持生命周期管理和作用域控制
 *
 * @module container/service-container
 */

import type {
  ServiceContainer,
  ServiceIdentifier,
  ServiceDescriptor,
  Constructor,
  Factory,
  ServiceProvider,
  ResolveOptions,
} from './types'
import type { ServiceInstance } from '../types/common'
import { ServiceLifetime } from './types'

/**
 * 服务容器实现类
 * 
 * 特性：
 * - 支持三种生命周期：单例、瞬态、作用域
 * - 支持构造函数、工厂函数和实例注册
 * - 支持循环依赖检测
 * - 支持作用域隔离
 * - 支持服务提供者模式
 * 
 * @example
 * ```typescript
 * const container = new ServiceContainerImpl()
 * 
 * // 注册单例服务
 * container.singleton('logger', Logger)
 * 
 * // 注册工厂函数
 * container.singleton('config', (container) => {
 *   const logger = container.resolve('logger')
 *   return new ConfigService(logger)
 * })
 * 
 * // 解析服务
 * const logger = container.resolve('logger')
 * ```
 */
export class ServiceContainerImpl implements ServiceContainer {
  /** 服务描述符存储 */
  private descriptors = new Map<ServiceIdentifier, ServiceDescriptor>()

  /** 单例实例缓存 */
  private singletons = new Map<ServiceIdentifier, ServiceInstance>()

  /** 作用域实例缓存 */
  private scopedInstances = new Map<ServiceIdentifier, ServiceInstance>()

  /** 父容器（用于作用域） */
  private parent: ServiceContainerImpl | null = null

  /** 正在解析的服务集合（用于检测循环依赖） */
  private resolving = new Set<ServiceIdentifier>()

  /** 解析路径栈（用于检测间接循环依赖） */
  private resolvingStack: ServiceIdentifier[] = []

  /** 性能优化:服务解析计数器,用于性能监控 */
  private resolveCount = new Map<ServiceIdentifier, number>()

  /** 性能优化:服务解析时间统计 */
  private resolveTimeStats = new Map<ServiceIdentifier, { totalTime: number; count: number }>()

  /**
   * 构造函数
   * 
   * @param parent - 父容器（用于创建作用域）
   */
  constructor(parent?: ServiceContainerImpl) {
    this.parent = parent || null
  }

  /**
   * 注册服务
   * 
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   * @param lifetime - 生命周期
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T> | T,
    lifetime: ServiceLifetime = ServiceLifetime.Singleton
  ): void {
    const descriptor: ServiceDescriptor<T> = {
      identifier,
      implementation,
      lifetime,
      isFactory: typeof implementation === 'function' && !this.isConstructor(implementation),
    }

    this.descriptors.set(identifier, descriptor)
  }

  /**
   * 注册单例服务
   * 
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  singleton<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T> | T
  ): void {
    this.register(identifier, implementation, ServiceLifetime.Singleton)
  }

  /**
   * 注册瞬态服务
   * 
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  transient<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T>
  ): void {
    this.register(identifier, implementation, ServiceLifetime.Transient)
  }

  /**
   * 注册作用域服务
   * 
   * @param identifier - 服务标识
   * @param implementation - 服务实现
   */
  scoped<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | Factory<T>
  ): void {
    this.register(identifier, implementation, ServiceLifetime.Scoped)
  }

  /**
   * 解析服务
   *
   * @param identifier - 服务标识
   * @param options - 解析选项
   * @returns 服务实例
   */
  resolve<T>(
    identifier: ServiceIdentifier<T>,
    options?: ResolveOptions
  ): T {
    // 检查循环依赖（增强版：支持间接循环依赖检测）
    if (this.resolving.has(identifier)) {
      const cycle = this.findCycle(identifier)
      throw new Error(
        `Circular dependency detected: ${cycle.map(id => String(id)).join(' → ')}`
      )
    }

    // 查找服务描述符（包括父容器）
    const descriptor = this.findDescriptor(identifier)

    if (!descriptor) {
      if (options?.optional) {
        return options.defaultValue as T
      }
      throw new Error(`Service "${String(identifier)}" not registered`)
    }

    // 标记为正在解析，并添加到解析栈
    this.resolving.add(identifier)
    this.resolvingStack.push(identifier)

    // 性能监控:记录解析开始时间
    const startTime = performance.now()

    try {
      const result = this.resolveDescriptor(descriptor, options) as T

      // 性能监控:统计解析次数和时间
      this.updateResolveStats(identifier, startTime)

      return result
    } finally {
      // 解析完成，移除标记
      this.resolving.delete(identifier)
      this.resolvingStack.pop()
    }
  }

  /**
   * 异步解析服务
   *
   * @param identifier - 服务标识
   * @param options - 解析选项
   * @returns Promise<服务实例>
   */
  async resolveAsync<T>(
    identifier: ServiceIdentifier<T>,
    options?: ResolveOptions
  ): Promise<T> {
    // 检查循环依赖（增强版：支持间接循环依赖检测）
    if (this.resolving.has(identifier)) {
      const cycle = this.findCycle(identifier)
      throw new Error(
        `Circular dependency detected: ${cycle.map(id => String(id)).join(' → ')}`
      )
    }

    // 查找服务描述符
    const descriptor = this.findDescriptor(identifier)

    if (!descriptor) {
      if (options?.optional) {
        return options.defaultValue as T
      }
      throw new Error(`Service "${String(identifier)}" not registered`)
    }

    // 标记为正在解析，并添加到解析栈
    this.resolving.add(identifier)
    this.resolvingStack.push(identifier)

    try {
      return await this.resolveDescriptorAsync(descriptor, options) as T
    } finally {
      // 解析完成，移除标记
      this.resolving.delete(identifier)
      this.resolvingStack.pop()
    }
  }

  /**
   * 检查服务是否已注册
   * 
   * @param identifier - 服务标识
   * @returns 是否已注册
   */
  has<T>(identifier: ServiceIdentifier<T>): boolean {
    if (this.descriptors.has(identifier)) {
      return true
    }

    // 检查父容器
    if (this.parent) {
      return this.parent.has(identifier)
    }

    return false
  }

  /**
   * 注册服务提供者
   * 
   * @param provider - 服务提供者
   */
  async addProvider(provider: ServiceProvider): Promise<void> {
    // 注册服务
    await provider.register(this)

    // 启动服务（如果提供了 boot 方法）
    if (provider.boot) {
      await provider.boot(this)
    }
  }

  /**
   * 创建子容器（作用域）
   * 
   * @returns 新的作用域容器
   */
  createScope(): ServiceContainer {
    return new ServiceContainerImpl(this)
  }

  /**
   * 清理容器
   * 
   * 释放所有资源，防止内存泄漏
   */
  clear(): void {
    this.descriptors.clear()
    this.singletons.clear()
    this.scopedInstances.clear()
    this.resolving.clear()
    this.resolveCount.clear()
    this.resolveTimeStats.clear()
  }

  /**
   * 获取服务解析统计信息
   *
   * @returns 统计信息对象
   *
   * @example
   * ```typescript
   * const stats = container.getResolveStats()
   * console.log('总解析次数:', stats.totalResolves)
   * console.log('最热门服务:', stats.topServices)
   * ```
   */
  getResolveStats(): {
    totalResolves: number
    topServices: Array<{ identifier: string; count: number; avgTime: number }>
    slowestServices: Array<{ identifier: string; avgTime: number; count: number }>
  } {
    let totalResolves = 0
    const services: Array<{ identifier: string; count: number; avgTime: number }> = []

    // 统计所有服务的解析次数和平均时间
    this.resolveCount.forEach((count, identifier) => {
      totalResolves += count
      const timeStats = this.resolveTimeStats.get(identifier)
      const avgTime = timeStats ? timeStats.totalTime / timeStats.count : 0
      services.push({
        identifier: String(identifier),
        count,
        avgTime,
      })
    })

    // 按解析次数排序获取最热门服务
    const topServices = [...services]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 按平均时间排序获取最慢服务
    const slowestServices = [...services]
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    return {
      totalResolves,
      topServices,
      slowestServices,
    }
  }

  /**
   * 重置解析统计信息
   *
   * @example
   * ```typescript
   * container.resetResolveStats()
   * ```
   */
  resetResolveStats(): void {
    this.resolveCount.clear()
    this.resolveTimeStats.clear()
  }

  /**
   * 查找服务描述符
   * 
   * @private
   * @param identifier - 服务标识
   * @returns 服务描述符
   */
  private findDescriptor(identifier: ServiceIdentifier): ServiceDescriptor | undefined {
    // 先查找当前容器
    const descriptor = this.descriptors.get(identifier)
    if (descriptor) {
      return descriptor
    }

    // 查找父容器
    if (this.parent) {
      return this.parent.findDescriptor(identifier)
    }

    return undefined
  }

  /**
   * 解析服务描述符
   * 
   * @private
   * @param descriptor - 服务描述符
   * @param options - 解析选项
   * @returns 服务实例
   */
  private resolveDescriptor<T>(
    descriptor: ServiceDescriptor<T>,
    options?: ResolveOptions
  ): T {
    const { identifier, implementation, lifetime, isFactory } = descriptor

    // 处理单例
    if (lifetime === ServiceLifetime.Singleton) {
      // 检查缓存（包括父容器）
      const cached = this.getSingleton(identifier)
      if (cached) {
        return cached as T
      }

      // 创建实例
      const instance = this.createInstance(implementation, isFactory)

      // 缓存到最顶层容器
      this.setSingleton(identifier, instance as ServiceInstance)

      return instance
    }

    // 处理作用域服务
    if (lifetime === ServiceLifetime.Scoped) {
      // 检查当前作用域缓存
      if (this.scopedInstances.has(identifier)) {
        return this.scopedInstances.get(identifier) as T
      }

      // 创建实例
      const instance = this.createInstance(implementation, isFactory)

      // 缓存到当前作用域
      this.scopedInstances.set(identifier, instance as ServiceInstance)

      return instance
    }

    // 处理瞬态服务
    return this.createInstance(implementation, isFactory)
  }

  /**
   * 异步解析服务描述符
   * 
   * @private
   * @param descriptor - 服务描述符
   * @param options - 解析选项
   * @returns Promise<服务实例>
   */
  private async resolveDescriptorAsync<T>(
    descriptor: ServiceDescriptor<T>,
    options?: ResolveOptions
  ): Promise<T> {
    const { identifier, implementation, lifetime, isFactory } = descriptor

    // 处理单例
    if (lifetime === ServiceLifetime.Singleton) {
      const cached = this.getSingleton(identifier)
      if (cached) {
        return cached as T
      }

      const instance = await this.createInstanceAsync(implementation, isFactory)
      this.setSingleton(identifier, instance as ServiceInstance)

      return instance
    }

    // 处理作用域服务
    if (lifetime === ServiceLifetime.Scoped) {
      if (this.scopedInstances.has(identifier)) {
        return this.scopedInstances.get(identifier) as T
      }

      const instance = await this.createInstanceAsync(implementation, isFactory)
      this.scopedInstances.set(identifier, instance as ServiceInstance)

      return instance
    }

    // 处理瞬态服务
    return await this.createInstanceAsync(implementation, isFactory)
  }

  /**
   * 创建服务实例
   * 
   * @private
   * @param implementation - 服务实现
   * @param isFactory - 是否为工厂函数
   * @returns 服务实例
   */
  private createInstance<T>(
    implementation: Constructor<T> | Factory<T> | T,
    isFactory?: boolean
  ): T {
    // 如果是值类型，直接返回
    if (!isFactory && typeof implementation !== 'function') {
      return implementation as T
    }

    // 如果是工厂函数
    if (isFactory) {
      return (implementation as Factory<T>)(this) as T
    }

    // 如果是构造函数
    const ctor = implementation as Constructor<T>
    return new ctor()
  }

  /**
   * 异步创建服务实例
   * 
   * @private
   * @param implementation - 服务实现
   * @param isFactory - 是否为工厂函数
   * @returns Promise<服务实例>
   */
  private async createInstanceAsync<T>(
    implementation: Constructor<T> | Factory<T> | T,
    isFactory?: boolean
  ): Promise<T> {
    // 如果是值类型，直接返回
    if (!isFactory && typeof implementation !== 'function') {
      return implementation as T
    }

    // 如果是工厂函数
    if (isFactory) {
      return await (implementation as Factory<T>)(this)
    }

    // 如果是构造函数
    const ctor = implementation as Constructor<T>
    return new ctor()
  }

  /**
   * 获取单例实例
   * 
   * @private
   * @param identifier - 服务标识
   * @returns 单例实例
   */
  private getSingleton(identifier: ServiceIdentifier): ServiceInstance | undefined {
    // 查找当前容器
    if (this.singletons.has(identifier)) {
      return this.singletons.get(identifier)
    }

    // 查找父容器
    if (this.parent) {
      return this.parent.getSingleton(identifier)
    }

    return undefined
  }

  /**
   * 设置单例实例
   * 
   * @private
   * @param identifier - 服务标识
   * @param instance - 实例
   */
  private setSingleton(identifier: ServiceIdentifier, instance: ServiceInstance): void {
    // 单例总是存储在最顶层容器
    if (this.parent) {
      this.parent.setSingleton(identifier, instance)
    } else {
      this.singletons.set(identifier, instance)
    }
  }

  /**
   * 检查是否为构造函数
   *
   * @private
   * @param fn - 函数
   * @returns 是否为构造函数
   */
  private isConstructor(fn: unknown): boolean {
    try {
      // 尝试获取原型
      const fnWithPrototype = fn as { prototype?: { constructor?: unknown } }
      return !!fnWithPrototype.prototype && !!fnWithPrototype.prototype.constructor
    } catch {
      return false
    }
  }

  /**
   * 查找循环依赖路径
   *
   * 从解析栈中提取循环依赖的完整路径，用于生成详细的错误信息
   *
   * @private
   * @param identifier - 当前正在解析的服务标识
   * @returns 循环依赖路径数组
   *
   * @example
   * ```typescript
   * // 假设解析栈为: [A, B, C]，当前尝试解析 A
   * // 返回: [A, B, C, A]
   * ```
   */
  private findCycle(identifier: ServiceIdentifier): ServiceIdentifier[] {
    // 在解析栈中查找第一次出现的位置
    const firstIndex = this.resolvingStack.indexOf(identifier)

    if (firstIndex === -1) {
      // 如果栈中没有找到（理论上不应该发生），返回简单路径
      return [identifier]
    }

    // 提取从第一次出现到当前的路径，并添加当前标识符形成闭环
    const cycle = this.resolvingStack.slice(firstIndex)
    cycle.push(identifier)

    return cycle
  }

  /**
   * 更新服务解析统计信息
   *
   * @private
   * @param identifier - 服务标识
   * @param startTime - 解析开始时间
   */
  private updateResolveStats(identifier: ServiceIdentifier, startTime: number): void {
    // 更新解析计数
    const count = this.resolveCount.get(identifier) || 0
    this.resolveCount.set(identifier, count + 1)

    // 更新时间统计
    const duration = performance.now() - startTime
    const timeStats = this.resolveTimeStats.get(identifier)

    if (timeStats) {
      timeStats.totalTime += duration
      timeStats.count += 1
    } else {
      this.resolveTimeStats.set(identifier, {
        totalTime: duration,
        count: 1,
      })
    }
  }
}

/**
 * 创建服务容器
 * 
 * @returns 新的服务容器实例
 * 
 * @example
 * ```typescript
 * const container = createServiceContainer()
 * 
 * // 注册服务
 * container.singleton('app', Application)
 * 
 * // 解析服务
 * const app = container.resolve('app')
 * ```
 */
export function createServiceContainer(): ServiceContainer {
  return new ServiceContainerImpl()
}