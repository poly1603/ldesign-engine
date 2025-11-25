/**
 * 事件命名空间管理器
 * 
 * 提供命名空间隔离、事件组织和批量操作功能
 * 
 * @module namespace-manager
 */

import type { EventHandler, Unsubscribe } from '../types'
import type { EventManager } from '../types/event'

/**
 * 命名空间配置
 */
export interface NamespaceConfig {
  /** 命名空间名称 */
  name: string
  /** 命名空间分隔符（默认: ':'） */
  separator?: string
  /** 是否继承父命名空间事件 */
  inherit?: boolean
  /** 父命名空间 */
  parent?: EventNamespace
}

/**
 * 命名空间统计信息
 */
export interface NamespaceStats {
  /** 命名空间名称 */
  name: string
  /** 事件总数 */
  eventCount: number
  /** 监听器总数 */
  listenerCount: number
  /** 子命名空间数量 */
  childCount: number
  /** 事件列表 */
  events: string[]
}

/**
 * 事件命名空间类
 * 
 * 提供隔离的事件空间，避免不同模块间的事件名冲突
 * 
 * @example
 * ```typescript
 * const userNs = namespace.createChild('user')
 * const authNs = userNs.createChild('auth')
 * 
 * // 事件名自动添加命名空间前缀
 * authNs.on('login', handler)  // 实际监听 'user:auth:login'
 * authNs.emit('login', data)   // 实际触发 'user:auth:login'
 * ```
 */
export class EventNamespace {
  /** 命名空间名称 */
  private name: string

  /** 命名空间分隔符 */
  private separator: string

  /** 父命名空间 */
  private parent?: EventNamespace

  /** 是否继承父命名空间事件 */
  private inherit: boolean

  /** 底层事件管理器 */
  private eventManager: EventManager

  /** 子命名空间 */
  private children = new Map<string, EventNamespace>()

  /** 已注册的事件名称 */
  private registeredEvents = new Set<string>()

  /**
   * 创建命名空间实例
   * 
   * @param eventManager - 事件管理器
   * @param config - 命名空间配置
   */
  constructor(eventManager: EventManager, config: NamespaceConfig) {
    this.eventManager = eventManager
    this.name = config.name
    this.separator = config.separator ?? ':'
    this.parent = config.parent
    this.inherit = config.inherit ?? false
  }

  /**
   * 获取完整的命名空间路径
   * 
   * @returns 命名空间路径（如 'app:user:auth'）
   */
  getFullPath(): string {
    const parts: string[] = []
    let current: EventNamespace | undefined = this

    while (current) {
      if (current.name) {
        parts.unshift(current.name)
      }
      current = current.parent
    }

    return parts.join(this.separator)
  }

  /**
   * 创建完整的事件名称
   * 
   * @param event - 事件名称
   * @returns 带命名空间的完整事件名
   * 
   * @example
   * ```typescript
   * const ns = new EventNamespace(em, { name: 'user' })
   * ns.getFullEventName('login') // 'user:login'
   * ```
   */
  private getFullEventName(event: string): string {
    const fullPath = this.getFullPath()
    return fullPath ? `${fullPath}${this.separator}${event}` : event
  }

  /**
   * 触发事件
   * 
   * @param event - 事件名称（自动添加命名空间前缀）
   * @param payload - 事件数据
   * 
   * @example
   * ```typescript
   * userNs.emit('login', { userId: 1 })
   * // 实际触发 'user:login'
   * ```
   */
  emit<T = any>(event: string, payload?: T): void {
    const fullEvent = this.getFullEventName(event)
    this.eventManager.emit(fullEvent, payload)

    // 如果启用继承，也触发父命名空间的事件
    if (this.inherit && this.parent) {
      this.parent.emit(event, payload)
    }
  }

  /**
   * 监听事件
   * 
   * @param event - 事件名称（自动添加命名空间前缀）
   * @param handler - 事件处理器
   * @returns 取消监听函数
   * 
   * @example
   * ```typescript
   * const unsubscribe = userNs.on('login', (data) => {
   *   console.log('User logged in:', data)
   * })
   * ```
   */
  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    const fullEvent = this.getFullEventName(event)
    this.registeredEvents.add(event)
    return this.eventManager.on(fullEvent, handler)
  }

  /**
   * 一次性监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理器
   * @returns 取消监听函数
   */
  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    const fullEvent = this.getFullEventName(event)
    this.registeredEvents.add(event)
    return this.eventManager.once(fullEvent, handler)
  }

  /**
   * 移除事件监听
   * 
   * @param event - 事件名称
   * @param handler - 事件处理器（可选）
   */
  off(event: string, handler?: EventHandler): void {
    const fullEvent = this.getFullEventName(event)
    this.eventManager.off(fullEvent, handler)

    // 如果没有监听器了，从注册列表移除
    if (!handler && this.eventManager.listenerCount(fullEvent) === 0) {
      this.registeredEvents.delete(event)
    }
  }

  /**
   * 创建子命名空间
   * 
   * @param name - 子命名空间名称
   * @param config - 命名空间配置
   * @returns 子命名空间实例
   * 
   * @example
   * ```typescript
   * const appNs = rootNs.createChild('app')
   * const userNs = appNs.createChild('user')
   * const authNs = userNs.createChild('auth')
   * 
   * authNs.emit('login')  // 触发 'app:user:auth:login'
   * ```
   */
  createChild(name: string, config?: Partial<NamespaceConfig>): EventNamespace {
    if (this.children.has(name)) {
      return this.children.get(name)!
    }

    const child = new EventNamespace(this.eventManager, {
      name,
      separator: config?.separator ?? this.separator,
      inherit: config?.inherit ?? this.inherit,
      parent: this,
    })

    this.children.set(name, child)
    return child
  }

  /**
   * 获取子命名空间
   * 
   * @param name - 子命名空间名称
   * @returns 子命名空间实例或 undefined
   */
  getChild(name: string): EventNamespace | undefined {
    return this.children.get(name)
  }

  /**
   * 获取所有子命名空间
   * 
   * @returns 子命名空间 Map
   */
  getChildren(): Map<string, EventNamespace> {
    return new Map(this.children)
  }

  /**
   * 清空命名空间的所有事件监听器
   * 
   * 包括所有子命名空间的监听器
   */
  clear(): void {
    // 清空所有注册的事件
    this.registeredEvents.forEach(event => {
      const fullEvent = this.getFullEventName(event)
      this.eventManager.off(fullEvent)
    })
    this.registeredEvents.clear()

    // 递归清空子命名空间
    this.children.forEach(child => child.clear())
  }

  /**
   * 获取命名空间统计信息
   * 
   * @returns 统计信息对象
   */
  getStats(): NamespaceStats {
    const events = Array.from(this.registeredEvents)
    let listenerCount = 0

    events.forEach(event => {
      const fullEvent = this.getFullEventName(event)
      listenerCount += this.eventManager.listenerCount(fullEvent)
    })

    return {
      name: this.getFullPath(),
      eventCount: events.length,
      listenerCount,
      childCount: this.children.size,
      events,
    }
  }

  /**
   * 监听命名空间下的所有事件（通配符）
   * 
   * @param handler - 事件处理器
   * @returns 取消监听函数
   * 
   * @example
   * ```typescript
   * userNs.onAll((data) => {
   *   console.log('Any user event:', data)
   * })
   * // 监听 'user:*' 模式
   * ```
   */
  onAll<T = any>(handler: EventHandler<T>): Unsubscribe {
    const pattern = `${this.getFullPath()}${this.separator}*`
    return this.eventManager.on(pattern, handler)
  }

  /**
   * 批量触发事件
   * 
   * @param events - 事件名称数组
   * @param payload - 事件数据
   * 
   * @example
   * ```typescript
   * userNs.emitBatch(['login', 'profile-loaded', 'permissions-set'], user)
   * ```
   */
  emitBatch<T = any>(events: string[], payload?: T): void {
    events.forEach(event => this.emit(event, payload))
  }

  /**
   * 批量监听事件
   * 
   * @param events - 事件名称数组
   * @param handler - 事件处理器
   * @returns 取消所有监听的函数
   * 
   * @example
   * ```typescript
   * const unsubscribe = userNs.onBatch(
   *   ['login', 'logout', 'update'],
   *   handleUserEvent
   * )
   * ```
   */
  onBatch<T = any>(events: string[], handler: EventHandler<T>): Unsubscribe {
    const unsubscribers = events.map(event => this.on(event, handler))

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  /**
   * 移除命名空间及其所有子命名空间
   * 
   * 清理所有监听器并从父命名空间移除
   */
  destroy(): void {
    // 清空所有事件监听器
    this.clear()

    // 销毁所有子命名空间
    this.children.forEach(child => child.destroy())
    this.children.clear()

    // 从父命名空间移除
    if (this.parent) {
      this.parent.children.delete(this.name)
    }
  }
}

/**
 * 命名空间管理器
 * 
 * 管理多个命名空间实例，提供全局访问和统计功能
 */
export class NamespaceManager {
  /** 事件管理器 */
  private eventManager: EventManager

  /** 根命名空间 */
  private root: EventNamespace

  /** 命名空间注册表（扁平化访问） */
  private registry = new Map<string, EventNamespace>()

  /**
   * 创建命名空间管理器
   * 
   * @param eventManager - 事件管理器
   */
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager

    // 创建根命名空间（空名称）
    this.root = new EventNamespace(eventManager, { name: '' })
    this.registry.set('', this.root)
  }

  /**
   * 创建或获取命名空间
   * 
   * 支持路径格式创建嵌套命名空间
   * 
   * @param path - 命名空间路径（如 'app:user:auth'）
   * @param config - 命名空间配置
   * @returns 命名空间实例
   * 
   * @example
   * ```typescript
   * const authNs = nsManager.namespace('app:user:auth')
   * authNs.emit('login', data)
   * ```
   */
  namespace(path: string, config?: Partial<NamespaceConfig>): EventNamespace {
    // 如果已注册，直接返回
    if (this.registry.has(path)) {
      return this.registry.get(path)!
    }

    // 解析路径
    const separator = config?.separator ?? ':'
    const parts = path.split(separator).filter(p => p.length > 0)

    // 从根命名空间开始，逐级创建
    let current = this.root
    let currentPath = ''

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}${separator}${part}` : part

      if (this.registry.has(currentPath)) {
        current = this.registry.get(currentPath)!
      } else {
        current = current.createChild(part, config)
        this.registry.set(currentPath, current)
      }
    }

    return current
  }

  /**
   * 获取已注册的命名空间
   * 
   * @param path - 命名空间路径
   * @returns 命名空间实例或 undefined
   */
  get(path: string): EventNamespace | undefined {
    return this.registry.get(path)
  }

  /**
   * 检查命名空间是否存在
   * 
   * @param path - 命名空间路径
   * @returns 是否存在
   */
  has(path: string): boolean {
    return this.registry.has(path)
  }

  /**
   * 获取所有命名空间路径
   * 
   * @returns 命名空间路径数组
   */
  list(): string[] {
    return Array.from(this.registry.keys()).filter(k => k.length > 0)
  }

  /**
   * 清空所有命名空间
   */
  clear(): void {
    this.registry.forEach(ns => ns.clear())
  }

  /**
   * 获取全局统计信息
   * 
   * @returns 所有命名空间的统计信息
   */
  getGlobalStats(): {
    totalNamespaces: number
    totalEvents: number
    totalListeners: number
    namespaces: NamespaceStats[]
  } {
    const namespaces: NamespaceStats[] = []
    let totalEvents = 0
    let totalListeners = 0

    this.registry.forEach((ns, path) => {
      if (path) {  // 跳过根命名空间
        const stats = ns.getStats()
        namespaces.push(stats)
        totalEvents += stats.eventCount
        totalListeners += stats.listenerCount
      }
    })

    return {
      totalNamespaces: this.registry.size - 1,  // 排除根命名空间
      totalEvents,
      totalListeners,
      namespaces: namespaces.sort((a, b) => b.listenerCount - a.listenerCount),
    }
  }

  /**
   * 销毁命名空间管理器
   * 
   * 清理所有命名空间和监听器
   */
  destroy(): void {
    this.clear()
    this.registry.clear()
  }
}

/**
 * 创建命名空间管理器
 * 
 * @param eventManager - 事件管理器
 * @returns 命名空间管理器实例
 * 
 * @example
 * ```typescript
 * import { createEventManager } from '@ldesign/engine-core'
 * import { createNamespaceManager } from '@ldesign/engine-core'
 * 
 * const em = createEventManager()
 * const nsManager = createNamespaceManager(em)
 * 
 * const userNs = nsManager.namespace('user')
 * userNs.on('login', handleLogin)
 * ```
 */
export function createNamespaceManager(eventManager: EventManager): NamespaceManager {
  return new NamespaceManager(eventManager)
}