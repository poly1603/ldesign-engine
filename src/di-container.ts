import type { DIContainer } from './types'

/**
 * 依赖注入容器实现
 * 基于Vue 3的provide/inject机制提供依赖注入功能
 */
export class DIContainerImpl implements DIContainer {
  private dependencies = new Map<string | symbol, any>()
  private singletons = new Map<string | symbol, any>()
  private factories = new Map<string | symbol, () => any>()
  private weakRefs = new WeakMap<object, string | symbol>()

  /**
   * 提供依赖
   */
  provide(key: string | symbol, value: any): void {
    if (key === null || key === undefined) {
      throw new TypeError('Dependency key cannot be null or undefined')
    }

    this.dependencies.set(key, value)

    // 如果是对象，建立弱引用映射
    if (typeof value === 'object' && value !== null) {
      this.weakRefs.set(value, key)
    }
  }

  /**
   * 注入依赖
   */
  inject<T>(key: string | symbol): T | undefined {
    if (key === null || key === undefined) {
      return undefined
    }

    // 检查是否有直接依赖
    if (this.dependencies.has(key)) {
      return this.dependencies.get(key) as T
    }

    // 检查是否有单例
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T
    }

    // 检查是否有工厂函数
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!
      try {
        const instance = factory()
        // 缓存单例
        this.singletons.set(key, instance)
        return instance as T
      } catch (error) {
        console.error(`Error creating instance for key '${String(key)}':`, error)
        return undefined
      }
    }

    return undefined
  }

  /**
   * 检查依赖是否存在
   */
  has(key: string | symbol): boolean {
    return this.dependencies.has(key) || 
           this.singletons.has(key) || 
           this.factories.has(key)
  }

  /**
   * 移除依赖
   */
  remove(key: string | symbol): boolean {
    let removed = false

    if (this.dependencies.has(key)) {
      const value = this.dependencies.get(key)
      this.dependencies.delete(key)
      
      // 清理弱引用
      if (typeof value === 'object' && value !== null) {
        this.weakRefs.delete(value)
      }
      
      removed = true
    }

    if (this.singletons.has(key)) {
      const value = this.singletons.get(key)
      this.singletons.delete(key)
      
      // 如果实例有销毁方法，调用它
      if (value && typeof value.destroy === 'function') {
        try {
          value.destroy()
        } catch (error) {
          console.error(`Error destroying instance for key '${String(key)}':`, error)
        }
      }
      
      removed = true
    }

    if (this.factories.has(key)) {
      this.factories.delete(key)
      removed = true
    }

    return removed
  }

  /**
   * 注册工厂函数
   */
  factory(key: string | symbol, factory: () => any): void {
    if (typeof factory !== 'function') {
      throw new TypeError('Factory must be a function')
    }

    this.factories.set(key, factory)
  }

  /**
   * 注册单例
   */
  singleton(key: string | symbol, factory: () => any): void {
    if (typeof factory !== 'function') {
      throw new TypeError('Factory must be a function')
    }

    // 延迟创建单例
    this.factory(key, () => {
      if (!this.singletons.has(key)) {
        const instance = factory()
        this.singletons.set(key, instance)
        return instance
      }
      return this.singletons.get(key)
    })
  }

  /**
   * 获取所有依赖键
   */
  keys(): (string | symbol)[] {
    const keys = new Set<string | symbol>()
    
    for (const key of this.dependencies.keys()) {
      keys.add(key)
    }
    
    for (const key of this.singletons.keys()) {
      keys.add(key)
    }
    
    for (const key of this.factories.keys()) {
      keys.add(key)
    }
    
    return Array.from(keys)
  }

  /**
   * 获取依赖数量
   */
  size(): number {
    return this.keys().length
  }

  /**
   * 清空所有依赖
   */
  clear(): void {
    // 销毁所有单例
    for (const [key, instance] of this.singletons) {
      if (instance && typeof instance.destroy === 'function') {
        try {
          instance.destroy()
        } catch (error) {
          console.error(`Error destroying instance for key '${String(key)}':`, error)
        }
      }
    }

    this.dependencies.clear()
    this.singletons.clear()
    this.factories.clear()
    // WeakMap会自动清理
  }

  /**
   * 克隆容器
   */
  clone(): DIContainerImpl {
    const cloned = new DIContainerImpl()
    
    // 复制依赖
    for (const [key, value] of this.dependencies) {
      cloned.provide(key, value)
    }
    
    // 复制工厂函数
    for (const [key, factory] of this.factories) {
      cloned.factory(key, factory)
    }
    
    return cloned
  }

  /**
   * 合并另一个容器
   */
  merge(other: DIContainerImpl): void {
    // 合并依赖
    for (const [key, value] of other.dependencies) {
      this.provide(key, value)
    }
    
    // 合并工厂函数
    for (const [key, factory] of other.factories) {
      this.factory(key, factory)
    }
  }

  /**
   * 获取依赖信息
   */
  getInfo(key: string | symbol): {
    exists: boolean
    type: 'direct' | 'singleton' | 'factory' | 'none'
    value?: any
  } {
    if (this.dependencies.has(key)) {
      return {
        exists: true,
        type: 'direct',
        value: this.dependencies.get(key)
      }
    }
    
    if (this.singletons.has(key)) {
      return {
        exists: true,
        type: 'singleton',
        value: this.singletons.get(key)
      }
    }
    
    if (this.factories.has(key)) {
      return {
        exists: true,
        type: 'factory'
      }
    }
    
    return {
      exists: false,
      type: 'none'
    }
  }

  /**
   * 检查循环依赖
   */
  checkCircularDependency(key: string | symbol, visited = new Set<string | symbol>()): boolean {
    if (visited.has(key)) {
      return true // 发现循环依赖
    }
    
    visited.add(key)
    
    const value = this.dependencies.get(key)
    if (value && typeof value === 'object') {
      // 检查对象的依赖
      const dependencyKey = this.weakRefs.get(value)
      if (dependencyKey && dependencyKey !== key) {
        return this.checkCircularDependency(dependencyKey, visited)
      }
    }
    
    visited.delete(key)
    return false
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): {
    dependencies: number
    singletons: number
    factories: number
    total: number
  } {
    return {
      dependencies: this.dependencies.size,
      singletons: this.singletons.size,
      factories: this.factories.size,
      total: this.dependencies.size + this.singletons.size + this.factories.size
    }
  }

  /**
   * 销毁容器
   */
  destroy(): void {
    this.clear()
  }
}