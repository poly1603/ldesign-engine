/**
 * 应用配置文件（基础配置）
 *
 * 此配置会被注入到 import.meta.env.appConfig 中
 * 可以在应用代码中通过 useAppConfig() 访问
 * 支持 HMR 热更新
 */
export default {
  app: {
    name: 'Qwik Engine Example',
    version: '1.0.1',
    description: 'Qwik Engine 示例项目 - 展示 @ldesign/engine-qwik 的使用'
  },

  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 30000
  },

  features: {
    enableAnalytics: false,
    enableDebug: true
  },

  theme: {
    primaryColor: '#18b6f6',
    mode: 'light'
  }
}

