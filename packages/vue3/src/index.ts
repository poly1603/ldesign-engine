/**
 * @ldesign/engine-vue3
 *
 * Vue 3 应用引擎包
 */

// 导出 Vue 引擎
export * from './engine/vue-engine'

// 导出组合式 API
export * from './composables'

// 导出组件
export * from './components'

// 导出插件
export * from './plugins'

// 导出 Devtools
export * from './devtools'

// 导出配置模块（defineConfig 和类型定义）
// ThemeConfig excluded — already exported from @ldesign/engine-core
export {
  defineConfig,
  type AppInfo,
  type ApiConfig,
  type FeatureFlags,
  type LogConfig,
  type StorageConfig,
  type I18nConfig,
  type RouterConfig,
  type AppConfig,
  type AppConfigOverride,
} from './config'

// 重新导出核心功能
export * from '@ldesign/engine-core'

