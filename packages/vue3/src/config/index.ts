/**
 * 应用配置模块
 *
 * 提供应用配置的类型定义和辅助函数
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import type { AppConfig, AppConfigOverride } from './types'

// 导出类型定义
export * from './types'

/**
 * 定义应用配置的辅助函数
 *
 * 提供完整的 TypeScript 类型安全和智能提示，用于 app.config.ts 文件。
 * 配置会被注入到应用中，可通过 `import.meta.env.appConfig` 访问，支持 HMR 热更新。
 *
 * @param config - 应用配置对象
 * @returns 配置对象（原样返回，用于类型推断）
 *
 * @example
 * ```typescript
 * // app.config.ts - 基础配置
 * import { defineConfig } from '@ldesign/engine-vue3'
 *
 * export default defineConfig({
 *   // 应用基本信息
 *   app: {
 *     name: 'My Application',
 *     version: '1.0.0',
 *     description: '应用描述',
 *     author: 'LDesign Team',
 *   },
 *
 *   // API 配置
 *   api: {
 *     baseUrl: '/api',
 *     timeout: 30000,
 *   },
 *
 *   // 功能开关
 *   features: {
 *     debug: false,
 *     mock: false,
 *   },
 *
 *   // 主题配置
 *   theme: {
 *     mode: 'auto',
 *     primaryColor: '#1890ff',
 *   },
 *
 *   // 国际化配置
 *   i18n: {
 *     defaultLocale: 'zh-CN',
 *     fallbackLocale: 'en-US',
 *   },
 * })
 * ```
 *
 * @example
 * ```typescript
 * // app.config.development.ts - 开发环境配置
 * import { defineConfig } from '@ldesign/engine-vue3'
 *
 * export default defineConfig({
 *   app: {
 *     name: 'My App (开发环境)',
 *   },
 *   api: {
 *     baseUrl: 'http://localhost:8080/api',
 *   },
 *   features: {
 *     debug: true,
 *     mock: true,
 *   },
 *   log: {
 *     level: 'debug',
 *     console: true,
 *   },
 * })
 * ```
 *
 * @example
 * ```typescript
 * // app.config.production.ts - 生产环境配置
 * import { defineConfig } from '@ldesign/engine-vue3'
 *
 * export default defineConfig({
 *   environment: 'production',
 *   api: {
 *     baseUrl: 'https://api.example.com',
 *   },
 *   features: {
 *     debug: false,
 *     performance: true,
 *     errorReporting: true,
 *   },
 *   log: {
 *     level: 'error',
 *     report: true,
 *   },
 * })
 * ```
 *
 * @see {@link AppConfig} 完整配置选项
 */
export function defineConfig(config: AppConfig): AppConfig
export function defineConfig(config: AppConfigOverride): AppConfigOverride
export function defineConfig(config: AppConfig | AppConfigOverride): AppConfig | AppConfigOverride {
  return config
}

