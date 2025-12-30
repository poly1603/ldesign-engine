/**
 * 依赖注入装饰器
 * 
 * 提供装饰器语法支持，简化依赖注入的使用
 * 
 * @module container/decorators
 */

import type { ServiceIdentifier, InjectMetadata } from './types'
import { METADATA_KEY } from './types'

/**
 * 标记类为可注入
 * 
 * @decorator
 * @returns 类装饰器
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(private db: Database) {}
 * }
 * ```
 */
export function Injectable(): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    (Reflect as any).defineMetadata(METADATA_KEY.INJECTABLE, true, target)
    
    // 保存构造函数参数类型
    const paramTypes = (Reflect as any).getMetadata('design:paramtypes', target) || []
    ;(Reflect as any).defineMetadata(METADATA_KEY.PARAM_TYPES, paramTypes, target)
    
    return target
  }
}

/**
 * 注入依赖
 * 
 * @decorator
 * @param identifier - 服务标识
 * @returns 参数装饰器
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @Inject('database') private db: Database,
 *     @Inject('logger') private logger: Logger
 *   ) {}
 * }
 * ```
 */
export function Inject(identifier: ServiceIdentifier): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 获取现有的注入元数据
    const existingMetadata: InjectMetadata[] = 
      (Reflect as any).getMetadata(METADATA_KEY.INJECT, target) || []
    
    // 添加新的注入元数据
    existingMetadata.push({
      index: parameterIndex,
      identifier,
      optional: false,
    })
    
    // 保存元数据
    ;(Reflect as any).defineMetadata(METADATA_KEY.INJECT, existingMetadata, target)
  }
}

/**
 * 可选注入
 * 
 * @decorator
 * @param identifier - 服务标识
 * @returns 参数装饰器
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @Optional('cache') private cache?: CacheService
 *   ) {}
 * }
 * ```
 */
export function Optional(identifier: ServiceIdentifier): ParameterDecorator {
  return function (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 获取现有的注入元数据
    const existingMetadata: InjectMetadata[] = 
      (Reflect as any).getMetadata(METADATA_KEY.INJECT, target) || []
    
    // 添加新的注入元数据
    existingMetadata.push({
      index: parameterIndex,
      identifier,
      optional: true,
    })
    
    // 保存元数据
    ;(Reflect as any).defineMetadata(METADATA_KEY.INJECT, existingMetadata, target)
  }
}

/**
 * 检查类是否可注入
 * 
 * @param target - 目标类
 * @returns 是否可注入
 * 
 * @example
 * ```typescript
 * if (isInjectable(UserService)) {
 *   // 可以进行依赖注入
 * }
 * ```
 */
export function isInjectable(target: object): boolean {
  return (Reflect as any).getMetadata(METADATA_KEY.INJECTABLE, target) === true
}

/**
 * 获取构造函数参数类型
 * 
 * @param target - 目标类
 * @returns 参数类型数组
 * 
 * @example
 * ```typescript
 * const paramTypes = getParamTypes(UserService)
 * // [Database, Logger]
 * ```
 */
export function getParamTypes(target: object): unknown[] {
  return (Reflect as any).getMetadata(METADATA_KEY.PARAM_TYPES, target) || []
}

/**
 * 获取注入元数据
 * 
 * @param target - 目标类
 * @returns 注入元数据数组
 * 
 * @example
 * ```typescript
 * const metadata = getInjectMetadata(UserService)
 * // [{ index: 0, identifier: 'database', optional: false }]
 * ```
 */
export function getInjectMetadata(target: object): InjectMetadata[] {
  return (Reflect as any).getMetadata(METADATA_KEY.INJECT, target) || []
}
