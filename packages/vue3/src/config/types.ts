/**
 * 应用配置类型定义
 *
 * 定义 app.config.ts 配置文件的类型接口
 *
 * @author LDesign Team
 * @since 2.0.0
 */

/**
 * 应用基本信息配置
 */
export interface AppInfo {
  /** 应用名称 */
  name?: string
  /** 应用版本号 */
  version?: string
  /** 应用描述 */
  description?: string
  /** 作者信息 */
  author?: string
  /** 应用主页地址 */
  homepage?: string
  /** 应用图标 URL */
  icon?: string
  /** 应用 Logo URL */
  logo?: string
}

/**
 * API 配置
 */
export interface ApiConfig {
  /** API 基础 URL */
  baseUrl?: string
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 是否携带凭证 */
  withCredentials?: boolean
  /** 自定义请求头 */
  headers?: Record<string, string>
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 默认主题模式 */
  mode?: 'light' | 'dark' | 'auto'
  /** 主色调 */
  primaryColor?: string
  /** 边框圆角 */
  borderRadius?: number | string
  /** 自定义主题变量 */
  variables?: Record<string, string>
}

/**
 * 功能开关配置
 */
export interface FeatureFlags {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 是否启用 Mock 数据 */
  mock?: boolean
  /** 是否启用性能监控 */
  performance?: boolean
  /** 是否启用错误上报 */
  errorReporting?: boolean
  /** 自定义功能开关 */
  [key: string]: boolean | undefined
}

/**
 * 日志配置
 */
export interface LogConfig {
  /** 日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  /** 是否在控制台输出 */
  console?: boolean
  /** 是否上报日志 */
  report?: boolean
  /** 日志上报地址 */
  reportUrl?: string
}

/**
 * 存储配置
 */
export interface StorageConfig {
  /** 存储前缀 */
  prefix?: string
  /** 存储类型 */
  type?: 'localStorage' | 'sessionStorage' | 'memory'
  /** 是否加密存储 */
  encrypt?: boolean
}

/**
 * 国际化配置
 */
export interface I18nConfig {
  /** 默认语言 */
  defaultLocale?: string
  /** 备选语言 */
  fallbackLocale?: string
  /** 支持的语言列表 */
  supportedLocales?: string[]
  /** 是否自动检测浏览器语言 */
  autoDetect?: boolean
}

/**
 * 路由配置
 */
export interface RouterConfig {
  /** 路由模式 */
  mode?: 'hash' | 'history' | 'memory'
  /** 基础路径 */
  base?: string
  /** 是否启用滚动行为 */
  scrollBehavior?: boolean
}

/**
 * 应用配置接口
 *
 * 定义 app.config.ts 中可用的所有配置项
 */
export interface AppConfig {
  /**
   * 应用基本信息
   * @example
   * ```ts
   * app: {
   *   name: 'My App',
   *   version: '1.0.0',
   *   description: '应用描述',
   * }
   * ```
   */
  app?: AppInfo

  /**
   * API 配置
   * @example
   * ```ts
   * api: {
   *   baseUrl: '/api',
   *   timeout: 30000,
   * }
   * ```
   */
  api?: ApiConfig

  /** 主题配置 */
  theme?: ThemeConfig

  /** 功能开关 */
  features?: FeatureFlags

  /** 日志配置 */
  log?: LogConfig

  /** 存储配置 */
  storage?: StorageConfig

  /** 国际化配置 */
  i18n?: I18nConfig

  /** 路由配置 */
  router?: RouterConfig

  /** 当前环境 */
  environment?: 'development' | 'staging' | 'production' | string

  /** 自定义配置项，支持任意扩展字段 */
  [key: string]: unknown
}

/**
 * 环境特定的应用配置
 *
 * 用于环境特定配置文件（如 app.config.development.ts）
 * 类型与 AppConfig 相同，但所有字段都是可选的，用于覆盖基础配置
 */
export type AppConfigOverride = Partial<AppConfig>

