/**
 * 引擎事件常量定义
 *
 * 统一的事件命名规范：plugin:{pluginName}:{category}:{action}
 *
 * @module constants/events
 */

/**
 * 路由位置信息
 */
export interface RouteLocation {
  /** 路由路径 */
  path: string
  /** 路由名称 */
  name?: string
  /** 路由参数 */
  params?: Record<string, string | string[]>
  /** 查询参数 */
  query?: Record<string, string | string[]>
  /** 路由元信息 */
  meta?: Record<string, unknown>
  /** 哈希值 */
  hash?: string
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题模式 */
  mode?: 'light' | 'dark'
  /** 主色调 */
  primaryColor?: string
  /** 其他主题配置 */
  [key: string]: unknown
}

/**
 * 引擎核心事件
 */
export const ENGINE_EVENTS = {
  /** 引擎初始化开始 */
  INIT_START: 'engine:core:init:start',
  /** 引擎初始化完成 */
  INIT_COMPLETE: 'engine:core:init:complete',
  /** 引擎初始化失败 */
  INIT_ERROR: 'engine:core:init:error',
  /** 引擎销毁 */
  DESTROY: 'engine:core:destroy',
  /** 应用创建完成 */
  APP_CREATED: 'engine:core:app:created',
  /** 应用挂载前 */
  APP_BEFORE_MOUNT: 'engine:core:app:beforeMount',
  /** 应用挂载完成 */
  APP_MOUNTED: 'engine:core:app:mounted',
  /** 应用卸载 */
  APP_UNMOUNTED: 'engine:core:app:unmounted',
} as const

/**
 * I18n 插件事件
 */
export const I18N_EVENTS = {
  /** 插件安装完成 */
  INSTALLED: 'plugin:i18n:lifecycle:installed',
  /** 插件卸载完成 */
  UNINSTALLED: 'plugin:i18n:lifecycle:uninstalled',
  /** 语言切换开始 */
  LOCALE_CHANGING: 'plugin:i18n:locale:changing',
  /** 语言切换完成 */
  LOCALE_CHANGED: 'plugin:i18n:locale:changed',
  /** 语言切换失败 */
  LOCALE_CHANGE_ERROR: 'plugin:i18n:locale:error',
  /** 语言包加载开始 */
  MESSAGES_LOADING: 'plugin:i18n:messages:loading',
  /** 语言包加载完成 */
  MESSAGES_LOADED: 'plugin:i18n:messages:loaded',
  /** 语言包加载失败 */
  MESSAGES_LOAD_ERROR: 'plugin:i18n:messages:error',
  /** 翻译缺失 */
  TRANSLATION_MISSING: 'plugin:i18n:translation:missing',
} as const

/**
 * Router 插件事件
 */
export const ROUTER_EVENTS = {
  /** 插件安装完成 */
  INSTALLED: 'plugin:router:lifecycle:installed',
  /** 插件卸载完成 */
  UNINSTALLED: 'plugin:router:lifecycle:uninstalled',
  /** 路由导航开始 */
  NAVIGATION_START: 'plugin:router:navigation:start',
  /** 路由导航完成 */
  NAVIGATED: 'plugin:router:navigation:completed',
  /** 路由导航取消 */
  NAVIGATION_CANCELLED: 'plugin:router:navigation:cancelled',
  /** 路由导航失败 */
  NAVIGATION_ERROR: 'plugin:router:navigation:error',
  /** 路由守卫执行前 */
  GUARD_BEFORE: 'plugin:router:guard:before',
  /** 路由守卫执行后 */
  GUARD_AFTER: 'plugin:router:guard:after',
  /** 路由守卫执行失败 */
  GUARD_ERROR: 'plugin:router:guard:error',
} as const

/**
 * Color 插件事件
 */
export const COLOR_EVENTS = {
  /** 插件安装完成 */
  INSTALLED: 'plugin:color:lifecycle:installed',
  /** 插件卸载完成 */
  UNINSTALLED: 'plugin:color:lifecycle:uninstalled',
  /** 主题切换开始 */
  THEME_CHANGING: 'plugin:color:theme:changing',
  /** 主题切换完成 */
  THEME_CHANGED: 'plugin:color:theme:changed',
  /** 主题切换失败 */
  THEME_CHANGE_ERROR: 'plugin:color:theme:error',
  /** 主题模式切换（亮/暗） */
  MODE_CHANGED: 'plugin:color:mode:changed',
  /** 主色调变更 */
  PRIMARY_COLOR_CHANGED: 'plugin:color:primary:changed',
} as const

/**
 * Size 插件事件
 */
export const SIZE_EVENTS = {
  /** 插件安装完成 */
  INSTALLED: 'plugin:size:lifecycle:installed',
  /** 插件卸载完成 */
  UNINSTALLED: 'plugin:size:lifecycle:uninstalled',
  /** 尺寸预设切换开始 */
  PRESET_CHANGING: 'plugin:size:preset:changing',
  /** 尺寸预设切换完成 */
  PRESET_CHANGED: 'plugin:size:preset:changed',
  /** 尺寸预设切换失败 */
  PRESET_CHANGE_ERROR: 'plugin:size:preset:error',
  /** 基础尺寸变更 */
  BASE_SIZE_CHANGED: 'plugin:size:base:changed',
  /** 尺寸比例变更 */
  SCALE_CHANGED: 'plugin:size:scale:changed',
} as const

/**
 * 所有事件类型联合
 */
export type EngineEventType =
  | typeof ENGINE_EVENTS[keyof typeof ENGINE_EVENTS]
  | typeof I18N_EVENTS[keyof typeof I18N_EVENTS]
  | typeof ROUTER_EVENTS[keyof typeof ROUTER_EVENTS]
  | typeof COLOR_EVENTS[keyof typeof COLOR_EVENTS]
  | typeof SIZE_EVENTS[keyof typeof SIZE_EVENTS]

/**
 * 事件载荷类型映射
 *
 * 为每个事件定义具体的载荷类型，提供类型安全
 */
export interface EventPayloadMap {
  // Engine 核心事件
  [ENGINE_EVENTS.INIT_START]: void
  [ENGINE_EVENTS.INIT_COMPLETE]: void
  [ENGINE_EVENTS.INIT_ERROR]: { error: Error }
  [ENGINE_EVENTS.DESTROY]: void
  [ENGINE_EVENTS.APP_CREATED]: { app: unknown }
  [ENGINE_EVENTS.APP_BEFORE_MOUNT]: void
  [ENGINE_EVENTS.APP_MOUNTED]: void
  [ENGINE_EVENTS.APP_UNMOUNTED]: void

  // I18n 事件
  [I18N_EVENTS.INSTALLED]: { locale: string }
  [I18N_EVENTS.UNINSTALLED]: void
  [I18N_EVENTS.LOCALE_CHANGING]: { locale: string; oldLocale: string }
  [I18N_EVENTS.LOCALE_CHANGED]: { locale: string; oldLocale: string }
  [I18N_EVENTS.LOCALE_CHANGE_ERROR]: { locale: string; error: Error }
  [I18N_EVENTS.MESSAGES_LOADING]: { locale: string }
  [I18N_EVENTS.MESSAGES_LOADED]: { locale: string; messages: Record<string, unknown> }
  [I18N_EVENTS.MESSAGES_LOAD_ERROR]: { locale: string; error: Error }
  [I18N_EVENTS.TRANSLATION_MISSING]: { key: string; locale: string }

  // Router 事件
  [ROUTER_EVENTS.INSTALLED]: { mode: string; base: string }
  [ROUTER_EVENTS.UNINSTALLED]: void
  [ROUTER_EVENTS.NAVIGATION_START]: { to: RouteLocation; from: RouteLocation }
  [ROUTER_EVENTS.NAVIGATED]: { to: RouteLocation; from?: RouteLocation }
  [ROUTER_EVENTS.NAVIGATION_CANCELLED]: { to: RouteLocation; from: RouteLocation }
  [ROUTER_EVENTS.NAVIGATION_ERROR]: { to: RouteLocation; from: RouteLocation; error: Error }
  [ROUTER_EVENTS.GUARD_BEFORE]: { to: RouteLocation; from: RouteLocation; guard: string }
  [ROUTER_EVENTS.GUARD_AFTER]: { to: RouteLocation; from: RouteLocation; guard: string }
  [ROUTER_EVENTS.GUARD_ERROR]: { to: RouteLocation; from: RouteLocation; guard: string; error: Error }

  // Color 事件
  [COLOR_EVENTS.INSTALLED]: { primaryColor?: string }
  [COLOR_EVENTS.UNINSTALLED]: void
  [COLOR_EVENTS.THEME_CHANGING]: { theme: ThemeConfig; oldTheme?: ThemeConfig }
  [COLOR_EVENTS.THEME_CHANGED]: { theme: ThemeConfig; oldTheme?: ThemeConfig }
  [COLOR_EVENTS.THEME_CHANGE_ERROR]: { theme: ThemeConfig; error: Error }
  [COLOR_EVENTS.MODE_CHANGED]: { mode: 'light' | 'dark' }
  [COLOR_EVENTS.PRIMARY_COLOR_CHANGED]: { color: string; oldColor?: string }

  // Size 事件
  [SIZE_EVENTS.INSTALLED]: { baseSize?: number }
  [SIZE_EVENTS.UNINSTALLED]: void
  [SIZE_EVENTS.PRESET_CHANGING]: { preset: string; oldPreset?: string }
  [SIZE_EVENTS.PRESET_CHANGED]: { preset: string; oldPreset?: string }
  [SIZE_EVENTS.PRESET_CHANGE_ERROR]: { preset: string; error: Error }
  [SIZE_EVENTS.BASE_SIZE_CHANGED]: { size: number; oldSize?: number }
  [SIZE_EVENTS.SCALE_CHANGED]: { scale: number; oldScale?: number }
}

/**
 * 获取事件载荷类型
 */
export type EventPayload<T extends EngineEventType> = EventPayloadMap[T]
