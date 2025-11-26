/**
 * 通用类型定义
 * 用于替代 any 类型，提供更好的类型安全
 */

/**
 * 状态值类型（用于状态管理）
 */
export type StateValue = unknown

/**
 * 事件负载类型（用于事件系统）
 */
export type EventPayload = unknown

/**
 * 上下文数据类型（用于中间件和插件上下文）
 */
export type ContextData = unknown

/**
 * 未知记录类型（替代 Record<string, any>）
 */
export type UnknownRecord = Record<string, unknown>

/**
 * JSON 值类型
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

/**
 * JSON 对象类型
 */
export type JsonObject = { [key: string]: JsonValue }

/**
 * 可序列化的值类型
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

/**
 * 框架应用实例类型（框架无关）
 */
export interface FrameworkApp {
  /** 应用名称 */
  name?: string
  /** 挂载点 */
  mount?: (selector: string | HTMLElement) => void | Promise<void>
  /** 卸载 */
  unmount?: () => void | Promise<void>
  /** 其他属性 */
  [key: string]: unknown
}

/**
 * 路由实例类型（框架无关）
 */
export interface RouterInstance {
  /** 当前路径 */
  currentRoute?: unknown
  /** 导航方法 */
  push?: (to: string | RouteLocation) => void | Promise<void>
  /** 替换方法 */
  replace?: (to: string | RouteLocation) => void | Promise<void>
  /** 返回 */
  back?: () => void
  /** 前进 */
  forward?: () => void
  /** 其他属性 */
  [key: string]: unknown
}

/**
 * 路由位置类型
 */
export interface RouteLocation {
  /** 路径 */
  path: string
  /** 参数 */
  params?: UnknownRecord
  /** 查询参数 */
  query?: UnknownRecord
  /** 哈希 */
  hash?: string
  /** 元数据 */
  meta?: UnknownRecord
}

/**
 * I18n 实例类型（框架无关）
 */
export interface I18nInstance {
  /** 当前语言 */
  locale: string
  /** 可用语言 */
  availableLocales?: string[]
  /** 翻译方法 */
  t: (key: string, params?: UnknownRecord) => string
  /** 其他属性 */
  [key: string]: unknown
}

/**
 * 主题适配器类型
 */
export interface ThemeAdapter {
  /** 主题名称 */
  name?: string
  /** 主题色 */
  primaryColor?: string
  /** 模式 */
  mode?: 'light' | 'dark' | 'auto'
  /** 设置主题 */
  setTheme?: (theme: string) => void
  /** 设置语言 */
  setLocale?: (locale: string) => void
  /** 其他属性 */
  [key: string]: unknown
}

/**
 * 服务实例类型
 */
export type ServiceInstance = object

/**
 * 可调用类型
 */
export type Callable<T = unknown> = (...args: unknown[]) => T

/**
 * 异步可调用类型
 */
export type AsyncCallable<T = unknown> = (...args: unknown[]) => Promise<T>

/**
 * 构造函数类型
 */
export type Constructor<T = object> = new (...args: unknown[]) => T

/**
 * 抽象构造函数类型
 */
export type AbstractConstructor<T = object> = abstract new (...args: unknown[]) => T

/**
 * 类类型（构造函数或抽象构造函数）
 */
export type ClassType<T = object> = Constructor<T> | AbstractConstructor<T>