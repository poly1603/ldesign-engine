/**
 * 插件 API 类型定义
 *
 * 为插件间通信提供类型安全的 API 接口
 *
 * @module types/plugin-api
 */

/**
 * 插件 API 基础接口
 */
export interface PluginAPI {
  /** API 名称（通常与插件名称相同） */
  name: string
  /** API 版本 */
  version: string
}

/**
 * I18n 插件 API
 */
export interface I18nPluginAPI extends PluginAPI {
  name: 'i18n'

  /**
   * 获取当前语言
   */
  getLocale(): string

  /**
   * 设置语言
   * @param locale - 语言代码
   */
  setLocale(locale: string): Promise<void>

  /**
   * 翻译文本
   * @param key - 翻译键
   * @param params - 翻译参数
   */
  t(key: string, params?: Record<string, any>): string

  /**
   * 获取可用语言列表
   */
  getAvailableLocales(): string[]

  /**
   * 添加语言包
   * @param locale - 语言代码
   * @param messages - 语言包数据
   */
  addLocale(locale: string, messages: Record<string, any>): void

  /**
   * 移除语言包
   * @param locale - 语言代码
   */
  removeLocale(locale: string): void

  /**
   * 检查是否存在翻译
   * @param key - 翻译键
   * @param locale - 语言代码（可选，默认当前语言）
   */
  has(key: string, locale?: string): boolean
}

/**
 * Router 插件 API
 */
export interface RouterPluginAPI extends PluginAPI {
  name: 'router'

  /**
   * 导航到指定路径
   * @param path - 路径
   */
  push(path: string): Promise<void>

  /**
   * 替换当前路由
   * @param path - 路径
   */
  replace(path: string): Promise<void>

  /**
   * 返回上一页
   */
  back(): void

  /**
   * 前进一页
   */
  forward(): void

  /**
   * 跳转指定步数
   * @param n - 步数（正数前进，负数后退）
   */
  go(n: number): void

  /**
   * 获取当前路由
   */
  getCurrentRoute(): any

  /**
   * 获取所有路由
   */
  getRoutes(): any[]

  /**
   * 添加路由
   * @param route - 路由配置
   */
  addRoute(route: any): void

  /**
   * 移除路由
   * @param name - 路由名称
   */
  removeRoute(name: string): void

  /**
   * 检查路由是否存在
   * @param name - 路由名称
   */
  hasRoute(name: string): boolean

  /**
   * 添加导航守卫
   * @param guard - 守卫函数
   */
  beforeEach(guard: (to: any, from: any, next: Function) => void): () => void

  /**
   * 添加后置钩子
   * @param hook - 钩子函数
   */
  afterEach(hook: (to: any, from: any) => void): () => void
}

/**
 * Color 插件 API
 */
export interface ColorPluginAPI extends PluginAPI {
  name: 'color'

  /**
   * 应用主题
   * @param primaryColor - 主题色
   */
  applyTheme(primaryColor: string): Promise<void>

  /**
   * 获取当前主题
   */
  getCurrentTheme(): any

  /**
   * 设置主题模式
   * @param mode - 主题模式（'light' | 'dark'）
   */
  setMode(mode: 'light' | 'dark'): void

  /**
   * 获取当前模式
   */
  getMode(): 'light' | 'dark'

  /**
   * 切换主题模式
   */
  toggleMode(): void

  /**
   * 获取主色调
   */
  getPrimaryColor(): string

  /**
   * 设置主色调
   * @param color - 颜色值
   */
  setPrimaryColor(color: string): Promise<void>

  /**
   * 获取预设主题列表
   */
  getPresets(): any[]

  /**
   * 应用预设主题
   * @param name - 预设名称
   */
  applyPreset(name: string): Promise<void>
}

/**
 * Size 插件 API
 */
export interface SizePluginAPI extends PluginAPI {
  name: 'size'

  /**
   * 应用尺寸预设
   * @param preset - 预设名称
   */
  applyPreset(preset: string): void

  /**
   * 获取当前预设
   */
  getCurrentPreset(): string | null

  /**
   * 设置基础尺寸
   * @param size - 基础尺寸（px）
   */
  setBaseSize(size: number): void

  /**
   * 获取基础尺寸
   */
  getBaseSize(): number

  /**
   * 设置尺寸比例
   * @param scale - 比例值
   */
  setScale(scale: number): void

  /**
   * 获取尺寸比例
   */
  getScale(): number

  /**
   * 获取预设列表
   */
  getPresets(): any[]

  /**
   * 计算尺寸值
   * @param level - 尺寸等级
   */
  compute(level: number): number

  /**
   * 获取当前状态
   */
  getState(): any
}

/**
 * 插件 API 类型映射
 */
export interface PluginAPIMap {
  i18n: I18nPluginAPI
  router: RouterPluginAPI
  color: ColorPluginAPI
  size: SizePluginAPI
}

/**
 * 插件 API 名称
 */
export type PluginAPIName = keyof PluginAPIMap

/**
 * 获取插件 API 类型
 */
export type GetPluginAPI<T extends PluginAPIName> = PluginAPIMap[T]
