/**
 * 插件系统类型定义
 */

import type { CoreEngine } from './engine'
import type { UnknownRecord, FrameworkApp, ServiceInstance } from './common'

/**
 * 框架信息
 */
export interface FrameworkInfo {
  /** 框架名称 */
  name: 'vue' | 'react' | 'lit' | 'unknown'
  /** 框架版本 */
  version?: string
  /** 框架应用实例 */
  app?: FrameworkApp
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 引擎实例 */
  engine: CoreEngine
  /** 插件配置 */
  config?: UnknownRecord
  /** 框架信息（可选，框架特定引擎会提供） */
  framework?: FrameworkInfo
  /** 服务容器（可选，支持依赖注入的引擎会提供） */
  container?: {
    singleton: (identifier: string | symbol, implementation: ServiceInstance) => void
    resolve: <T = ServiceInstance>(identifier: string | symbol) => T
    has: (identifier: string | symbol) => boolean
  }
}

/**
 * 插件接口
 */
export interface Plugin<Options = UnknownRecord> {
  /** 插件名称 */
  readonly name: string
  /** 插件版本 */
  readonly version?: string
  /** 插件依赖 */
  readonly dependencies?: string[]
  /** 安装函数 */
  install: (context: PluginContext, options?: Options) => void | Promise<void>
  /** 卸载函数 */
  uninstall?: (context: PluginContext) => void | Promise<void>
}

/**
 * 插件管理器接口
 */
export interface PluginManager {
  /** 注册插件 */
  use: <T = UnknownRecord>(plugin: Plugin<T>, options?: T, customContext?: Partial<PluginContext>) => Promise<void>
  /** 卸载插件 */
  uninstall: (name: string) => Promise<boolean>
  /** 获取插件 */
  get: (name: string) => Plugin | undefined
  /** 获取所有插件 */
  getAll: () => Plugin[]
  /** 检查插件是否已安装 */
  has: (name: string) => boolean
  /** 清空所有插件 */
  clear: () => void
  /** 获取插件数量 */
  size: () => number
  /** 热重载插件 */
  hotReload?: <T = unknown>(name: string, newPlugin: Plugin<T>) => Promise<boolean>
  /** 注册热重载监听器 */
  onHotReload?: (name: string, listener: () => void | Promise<void>) => () => void
  /** 检查插件是否支持热重载 */
  isHotReloadable?: (name: string) => boolean
}

// ============================================================================
// 跨插件通信类型定义（增强功能）
// ============================================================================

/**
 * 预定义的状态键（类型安全）
 *
 * 使用命名空间前缀避免冲突，格式：`<plugin>:<key>`
 *
 * @example
 * ```typescript
 * // 使用预定义的状态键
 * engine.state.set(StateKeys.I18N_LOCALE, 'zh-CN')
 * const locale = engine.state.get(StateKeys.I18N_LOCALE)
 * ```
 */
export const StateKeys = {
  // I18n 相关状态
  /** 当前语言 */
  I18N_LOCALE: 'i18n:locale' as const,
  /** 回退语言 */
  I18N_FALLBACK_LOCALE: 'i18n:fallbackLocale' as const,
  /** 可用语言列表 */
  I18N_AVAILABLE_LOCALES: 'i18n:availableLocales' as const,

  // Color 相关状态
  /** 主题色 */
  COLOR_PRIMARY: 'color:primaryColor' as const,
  /** 主题名称 */
  COLOR_THEME_NAME: 'color:themeName' as const,
  /** 主题模式（light/dark/auto） */
  COLOR_MODE: 'color:mode' as const,

  // Router 相关状态
  /** 路由模式（history/hash/memory） */
  ROUTER_MODE: 'router:mode' as const,
  /** 路由基础路径 */
  ROUTER_BASE: 'router:base' as const,
  /** 路由预设 */
  ROUTER_PRESET: 'router:preset' as const,
} as const

/**
 * 状态键类型
 */
export type StateKey = typeof StateKeys[keyof typeof StateKeys]

/**
 * 预定义的事件键（类型安全）
 *
 * 使用命名空间前缀避免冲突，格式：`<plugin>:<event>`
 *
 * @example
 * ```typescript
 * // 发送事件
 * engine.events.emit(EventKeys.I18N_LOCALE_CHANGED, { locale: 'zh-CN', oldLocale: 'en-US' })
 *
 * // 监听事件
 * engine.events.on(EventKeys.I18N_LOCALE_CHANGED, ({ locale }) => {
 *   console.log('Locale changed to:', locale)
 * })
 * ```
 */
export const EventKeys = {
  // 应用生命周期事件
  /** 应用创建完成 */
  APP_CREATED: 'app:created' as const,
  /** 应用挂载完成 */
  APP_MOUNTED: 'app:mounted' as const,
  /** 应用卸载 */
  APP_UNMOUNTED: 'app:unmounted' as const,

  // I18n 事件
  /** I18n 插件安装完成 */
  I18N_INSTALLED: 'i18n:installed' as const,
  /** 语言切换 */
  I18N_LOCALE_CHANGED: 'i18n:localeChanged' as const,
  /** I18n 插件卸载 */
  I18N_UNINSTALLED: 'i18n:uninstalled' as const,

  // Color 事件
  /** Color 插件安装完成 */
  COLOR_INSTALLED: 'color:installed' as const,
  /** 主题变化 */
  COLOR_THEME_CHANGED: 'color:themeChanged' as const,
  /** 主题模式变化 */
  COLOR_MODE_CHANGED: 'color:modeChanged' as const,
  /** Color 插件卸载 */
  COLOR_UNINSTALLED: 'color:uninstalled' as const,

  // Router 事件
  /** Router 插件安装完成 */
  ROUTER_INSTALLED: 'router:installed' as const,
  /** 路由导航 */
  ROUTER_NAVIGATED: 'router:navigated' as const,
  /** 路由导航前 */
  ROUTER_BEFORE_NAVIGATE: 'router:beforeNavigate' as const,
  /** 路由导航后 */
  ROUTER_AFTER_NAVIGATE: 'router:afterNavigate' as const,
  /** Router 插件卸载 */
  ROUTER_UNINSTALLED: 'router:uninstalled' as const,
} as const

/**
 * 事件键类型
 */
export type EventKey = typeof EventKeys[keyof typeof EventKeys]

/**
 * 事件负载类型映射
 *
 * 为每个事件定义其负载类型，提供类型安全
 */
export interface EventPayloadMap {
  // 应用事件
  [EventKeys.APP_CREATED]: { app: FrameworkApp }
  [EventKeys.APP_MOUNTED]: { app: FrameworkApp; element: HTMLElement | string }
  [EventKeys.APP_UNMOUNTED]: { app: FrameworkApp }

  // I18n 事件
  [EventKeys.I18N_INSTALLED]: { i18n: import('./common').I18nInstance; locale: string }
  [EventKeys.I18N_LOCALE_CHANGED]: { locale: string; oldLocale: string }
  [EventKeys.I18N_UNINSTALLED]: Record<string, never>

  // Color 事件
  [EventKeys.COLOR_INSTALLED]: { primaryColor: string; mode: string }
  [EventKeys.COLOR_THEME_CHANGED]: { primaryColor: string; themeName: string }
  [EventKeys.COLOR_MODE_CHANGED]: { mode: string; oldMode: string }
  [EventKeys.COLOR_UNINSTALLED]: Record<string, never>

  // Router 事件
  [EventKeys.ROUTER_INSTALLED]: { router: import('./common').RouterInstance; mode: string; base: string }
  [EventKeys.ROUTER_NAVIGATED]: { to: import('./common').RouteLocation; from?: import('./common').RouteLocation }
  [EventKeys.ROUTER_BEFORE_NAVIGATE]: { to: import('./common').RouteLocation; from: import('./common').RouteLocation }
  [EventKeys.ROUTER_AFTER_NAVIGATE]: { to: import('./common').RouteLocation; from: import('./common').RouteLocation }
  [EventKeys.ROUTER_UNINSTALLED]: Record<string, never>
}

/**
 * 类型化的状态访问接口
 *
 * 提供类型安全的状态访问方法
 */
export interface TypedStateAccess {
  /**
   * 获取状态值
   * @param key - 状态键
   * @returns 状态值
   */
  get<T = unknown>(key: StateKey): T | undefined

  /**
   * 设置状态值
   * @param key - 状态键
   * @param value - 状态值
   */
  set<T = unknown>(key: StateKey, value: T): void

  /**
   * 监听状态变化
   * @param key - 状态键
   * @param listener - 监听器函数
   * @returns 取消监听的函数
   */
  watch<T = unknown>(key: StateKey, listener: (value: T, oldValue: T) => void): () => void

  /**
   * 检查状态是否存在
   * @param key - 状态键
   * @returns 是否存在
   */
  has(key: StateKey): boolean

  /**
   * 删除状态
   * @param key - 状态键
   * @returns 是否删除成功
   */
  delete(key: StateKey): boolean
}

/**
 * 类型化的事件访问接口
 *
 * 提供类型安全的事件访问方法
 */
export interface TypedEventAccess {
  /**
   * 监听事件
   * @param event - 事件键
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   */
  on<K extends EventKey>(
    event: K,
    handler: (payload: EventPayloadMap[K]) => void
  ): () => void

  /**
   * 一次性监听事件
   * @param event - 事件键
   * @param handler - 事件处理器
   * @returns 取消监听的函数
   */
  once<K extends EventKey>(
    event: K,
    handler: (payload: EventPayloadMap[K]) => void
  ): () => void

  /**
   * 触发事件
   * @param event - 事件键
   * @param payload - 事件负载
   */
  emit<K extends EventKey>(event: K, payload: EventPayloadMap[K]): void

  /**
   * 移除事件监听
   * @param event - 事件键
   * @param handler - 事件处理器（可选）
   */
  off<K extends EventKey>(
    event: K,
    handler?: (payload: EventPayloadMap[K]) => void
  ): void
}

/**
 * 增强的插件上下文（向后兼容）
 *
 * 在原有 PluginContext 基础上添加类型化的状态和事件访问
 *
 * @example
 * ```typescript
 * export function createMyPlugin(): Plugin {
 *   return {
 *     name: 'my-plugin',
 *     async install(context: EnhancedPluginContext) {
 *       // 使用类型化的状态访问
 *       if (context.typedState) {
 *         const locale = context.typedState.get(StateKeys.I18N_LOCALE)
 *         context.typedState.watch(StateKeys.I18N_LOCALE, (newLocale) => {
 *           console.log('Locale changed:', newLocale)
 *         })
 *       }
 *
 *       // 使用类型化的事件访问
 *       if (context.typedEvents) {
 *         context.typedEvents.on(EventKeys.I18N_LOCALE_CHANGED, ({ locale }) => {
 *           console.log('Locale changed to:', locale)
 *         })
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface EnhancedPluginContext extends PluginContext {
  /** 类型化的状态访问（可选，增强功能） */
  typedState?: TypedStateAccess

  /** 类型化的事件访问（可选，增强功能） */
  typedEvents?: TypedEventAccess
}

