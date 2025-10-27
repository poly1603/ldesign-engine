/**
 * 依赖注入容器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createDIContainer } from '../../src/core/di-container'

describe('DIContainer', () => {
  let container: ReturnType<typeof createDIContainer>

  beforeEach(() => {
    container = createDIContainer()
  })

  describe('基础功能', () => {
    it('应该能注册和解析服务', () => {
      class Logger {
        log(msg: string) {
          return `LOG: ${msg}`
        }
      }

      container.register('Logger', Logger, 'singleton')
      const logger = container.resolve<Logger>('Logger')

      expect(logger).toBeInstanceOf(Logger)
      expect(logger.log('test')).toBe('LOG: test')
    })

    it('应该能注册工厂函数', () => {
      container.registerFactory(
        'Config',
        () => ({ apiUrl: 'https://api.example.com' }),
        'singleton'
      )

      const config = container.resolve<any>('Config')
      expect(config.apiUrl).toBe('https://api.example.com')
    })

    it('应该能注册实例', () => {
      const instance = { value: 123 }
      container.registerInstance('MyInstance', instance)

      const resolved = container.resolve('MyInstance')
      expect(resolved).toBe(instance)
    })
  })

  describe('生命周期', () => {
    it('Singleton应该返回同一实例', () => {
      class Service { }
      container.register('Service', Service, 'singleton')

      const instance1 = container.resolve('Service')
      const instance2 = container.resolve('Service')

      expect(instance1).toBe(instance2)
    })

    it('Transient应该返回新实例', () => {
      class Service { }
      container.register('Service', Service, 'transient')

      const instance1 = container.resolve('Service')
      const instance2 = container.resolve('Service')

      expect(instance1).not.toBe(instance2)
    })

    it('Scoped应该在作用域内共享', () => {
      class Service { }
      container.register('Service', Service, 'scoped')

      const scope = container.createScope()
      const instance1 = scope.resolve('Service')
      const instance2 = scope.resolve('Service')

      expect(instance1).toBe(instance2)

      // 不同作用域应该不同
      const scope2 = container.createScope()
      const instance3 = scope2.resolve('Service')
      expect(instance1).not.toBe(instance3)
    })
  })

  describe('依赖解析', () => {
    it('应该自动解析依赖', () => {
      class Logger {
        log(msg: string) { return msg }
      }

      class UserService {
        constructor(private logger: Logger) { }
        getLogger() { return this.logger }
      }

      container.register('Logger', Logger, 'singleton')
      container.register('UserService', UserService, 'transient', ['Logger'])

      const service = container.resolve<UserService>('UserService')
      expect(service.getLogger()).toBeInstanceOf(Logger)
    })

    it('应该检测循环依赖', () => {
      class ServiceA {
        constructor(b: any) { }
      }
      class ServiceB {
        constructor(a: any) { }
      }

      container.register('ServiceA', ServiceA, 'singleton', ['ServiceB'])
      container.register('ServiceB', ServiceB, 'singleton', ['ServiceA'])

      expect(() => {
        container.resolve('ServiceA')
      }).toThrow(/循环依赖/)
    })
  })

  describe('验证', () => {
    it('应该验证依赖完整性', () => {
      class Service { }
      container.register('Service', Service, 'singleton', ['MissingDep'])

      const result = container.validate()
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('应该验证通过', () => {
      class Logger { }
      class Service { }

      container.register('Logger', Logger, 'singleton')
      container.register('Service', Service, 'singleton', ['Logger'])

      const result = container.validate()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('管理', () => {
    it('应该能检查服务是否存在', () => {
      class Service { }
      container.register('Service', Service)

      expect(container.has('Service')).toBe(true)
      expect(container.has('NotExists')).toBe(false)
    })

    it('应该能注销服务', () => {
      class Service { }
      container.register('Service', Service)

      expect(container.has('Service')).toBe(true)

      container.unregister('Service')
      expect(container.has('Service')).toBe(false)
    })

    it('应该能获取所有注册', () => {
      class Service1 { }
      class Service2 { }

      container.register('Service1', Service1)
      container.register('Service2', Service2)

      const registrations = container.getRegistrations()
      expect(registrations).toContain('Service1')
      expect(registrations).toContain('Service2')
    })
  })
})

