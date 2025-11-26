/**
 * ServiceContainer 单元测试
 * 
 * 测试依赖注入容器的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createServiceContainer } from '../src/container/service-container'
import { ServiceLifetime } from '../src/container/types'
import type { ServiceContainer, ServiceProvider } from '../src/container/types'

describe('ServiceContainer', () => {
  let container: ServiceContainer

  beforeEach(() => {
    container = createServiceContainer()
  })

  // ===================================
  // 1. 服务注册测试 (6个)
  // ===================================
  describe('服务注册', () => {
    it('应该能够注册服务', () => {
      class TestService { }

      container.register('test', TestService)

      expect(container.has('test')).toBe(true)
    })

    it('应该能够注册单例服务', () => {
      class Logger {
        id = Math.random()
      }

      container.singleton('logger', Logger)

      const instance1 = container.resolve<Logger>('logger')
      const instance2 = container.resolve<Logger>('logger')

      expect(instance1).toBe(instance2)
      expect(instance1.id).toBe(instance2.id)
    })

    it('应该能够注册瞬态服务', () => {
      class TempService {
        id = Math.random()
      }

      container.transient('temp', TempService)

      const instance1 = container.resolve<TempService>('temp')
      const instance2 = container.resolve<TempService>('temp')

      expect(instance1).not.toBe(instance2)
      expect(instance1.id).not.toBe(instance2.id)
    })

    it('应该能够注册作用域服务', () => {
      class ScopedService {
        id = Math.random()
      }

      container.scoped('scoped', ScopedService)

      const instance1 = container.resolve<ScopedService>('scoped')
      const instance2 = container.resolve<ScopedService>('scoped')

      // 在同一作用域内应该相同
      expect(instance1).toBe(instance2)
    })

    it('应该能够注册工厂函数', () => {
      let callCount = 0
      const factory = (container: ServiceContainer) => {
        callCount++
        return { value: 'from-factory', container }
      }

      container.singleton('factory-service', factory)

      const instance = container.resolve<{ value: string; container: ServiceContainer }>('factory-service')

      expect(instance.value).toBe('from-factory')
      expect(instance.container).toBe(container)
      expect(callCount).toBe(1)
    })

    it('应该能够注册值类型', () => {
      const config = { database: 'mysql', port: 3306 }

      container.singleton('config', config)

      const resolved = container.resolve<typeof config>('config')

      expect(resolved).toBe(config)
      expect(resolved.database).toBe('mysql')
    })
  })

  // ===================================
  // 2. 服务解析测试 (8个)
  // ===================================
  describe('服务解析', () => {
    it('应该能够解析已注册的服务', () => {
      class UserService {
        getName() {
          return 'Alice'
        }
      }

      container.singleton('user', UserService)

      const user = container.resolve<UserService>('user')

      expect(user).toBeInstanceOf(UserService)
      expect(user.getName()).toBe('Alice')
    })

    it('应该在解析未注册服务时抛出错误', () => {
      expect(() => {
        container.resolve('non-existent')
      }).toThrow('Service "non-existent" not registered')
    })

    it('应该支持可选解析', () => {
      const result = container.resolve('optional-service', {
        optional: true,
        defaultValue: 'default'
      })

      expect(result).toBe('default')
    })

    it('应该正确处理单例生命周期', () => {
      class Counter {
        count = 0
        increment() {
          this.count++
        }
      }

      container.singleton('counter', Counter)

      const counter1 = container.resolve<Counter>('counter')
      counter1.increment()

      const counter2 = container.resolve<Counter>('counter')
      counter2.increment()

      expect(counter1).toBe(counter2)
      expect(counter1.count).toBe(2)
    })

    it('应该正确处理瞬态生命周期', () => {
      let instanceCount = 0

      class TempService {
        id: number
        constructor() {
          this.id = ++instanceCount
        }
      }

      container.transient('temp', TempService)

      const instance1 = container.resolve<TempService>('temp')
      const instance2 = container.resolve<TempService>('temp')
      const instance3 = container.resolve<TempService>('temp')

      expect(instance1.id).toBe(1)
      expect(instance2.id).toBe(2)
      expect(instance3.id).toBe(3)
    })

    it('应该正确处理作用域生命周期', () => {
      class ScopedService {
        id = Math.random()
      }

      container.scoped('scoped', ScopedService)

      // 在根容器中，作用域服务应该缓存
      const instance1 = container.resolve<ScopedService>('scoped')
      const instance2 = container.resolve<ScopedService>('scoped')

      expect(instance1).toBe(instance2)
      expect(instance1.id).toBe(instance2.id)
    })

    it('应该支持异步解析', async () => {
      const asyncFactory = async (container: ServiceContainer) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { value: 'async-result' }
      }

      container.singleton('async-service', asyncFactory)

      const result = await container.resolveAsync<{ value: string }>('async-service')

      expect(result.value).toBe('async-result')
    })

    it('应该在异步解析未注册服务时抛出错误', async () => {
      await expect(async () => {
        await container.resolveAsync('non-existent')
      }).rejects.toThrow('Service "non-existent" not registered')
    })
  })

  // ===================================
  // 3. 循环依赖检测测试 (4个)
  // ===================================
  describe('循环依赖检测', () => {
    it('应该检测直接循环依赖', () => {
      // A 依赖 A
      container.singleton('service-a', (container: ServiceContainer) => {
        container.resolve('service-a') // 循环依赖
        return {}
      })

      expect(() => {
        container.resolve('service-a')
      }).toThrow(/Circular dependency detected.*service-a.*service-a/)
    })

    it('应该检测间接循环依赖 (A → B → A)', () => {
      // A 依赖 B，B 依赖 A
      container.singleton('service-a', (container: ServiceContainer) => {
        return { b: container.resolve('service-b') }
      })

      container.singleton('service-b', (container: ServiceContainer) => {
        return { a: container.resolve('service-a') }
      })

      expect(() => {
        container.resolve('service-a')
      }).toThrow(/Circular dependency detected.*service-a.*service-b.*service-a/)
    })

    it('应该检测复杂循环依赖 (A → B → C → A)', () => {
      // A → B → C → A
      container.singleton('service-a', (container: ServiceContainer) => {
        return { b: container.resolve('service-b') }
      })

      container.singleton('service-b', (container: ServiceContainer) => {
        return { c: container.resolve('service-c') }
      })

      container.singleton('service-c', (container: ServiceContainer) => {
        return { a: container.resolve('service-a') }
      })

      expect(() => {
        container.resolve('service-a')
      }).toThrow(/Circular dependency detected.*service-a.*service-b.*service-c.*service-a/)
    })

    it('应该在异步解析中检测循环依赖', async () => {
      container.singleton('async-a', async (container: ServiceContainer) => {
        return { b: await container.resolveAsync('async-b') }
      })

      container.singleton('async-b', async (container: ServiceContainer) => {
        return { a: await container.resolveAsync('async-a') }
      })

      await expect(async () => {
        await container.resolveAsync('async-a')
      }).rejects.toThrow(/Circular dependency detected/)
    })
  })

  // ===================================
  // 4. 作用域管理测试 (5个)
  // ===================================
  describe('作用域管理', () => {
    it('应该能够创建子容器', () => {
      const scope = container.createScope()

      expect(scope).toBeDefined()
      expect(scope).not.toBe(container)
    })

    it('子容器应该能够访问父容器的服务', () => {
      class ParentService { }

      container.singleton('parent-service', ParentService)

      const scope = container.createScope()
      const service = scope.resolve<ParentService>('parent-service')

      expect(service).toBeInstanceOf(ParentService)
    })

    it('作用域服务应该在作用域内隔离', () => {
      class ScopedService {
        id = Math.random()
      }

      container.scoped('scoped', ScopedService)

      const scope1 = container.createScope()
      const scope2 = container.createScope()

      const instance1a = scope1.resolve<ScopedService>('scoped')
      const instance1b = scope1.resolve<ScopedService>('scoped')

      const instance2a = scope2.resolve<ScopedService>('scoped')
      const instance2b = scope2.resolve<ScopedService>('scoped')

      // 同一作用域内相同
      expect(instance1a).toBe(instance1b)
      expect(instance2a).toBe(instance2b)

      // 不同作用域间不同
      expect(instance1a).not.toBe(instance2a)
      expect(instance1a.id).not.toBe(instance2a.id)
    })

    it('单例服务应该在所有作用域中共享', () => {
      class SingletonService {
        id = Math.random()
      }

      container.singleton('singleton', SingletonService)

      const scope1 = container.createScope()
      const scope2 = container.createScope()

      const instance1 = scope1.resolve<SingletonService>('singleton')
      const instance2 = scope2.resolve<SingletonService>('singleton')
      const instance3 = container.resolve<SingletonService>('singleton')

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
      expect(instance1.id).toBe(instance2.id)
    })

    it('子容器应该能够注册自己的服务', () => {
      class ChildService { }

      const scope = container.createScope()
      scope.singleton('child-service', ChildService)

      const service = scope.resolve<ChildService>('child-service')

      expect(service).toBeInstanceOf(ChildService)
      expect(container.has('child-service')).toBe(false)
    })
  })

  // ===================================
  // 5. 服务提供者测试 (3个)
  // ===================================
  describe('服务提供者', () => {
    it('应该能够注册服务提供者', async () => {
      const provider: ServiceProvider = {
        name: 'test-provider',
        register: (container) => {
          container.singleton('provided-service', () => ({ value: 'provided' }))
        }
      }

      await container.addProvider(provider)

      const service = container.resolve<{ value: string }>('provided-service')
      expect(service.value).toBe('provided')
    })

    it('应该调用服务提供者的 boot 方法', async () => {
      const bootSpy = vi.fn()

      const provider: ServiceProvider = {
        name: 'boot-provider',
        register: (container) => {
          container.singleton('service', () => ({ value: 'test' }))
        },
        boot: bootSpy
      }

      await container.addProvider(provider)

      expect(bootSpy).toHaveBeenCalledTimes(1)
      expect(bootSpy).toHaveBeenCalledWith(container)
    })

    it('应该支持异步服务提供者', async () => {
      const provider: ServiceProvider = {
        name: 'async-provider',
        register: async (container) => {
          await new Promise(resolve => setTimeout(resolve, 10))
          container.singleton('async-provided', () => ({ value: 'async' }))
        },
        boot: async (container) => {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      await container.addProvider(provider)

      const service = container.resolve<{ value: string }>('async-provided')
      expect(service.value).toBe('async')
    })
  })

  // ===================================
  // 6. 容器管理测试 (3个)
  // ===================================
  describe('容器管理', () => {
    it('应该能够检查服务是否已注册', () => {
      class TestService { }

      expect(container.has('test')).toBe(false)

      container.singleton('test', TestService)

      expect(container.has('test')).toBe(true)
    })

    it('应该能够清理容器', () => {
      class Service1 { }
      class Service2 { }

      container.singleton('service1', Service1)
      container.singleton('service2', Service2)

      expect(container.has('service1')).toBe(true)
      expect(container.has('service2')).toBe(true)

      container.clear()

      expect(container.has('service1')).toBe(false)
      expect(container.has('service2')).toBe(false)
    })

    it('子容器应该能够检查父容器的服务', () => {
      class ParentService { }

      container.singleton('parent', ParentService)

      const scope = container.createScope()

      expect(scope.has('parent')).toBe(true)
    })
  })

  // ===================================
  // 7. 边界情况测试 (3个)
  // ===================================
  describe('边界情况', () => {
    it('应该正确区分构造函数和工厂函数', () => {
      class ConstructorService {
        type = 'constructor'
      }

      const factoryService = () => ({ type: 'factory' })

      container.singleton('constructor', ConstructorService)
      container.singleton('factory', factoryService)

      const constructorInstance = container.resolve<{ type: string }>('constructor')
      const factoryInstance = container.resolve<{ type: string }>('factory')

      expect(constructorInstance.type).toBe('constructor')
      expect(factoryInstance.type).toBe('factory')
    })

    it('应该支持 Symbol 作为服务标识', () => {
      const serviceSymbol = Symbol('my-service')

      class SymbolService { }

      container.singleton(serviceSymbol, SymbolService)

      const service = container.resolve<SymbolService>(serviceSymbol)

      expect(service).toBeInstanceOf(SymbolService)
      expect(container.has(serviceSymbol)).toBe(true)
    })

    it('应该支持异步工厂函数', async () => {
      const asyncFactory = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { status: 'ready' }
      }

      container.singleton('async-factory', asyncFactory)

      const service = await container.resolveAsync<{ status: string }>('async-factory')

      expect(service.status).toBe('ready')
    })
  })
})