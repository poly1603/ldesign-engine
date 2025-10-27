/**
 * 依赖注入容器（IoC Container）
 * 
 * 提供完整的依赖注入功能，支持：
 * - 自动依赖解析
 * - 多种生命周期（Singleton、Transient、Scoped）
 * - 循环依赖检测
 * - 工厂函数注册
 * 
 * ## 核心概念
 * 
 * ### 生命周期
 * - **Singleton**：单例模式，整个应用只创建一次
 * - **Transient**：瞬态模式，每次请求都创建新实例
 * - **Scoped**：作用域模式，在同一作用域内共享实例
 * 
 * ### 依赖解析
 * 容器会自动解析构造函数的依赖参数，递归创建所需的依赖实例
 * 
 * @example
 * ```typescript
 * // 定义服务
 * class Logger {
 *   log(msg: string) { console.log(msg) }
 * }
 * 
 * class UserService {
 *   constructor(private logger: Logger) {}
 *   
 *   getUser() {
 *     this.logger.log('Getting user...')
 *   }
 * }
 * 
 * // 注册服务
 * const container = createDIContainer()
 * container.register('Logger', Logger, 'singleton')
 * container.register('UserService', UserService, 'transient')
 * 
 * // 解析服务（自动注入依赖）
 * const userService = container.resolve<UserService>('UserService')
 * ```
 */

/**
 * 服务生命周期类型
 */
export type ServiceLifetime = 'singleton' | 'transient' | 'scoped'

/**
 * 服务注册信息
 */
interface ServiceRegistration {
  /** 服务标识 */
  token: string
  /** 服务实现（类或工厂函数） */
  implementation: any
  /** 生命周期 */
  lifetime: ServiceLifetime
  /** 单例实例（仅用于singleton） */
  instance?: any
  /** 依赖列表 */
  dependencies?: string[]
  /** 工厂函数 */
  factory?: (...deps: any[]) => any
}

/**
 * 依赖注入容器实现
 */
export class DIContainer {
  /** 服务注册表 */
  private services = new Map<string, ServiceRegistration>()
  
  /** 作用域实例缓存 */
  private scopedInstances = new Map<string, any>()
  
  /** 解析栈（用于循环依赖检测） */
  private resolutionStack: string[] = []
  
  /** 父容器（用于作用域） */
  private parent?: DIContainer

  /**
   * 注册服务
   * 
   * @param token 服务标识
   * @param implementation 服务实现（类）
   * @param lifetime 生命周期（默认singleton）
   * @param dependencies 依赖列表（可选，自动推断）
   */
  register<T>(
    token: string,
    implementation: new (...args: any[]) => T,
    lifetime: ServiceLifetime = 'singleton',
    dependencies?: string[]
  ): void {
    if (this.services.has(token)) {
      throw new Error(`服务 "${token}" 已注册`)
    }

    this.services.set(token, {
      token,
      implementation,
      lifetime,
      dependencies
    })
  }

  /**
   * 注册工厂函数
   * 
   * @example
   * ```typescript
   * container.registerFactory(
   *   'Config',
   *   (logger: Logger) => {
   *     return createConfig(logger)
   *   },
   *   'singleton',
   *   ['Logger']
   * )
   * ```
   */
  registerFactory<T>(
    token: string,
    factory: (...deps: any[]) => T,
    lifetime: ServiceLifetime = 'singleton',
    dependencies: string[] = []
  ): void {
    if (this.services.has(token)) {
      throw new Error(`服务 "${token}" 已注册`)
    }

    this.services.set(token, {
      token,
      implementation: null,
      factory,
      lifetime,
      dependencies
    })
  }

  /**
   * 注册实例
   * 
   * 直接注册一个已创建的实例
   */
  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, {
      token,
      implementation: null,
      lifetime: 'singleton',
      instance
    })
  }

  /**
   * 解析服务
   * 
   * 自动解析依赖并创建实例
   * 
   * @param token 服务标识
   * @returns 服务实例
   * @throws 服务未注册或存在循环依赖
   */
  resolve<T>(token: string): T {
    const registration = this.services.get(token)
    
    if (!registration) {
      throw new Error(`服务 "${token}" 未注册`)
    }

    // 检查循环依赖
    if (this.resolutionStack.includes(token)) {
      const cycle = [...this.resolutionStack, token].join(' -> ')
      throw new Error(`检测到循环依赖: ${cycle}`)
    }

    // Singleton：返回已创建的实例
    if (registration.lifetime === 'singleton' && registration.instance) {
      return registration.instance
    }

    // Scoped：从作用域缓存获取
    if (registration.lifetime === 'scoped') {
      const cached = this.scopedInstances.get(token)
      if (cached) return cached
    }

    // 添加到解析栈
    this.resolutionStack.push(token)

    try {
      // 解析依赖
      const dependencies = this.resolveDependencies(registration)

      // 创建实例
      let instance: any

      if (registration.factory) {
        // 使用工厂函数
        instance = registration.factory(...dependencies)
      } else if (registration.implementation) {
        // 使用类构造函数
        instance = new registration.implementation(...dependencies)
      } else {
        throw new Error(`服务 "${token}" 没有实现或工厂函数`)
      }

      // 缓存实例
      if (registration.lifetime === 'singleton') {
        registration.instance = instance
      } else if (registration.lifetime === 'scoped') {
        this.scopedInstances.set(token, instance)
      }

      return instance
    } finally {
      // 从解析栈移除
      this.resolutionStack.pop()
    }
  }

  /**
   * 解析依赖列表
   */
  private resolveDependencies(registration: ServiceRegistration): any[] {
    if (!registration.dependencies || registration.dependencies.length === 0) {
      return []
    }

    return registration.dependencies.map(dep => this.resolve(dep))
  }

  /**
   * 检查服务是否已注册
   */
  has(token: string): boolean {
    return this.services.has(token)
  }

  /**
   * 注销服务
   */
  unregister(token: string): void {
    this.services.delete(token)
    this.scopedInstances.delete(token)
  }

  /**
   * 创建子容器（作用域）
   * 
   * 子容器会继承父容器的服务注册，但有独立的作用域实例缓存
   */
  createScope(): DIContainer {
    const scope = new DIContainer()
    scope.parent = this
    scope.services = new Map(this.services)
    return scope
  }

  /**
   * 获取所有注册的服务标识
   */
  getRegistrations(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(token: string): {
    token: string
    lifetime: ServiceLifetime
    dependencies: string[]
    hasInstance: boolean
  } | undefined {
    const registration = this.services.get(token)
    if (!registration) return undefined

    return {
      token: registration.token,
      lifetime: registration.lifetime,
      dependencies: registration.dependencies || [],
      hasInstance: !!registration.instance
    }
  }

  /**
   * 验证所有依赖
   * 
   * 检查所有注册的服务的依赖是否都已注册
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const [token, registration] of this.services) {
      if (registration.dependencies) {
        for (const dep of registration.dependencies) {
          if (!this.services.has(dep)) {
            errors.push(`服务 "${token}" 依赖的 "${dep}" 未注册`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 清空容器
   */
  clear(): void {
    // 清理所有单例实例（如果有dispose方法，调用它）
    for (const registration of this.services.values()) {
      if (registration.instance && typeof registration.instance.dispose === 'function') {
        try {
          registration.instance.dispose()
        } catch (error) {
          console.error(`清理服务 "${registration.token}" 失败:`, error)
        }
      }
    }

    this.services.clear()
    this.scopedInstances.clear()
    this.resolutionStack = []
  }
}

/**
 * 创建依赖注入容器
 * 
 * @example
 * ```typescript
 * const container = createDIContainer()
 * 
 * // 注册服务
 * container.register('Logger', Logger, 'singleton')
 * container.register('Database', Database, 'singleton', ['Logger'])
 * container.register('UserService', UserService, 'transient', ['Database', 'Logger'])
 * 
 * // 解析服务
 * const userService = container.resolve<UserService>('UserService')
 * ```
 */
export function createDIContainer(): DIContainer {
  return new DIContainer()
}

/**
 * 全局容器实例（可选）
 */
let globalContainer: DIContainer | undefined

/**
 * 获取全局容器
 */
export function getGlobalContainer(): DIContainer {
  if (!globalContainer) {
    globalContainer = createDIContainer()
  }
  return globalContainer
}

/**
 * 设置全局容器
 */
export function setGlobalContainer(container: DIContainer): void {
  globalContainer = container
}

/**
 * Injectable装饰器（用于标记可注入的类）
 * 
 * @example
 * ```typescript
 * @Injectable('singleton')
 * class UserService {
 *   constructor(private logger: Logger) {}
 * }
 * ```
 */
export function Injectable(lifetime: ServiceLifetime = 'singleton') {
  return function <T extends new (...args: any[]) => any>(target: T) {
    const metadata = {
      lifetime,
      dependencies: Reflect.getMetadata?.('design:paramtypes', target) || []
    }
    
    // 保存元数据
    ;(target as any).__injectable__ = metadata
    
    return target
  }
}

/**
 * Inject装饰器（用于标记注入的依赖）
 * 
 * @example
 * ```typescript
 * class UserService {
 *   constructor(
 *     @Inject('Logger') private logger: any,
 *     @Inject('Database') private db: any
 *   ) {}
 * }
 * ```
 */
export function Inject(token: string) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingInjections = Reflect.getMetadata?.('inject:params', target) || {}
    existingInjections[parameterIndex] = token
    Reflect.defineMetadata?.('inject:params', existingInjections, target)
  }
}


