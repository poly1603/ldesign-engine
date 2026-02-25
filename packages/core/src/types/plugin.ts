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

  // Validate 相关状态
  /** 校验引擎实例 */
  VALIDATE_ENGINE: 'validate:engine' as const,

  // Event 相关状态
  /** 事件总线实例 */
  EVENT_BUS: 'event:bus' as const,

  // Storage 相关状态
  /** 存储管理器实例 */
  STORAGE_MANAGER: 'storage:manager' as const,

  // WebSocket 相关状态
  /** WebSocket 客户端实例 */
  WEBSOCKET_CLIENT: 'websocket:client' as const,
  /** WebSocket 连接状态 */
  WEBSOCKET_STATE: 'websocket:state' as const,

  // Config 相关状态
  /** 配置管理器实例 */
  CONFIG_MANAGER: 'config:manager' as const,

  // Theme 相关状态
  /** 主题管理器实例 */
  THEME_MANAGER: 'theme:manager' as const,
  /** 主题模式 */
  THEME_MODE: 'theme:mode' as const,
  /** 设计令牌 */
  THEME_TOKENS: 'theme:tokens' as const,

  // Auth 相关状态
  AUTH_MANAGER: 'auth:manager' as const,
  AUTH_USER: 'auth:user' as const,
  AUTH_TOKEN: 'auth:token' as const,
  AUTH_AUTHENTICATED: 'auth:authenticated' as const,

  // Logger 相关状态
  LOGGER_INSTANCE: 'logger:instance' as const,

  // Cache 相关状态
  CACHE_MANAGER: 'cache:manager' as const,

  // Store 相关状态
  STORE_BUS: 'store:bus' as const,

  // Notification 相关状态
  NOTIFICATION_MANAGER: 'notification:manager' as const,
  NOTIFICATION_TOAST: 'notification:toast' as const,
  NOTIFICATION_MESSAGE: 'notification:message' as const,

  // Tracker 相关状态
  TRACKER_COLLECTOR: 'tracker:collector' as const,

  // Permission 相关状态
  PERMISSION_MANAGER: 'permission:manager' as const,

  // Error 相关状态
  ERROR_CATCHER: 'error:catcher' as const,
  ERROR_REPORTER: 'error:reporter' as const,

  // Size 相关状态
  SIZE_MANAGER: 'size:manager' as const,

  // Device 相关状态
  DEVICE_DETECTOR: 'device:detector' as const,
  DEVICE_INFO: 'device:info' as const,

  // Bookmark 相关状态
  BOOKMARK_MANAGER: 'bookmark:manager' as const,

  // Breadcrumb 相关状态
  BREADCRUMB_MANAGER: 'breadcrumb:manager' as const,

  // Menu 相关状态
  MENU_MANAGER: 'menu:manager' as const,
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

  // Validate 事件
  /** Validate 插件安装完成 */
  VALIDATE_INSTALLED: 'validate:installed' as const,
  /** 校验完成 */
  VALIDATE_VALIDATED: 'validate:validated' as const,
  /** Validate 插件卸载 */
  VALIDATE_UNINSTALLED: 'validate:uninstalled' as const,

  // Event 事件
  /** Event 插件安装完成 */
  EVENT_INSTALLED: 'event:installed' as const,
  /** Event 插件卸载 */
  EVENT_UNINSTALLED: 'event:uninstalled' as const,

  // Storage 事件
  /** Storage 插件安装完成 */
  STORAGE_INSTALLED: 'storage:installed' as const,
  /** Storage 插件卸载 */
  STORAGE_UNINSTALLED: 'storage:uninstalled' as const,

  // WebSocket 事件
  /** WebSocket 插件安装完成 */
  WEBSOCKET_INSTALLED: 'websocket:installed' as const,
  /** WebSocket 连接成功 */
  WEBSOCKET_CONNECTED: 'websocket:connected' as const,
  /** WebSocket 连接断开 */
  WEBSOCKET_DISCONNECTED: 'websocket:disconnected' as const,
  /** WebSocket 插件卸载 */
  WEBSOCKET_UNINSTALLED: 'websocket:uninstalled' as const,

  // Config 事件
  /** Config 插件安装完成 */
  CONFIG_INSTALLED: 'config:installed' as const,
  /** 配置变更 */
  CONFIG_CHANGED: 'config:changed' as const,
  /** Config 插件卸载 */
  CONFIG_UNINSTALLED: 'config:uninstalled' as const,

  // Theme 事件
  /** Theme 插件安装完成 */
  THEME_INSTALLED: 'theme:installed' as const,
  /** 主题模式变更 */
  THEME_MODE_CHANGED: 'theme:modeChanged' as const,
  /** 设计令牌变更 */
  THEME_TOKENS_CHANGED: 'theme:tokensChanged' as const,
  /** Theme 插件卸载 */
  THEME_UNINSTALLED: 'theme:uninstalled' as const,

  // Auth 事件
  AUTH_INSTALLED: 'auth:installed' as const,
  AUTH_UNINSTALLED: 'auth:uninstalled' as const,
  AUTH_LOGIN: 'auth:login' as const,
  AUTH_LOGOUT: 'auth:logout' as const,
  AUTH_TOKEN_REFRESHED: 'auth:tokenRefreshed' as const,

  // Logger 事件
  LOGGER_INSTALLED: 'logger:installed' as const,
  LOGGER_UNINSTALLED: 'logger:uninstalled' as const,

  // Cache 事件
  CACHE_INSTALLED: 'cache:installed' as const,
  CACHE_UNINSTALLED: 'cache:uninstalled' as const,

  // Store 事件
  STORE_INSTALLED: 'store:installed' as const,
  STORE_UNINSTALLED: 'store:uninstalled' as const,

  // Notification 事件
  NOTIFICATION_INSTALLED: 'notification:installed' as const,
  NOTIFICATION_UNINSTALLED: 'notification:uninstalled' as const,
  NOTIFICATION_NOTIFY: 'notification:notify' as const,

  // Tracker 事件
  TRACKER_INSTALLED: 'tracker:installed' as const,
  TRACKER_UNINSTALLED: 'tracker:uninstalled' as const,
  TRACKER_TRACK: 'tracker:track' as const,

  // Permission 事件
  PERMISSION_INSTALLED: 'permission:installed' as const,
  PERMISSION_UNINSTALLED: 'permission:uninstalled' as const,
  PERMISSION_CHANGED: 'permission:changed' as const,

  // Error 事件
  ERROR_INSTALLED: 'error:installed' as const,
  ERROR_UNINSTALLED: 'error:uninstalled' as const,
  ERROR_CAUGHT: 'error:caught' as const,

  // Size 事件
  SIZE_INSTALLED: 'size:installed' as const,
  SIZE_UNINSTALLED: 'size:uninstalled' as const,
  SIZE_CHANGED: 'size:changed' as const,

  // Device 事件
  DEVICE_INSTALLED: 'device:installed' as const,
  DEVICE_UNINSTALLED: 'device:uninstalled' as const,
  DEVICE_CHANGED: 'device:changed' as const,

  // Bookmark 事件
  BOOKMARK_INSTALLED: 'bookmark:installed' as const,
  BOOKMARK_UNINSTALLED: 'bookmark:uninstalled' as const,
  BOOKMARK_ADDED: 'bookmark:added' as const,
  BOOKMARK_REMOVED: 'bookmark:removed' as const,

  // Breadcrumb 事件
  BREADCRUMB_INSTALLED: 'breadcrumb:installed' as const,
  BREADCRUMB_UNINSTALLED: 'breadcrumb:uninstalled' as const,
  BREADCRUMB_CHANGED: 'breadcrumb:changed' as const,

  // Menu 事件
  MENU_INSTALLED: 'menu:installed' as const,
  MENU_UNINSTALLED: 'menu:uninstalled' as const,
  MENU_CHANGED: 'menu:changed' as const,
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

  // Validate 事件
  [EventKeys.VALIDATE_INSTALLED]: { name: string }
  [EventKeys.VALIDATE_VALIDATED]: { schema: string; valid: boolean }
  [EventKeys.VALIDATE_UNINSTALLED]: Record<string, never>

  // Event 事件
  [EventKeys.EVENT_INSTALLED]: { name: string }
  [EventKeys.EVENT_UNINSTALLED]: Record<string, never>

  // Storage 事件
  [EventKeys.STORAGE_INSTALLED]: { name: string }
  [EventKeys.STORAGE_UNINSTALLED]: Record<string, never>

  // WebSocket 事件
  [EventKeys.WEBSOCKET_INSTALLED]: { name: string }
  [EventKeys.WEBSOCKET_CONNECTED]: Record<string, never>
  [EventKeys.WEBSOCKET_DISCONNECTED]: Record<string, never>
  [EventKeys.WEBSOCKET_UNINSTALLED]: Record<string, never>

  // Config 事件
  [EventKeys.CONFIG_INSTALLED]: { name: string }
  [EventKeys.CONFIG_CHANGED]: { key: string; oldValue: unknown; newValue: unknown; source: string }
  [EventKeys.CONFIG_UNINSTALLED]: Record<string, never>

  // Theme 事件
  [EventKeys.THEME_INSTALLED]: { name: string; mode: string }
  [EventKeys.THEME_MODE_CHANGED]: { mode: string; resolvedMode: string }
  [EventKeys.THEME_TOKENS_CHANGED]: { tokens: unknown }
  [EventKeys.THEME_UNINSTALLED]: Record<string, never>

  // Auth 事件
  [EventKeys.AUTH_INSTALLED]: { name: string }
  [EventKeys.AUTH_UNINSTALLED]: Record<string, never>
  [EventKeys.AUTH_LOGIN]: { user: unknown }
  [EventKeys.AUTH_LOGOUT]: Record<string, never>
  [EventKeys.AUTH_TOKEN_REFRESHED]: { token: string }

  // Logger 事件
  [EventKeys.LOGGER_INSTALLED]: { name: string }
  [EventKeys.LOGGER_UNINSTALLED]: Record<string, never>

  // Cache 事件
  [EventKeys.CACHE_INSTALLED]: { name: string }
  [EventKeys.CACHE_UNINSTALLED]: Record<string, never>

  // Store 事件
  [EventKeys.STORE_INSTALLED]: { name: string }
  [EventKeys.STORE_UNINSTALLED]: Record<string, never>

  // Notification 事件
  [EventKeys.NOTIFICATION_INSTALLED]: { name: string }
  [EventKeys.NOTIFICATION_UNINSTALLED]: Record<string, never>
  [EventKeys.NOTIFICATION_NOTIFY]: { type: string; message: string }

  // Tracker 事件
  [EventKeys.TRACKER_INSTALLED]: { name: string }
  [EventKeys.TRACKER_UNINSTALLED]: Record<string, never>
  [EventKeys.TRACKER_TRACK]: { event: string; data?: unknown }

  // Permission 事件
  [EventKeys.PERMISSION_INSTALLED]: { name: string }
  [EventKeys.PERMISSION_UNINSTALLED]: Record<string, never>
  [EventKeys.PERMISSION_CHANGED]: { permissions: unknown }

  // Error 事件
  [EventKeys.ERROR_INSTALLED]: { name: string }
  [EventKeys.ERROR_UNINSTALLED]: Record<string, never>
  [EventKeys.ERROR_CAUGHT]: { error: unknown; source: string }

  // Size 事件
  [EventKeys.SIZE_INSTALLED]: { name: string }
  [EventKeys.SIZE_UNINSTALLED]: Record<string, never>
  [EventKeys.SIZE_CHANGED]: { size: unknown }

  // Device 事件
  [EventKeys.DEVICE_INSTALLED]: { name: string }
  [EventKeys.DEVICE_UNINSTALLED]: Record<string, never>
  [EventKeys.DEVICE_CHANGED]: { info: unknown }

  // Bookmark 事件
  [EventKeys.BOOKMARK_INSTALLED]: { name: string }
  [EventKeys.BOOKMARK_UNINSTALLED]: Record<string, never>
  [EventKeys.BOOKMARK_ADDED]: { id: string; title: string }
  [EventKeys.BOOKMARK_REMOVED]: { id: string }

  // Breadcrumb 事件
  [EventKeys.BREADCRUMB_INSTALLED]: { name: string }
  [EventKeys.BREADCRUMB_UNINSTALLED]: Record<string, never>
  [EventKeys.BREADCRUMB_CHANGED]: { items: unknown[] }

  // Menu 事件
  [EventKeys.MENU_INSTALLED]: { name: string }
  [EventKeys.MENU_UNINSTALLED]: Record<string, never>
  [EventKeys.MENU_CHANGED]: { items: unknown[] }
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

